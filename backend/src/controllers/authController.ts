import { Request, Response, NextFunction } from 'express';
import * as authService from '../services/authService';
import {
    registerSendOtpSchema,
    registerVerifyOtpSchema,
    loginSendOtpSchema,
    loginVerifyOtpSchema,
    googleLoginSchema
} from '../validations/authValidation';

import * as userRepository from '../repositories/userRepository';

const sendTokenResponse = (res: Response, result: any, statusCode: number = 200) => {
    const { token, user } = result;

    const options = {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' as 'none' : 'strict' as 'strict',
        domain: process.env.NODE_ENV === 'production' ? '.rohitcodes.tech' : undefined
    };

    if (token) {
        res.cookie('token', token, options);
    }

    res.status(statusCode).json({
        success: true,
        user,
    });
};

export const getMe = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.userId;
        const user = await userRepository.findById(userId);
        if (!user) {
            res.status(404).json({ error: 'User not found' });
            return;
        }
        res.status(200).json({ user });
    } catch (error) {
        next(error);
    }
};

// Register
export const registerSendOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const validation = registerSendOtpSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({ error: validation.error.format() });
            return;
        }
        const { email } = validation.data;
        const result = await authService.registerSendOtp(email);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

export const registerVerifyOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const validation = registerVerifyOtpSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({ error: validation.error.format() });
            return;
        }
        const { email, otp, firstName, lastName } = validation.data;
        const result = await authService.registerVerifyOtp(email, otp, firstName, lastName);
        sendTokenResponse(res, result, 201);
    } catch (error) {
        next(error);
    }
};

// Login
export const loginSendOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const validation = loginSendOtpSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({ error: validation.error.format() });
            return;
        }
        const { email } = validation.data;
        const result = await authService.loginSendOtp(email);
        res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

export const loginVerifyOtp = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const validation = loginVerifyOtpSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({ error: validation.error.format() });
            return;
        }
        const { email, otp } = validation.data;
        const result = await authService.loginVerifyOtp(email, otp);
        sendTokenResponse(res, result, 200);
    } catch (error) {
        next(error);
    }
};

// Google
export const googleLogin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const validation = googleLoginSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({ error: validation.error.format() });
            return;
        }
        const { token } = validation.data;
        const result = await authService.verifyGoogleToken(token);
        sendTokenResponse(res, result, 200);
    } catch (error) {
        next(error);
    }
};

export const logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        // Clear the token cookie
        res.clearCookie('token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: process.env.NODE_ENV === 'production' ? 'none' as 'none' : 'strict' as 'strict',
            domain: process.env.NODE_ENV === 'production' ? '.rohitcodes.tech' : undefined
        });

        res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        next(error);
    }
};
