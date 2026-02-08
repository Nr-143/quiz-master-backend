import redisClient from '../config/redis.config';
import { IQuiz } from '../models/quiz.interface';
import { AppError } from '../utils/AppError';
import { User } from '../models/user.model';
import { QuizSession } from '../models/quiz-session.model';
import { Category } from '../models/category.model';
import { Quiz } from '../models/quiz.model';
import { Question } from '../models/question.model';

export class QuizService {
    async getAllCategories() {
        // Try Redis first
        const cachedCategories = await redisClient.get('categories:all');
        if (cachedCategories) {
            return JSON.parse(cachedCategories);
        }

        // Fetch from DB
        const categories = await Category.find({ isActive: true }).select('-_id -__v').lean();

        // Map categoryId to id manually since .lean() skips mongoose transformation
        const mappedCategories = categories.map((c: any) => ({
            ...c,
            id: c.categoryId
        }));

        // Cache for 1 hour
        await redisClient.setEx('categories:all', 3600, JSON.stringify(mappedCategories));

        return mappedCategories;
    }

    private async getRawQuizFromCacheOrDB(categorySlug: string): Promise<IQuiz> {
        const redisKey = `quiz:${categorySlug.toLowerCase()}`;
        const quizData = await redisClient.get(redisKey);

        if (quizData) {
            return JSON.parse(quizData);
        }

        // Cache Miss - Rehydrate from DB
        console.log(`Cache miss for quiz: ${categorySlug}`);

        // 1. Get Category
        const categoryDoc = await Category.findOne({
            $or: [{ categoryId: categorySlug }, { name: new RegExp(`^${categorySlug}$`, 'i') }]
        });

        if (!categoryDoc) {
            throw new AppError('Quiz category not found', 404);
        }

        // 2. Get Quiz
        const quizDoc = await Quiz.findOne({ categoryId: categoryDoc.categoryId, isActive: true });
        if (!quizDoc) {
            throw new AppError('Quiz not found for this category', 404);
        }

        // 3. Get Questions
        const questionIds = quizDoc.questions.map(q => q.questionId);
        const questionDocs = await Question.find({ _id: { $in: questionIds } }).lean();

        const mappedQuestions = quizDoc.questions.sort((a, b) => a.order - b.order).map(qItem => {
            const qDoc = questionDocs.find(q => q._id.toString() === qItem.questionId);
            if (!qDoc) return null;
            return {
                id: qDoc._id.toString(),
                question: qDoc.text,
                options: qDoc.options,
                correctOptionId: qDoc.correctOptionId,
                explanation: qDoc.explanation,
                hint: qDoc.explanation,
                difficulty: qDoc.difficulty,
                tags: qDoc.tags
            };
        }).filter(q => q !== null);

        const quiz: IQuiz = {
            category: categoryDoc.name,
            level: quizDoc.difficulty,
            questions: mappedQuestions as any[]
        };

        // Cache re-built data
        await redisClient.setEx(redisKey, 3600, JSON.stringify(quiz));
        return quiz;
    }

    async getQuizByCategory(categorySlug: string, level?: string, page: number = 1, limit: number = 10, onlyQuestions: boolean = false) {

        const quiz = await this.getRawQuizFromCacheOrDB(categorySlug);

        // Filter by level if provided
        if (level && quiz.level.toLowerCase() !== level.toLowerCase()) {
            // Logic to filter questions by level could go here if questions have individual levels
            // For now assuming whole quiz has a level
            if (quiz.level.toLowerCase() !== level.toLowerCase()) {
                // return { ...quiz, questions: [] }; // Strict filtering?
                // Current logic seemed to return empty if level didn't match
            }
        }

        // Pagination
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const paginatedQuestions = quiz.questions.slice(startIndex, endIndex);

        return {
            category: quiz.category,
            level: quiz.level,
            totalQuestions: quiz.questions.length,
            page,
            limit,
            questions: paginatedQuestions.map(q => {
                if (onlyQuestions) {
                    return {
                        id: q.id,
                        question: q.question
                    };
                }
                return {
                    id: q.id,
                    question: q.question,
                    options: q.options,
                    // explanation: q.explanation, // Secure: Do not send explanation initially
                };
            })
        };
    }

