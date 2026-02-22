import express from 'express';
import { requireAuth } from '../middlewares/authMiddleware';
import * as problemController from '../controllers/problemController';

const router = express.Router();

// Protected Routes
router.use(requireAuth);

router.post('/', problemController.createProblem);
router.get('/', problemController.getMyProblems);
router.delete('/:id', problemController.deleteProblem);

export default router;
