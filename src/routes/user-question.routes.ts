import { Router } from 'express';
import { UserQuestionController } from '../controllers/user-question.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

// All routes require authentication
router.use(protect);

// Categories
router.get('/categories', UserQuestionController.getUserCategories);
router.get('/my-questions', UserQuestionController.getUserCategories); // Alias
router.post('/categories', UserQuestionController.createCategory);
router.get('/categories/:categoryId', UserQuestionController.getCategoryWithQuestions);

// User preferences
router.get('/preferences', (req, res) => {
  res.json({ preferences: { theme: 'light', autoSave: true } });
});

// Questions
router.post('/questions', UserQuestionController.createQuestion);
router.put('/questions/:questionId', UserQuestionController.updateQuestion);
router.delete('/questions/:questionId', UserQuestionController.deleteQuestion);

// Bulk operations
router.post('/questions/import', UserQuestionController.importPredefinedQuestions);
router.post('/questions/reorder', UserQuestionController.reorderQuestions);

export default router;