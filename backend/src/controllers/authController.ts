import { Request, Response, NextFunction } from 'express';
import { googleLoginSchema, loginSendOtpSchema, loginVerifyOtpSchema, registerSendOtpSchema, registerVerifyOtpSchema } from '../validations/authValidation';
import * as authService from '../services/authService';

const sendTokenResponse = (res: Response, result: any, statusCode: number = 200) => {
    const { token, user, message, requiresRegistration, userExists } = result;

    // Cookie Options
    const options = {
        expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict' as 'strict'
    };

    if (token) {
        res.cookie('token', token, options);
    }

    res.status(statusCode).json({
        success: true,
        message,
        user,
        requiresRegistration,
        userExists,
        // token // Token removed from body for security, relying on cookie
    });
};

export const requestOtp = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const validation = loginSendOtpSchema.safeParse(req.body); // Using existing schema
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

export const verifyOtp = async (req: Request, res: Response, next: NextFunction) => {
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

// Google
export const googleAuth = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const validation = googleLoginSchema.safeParse(req.body); // Keeping validation as per original pattern
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