    async unlockHint(userId: string, categoryInput: string, questionId: string) {
        // 1. Fetch user validation first
        const user = await User.findById(userId);
        if (!user) {
            throw new AppError('User not found', 404);
        }

        const categoryId = await this.resolveCategoryId(categoryInput);

        // 2. Check if already unlocked
        const isUnlocked = user.unlockedHints?.some(
            h => h.quizId.toLowerCase() === categoryId.toLowerCase() && h.questionId === questionId
        );

        if (isUnlocked) {
            const question = await this.getQuestionFromCacheOrDB(categoryInput, questionId);
            return { hint: question.explanation || "No hint available", creditsDeducted: 0, remainingCredits: user.credits };
        }

        // 3. Check credits
        if (user.credits < 5) {
            throw new AppError('Insufficient credits', 402);
        }

        // 4. Verify question exists before deducting
        const question = await this.getQuestionFromCacheOrDB(categoryInput, questionId);

        // 5. Deduct and Save
        user.credits -= 5;
        if (!user.unlockedHints) user.unlockedHints = [];

        user.unlockedHints.push({
            quizId: categoryId, // Store ID
            questionId,
            unlockedAt: new Date()
        });

        await user.save();

        // 6. Track in QuizSession if active
        await QuizSession.updateOne(
            { userId, categoryId: categoryId, status: 'in_progress', "answeredQuestions.questionId": questionId },
            { $set: { "answeredQuestions.$.hintOpened": true } }
        );

        return { hint: question.explanation || "No hint available", creditsDeducted: 5, remainingCredits: user.credits };
    }

    private async resolveCategoryId(input: string): Promise<string> {
        // Optimistic: input might be UUID
        // But we can't be sure.
        // Check cache first
        const categories = await this.getAllCategories();
        const category = categories.find((c: any) =>
            c.categoryId === input || c.name.toLowerCase() === input.toLowerCase()
        );

        if (category) return category.categoryId;

        // Fallback DB
        const catDoc = await Category.findOne({
            $or: [{ categoryId: input }, { name: new RegExp(`^${input}$`, 'i') }]
        });

        if (catDoc) return catDoc.categoryId;

        throw new AppError('Category not found', 404);
    }

    async validateAnswer(userId: string | undefined, questionId: string, selectedOption: string, categoryInput: string) {
        // Ensure data availability (using input which could be name)
        const question = await this.getQuestionFromCacheOrDB(categoryInput, questionId);

        // Resolve ID for session
        const categoryId = await this.resolveCategoryId(categoryInput);

        const isCorrect = question.correctOptionId === selectedOption;
        const correctOption = question.options.find((o: any) => o.id === question.correctOptionId);

        // Calculate points
        const pointsEarned = isCorrect ? 10 : 0;
        const creditsEarned = isCorrect ? 1 : 0;
        const xpEarned = isCorrect ? 5 : 1;

        if (userId && userId !== 'anonymous') {
            try {
                // Find active session
                // We use category as the lookup. In new model, we should map category ID.
                // Assuming 'category' arg is valid categoryId or mapped correctly in getQuestionFromCacheOrDB

                let session = await QuizSession.findOne({
                    userId: userId,
                    categoryId: categoryId, // Assuming category arg is categoryId
                    status: 'in_progress'
                });

                // If no session or session is for different quiz, create/logic?
                // For now, assume 'category' corresponds to the session key.

                if (!session) {
                    // Create new session if implicit start allowed
                    // Ideally startQuiz should be called explicitely
                    session = await QuizSession.create({
                        userId: userId,
                        quizId: 'unknown', // Should resolve this
                        categoryId: categoryId,
                        startedAt: new Date(),
                        answeredQuestions: []
                    });
                    // Note: This 'unknown' is risky. Should ideally require startQuiz.
                    // But to maintain backward compatibility with implicit flow:
                    // We try to find the Quiz ID from the cached question/quiz data?
                    // For now, let's look up the quiz for this category
                    const quizDoc = await Quiz.findOne({ categoryId: categoryId, isActive: true });
                    if (quizDoc) {
                        session.quizId = quizDoc.quizId;
                        await session.save();
                    }
                }

                // Push answer
                session.answeredQuestions.push({
                    questionId,
                    selectedOptionId: selectedOption,
                    correctOptionId: question.correctOptionId,
                    isCorrect,
                    hintOpened: false, // Default, logic elsewhere handles if it was opened
                    timeTaken: 0, // Frontend should send this
                    answeredAt: new Date()
                });

                if (isCorrect) {
                    session.correctAnswers += 1;
                } else {
                    session.wrongAnswers += 1;
                }

                await session.save();

                // Update User Stats
                await User.findByIdAndUpdate(userId, {
                    $inc: {
                        'stats.totalQuestions': 1,
                        'stats.correctAnswers': isCorrect ? 1 : 0,
                        'xp': xpEarned,
                        'credits': creditsEarned
                    }
                });

            } catch (error) {
                console.error('Error updating quiz session:', error);
                // Don't block response on analytics failure
            }
        }

        return {
            correct: isCorrect,
            correctAnswer: correctOption?.text,
            explanation: question.explanation || "",
            pointsEarned,
            creditsEarned,
            xpEarned,
            selectedAnswer: question.options.find((o: any) => o.id === selectedOption)?.text,
        };
    }

