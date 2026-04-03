import { Worker } from 'bullmq';
import Redis from 'ioredis';
import pg from 'pg';
import 'dotenv/config';
import dotenv from 'dotenv';
import path from 'path';

// Setup env variables explicitly if run directly
dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

import { generateTestCasesFlow } from './orchestrator';

const { Pool } = pg;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

console.log('[System] Initializing Worker Redis connection...');
const connection = process.env.REDIS_URL
    ? new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: null,
        family: 4,
        tls: process.env.REDIS_URL.includes('amazonaws.com') ? { rejectUnauthorized: false } : undefined
    })
    : new Redis({
        host: '127.0.0.1',
        port: 6379,
        maxRetriesPerRequest: null,
        family: 4,                  // Forces IPv4 for the tunnel
        tls: {
            rejectUnauthorized: false // Required for tunneling to AWS
        }
    });
connection.on('error', err => console.error('[Worker Redis Error]', err.message));

console.log('[Worker] Initialization finished with Multi-Agent Workflow framework. Standing by for jobs...\n');

const worker = new Worker('{test-case-generation}', async (job) => {
    const { problemId, description } = job.data;

    try {
        await pool.query(`UPDATE problems SET status = 'generating' WHERE id = $1`, [problemId]);

        // Execute the orchestrated multi-agent pipeline workflow
        await generateTestCasesFlow(problemId, description);

        // Success Completion
        await pool.query(`UPDATE problems SET status = 'generated' WHERE id = $1`, [problemId]);
        console.log(`[Worker] Problem status updated to 'generated'. JOB ${problemId} COMPLETE!`);

    } catch (error: any) {
        console.error(`\n[Worker ERROR] Job failed for problemId ${problemId}:`, error);
        await pool.query(`UPDATE problems SET status = 'failed' WHERE id = $1`, [problemId]);
    }
}, { connection });

worker.on('failed', (job, err) => {
    console.error(`[BullMQ Worker] Job ${job?.id} failed with error: ${err.message}`);
});
