import { Request, Response, NextFunction } from 'express';
import * as problemRepository from '../repositories/problemRepository';
import { Queue } from 'bullmq';
import Redis from 'ioredis';

console.log('[System] Initializing global Redis connection for Producer...');
const connection = new Redis({
    host: '127.0.0.1',
    port: 6379,
    maxRetriesPerRequest: null,
    enableOfflineQueue: false, // Prevents the "Pending" hang if Redis is unreachable
    family: 4,                  // Forces IPv4
    tls: {
        rejectUnauthorized: false // Required to bypass certificate name mismatch through the tunnel
    }
});

connection.on('error', (err) => {
    // Catch redis errors gracefully to not crash the whole node process
    console.error('[Redis Error] Connection failed:', err.message);
});

console.log('[System] Initializing BullMQ Producer Queue...');
const testCaseQueue = new Queue('{test-case-generation}', { connection });

export const createProblem = async (req: Request, res: Response, next: NextFunction) => {
    console.log('\n--- NEW REQUEST: POST /api/problems ---');
    try {
        console.log('[Producer] Extracting request body...');
        const userId = (req as any).user.userId;
        const { title, company, difficulty, original_input, ai_output } = req.body;

        if (!title || !original_input || !ai_output) {
            console.log('[Producer] Validation failed: Missing fields.');
            res.status(400).json({ error: "Missing required fields" });
            return;
        }

        console.log(`[Producer] Connecting to Postgres DB to insert problem. Status will default to 'processing'.`);
        const problem = await problemRepository.create(
            userId,
            title,
            company || 'other',
            difficulty || 'medium',
            original_input,
            ai_output
        );
        console.log(`[Producer] SUCCESS: Inserted problem into DB. Generated ID: ${problem.id}`);

        console.log(`[Producer] Connecting to BullMQ via Redis 127.0.0.1:6379 to add job...`);
        const job = await testCaseQueue.add('generate-test-cases', {
            problemId: problem.id,
            description: title,
            original_input,
            ai_output
        });
        console.log(`[Producer] SUCCESS: BullMQ Job added with Job ID: ${job.id}`);

        console.log('[Producer] Returning 202 Accepted successful response.');
        res.status(202).json({ success: true, problemId: problem.id });
    } catch (error) {
        console.error('[Producer] FATAL ERROR IN ROUTE:', error);
        next(error);
    }
};

export const getMyProblems = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.userId;
        const problems = await problemRepository.findByUserId(userId);
        res.status(200).json({ problems });
    } catch (error) {
        next(error);
    }
};

export const deleteProblem = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.userId;
        const problemId = req.params.id as string;

        if (!problemId) {
            res.status(400).json({ error: "Problem ID is required" });
            return;
        }

        const deleted = await problemRepository.deleteProblem(problemId, userId);

        if (!deleted) {
            res.status(404).json({ error: "Problem not found or unauthorized to delete" });
            return;
        }

        res.status(200).json({ message: "Problem deleted successfully" });
    } catch (error) {
        next(error);
    }
};

export const getProblem = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.userId;
        const problemId = req.params.id as string;

        if (!problemId) {
            res.status(400).json({ error: "Problem ID is required" });
            return;
        }

        const problem = await problemRepository.getProblemById(problemId, userId);

        if (!problem) {
            res.status(404).json({ error: "Problem not found or unauthorized" });
            return;
        }

        res.status(200).json({ problem });
    } catch (error) {
        next(error);
    }
};

export const updateProblem = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.userId;
        const problemId = req.params.id as string;
        const { title, company, difficulty, original_input, ai_output } = req.body;

        if (!problemId) {
            res.status(400).json({ error: "Problem ID is required" });
            return;
        }

        if (!title || !original_input || !ai_output) {
            res.status(400).json({ error: "Missing required fields" });
            return;
        }

        const problem = await problemRepository.updateProblem(
            problemId,
            userId,
            title,
            company || 'other',
            difficulty || 'medium',
            original_input,
            ai_output
        );

        if (!problem) {
            res.status(404).json({ error: "Problem not found or unauthorized to update" });
            return;
        }

        res.status(200).json({ message: "Problem updated successfully", problem });
    } catch (error) {
        next(error);
    }
};
