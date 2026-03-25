import { Router } from 'express';
import * as userController from '../controllers/userController';
import { requireAuth } from '../middlewares/authMiddleware';

const router = Router();

router.get('/', requireAuth, userController.getProfile);
router.patch('/', requireAuth, userController.updateProfile);
router.delete('/', requireAuth, userController.deleteAccount);

// Keep the old POST for backward compatibility
router.post('/', userController.update);

export default router;
