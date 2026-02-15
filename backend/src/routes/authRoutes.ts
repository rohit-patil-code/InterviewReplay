import { Router } from 'express';
import * as authController from '../controllers/authController';

const router = Router();

// Registration Routes
// Registration Routes
router.post('/register/send-otp', authController.registerSendOtp);
router.post('/register/verify-otp', authController.registerVerifyOtp);

// Login Routes
router.post('/login/send-otp', authController.requestOtp);
router.post('/login/verify-otp', authController.verifyOtp);

// Google Route
router.post('/google', authController.googleAuth);

export default router;
