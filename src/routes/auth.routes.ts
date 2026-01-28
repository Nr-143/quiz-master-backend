import express from 'express';
import * as authController from '../controllers/auth.controller';
import * as profileController from '../controllers/profile.controller';
import { validate } from '../middlewares/validate.middleware';
import { protect } from '../middlewares/auth.middleware';
import { z } from 'zod';

const router = express.Router();

const registerSchema = z.object({
    body: z.object({
        username: z.string().min(3),
        email: z.string().email(),
        password: z.string().min(6),
    }),
});

const loginSchema = z.object({
    body: z.object({
        email: z.string().email(),
        password: z.string(),
    }),
});

const refreshSchema = z.object({
    body: z.object({
        refreshToken: z.string(),
    }),
});

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/refresh', validate(refreshSchema), authController.refresh);
router.get('/me', protect, authController.getMe);
router.get('/profile', protect, profileController.getProfile);
router.get('/quiz-stats', protect, profileController.getQuizStats);

export default router;
