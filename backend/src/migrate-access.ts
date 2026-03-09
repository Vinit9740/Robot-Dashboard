import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function createTable() {
    const client = await pool.connect();
    try {
        console.log('📋 Creating user_robots table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS user_robots (
                user_id UUID NOT NULL,
                robot_id UUID NOT NULL REFERENCES robots(id) ON DELETE CASCADE,
                PRIMARY KEY (user_id, robot_id)
            );
        `);
        console.log('✅ Table user_robots created successfully');
    } catch (err) {
        console.error('❌ Error creating table:', err);
    } finally {
        client.release();
        await pool.end();
    }
}

createTable();
