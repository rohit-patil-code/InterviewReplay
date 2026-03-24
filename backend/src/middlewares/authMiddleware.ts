import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthError } from '../utils/errors';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    try {
        console.log('Cookies in requireAuth:', req.cookies); // DEBUG
        const token = req.cookies.token;

        if (!token) {
            throw new AuthError('Authentication required', 401);
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        (req as any).user = decoded;
        next();
    } catch (error: any) {
        if (error instanceof jwt.JsonWebTokenError) {
            next(new AuthError('Invalid token', 401));
        } else {
            next(error);
        }
    }
};
