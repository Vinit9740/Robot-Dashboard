// This file should be run from: npx ts-node src/seed.ts
// Note: Run from the backend directory

import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function seedDatabase() {
    const client = await pool.connect();

    try {
        console.log('🌱 Starting database seeding...\n');

        // Create tables
        console.log('📋 Creating tables...');
        await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        org_id INT NOT NULL,
        role VARCHAR(50) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS robots (
        id UUID PRIMARY KEY,
        org_id INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        model VARCHAR(255) DEFAULT 'Standard Unit',
        api_key_hash VARCHAR(255),
        status VARCHAR(50) DEFAULT 'OFFLINE',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS telemetry (
        id SERIAL PRIMARY KEY,
        robot_id UUID REFERENCES robots(id) ON DELETE CASCADE,
        org_id INT NOT NULL,
        battery FLOAT,
        cpu FLOAT,
        temperature FLOAT,
        pose_x FLOAT,
        pose_y FLOAT,
        pose_theta FLOAT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_org_id ON users(org_id);
      CREATE INDEX IF NOT EXISTS idx_robots_org_id ON robots(org_id);
      CREATE INDEX IF NOT EXISTS idx_telemetry_robot_id ON telemetry(robot_id);
      CREATE INDEX IF NOT EXISTS idx_telemetry_org_id ON telemetry(org_id);
    `);
        console.log('✅ Tables created successfully\n');

        // Seed test users
        console.log('👤 Creating test users...');
        const hashedPassword = await bcrypt.hash('password123', 10);

        const testUsers = [
            { email: 'user@test.com', password_hash: hashedPassword, org_id: 1, role: 'admin' },
            { email: 'admin@test.com', password_hash: hashedPassword, org_id: 1, role: 'admin' },
            { email: 'demo@test.com', password_hash: hashedPassword, org_id: 2, role: 'user' },
        ];

        for (const user of testUsers) {
            try {
                await client.query(
                    'INSERT INTO users (email, password_hash, org_id, role) VALUES ($1, $2, $3, $4)',
                    [user.email, user.password_hash, user.org_id, user.role]
                );
                console.log(`  ✓ Created user: ${user.email}`);
            } catch (err: any) {
                if (err.code === '23505') {
                    console.log(`  ℹ️ User already exists: ${user.email}`);
                } else {
                    throw err;
                }
            }
        }

        console.log('\n✅ Database seeding completed!\n');
        console.log('📝 Test Credentials:');
        console.log('   Email: user@test.com');
        console.log('   Password: password123\n');
        console.log('   Or use:');
        console.log('   Email: admin@test.com');
        console.log('   Password: password123\n');

    } catch (err) {
        console.error('❌ Error seeding database:', err);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
}

seedDatabase().catch(console.error);
