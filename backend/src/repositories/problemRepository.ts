import pool from '../config/db';
import { Problem } from '../models/problem';

export const create = async (
    userId: string,
    title: string,
    company: string,
    difficulty: string,
    originalInput: any,
    aiOutput: any,
    timeLimitMs: number = 2000
): Promise<Problem> => {
    const result = await pool.query(
        `INSERT INTO problems (user_id, title, company, difficulty, original_input, ai_output, time_limit_ms)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [userId, title, company, difficulty, originalInput, aiOutput, timeLimitMs]
    );
    return result.rows[0];
};

export interface FindProblemsOptions {
    search?: string;
    company?: string;
    difficulty?: string;
    sort?: string;
}

export const findByUserId = async (userId: string, options: FindProblemsOptions = {}): Promise<Problem[]> => {
    let queryStr = 'SELECT * FROM problems WHERE user_id = $1';
    const queryParams: any[] = [userId];
    let paramIdx = 2;

    if (options.search) {
        queryStr += ` AND (title ILIKE $${paramIdx} OR company ILIKE $${paramIdx})`;
        queryParams.push(`%${options.search}%`);
        paramIdx++;
    }

    if (options.difficulty && options.difficulty !== 'all') {
        queryStr += ` AND difficulty = $${paramIdx}`;
        queryParams.push(options.difficulty);
        paramIdx++;
    }

    if (options.company && options.company !== 'all') {
        queryStr += ` AND company = $${paramIdx}`;
        queryParams.push(options.company);
        paramIdx++;
    }

    // Sorting logic
    const sortFieldMap: Record<string, string> = {
        'newest': 'created_at DESC',
        'oldest': 'created_at ASC',
        'difficulty_asc': 'CASE WHEN difficulty = \'Easy\' THEN 1 WHEN difficulty = \'Medium\' THEN 2 ELSE 3 END ASC',
        'difficulty_desc': 'CASE WHEN difficulty = \'Easy\' THEN 1 WHEN difficulty = \'Medium\' THEN 2 ELSE 3 END DESC',
        'title_asc': 'title ASC',
        'title_desc': 'title DESC'
    };

    const orderBy = sortFieldMap[options.sort || 'newest'] || 'created_at DESC';
    queryStr += ` ORDER BY ${orderBy}`;

    const result = await pool.query(queryStr, queryParams);
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

