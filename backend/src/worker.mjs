import { Worker } from 'bullmq';
import Redis from 'ioredis';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import pg from 'pg';
import { exec } from 'child_process';
import util from 'util';
import fs from 'fs/promises';
import 'dotenv/config';

const { Pool } = pg;
const execPromise = util.promisify(exec);

console.log('[System] Initializing Worker Redis connection...');
const connection = new Redis({
    host: '127.0.0.1',
    port: 6379,
    maxRetriesPerRequest: null,
    // ADD THESE LINES:
    family: 4,                  // Forces IPv4 for the tunnel
    tls: {
        rejectUnauthorized: false // Required for tunneling to AWS
    }
});
connection.on('error', err => console.error('[Worker Redis Error]', err.message));

console.log('[System] Connecting to PostgreSQL database...');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

console.log('[System] Initializing Gemini AI...');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

console.log('[System] Initializing AWS S3 Client...');
const s3Client = new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    }
});

const worker = new Worker('{test-case-generation}', async (job) => {
    const { problemId, description } = job.data;
    console.log(`\n========================================`);
    console.log(`[Worker] Picked up job for problemId: ${problemId}`);

    try {
        // Step A: Edge Cases
        console.log(`[Worker - Step A] Calling Gemini for 3 Edge Cases...`);
        const edgePrompt = `You are an expert algorithm setter. Given the problem: "${description}", generate exactly 3 tricky edge cases. Return ONLY a strict JSON array of objects with keys "input" (string) and "expected_output" (string). DO NOT WRAP WITH MARKDOWN BACKTICKS.`;
        const edgeResult = await model.generateContent({ contents: [{ role: 'user', parts: [{ text: edgePrompt }] }] });

        let edgeText = edgeResult.response.text().trim();
        if (edgeText.startsWith('```json')) { edgeText = edgeText.replace(/^```json\n?/, '').replace(/```\n?$/, ''); }
        else if (edgeText.startsWith('```')) { edgeText = edgeText.replace(/^```\n?/, '').replace(/```\n?$/, ''); }

        const edgeCases = JSON.parse(edgeText);
        for (const tc of edgeCases) {
            await pool.query(
                `INSERT INTO test_cases (problem_id, type, input_data, expected_output) VALUES ($1, $2, $3, $4)`,
                [problemId, 'edge', tc.input, tc.expected_output]
            );
        }
        console.log(`[Worker - Step A] Inserted ${edgeCases.length} edge cases to PostgreSQL.`);

        // Step B: Script Generation
        console.log(`[Worker - Step B] Prompting Gemini for Node.js bulk generator script...`);
        const scriptPrompt = `Write a standalone Node.js script. The script MUST contain an optimal solution for this problem: "${description}". It MUST generate exactly 15 massive inputs for TLE testing, run them through the solution to get expected outputs, and use the 'fs' module to save them to the local disk as input_1.txt, output_1.txt, etc., up to 15. The script MUST NOT include any S3 upload logic or external AWS SDK dependencies. Return ONLY the raw JavaScript code (no markdown code blocks, no backticks).`;
        const scriptResult = await model.generateContent({ contents: [{ role: 'user', parts: [{ text: scriptPrompt }] }] });

        let scriptStr = scriptResult.response.text().trim();
        if (scriptStr.startsWith('```javascript')) { scriptStr = scriptStr.replace(/^```javascript\n?/, '').replace(/```\n?$/, ''); }
        else if (scriptStr.startsWith('```js')) { scriptStr = scriptStr.replace(/^```js\n?/, '').replace(/```\n?$/, ''); }
        else if (scriptStr.startsWith('```')) { scriptStr = scriptStr.replace(/^```\n?/, '').replace(/```\n?$/, ''); }

        // Step C: Execution
        const scriptName = `temp_generator_${problemId}.js`;
        console.log(`[Worker - Step C] Writing AI script to ${scriptName}...`);
        await fs.writeFile(scriptName, scriptStr, 'utf8');

        console.log(`[Worker - Step C] Executing ${scriptName} via child_process...`);
        await execPromise(`node ${scriptName}`);
        console.log(`[Worker - Step C] AI Script executed successfully.`);

        // Step D: S3 Upload
        console.log(`[Worker - Step D] Uploading 30 files to AWS S3...`);
        const bucket = process.env.AWS_S3_BUCKET_NAME || 'oarecall-test-cases';

        for (let i = 1; i <= 15; i++) {
            const inName = `input_${i}.txt`;
            const outName = `output_${i}.txt`;
            const inBuffer = await fs.readFile(inName);
            const outBuffer = await fs.readFile(outName);

            const s3InKey = `problems/${problemId}/inputs/${inName}`;
            const s3OutKey = `problems/${problemId}/outputs/${outName}`;

            await s3Client.send(new PutObjectCommand({ Bucket: bucket, Key: s3InKey, Body: inBuffer }));
            await s3Client.send(new PutObjectCommand({ Bucket: bucket, Key: s3OutKey, Body: outBuffer }));

            const inUrl = `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3InKey}`;
            const outUrl = `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${s3OutKey}`;

            await pool.query(
                `INSERT INTO test_cases (problem_id, type, input_file_url, output_file_url) VALUES ($1, $2, $3, $4)`,
                [problemId, 'large_tle', inUrl, outUrl]
            );
        }
        console.log(`[Worker - Step D] S3 Uploads complete. S3 URLs saved to DB.`);

        await pool.query(
            `UPDATE problems SET solution_code = $1 WHERE id = $2`,
            [scriptStr, problemId]
        );

        // Step E: Cleanup
        console.log(`[Worker - Step E] Cleaning up local files...`);
        try { await fs.unlink(scriptName); } catch (e) { }
        for (let i = 1; i <= 15; i++) {
            try { await fs.unlink(`input_${i}.txt`); } catch (e) { }
            try { await fs.unlink(`output_${i}.txt`); } catch (e) { }
        }

        await pool.query(`UPDATE problems SET status = 'generated' WHERE id = $1`, [problemId]);
        console.log(`[Worker - Step E] Problem status updated to 'generated'. JOB COMPLETE!`);

    } catch (error) {
        console.error(`[Worker ERROR] Job failed for problemId ${problemId}:`, error);
        await pool.query(`UPDATE problems SET status = 'failed' WHERE id = $1`, [problemId]);

        // Safety Cleanup
        try { await fs.unlink(`temp_generator_${problemId}.js`); } catch (e) { }
        for (let i = 1; i <= 15; i++) {
            try { await fs.unlink(`input_${i}.txt`); } catch (e) { }
            try { await fs.unlink(`output_${i}.txt`); } catch (e) { }
        }
    }
}, { connection });

console.log('[Worker] Initialization finished. Standing by for jobs...');
