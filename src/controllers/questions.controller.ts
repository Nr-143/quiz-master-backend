import { Request, Response, NextFunction } from 'express';
import { UserCategory } from '../models/user-category.model';
import { UserQuestion } from '../models/user-question.model';
import { AppError } from '../utils/AppError';
import { catchAsync } from '../utils/catchAsync';

export class QuestionsController {
  // Categories
  static getCategories = catchAsync(async (req: Request, res: Response) => {
    const categories = await UserCategory.find({ ownerId: req.user.id })
      .sort({ updatedAt: -1 });
    
    res.json({
      success: true,
      data: categories
    });
  });

  static createCategory = catchAsync(async (req: Request, res: Response) => {
    const { name, description, isPrivate = true } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required'
      });
    }

    const category = await UserCategory.create({
      name: name.trim(),
      description: description?.trim(),
      isPrivate,
      ownerId: req.user.id
    });
    
    res.status(201).json({
      success: true,
      data: category
    });
  });

  static getCategory = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const category = await UserCategory.findOne({
      _id: req.params.id,
      ownerId: req.user.id
    });

    if (!category) {
      return next(new AppError('Category not found', 404));
    }

    const questions = await UserQuestion.find({ categoryId: category._id })
      .sort({ order: 1 });

    res.json({
      success: true,
      data: {
        ...category.toObject(),
        questions
      }
    });
  });

  static updateCategory = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const category = await UserCategory.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!category) {
      return next(new AppError('Category not found', 404));
    }

    res.json({
      success: true,
      data: category
    });
  });

  static deleteCategory = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const category = await UserCategory.findOneAndDelete({
      _id: req.params.id,
      ownerId: req.user.id
    });

    if (!category) {
      return next(new AppError('Category not found', 404));
    }

    // Delete all questions in category
    await UserQuestion.deleteMany({ categoryId: req.params.id });

    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  });

  // Questions
  static createQuestion = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { categoryId, question, options, correctOptionId, explanation, difficulty = 'medium' } = req.body;
    
    if (!categoryId || !question || !options || !correctOptionId) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Verify category ownership
    const category = await UserCategory.findOne({
      _id: categoryId,
      ownerId: req.user.id
    });

    if (!category) {
      return next(new AppError('Category not found', 404));
    }

    const newQuestion = await UserQuestion.create({
      categoryId,
      question: question.trim(),
      options,
      correctOptionId,
      explanation: explanation?.trim(),
      difficulty,
      ownerId: req.user.id
    });

    // Update category question count
    await UserCategory.findByIdAndUpdate(category._id, {
      $inc: { questionCount: 1 },
      updatedAt: new Date()
    });

    res.status(201).json({
      success: true,
      data: newQuestion
    });
  });

  static getQuestion = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const question = await UserQuestion.findOne({
      _id: req.params.id,
      ownerId: req.user.id
    });

    if (!question) {
      return next(new AppError('Question not found', 404));
    }

    res.json({
      success: true,
      data: question
    });
  });

  static updateQuestion = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const question = await UserQuestion.findOneAndUpdate(
      { _id: req.params.id, ownerId: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );

    if (!question) {
      return next(new AppError('Question not found', 404));
    }

    // Update category timestamp
    await UserCategory.findByIdAndUpdate(question.categoryId, {
      updatedAt: new Date()
    });

    res.json({
      success: true,
      data: question
    });
  });

  static deleteQuestion = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const question = await UserQuestion.findOneAndDelete({
      _id: req.params.id,
      ownerId: req.user.id
    });

    if (!question) {
      return next(new AppError('Question not found', 404));
    }

    // Update category question count
    await UserCategory.findByIdAndUpdate(question.categoryId, {
      $inc: { questionCount: -1 },
      updatedAt: new Date()
    });

    res.json({
      success: true,
      message: 'Question deleted successfully'
    });
  });

  static getQuestions = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    const { categoryId } = req.query;

    if (!categoryId) {
      return next(new AppError('Category ID is required', 400));
    }

    // Verify category ownership
    const category = await UserCategory.findOne({
      _id: categoryId,
      ownerId: req.user.id
    });

    if (!category) {
      return next(new AppError('Category not found', 404));
    }

    const questions = await UserQuestion.find({ categoryId })
      .sort({ order: 1 });

    res.json({
      success: true,
      data: questions
    });
  });
}