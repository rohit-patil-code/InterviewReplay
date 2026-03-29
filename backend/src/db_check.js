const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function checkDb() {
    try {
        const res = await pool.query("SELECT id, title, solution_code, ai_output FROM problems WHERE title ILIKE '%depth%' OR ai_output ILIKE '%maxDepth%' LIMIT 5;");
        for (const row of res.rows) {
            console.log("Problem:", row.title, "| ID:", row.id);
            console.log("Schema:", row.solution_code);
            console.log("AI Output Examples:", JSON.stringify(row.ai_output?.examples));
        }
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
checkDb();
