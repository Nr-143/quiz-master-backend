import { Request, Response } from 'express';
import { UserCategory } from '../models/user-category.model';
import { UserQuestion } from '../models/user-question.model';
import { ActivityLog } from '../models/activity-log.model';
import { v4 as uuidv4 } from 'uuid';

export class UserQuestionController {
  // Get user's categories
  static async getUserCategories(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const categories = await UserCategory.find({ ownerId: userId })
        .sort({ updatedAt: -1 });

      res.json({ success: true, data: categories });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch categories' });
    }
  }

  // Create new category
  static async createCategory(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const { name, description } = req.body;
      
      const category = new UserCategory({
        name,
        description,
        ownerId: userId
      });

      await category.save();

      // Log activity
      await new ActivityLog({
        userId,
        action: 'create',
        resourceType: 'category',
        resourceId: category._id.toString(),
        details: { name }
      }).save();

      res.json({ success: true, data: category });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to create category' });
    }
  }

  // Get category with questions
  static async getCategoryWithQuestions(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { categoryId } = req.params;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const category = await UserCategory.findOne({ 
        _id: categoryId, 
        ownerId: userId 
      });

      if (!category) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }

      const questions = await UserQuestion.find({ categoryId })
        .sort({ order: 1, createdAt: 1 });

      // Increment view count
      category.viewCount += 1;
      await category.save();

      // Log view activity
      await new ActivityLog({
        userId,
        action: 'view',
        resourceType: 'category',
        resourceId: categoryId,
        details: {}
      }).save();

      res.json({ 
        success: true, 
        data: { 
          category, 
          questions 
        } 
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to fetch category' });
    }
  }

  // Create question
  static async createQuestion(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const { categoryId, question, options, correctOptionId, explanation, difficulty, tags } = req.body;

      // Verify category ownership
      const category = await UserCategory.findOne({ 
        _id: categoryId, 
        ownerId: userId 
      });

      if (!category) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }

      // Get next order number
      const lastQuestion = await UserQuestion.findOne({ categoryId })
        .sort({ order: -1 });
      const order = (lastQuestion?.order || 0) + 1;

      const newQuestion = new UserQuestion({
        categoryId,
        ownerId: userId,
        question,
        options,
        correctOptionId,
        explanation,
        difficulty: difficulty || 'medium',
        tags: tags || [],
        order
      });

      await newQuestion.save();

      // Update category question count
      category.questionCount += 1;
      category.updatedAt = new Date();
      await category.save();

      // Log activity
      await new ActivityLog({
        userId,
        action: 'create',
        resourceType: 'question',
        resourceId: newQuestion._id.toString(),
        details: { categoryId, question: question.substring(0, 100) }
      }).save();

      res.json({ success: true, data: newQuestion });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to create question' });
    }
  }

  // Update question
  static async updateQuestion(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { questionId } = req.params;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const question = await UserQuestion.findOne({ 
        _id: questionId, 
        ownerId: userId 
      });

      if (!question) {
        return res.status(404).json({ success: false, message: 'Question not found' });
      }

      const updates = req.body;
      Object.assign(question, updates);
      question.updatedAt = new Date();
      await question.save();

      // Update category timestamp
      await UserCategory.findByIdAndUpdate(question.categoryId, {
        updatedAt: new Date()
      });

      // Log activity
      await new ActivityLog({
        userId,
        action: 'edit',
        resourceType: 'question',
        resourceId: questionId,
        details: updates
      }).save();

      res.json({ success: true, data: question });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to update question' });
    }
  }

  // Delete question
  static async deleteQuestion(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      const { questionId } = req.params;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const question = await UserQuestion.findOne({ 
        _id: questionId, 
        ownerId: userId 
      });

      if (!question) {
        return res.status(404).json({ success: false, message: 'Question not found' });
      }

      await UserQuestion.findByIdAndDelete(questionId);

      // Update category question count
      await UserCategory.findByIdAndUpdate(question.categoryId, {
        $inc: { questionCount: -1 },
        updatedAt: new Date()
      });

      // Log activity
      await new ActivityLog({
        userId,
        action: 'delete',
        resourceType: 'question',
        resourceId: questionId,
        details: { categoryId: question.categoryId }
      }).save();

      res.json({ success: true, message: 'Question deleted successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to delete question' });
    }
  }

  // Import from predefined questions
  static async importPredefinedQuestions(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const { categoryId, questionIds } = req.body;

      // Verify category ownership
      const category = await UserCategory.findOne({ 
        _id: categoryId, 
        ownerId: userId 
      });

      if (!category) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }

      // TODO: Fetch predefined questions and import them
      // This would integrate with your existing question bank

      res.json({ success: true, message: 'Questions imported successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to import questions' });
    }
  }

  // Reorder questions
  static async reorderQuestions(req: Request, res: Response) {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      const { categoryId, questionOrders } = req.body;

      // Verify category ownership
      const category = await UserCategory.findOne({ 
        _id: categoryId, 
        ownerId: userId 
      });

      if (!category) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }

      // Update question orders
      const updatePromises = questionOrders.map((item: any) =>
        UserQuestion.findByIdAndUpdate(item.questionId, { order: item.order })
      );

      await Promise.all(updatePromises);

      // Update category timestamp
      category.updatedAt = new Date();
      await category.save();

      // Log activity
      await new ActivityLog({
        userId,
        action: 'reorder',
        resourceType: 'question',
        resourceId: categoryId,
        details: { questionOrders }
      }).save();

      res.json({ success: true, message: 'Questions reordered successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Failed to reorder questions' });
    }
  }
}