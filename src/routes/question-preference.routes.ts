import { Router } from 'express';
import { QuestionPreferenceController } from '../controllers/question-preference.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

// All routes require authentication
router.use(protect);

// Create a new question
router.post('/create', QuestionPreferenceController.createQuestion);

// Get user's question preferences
router.get('/preferences', QuestionPreferenceController.getUserPreferences);

// Get questions for a category
router.get('/categories/:categoryId/questions', QuestionPreferenceController.getCategoryQuestions);

// Save preferences
router.post('/preferences', QuestionPreferenceController.savePreferences);

// Reset preferences for a category
router.delete('/preferences/:categoryId', QuestionPreferenceController.resetPreferences);

export default router;