import { Router } from 'express';
import { QuestionsController } from '../controllers/questions.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

// All routes require authentication
router.use(protect);

// Categories
router.get('/categories', QuestionsController.getCategories);
router.post('/categories', QuestionsController.createCategory);
router.get('/categories/:id', QuestionsController.getCategory);
router.put('/categories/:id', QuestionsController.updateCategory);
router.delete('/categories/:id', QuestionsController.deleteCategory);

// Questions
router.get('/questions', QuestionsController.getQuestions);
router.post('/questions', QuestionsController.createQuestion);
router.get('/questions/:id', QuestionsController.getQuestion);
router.put('/questions/:id', QuestionsController.updateQuestion);
router.delete('/questions/:id', QuestionsController.deleteQuestion);

export default router;