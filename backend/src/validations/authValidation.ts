import { z } from 'zod';

// Shared schemas
const emailSchema = z.string().email("Invalid email address");
const otpSchema = z.string().length(6, "OTP must be 6 digits");

// Registration
export const registerSendOtpSchema = z.object({
    email: emailSchema,
});

export const registerVerifyOtpSchema = z.object({
    email: emailSchema,
    otp: otpSchema,
    firstName: z.string().min(1, "First Name is required").optional(), // Optional for now, or make required if you want
    lastName: z.string().optional(),
});

// Login
export const loginSendOtpSchema = z.object({
    email: emailSchema,
});

export const loginVerifyOtpSchema = z.object({
    email: emailSchema,
    otp: otpSchema,
});

// Google
export const googleLoginSchema = z.object({
    token: z.string().min(1, "Google token is required"),
});
