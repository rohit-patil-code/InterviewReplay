import { Request, Response, NextFunction } from 'express';
import { Pool } from 'pg';

export const getSubmissions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const pool = new Pool({ connectionString: process.env.DATABASE_URL });

        // Retrieve userId from the decoded JWT token (populated by requireAuth middleware)
        // User's previous edit confirmed that the field name is 'userId'
        const userId = (req as any).user?.userId;
        
        if (!userId) {
            res.status(401).json({ error: "Unauthorized: Please log in to view history." });
            return;
        }

        const { problemId } = req.query;

        let query: string;
        let params: any[];

        if (problemId) {
            // Fetch submissions for a specific problem
            query = `
                SELECT 
                    s.id, s.problem_id, s.language, s.code, s.status, s.runtime_ms, s.submitted_at,
                    p.title as problem_title
                FROM submissions s
                LEFT JOIN problems p ON s.problem_id = p.id
                WHERE s.problem_id = $1::uuid AND s.user_id = $2::uuid
                ORDER BY s.submitted_at DESC
                LIMIT 20
            `;
            params = [problemId, userId];
        } else {
            // Fetch all submissions for the history page
            query = `
                SELECT 
                    s.id, s.problem_id, s.language, s.code, s.status, s.runtime_ms, s.submitted_at,
                    p.title as problem_title, p.difficulty
                FROM submissions s
                LEFT JOIN problems p ON s.problem_id = p.id
                WHERE s.user_id = $1::uuid
                ORDER BY s.submitted_at DESC
                LIMIT 100
            `;
            params = [userId];
        }

        const result = await pool.query(query, params);
        
        // Build heatmap data: count submissions per day for the last year
        const heatmapQuery = `
            SELECT 
                DATE(submitted_at AT TIME ZONE 'UTC') as day,
                COUNT(*) as count,
                SUM(CASE WHEN status = 'Accepted' THEN 1 ELSE 0 END) as accepted_count
            FROM submissions
            WHERE submitted_at >= NOW() - INTERVAL '1 year' AND user_id = $1::uuid
            GROUP BY day
            ORDER BY day
        `;
        const heatmapResult = await pool.query(heatmapQuery, [userId]);

        res.status(200).json({
            success: true,
            submissions: result.rows,
            heatmap: heatmapResult.rows
        });

        await pool.end();
    } catch (error) {
        next(error);
    }
};
