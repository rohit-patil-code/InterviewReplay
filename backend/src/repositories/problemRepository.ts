import pool from '../config/db';
import { Problem } from '../models/problem';

export const create = async (
    userId: string,
    title: string,
    company: string,
    difficulty: string,
    originalInput: any,
    aiOutput: any
): Promise<Problem> => {
    const result = await pool.query(
        `INSERT INTO problems (user_id, title, company, difficulty, original_input, ai_output)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [userId, title, company, difficulty, originalInput, aiOutput]
    );
    return result.rows[0];
};

export const findByUserId = async (userId: string): Promise<Problem[]> => {
    const result = await pool.query(
        `SELECT * FROM problems WHERE user_id = $1 ORDER BY created_at DESC`,
        [userId]
    );
    return result.rows;
};

export const deleteProblem = async (problemId: string, userId: string): Promise<boolean> => {
    // Ensure that a user can only delete their own problem
    const result = await pool.query(
        `DELETE FROM problems WHERE id = $1 AND user_id = $2 RETURNING id`,
        [problemId, userId]
    );
    return result.rowCount !== null && result.rowCount > 0;
};

export const getProblemById = async (problemId: string, userId: string): Promise<Problem | null> => {
    const result = await pool.query(
        `SELECT * FROM problems WHERE id = $1 AND user_id = $2`,
        [problemId, userId]
    );
    return result.rows.length ? result.rows[0] : null;
};

export const updateProblem = async (
    problemId: string,
    userId: string,
    title: string,
    company: string,
    difficulty: string,
    originalInput: any,
    aiOutput: any
): Promise<Problem | null> => {
    const result = await pool.query(
        `UPDATE problems 
         SET title = $1, company = $2, difficulty = $3, original_input = $4, ai_output = $5, updated_at = NOW()
         WHERE id = $6 AND user_id = $7
         RETURNING *`,
        [title, company, difficulty, originalInput, aiOutput, problemId, userId]
    );
    return result.rows.length ? result.rows[0] : null;
};

