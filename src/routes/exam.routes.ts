import { Router } from 'express';
import { ExamController } from '../controllers/exam.controller';
import { authMiddleware } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { body, param, query } from 'express-validator';

const router = Router();

// Validation schemas
const createExamValidation = [
  body('name').notEmpty().withMessage('Exam name is required'),
  body('tagline').notEmpty().withMessage('Tagline is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('entryPrice').isNumeric().withMessage('Entry price must be a number'),
  body('examDate').isISO8601().withMessage('Valid exam date is required'),
  body('duration').isInt({ min: 1 }).withMessage('Duration must be a positive integer'),
  body('difficulty').isIn(['easy', 'medium', 'hard']).withMessage('Invalid difficulty level'),
  body('numberOfQuestions').isInt({ min: 1 }).withMessage('Number of questions must be positive'),
  body('examType').isIn(['mcq', 'coding', 'mixed']).withMessage('Invalid exam type'),
  body('benefits').isArray({ min: 1 }).withMessage('At least one benefit is required'),
  body('conductedBy').notEmpty().withMessage('Conducted by is required')
];

const applyExamValidation = [
  param('examId').isMongoId().withMessage('Invalid exam ID'),
  body('agreedToTerms').isBoolean().withMessage('Agreement to terms is required')
];

// Public routes
router.get('/', ExamController.getAllExams);
router.get('/:examId', 
  param('examId').isMongoId().withMessage('Invalid exam ID'),
  validateRequest,
  ExamController.getExamById
);

// Protected routes (require authentication)
router.use(authMiddleware);

router.post('/:examId/apply', 
  applyExamValidation,
  validateRequest,
  ExamController.applyForExam
);

router.get('/:examId/status',
  param('examId').isMongoId().withMessage('Invalid exam ID'),
  validateRequest,
  ExamController.checkApplicationStatus
);

router.get('/user/applications', ExamController.getUserApplications);

// Admin routes (you can add admin middleware here)
router.post('/', 
  createExamValidation,
  validateRequest,
  ExamController.createExam
);

router.put('/:examId',
  param('examId').isMongoId().withMessage('Invalid exam ID'),
  createExamValidation,
  validateRequest,
  ExamController.updateExam
);

router.delete('/:examId',
  param('examId').isMongoId().withMessage('Invalid exam ID'),
  validateRequest,
  ExamController.deleteExam
);

export default router;