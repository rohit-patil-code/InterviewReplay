import { query } from '../config/db';

export interface OtpRecord {
    id: string;
    email: string;
    otp_hash: string;
    expires_at: Date;
    created_at: Date;
}

export const saveOtp = async (email: string, otpHash: string, expiresAt: Date): Promise<void> => {
    await query(
        'INSERT INTO email_otps (email, otp_hash, expires_at) VALUES ($1, $2, $3)',
        [email, otpHash, expiresAt]
    );
};

export const findLatestOtp = async (email: string): Promise<OtpRecord | null> => {
    const result = await query(
        'SELECT * FROM email_otps WHERE email = $1 AND expires_at > NOW() ORDER BY created_at DESC LIMIT 1',
        [email]
    );
    return result.rows[0] || null;
};

export const deleteOtp = async (email: string): Promise<void> => {
    // We might want to delete all OTps for this email to prevent reuse, or just the verified one.
    // For security, checking against a specific ID would be better, but based on the prompt "Delete OTP",
    // and the fact we verify the *latest* valid one, deleting all for that user or just cleaning up is fine.
    // Let's delete all valid/expired OTPs for clarity or just let them rot? 
    // The prompt says "Delete OTP after successful verification."
    // Let's delete the OTps for this email to be clean.
    await query('DELETE FROM email_otps WHERE email = $1', [email]);
};
