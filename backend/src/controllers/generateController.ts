import { Request, Response } from 'express';
import { generateProblem } from '../services/aiService';

export const generate = async (req: Request, res: Response): Promise<void> => {
    try {
        const { memory, difficulty, company } = req.body;

        if (!memory || !difficulty || !company) {
            res.status(400).json({ error: "Memory/Description, Difficulty and Company are required" });
            return;
        }

        const problemData = await generateProblem({ memory, difficulty, company });
        res.json(problemData);

    } catch (error: any) {
        console.error("Error in generate controller:", error);
        res.status(500).json({ error: error.message || "Internal Server Error" });
    }
};
