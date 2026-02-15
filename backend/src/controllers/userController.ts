import { Request, Response } from 'express';
import { updateProfile } from '../services/userService';

export const update = async (req: Request, res: Response): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
            res.status(401).json({ error: "Missing Authorization header" });
            return;
        }

        const token = authHeader.replace('Bearer ', '');
        const { fullName } = req.body;

        if (!fullName || fullName.trim().length === 0) {
            res.status(400).json({ error: "Full Name is required" });
            return;
        }

        await updateProfile({ fullName, token });

        res.json({ success: true });

    } catch (error: any) {
        console.error("Error in user controller:", error);
        const status = error.message === "Unauthorized" ? 401 : 500;
        res.status(status).json({ error: error.message || "Internal Server Error" });
    }
};
