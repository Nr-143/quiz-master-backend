import { Request, Response } from 'express';
import { QuestionPreference } from '../models/question-preference.model';
import fs from 'fs';
import path from 'path';

export class QuestionPreferenceController {
  // Get user's question preferences for all categories
  static async getUserPreferences(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const preferences = await QuestionPreference.find({ userId });
      res.json({ success: true, data: preferences });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch preferences' });
    }
  }

  // Get questions for a specific category
  static async getCategoryQuestions(req: Request, res: Response) {
    try {
      const { categoryId } = req.params;
      const quizFilePath = path.join(__dirname, '../../static/quizzes', `${categoryId}.json`);
      
      if (!fs.existsSync(quizFilePath)) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }

      const quizData = JSON.parse(fs.readFileSync(quizFilePath, 'utf8'));
      const questions = quizData.questions.map((q: any) => ({
        id: q.id,
        question: q.question,
        difficulty: q.difficulty || 'medium',
        category: categoryId
      }));

      res.json({ success: true, data: questions });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch questions' });
    }
  }

  // Save user's question preferences
  static async savePreferences(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const { categoryId, selectedQuestions, questionOrder } = req.body;

      const preference = await QuestionPreference.findOneAndUpdate(
        { userId, categoryId },
        {
          selectedQuestions,
          questionOrder,
          lastUpdated: new Date()
        },
        { upsert: true, new: true }
      );

      res.json({ success: true, data: preference });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to save preferences' });
    }
  }

  // Create a new question
  static async createQuestion(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const { question, category, difficulty, options, correctOptionId, explanation } = req.body;

      // Validation
      if (!question || !category || !difficulty || !options || !correctOptionId || !explanation) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
      }

      if (!Array.isArray(options) || options.length < 2) {
        return res.status(400).json({ success: false, message: 'At least 2 options are required' });
      }

      if (!options.find(opt => opt.id === correctOptionId)) {
        return res.status(400).json({ success: false, message: 'Correct option ID must match one of the options' });
      }

      // Read existing quiz file
      const quizFilePath = path.join(__dirname, '../../static/quizzes', `${category}.json`);
      
      if (!fs.existsSync(quizFilePath)) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }

      const quizData = JSON.parse(fs.readFileSync(quizFilePath, 'utf8'));
      
      // Generate new question ID
      const existingIds = quizData.questions.map((q: any) => q.id);
      const newId = `${category}${existingIds.length + 1}`;

      // Create new question object
      const newQuestion = {
        id: newId,
        question,
        options,
        correctOptionId,
        explanation,
        difficulty,
        createdBy: userId,
        createdAt: new Date().toISOString()
      };

      // Add to questions array
      quizData.questions.push(newQuestion);

      // Write back to file
      fs.writeFileSync(quizFilePath, JSON.stringify(quizData, null, 2));

      res.json({ success: true, data: newQuestion, message: 'Question created successfully' });
    } catch (error) {
      console.error('Create question error:', error);
      res.status(500).json({ success: false, message: 'Failed to create question' });
    }
  }

  // Reset preferences for a category
  static async resetPreferences(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { categoryId } = req.params;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      await QuestionPreference.findOneAndDelete({ userId, categoryId });
      res.json({ success: true, message: 'Preferences reset successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to reset preferences' });
    }
  }
}