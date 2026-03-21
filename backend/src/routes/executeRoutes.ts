import express from 'express';
import { executeCode } from '../controllers/executeController';

const router = express.Router({ mergeParams: true });

// POST /api/problems/:id/execute
router.post('/execute', executeCode as any);

export default router;
