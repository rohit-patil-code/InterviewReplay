import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import generateRoutes from './routes/generateRoutes';
import userRoutes from './routes/userRoutes';
import authRoutes from './routes/authRoutes';
import problemRoutes from './routes/problemRoutes';
import executeRoutes from './routes/executeRoutes';
import submissionsRoutes from './routes/submissionsRoutes';

dotenv.config();

const app = express();

app.use(cors({
    origin: ['http://localhost:3000', 'https://oarecall.rohitcodes.tech'],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Mount routes
app.use('/api/generate', generateRoutes);
app.use('/api/profile', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/problems', problemRoutes);
app.use('/api/problems/:id', executeRoutes);
app.use('/api/submissions', submissionsRoutes);

export default app;
