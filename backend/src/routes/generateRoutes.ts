import { Router } from 'express';
import * as generateController from '../controllers/generateController';

const router = Router();

router.post('/', generateController.generate);

export default router;
