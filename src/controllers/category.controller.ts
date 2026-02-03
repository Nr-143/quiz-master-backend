import { Request, Response } from 'express';
import { Category } from '../models/category.model';

export class CategoryController {
  static async getAllCategories(req: Request, res: Response) {
    try {
      const categories = await Category.find({ isActive: true })
        .select('-_id -__v -createdAt -updatedAt -isActive')
        .lean();

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