import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import pool from '../config/db';

dotenv.config();

async function migrate() {
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Create migrations table if not exists
        await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        run_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

        // Get executed migrations
        const { rows: executedMigrations } = await client.query(
            'SELECT name FROM _migrations'
        );
        const executedMigrationNames = new Set(executedMigrations.map((row) => row.name));

        // Get migration files
        const migrationsDir = path.join(__dirname, '../migrations');
        const files = fs.readdirSync(migrationsDir).sort();

        for (const file of files) {
            if (!executedMigrationNames.has(file) && file.endsWith('.sql')) {
                console.log(`Running migration: ${file}`);
                const filePath = path.join(migrationsDir, file);
                const sql = fs.readFileSync(filePath, 'utf-8');

                try {
                    await client.query(sql);
                    await client.query('INSERT INTO _migrations (name) VALUES ($1)', [file]);
                    console.log(`Migration ${file} executed successfully.`);
                } catch (error) {
                    console.error(`Error running migration ${file}:`, error);
                    throw error; // Re-throw to trigger rollback
                }
            } else {
                console.log(`Skipping migration: ${file} (already executed)`);
            }
        }

        await client.query('COMMIT');
        console.log('All migrations completed successfully.');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Migration execution failed, rolled back changes.', error);
        process.exit(1);
    } finally {
        client.release();
        pool.end(); // Close the pool
    }
}

migrate();
