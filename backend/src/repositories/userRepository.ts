import { query } from '../config/db';

export interface User {
    id: string;
    email: string;
    first_name?: string;
    last_name?: string;
    display_name?: string;
    display_name_last_changed_at?: Date;
    google_id?: string;
    is_verified: boolean;
    created_at: Date;
    updated_at: Date;
};


export const findByEmail = async (email: string): Promise<User | null> => {
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    return result.rows[0] || null;
};

export const findById = async (id: string): Promise<User | null> => {
    const result = await query('SELECT * FROM users WHERE id = $1', [id]);
    return result.rows[0] || null;
};

export const create = async (email: string, firstName?: string, lastName?: string, googleId?: string): Promise<User> => {
    const result = await query(
        'INSERT INTO users (email, first_name, last_name, google_id, is_verified) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [email, firstName, lastName, googleId, true] // Assumed verified if creating via this flow usually
    );
    return result.rows[0];
};

export const markVerified = async (userId: string): Promise<User> => {
    const result = await query(
        'UPDATE users SET is_verified = $1 WHERE id = $2 RETURNING *',
        [true, userId]
    );
    return result.rows[0];
};

export const updateGoogleId = async (userId: string, googleId: string): Promise<User> => {
    const result = await query(
        'UPDATE users SET google_id = $1, is_verified = $2 WHERE id = $3 RETURNING *',
        [googleId, true, userId]
    );
    return result.rows[0];
};
