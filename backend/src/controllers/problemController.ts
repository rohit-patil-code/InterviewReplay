import { Request, Response, NextFunction } from 'express';
import * as problemRepository from '../repositories/problemRepository';

export const createProblem = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user.userId;
        const { title, company, difficulty, original_input, ai_output } = req.body;

        if (!title || !original_input || !ai_output) {
            res.status(400).json({ error: "Missing required fields" });
            return;
        }

        const problem = await problemRepository.create(
            userId,
            title,
            company || 'other',
            difficulty || 'medium',
            original_input,
            ai_output
        );

        res.status(201).json({ message: "Problem saved successfully", problem });
    } catch (error) {
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
