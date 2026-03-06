import { EdgeCaseAgent } from './agents/edgeCaseAgent';
import { ScriptAgent } from './agents/scriptAgent';
import { SolutionAgent } from './agents/solutionAgent';
import pg from 'pg';
import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export const generateTestCasesFlow = async (problemId: string, description: string) => {
    const { Pool } = pg;
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    const s3Client = new S3Client({
        region: process.env.AWS_REGION,
        credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        }
    });

    console.log(`\n========================================`);
    console.log(`[Orchestrator] Starting multi-agent pipeline for problemId: ${problemId}`);

    const edgeCaseAgent = new EdgeCaseAgent();
    const scriptAgent = new ScriptAgent();
    const solutionAgent = new SolutionAgent();

    // Setup an isolated directory for the job execution dynamically
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), `oarecall-job-${problemId}-`));
    console.log(`[Orchestrator] Working in isolated sandbox env: ${tmpDir}`);

    try {
        // --- PHASE 1: Edge Cases Generation ---
        console.log(`[Orchestrator - Phase 1] Agent 1: Generating Edge Cases...`);
        const edgeCases = await edgeCaseAgent.generateEdgeCases(description);

        for (const tc of edgeCases) {
            await pool.query(
                `INSERT INTO test_cases (problem_id, type, input_data, expected_output) VALUES ($1, $2, $3, $4)`,
                [problemId, 'edge', tc.input, tc.expected_output]
            );
        }
        console.log(`[Orchestrator - Phase 1] Inserted ${edgeCases.length} edge cases into PostgreSQL.`);

        // --- PHASE 2: Deterministic Input Generator Script & Schema ---
        console.log(`[Orchestrator - Phase 2] Agent 3/4: Generating Deterministic Test Input Script Engine and Schema...`);
        const scriptData = await scriptAgent.generateAndVerifyScript(description, tmpDir);

        console.log(`[Orchestrator - Phase 2] 15 Massive Inputs created dynamically via test inputs engine inside sandbox: ${tmpDir}`);

        // --- PHASE 3: Solution Generation ---
        console.log(`[Orchestrator - Phase 3] Agent 5/6: Generating Optimal Solution and Starter Code using Schema...`);
        const schemaString = JSON.stringify(scriptData.generationSchema);
        const solutionData = await solutionAgent.generateAndVerifySolution(description, schemaString, tmpDir);

        console.log(`[Orchestrator - Phase 3] Successfully computed outputs via Optimal AI Solver Execution.`);

        console.log(`[Orchestrator - Phase 4] Saving starter_code and schema mapping to DB...`);
        await pool.query(
            `UPDATE problems SET starter_code = $1, solution_code = $2 WHERE id = $3`,
            [JSON.stringify(solutionData.starterCode), JSON.stringify(scriptData.generationSchema, null, 2), problemId]
        );

        // --- PHASE 5: S3 Uploads & DB Registration ---
        console.log(`[Orchestrator - Phase 5] Uploading 30 files to AWS S3 and registering to PostgreSQL...`);
        const bucket = process.env.AWS_S3_BUCKET_NAME || 'oarecall-test-cases';
        const region = process.env.AWS_REGION || 'us-east-1';

        for (let i = 1; i <= 15; i++) {
            const inName = `input_${i}.txt`;
            const outName = `output_${i}.txt`;
            const inPath = path.join(tmpDir, inName);
            const outPath = path.join(tmpDir, outName);

            const inBuffer = await fs.readFile(inPath);
            const outBuffer = await fs.readFile(outPath);

            const s3InKey = `problems/${problemId}/inputs/${inName}`;
            const s3OutKey = `problems/${problemId}/outputs/${outName}`;

            await s3Client.send(new PutObjectCommand({ Bucket: bucket, Key: s3InKey, Body: inBuffer }));
            await s3Client.send(new PutObjectCommand({ Bucket: bucket, Key: s3OutKey, Body: outBuffer }));

            // Construct standard secure AWS S3 URLs
            const inputUrl = `https://${bucket}.s3.${region}.amazonaws.com/${s3InKey}`;
            const outputUrl = `https://${bucket}.s3.${region}.amazonaws.com/${s3OutKey}`;

            // Insert into the database as 'large_tle' or 'standard' dynamic cases
            await pool.query(
                `INSERT INTO test_cases (problem_id, type, input_file_url, output_file_url) VALUES ($1, $2, $3, $4)`,
                [problemId, 'large_tle', inputUrl, outputUrl]
            );
        }

        console.log(`[Orchestrator - Phase 5] S3 Uploads complete.`);

        // --- LOCAL DEBUG SAVE ---
        console.log(`[Orchestrator - Debug Save] Saving debug scripts locally before cleaning up sandbox files...`);
        const debugDir = path.join(process.cwd(), 'debug_outputs', problemId);
        await fs.mkdir(debugDir, { recursive: true });

        // Save the raw scripts to the local directory
        await fs.writeFile(path.join(debugDir, 'generator_script.js'), scriptData.inputGenerationScript);
        await fs.writeFile(path.join(debugDir, 'solution_script.js'), solutionData.solutionScript);
        await fs.writeFile(path.join(debugDir, 'schema.json'), JSON.stringify(scriptData.generationSchema, null, 2));

        // Copy all 15 test case text files
        for (let i = 1; i <= 15; i++) {
            const inName = `input_${i}.txt`;
            const outName = `output_${i}.txt`;
            await fs.copyFile(path.join(tmpDir, inName), path.join(debugDir, inName)).catch(() => { });
            await fs.copyFile(path.join(tmpDir, outName), path.join(debugDir, outName)).catch(() => { });
        }

        console.log(`[Orchestrator - Debug Save] Saved sample I/O and bot scripts to ./debug_outputs/${problemId}`);
    } finally {
        // --- PHASE 6: Sandboxed Cleanup ---
        console.log(`[Orchestrator - Phase 6] Cleaning up local sandbox files from ${tmpDir}...`);
        try {
            await fs.rm(tmpDir, { recursive: true, force: true });
        } catch (e) {
            console.error(`[Orchestrator] Warning: Cleanup of sandbox failed: `, e);
        }
    }
};
