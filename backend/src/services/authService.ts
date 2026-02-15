import sgMail from '@sendgrid/mail';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import * as otpRepository from '../repositories/otpRepository';
import * as userRepository from '../repositories/userRepository';

// types
export interface AuthResult {
    user: any;
    token: string;
}

// errors
export class AuthError extends Error {
    statusCode: number;
    constructor(message: string, statusCode: number = 401) {
        super(message);
        this.statusCode = statusCode;
    }
}

// Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const OTP_EXPIRY_MINUTES = 5;
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;

if (SENDGRID_API_KEY) {
    sgMail.setApiKey(SENDGRID_API_KEY);
} else {
    console.warn("SENDGRID_API_KEY is missing. Emails will not be sent.");
}

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// ... (Custom Errors remain the same)

// Helper: Generate & Send OTP
const generateAndSendOtp = async (email: string) => {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    await otpRepository.saveOtp(email, otpHash, expiresAt);

    const msg = {
        to: email,
        from: 'rohitpatilwork7797@gmail.com', // Verified sender
        subject: 'Your OTP for Interview Replay',
        text: `Please use this OTP for logging in: ${otp}. Note that the OTP will expire after 5 minutes.`,
    };

    try {
        if (SENDGRID_API_KEY) {
            await sgMail.send(msg);
            console.log(`[SendGrid] OTP sent to ${email}`);
        } else {
            console.log(`[DEV] OTP for ${email}: ${otp} (SendGrid Key Missing)`);
        }
    } catch (error) {
        console.error("Error sending email:", error);
        // Optionally throw error if email is critical, or just log
        throw new AuthError("Failed to send verification email. Please try again.", 500);
    }
};

// ==========================================
// REGISTRATION FLOW
// ==========================================

export const registerSendOtp = async (email: string): Promise<{ message: string }> => {
    // 1. Check if user already exists
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
        throw new AuthError("User already exists. Please login.", 409); // 409 Conflict
    }

    // 2. Generate & Send OTP
    await generateAndSendOtp(email);

    return { message: "OTP sent successfully" };
};

export const registerVerifyOtp = async (email: string, otp: string, firstName?: string, lastName?: string): Promise<AuthResult> => {
    // 1. Verify OTP
    const otpRecord = await otpRepository.findLatestOtp(email);
    if (!otpRecord) throw new AuthError("Invalid or expired OTP");

    const isValid = await bcrypt.compare(otp, otpRecord.otp_hash);
    if (!isValid) throw new AuthError("Invalid OTP");

    await otpRepository.deleteOtp(email);

    // 2. Check if user exists (Double check to prevent race conditions)
    let user = await userRepository.findByEmail(email);
    if (user) {
        throw new AuthError("User already exists. Please login.", 409);
    }

    // 3. Create User
    user = await userRepository.create(email, firstName, lastName);

    // 4. Generate Token
    const token = generateJwt(user.id);

    return { user, token };
};

// ==========================================
// LOGIN FLOW
// ==========================================

export const loginSendOtp = async (email: string): Promise<{ message: string }> => {
    // 1. Check if user exists
    const user = await userRepository.findByEmail(email);
    if (!user) {
        throw new AuthError("User not found. Please register first.", 404);
    }

    // 2. Generate & Send OTP
    await generateAndSendOtp(email);

    return { message: "OTP sent successfully" };
};

export const loginVerifyOtp = async (email: string, otp: string): Promise<AuthResult> => {
    // 1. Verify OTP
    const otpRecord = await otpRepository.findLatestOtp(email);
    if (!otpRecord) throw new AuthError("Invalid or expired OTP");

    const isValid = await bcrypt.compare(otp, otpRecord.otp_hash);
    if (!isValid) throw new AuthError("Invalid OTP");

    await otpRepository.deleteOtp(email);

    // 2. Get User
    let user = await userRepository.findByEmail(email);
    if (!user) {
        throw new AuthError("User not found. Please register first.", 404);
    }

    // 3. Ensure Verified
    if (!user.is_verified) {
        user = await userRepository.markVerified(user.id);
    }

    // 4. Generate Token
    const token = generateJwt(user.id);

    return { user, token };
};

// ==========================================
// GOOGLE AUTH
// ==========================================

export const verifyGoogleToken = async (token: string): Promise<AuthResult> => {
    let ticket;
    try {
        ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: GOOGLE_CLIENT_ID,
        });
    } catch (error) {
        throw new AuthError("Invalid Google Token");
    }

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
        throw new AuthError("Invalid Google Token Payload");
    }

    const { email, given_name, family_name, sub: googleId } = payload;

    let user = await userRepository.findByEmail(email);

    if (!user) {
        // Auto-register for Google
        user = await userRepository.create(email, given_name, family_name, googleId);
    } else {
        if (!user.google_id || !user.is_verified) {
            user = await userRepository.updateGoogleId(user.id, googleId);
        }
    }

    const jwtToken = generateJwt(user.id);

    return { user, token: jwtToken };
};

// Helper
export const generateJwt = (userId: string): string => {
    return jwt.sign(
        { userId },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
};
