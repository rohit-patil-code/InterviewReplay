import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import generateRoutes from './routes/generateRoutes';
import userRoutes from './routes/userRoutes';
import authRoutes from './routes/authRoutes';
import problemRoutes from './routes/problemRoutes';

dotenv.config();

const app = express();

app.use(cors({
    origin: ['http://localhost:3000'],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Mount routes
app.use('/api/generate', generateRoutes);
app.use('/api/profile', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/problems', problemRoutes);

export default app;
