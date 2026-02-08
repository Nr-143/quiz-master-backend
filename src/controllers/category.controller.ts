import { Request, Response } from 'express';
import { QuizService } from '../services/quiz.service';

const quizService = new QuizService();

export class CategoryController {
  static async getAllCategories(req: Request, res: Response) {
    try {
      // Use logic from QuizService (which handles Redis caching and ID mapping)
      const categories = await quizService.getAllCategories();

      res.json({
        success: true,
        data: categories
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch categories',
        error: { code: '500', message: 'Failed to fetch categories' }
      });
    }
  }
}