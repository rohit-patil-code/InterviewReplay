import { Router } from 'express';
import * as userController from '../controllers/userController';

const router = Router();

router.post('/', userController.update);

export default router;
