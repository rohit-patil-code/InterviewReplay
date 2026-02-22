import { Router } from 'express';
import * as authController from '../controllers/authController';

const router = Router();

// Registration Routes
router.post('/register/send-otp', authController.registerSendOtp);
router.post('/register/verify-otp', authController.registerVerifyOtp);

// Login Routes
router.post('/login/send-otp', authController.loginSendOtp);
router.post('/login/verify-otp', authController.loginVerifyOtp);

// Google Route
router.post('/google', authController.googleLogin);

// Profile Route
import { requireAuth } from '../middlewares/authMiddleware';
router.get('/me', requireAuth, authController.getMe);

// Logout Route
router.post('/logout', authController.logout);

router.use((err: any, req: any, res: any, next: any) => {
    console.error(err);

    res.status(err.statusCode || 500).json({
        message: err.message || "Internal Server Error",
    });
});

export default router;
