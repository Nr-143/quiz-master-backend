import { User, IUser } from '../models/user.model';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt.utils';
import { AppError } from '../utils/AppError';
import redisClient from '../config/redis.config';

export class AuthService {
    async register(data: Partial<IUser>) {
        const existingUser = await User.findOne({ $or: [{ email: data.email }, { username: data.username }] });
        if (existingUser) {
            throw new AppError('Email or Username already exists', 400);
        }

        const user = await User.create(data);
        const userObject = user.toObject();
        delete userObject.password; // Remove password from response
        
        const accessToken = signAccessToken(user.id);
        const refreshToken = signRefreshToken(user.id);

        return { user: userObject, accessToken, refreshToken };
    }

    async login(data: Pick<IUser, 'email' | 'password'>) {
        const user = await User.findOne({ email: data.email }).select('+password');
        if (!user || !(await user.comparePassword(data.password!))) {
            throw new AppError('Invalid credentials', 401);
        }

        const userObject = user.toObject();
        delete userObject.password; // Remove password from response
        
        const accessToken = signAccessToken(user.id);
        const refreshToken = signRefreshToken(user.id);

        return { user: userObject, accessToken, refreshToken };
    }

    async refreshToken(token: string) {
        try {
            const decoded = verifyRefreshToken(token);
            const user = await User.findById(decoded.id);

            if (!user) {
                throw new AppError('User not found', 404);
            }

            // Here you might want to check for blacklisted refresh tokens in Redis

            const accessToken = signAccessToken(user.id);
            return { accessToken };
        } catch (error) {
            throw new AppError('Invalid refresh token', 403);
        }
    }

    async logout(token: string) {
        // Ideally blacklist the refresh token in Redis
        // const decoded = verifyRefreshToken(token);
        // await redisClient.set(`blacklist:${token}`, 'true', { EX: 7 * 24 * 60 * 60 });
    }
}
