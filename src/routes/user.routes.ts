import express from 'express';
import * as authController from '../controllers/auth.controller';
import * as scoreController from '../controllers/score.controller';
import { protect } from '../middlewares/auth.middleware';
import { validateRequest } from '../middlewares/validate.middleware';
import { body } from 'express-validator';

const router = express.Router();

router.get('/me', protect, authController.getMe);
router.get('/profile', protect, authController.getMe);
router.put('/profile', 
  protect,
  [
    body('username').optional().isLength({ min: 2 }).withMessage('Username must be at least 2 characters'),
    body('phone').optional().isMobilePhone('any').withMessage('Invalid phone number'),
    body('qualification').optional().isLength({ min: 2 }).withMessage('Qualification must be at least 2 characters')
  ],
  validateRequest,
  authController.updateProfile
);
router.get('/me/stats', protect, scoreController.getUserStats);

export default router;