    async getQuizProgress(userId: string, categoryInput: string) {
        let categoryId: string;
        try {
            categoryId = await this.resolveCategoryId(categoryInput);
        } catch {
            categoryId = categoryInput; // Fallback, though likely to fail lookup if UUID required
        }

        const activeSession = await QuizSession.findOne({
            userId: userId,
            categoryId: categoryId,
            status: 'in_progress'
        });

        if (!activeSession) {
            return {
                lastQuestionIndex: 0,
                answeredQuestions: [],
                totalSolved: 0,
                sessionId: null
            };
        }

        const quizData = await this.getRawQuizFromCacheOrDB(categoryInput); // Use input (name/slug) for cache lookup

        const answeredQuestionsDetail = activeSession.answeredQuestions.map(aq => {
            const qDef = quizData.questions.find((q: any) => q.id === aq.questionId);
            let explanation = '';
            let correctAnswerText = '';

            if (qDef) {
                explanation = qDef.explanation || '';
                correctAnswerText = qDef.options?.find((o: any) => o.id === qDef.correctOptionId)?.text || '';
            }

            return {
                questionId: aq.questionId,
                selectedOption: aq.selectedOptionId,
                isCorrect: aq.isCorrect,
                correctAnswer: correctAnswerText,
                explanation,
                pointsEarned: aq.isCorrect ? 10 : 0
            };
        });

        return {
            lastQuestionIndex: activeSession.answeredQuestions.length,
            answeredQuestions: Array.from({ length: activeSession.answeredQuestions.length }, (_, i) => i),
            totalSolved: activeSession.answeredQuestions.length,
            sessionId: activeSession.sessionId,
            answeredQuestionIds: activeSession.answeredQuestions.map(aq => aq.questionId),
            answeredQuestionsDetail
        };
    }

    async submitQuiz(userId: string, categoryInput: string) {
        const categoryId = await this.resolveCategoryId(categoryInput);

        const session = await QuizSession.findOne({
            userId: userId,
            categoryId: categoryId,
            status: 'in_progress'
        });

        if (!session) {
            throw new AppError('No active quiz session found', 404);
        }

        // Just use session data for scoring
        const score = session.correctAnswers;
        const total = session.totalQuestions || session.answeredQuestions.length; // Fallback

        // Build results
        const quizData = await this.getRawQuizFromCacheOrDB(categoryInput);

        const results = session.answeredQuestions.map(aq => {
            const qDef = quizData.questions.find((q: any) => q.id === aq.questionId);
            const correctAnswerText = qDef?.options?.find((o: any) => o.id === qDef.correctOptionId)?.text;
            return {
                id: aq.questionId,
                correct: aq.isCorrect,
                correctAnswer: correctAnswerText,
                explanation: qDef?.explanation
            };
        });

        session.status = 'completed';
        session.completedAt = new Date();
        session.score = score;
        await session.save();

        const { Score } = await import('../models/score.model');
        await Score.create({
            userId,
            category: categoryId, // Consistent Storage
            score,
            total
        });

        return {
            score,
            total,
            results
        };
    }

    // Helper: unified fetch
    private async getQuestionFromCacheOrDB(category: string, questionId: string) {
        const quizData = await this.getRawQuizFromCacheOrDB(category);
        const question = quizData.questions.find((q: any) => q.id === questionId);
        if (!question) {
            throw new AppError('Question not found', 404);
        }
        return question;
    }
}
