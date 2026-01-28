import express from 'express';
import * as authController from '../controllers/auth.controller';
import * as scoreController from '../controllers/score.controller';
import { protect } from '../middlewares/auth.middleware';

const router = express.Router();

router.get('/me', protect, authController.getMe);
router.get('/me/stats', protect, scoreController.getUserStats);

export default router;
