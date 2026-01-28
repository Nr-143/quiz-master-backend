import redisClient from '../config/redis.config';
import { IQuiz } from '../models/quiz.interface';
import { AppError } from '../utils/AppError';
import { User } from '../models/user.model';
import { QuizSession } from '../models/quiz-session.model';

export class QuizService {
    async getAllCategories() {
        const categories = await redisClient.sMembers('categories');
        return categories;
    }

    async getQuizByCategory(category: string, level?: string, page: number = 1, limit: number = 10) {
        const redisKey = `quiz:${category.toLowerCase()}`;
        const data = await redisClient.get(redisKey);

        if (!data) {
            throw new AppError('Quiz category not found', 404);
        }

        const quiz: IQuiz = JSON.parse(data);

        // Filter by level if provided
        if (level && quiz.level.toLowerCase() !== level.toLowerCase()) {
            if (quiz.level.toLowerCase() !== level.toLowerCase()) {
                return { ...quiz, questions: [] };
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
            questions: paginatedQuestions.map(q => ({
                id: q.id,
                question: q.question,
                options: q.options,
                explanation: q.explanation,
            }))
        };
    }

    async unlockHint(userId: string, category: string, questionId: string) {
        // 1. Fetch user to verify credits and unlocked hints
        const user = await User.findById(userId);
        if (!user) {
            throw new AppError('User not found', 404);
        }

        // 2. Check if already unlocked (User Schema Rule 4)
        const isUnlocked = user.unlockedHints?.some(
            h => h.quizId.toLowerCase() === category.toLowerCase() && h.questionId === questionId
        );

        const redisKey = `quiz:${category.toLowerCase()}`;
        const data = await redisClient.get(redisKey);

        if (!data) {
            throw new AppError('Quiz not found', 404);
        }

        const quiz: IQuiz = JSON.parse(data);
        const question = quiz.questions.find(q => q.id === questionId);

        if (!question) {
            throw new AppError('Question not found', 404);
        }

        const hintText = question.hint || "No hint available for this question.";

        if (isUnlocked) {
            return { hint: hintText, creditsDeducted: 0, remainingCredits: user.credits };
        }

        // 3. User Logic: Check credits (Strict Rule 3)
        if (user.credits < 5) {
            throw new AppError('Insufficient credits', 402);
        }

        // 4. Deduct and Save (Strict Rule 3)
        user.credits -= 5;

        if (!user.unlockedHints) user.unlockedHints = [];

        user.unlockedHints.push({
            quizId: category.toLowerCase(),
            questionId,
            unlockedAt: new Date()
        });

        await user.save();

        return { hint: hintText, creditsDeducted: 5, remainingCredits: user.credits };
    }

    async validateAnswer(userId: string | undefined, questionId: string, selectedOption: string, category: string) {
        const redisKey = `quiz:${category.toLowerCase()}`;
        const data = await redisClient.get(redisKey);

        if (!data) {
            throw new AppError('Quiz category not found', 404);
        }

        const quiz: IQuiz = JSON.parse(data);
        const question = quiz.questions.find(q => q.id === questionId);

        if (!question) {
            throw new AppError('Question not found', 404);
        }

        const isCorrect = question.correctOptionId === selectedOption;
        const correctOption = question.options.find(o => o.id === question.correctOptionId);

        // Calculate points and credits
        const pointsEarned = isCorrect ? 10 : 0;
        const creditsEarned = isCorrect ? 1 : 0;
        const xpEarned = isCorrect ? 5 : 1;

        // Update or create quiz session
        if (userId && userId !== 'anonymous') {
            try {
                let session = await QuizSession.findOne({
                    user: userId,
                    category: category.toLowerCase(),
                    status: 'active'
                });

                if (!session) {
                    session = await QuizSession.create({
                        user: userId,
                        category: category.toLowerCase(),
                        level: 'beginner',
                        totalQuestions: quiz.questions.length,
                        answeredQuestions: []
                    });
                }

                // Add answered question
                session.answeredQuestions.push({
                    questionId,
                    selectedOptionId: selectedOption,
                    correctOptionId: question.correctOptionId,
                    isCorrect,
                    answeredAt: new Date()
                });

                if (isCorrect) {
                    session.correctAnswers += 1;
                }

                await session.save();

                // Update user stats
                const user = await User.findById(userId);
                if (user) {
                    await User.findByIdAndUpdate(userId, {
                        $inc: {
                            'stats.totalQuestions': 1,
                            'stats.correctAnswers': isCorrect ? 1 : 0,
                            'xp': xpEarned,
                            'credits': creditsEarned
                        }
                    });
                }
            } catch (error) {
                console.error('Error updating quiz session:', error);
            }
        }

        return {
            correct: isCorrect,
            correctAnswer: correctOption?.text,
            explanation: question.explanation,
            pointsEarned,
            creditsEarned,
            xpEarned,
            selectedAnswer: question.options.find(o => o.id === selectedOption)?.text
        };
    }

    async getQuizProgress(userId: string, category: string) {
        try {
            // Get active quiz session
            const activeSession = await QuizSession.findOne({
                user: userId,
                category: category.toLowerCase(),
                status: 'active'
            });

            if (!activeSession) {
                return {
                    lastQuestionIndex: 0,
                    answeredQuestions: [],
                    totalSolved: 0,
                    sessionId: null
                };
            }

            // Fetch the quiz definition to get explanations and correct answer text
            const redisKey = `quiz:${category.toLowerCase()}`;
            const data = await redisClient.get(redisKey);
            const quiz: IQuiz | null = data ? JSON.parse(data) : null;

            const answeredQuestionsDetail = activeSession.answeredQuestions.map(aq => {
                let explanation = '';
                let correctAnswerText = '';

                if (quiz) {
                    const question = quiz.questions.find(q => q.id === aq.questionId);
                    if (question) {
                        explanation = question.explanation;
                        correctAnswerText = question.options.find(o => o.id === question.correctOptionId)?.text || '';
                    }
                }

                return {
                    questionId: aq.questionId,
                    selectedOption: aq.selectedOptionId,
                    isCorrect: aq.isCorrect,
                    correctAnswer: correctAnswerText,
                    explanation: explanation,
                    // Mock points/xp for restoration since they aren't stored per-question in session array explicitly (simplification)
                    pointsEarned: aq.isCorrect ? 10 : 0,
                    creditsEarned: aq.isCorrect ? 1 : 0,
                    xpEarned: aq.isCorrect ? 5 : 1
                };
            });

            return {
                lastQuestionIndex: activeSession.answeredQuestions.length,
                answeredQuestions: Array.from({ length: activeSession.answeredQuestions.length }, (_, i) => i),
                totalSolved: activeSession.answeredQuestions.length,
                sessionId: activeSession._id,
                answeredQuestionIds: activeSession.answeredQuestions.map(aq => aq.questionId),
                answeredQuestionsDetail // New field with detailed info
            };
        } catch (error) {
            throw new AppError('Failed to get quiz progress', 500);
        }
    }

    async submitQuiz(userId: string, category: string) {
        // 1. Get active session
        const session = await QuizSession.findOne({
            user: userId,
            category: category.toLowerCase(),
            status: 'active'
        });

        if (!session) {
            throw new AppError('No active quiz session found', 404);
        }

        // 2. Validate completion
        if (session.answeredQuestions.length < session.totalQuestions) {
            throw new AppError('Please answer all questions before submitting', 400);
        }

        // 3. Get quiz definition for validation (optional: session already has isCorrect)
        const redisKey = `quiz:${category.toLowerCase()}`;
        const data = await redisClient.get(redisKey);

        if (!data) {
            throw new AppError('Quiz definition not found', 500);
        }

        const quiz: IQuiz = JSON.parse(data);

        // 4. Calculate score from session data
        const score = session.correctAnswers;
        const total = session.totalQuestions;

        // 5. Build results array for frontend
        const results = session.answeredQuestions.map(aq => {
            const question = quiz.questions.find(q => q.id === aq.questionId);
            const correctAnswerText = question?.options.find(o => o.id === question.correctOptionId)?.text;

            return {
                id: aq.questionId,
                correct: aq.isCorrect,
                correctAnswer: correctAnswerText,
                explanation: question?.explanation
            };
        });

        // 6. Mark session completed
        session.status = 'completed';
        session.completedAt = new Date();
        session.score = score;
        await session.save();

        // 7. Save to Score model (Leaderboard)
        const { Score } = await import('../models/score.model');
        await Score.create({
            user: userId,
            category,
            score,
            total
        });

        return {
            score,
            total,
            results
        };
    }
}
