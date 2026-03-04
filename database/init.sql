-- Robot Dashboard Database Schema
-- Initialize database with tables and test data

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  org_id INT NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create robots table
CREATE TABLE IF NOT EXISTS robots (
  id UUID PRIMARY KEY,
  org_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  api_key_hash VARCHAR(255),
  status VARCHAR(50) DEFAULT 'OFFLINE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create telemetry table
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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_org_id ON users(org_id);
CREATE INDEX IF NOT EXISTS idx_robots_org_id ON robots(org_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_robot_id ON telemetry(robot_id);
CREATE INDEX IF NOT EXISTS idx_telemetry_org_id ON telemetry(org_id);

-- Test Data
-- Organization ID 1
-- User email: user@test.com
-- Password: password123 (bcrypted)
-- Bcrypt hash of "password123": $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/tsO

INSERT INTO users (email, password_hash, org_id, role)
VALUES ('user@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/tsO', 1, 'admin')
ON CONFLICT (email) DO NOTHING;

INSERT INTO users (email, password_hash, org_id, role)
VALUES ('admin@test.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcg7b3XeKeUxWdeS86E36P4/tsO', 1, 'admin')
ON CONFLICT (email) DO NOTHING;
