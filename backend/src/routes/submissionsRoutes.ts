import express from 'express';
import { getSubmissions } from '../controllers/submissionsController';
import { requireAuth } from '../middlewares/authMiddleware';

const router = express.Router();

// GET /api/submissions - Protected by requireAuth
router.get('/', requireAuth, getSubmissions as any);

export default router;
