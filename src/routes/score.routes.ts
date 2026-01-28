import express from 'express';
import * as scoreController from '../controllers/score.controller';
import { protect } from '../middlewares/auth.middleware';

const router = express.Router();

router.get('/leaderboard', protect, scoreController.getLeaderboard);

export default router;
