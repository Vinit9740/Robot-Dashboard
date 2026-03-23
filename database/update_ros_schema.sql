-- Migration to support ROS2 integration and advanced monitoring
-- Add new tables for sensors, logs, and events

-- Extend robots table to store ROS bridge configuration
ALTER TABLE robots ADD COLUMN IF NOT EXISTS ros_bridge_url VARCHAR(255);
ALTER TABLE robots ADD COLUMN IF NOT EXISTS mode VARCHAR(50) DEFAULT 'MANUAL'; -- MANUAL or AUTONOMOUS

-- Create robot_sensors table
CREATE TABLE IF NOT EXISTS robot_sensors (
  id SERIAL PRIMARY KEY,
  robot_id UUID REFERENCES robots(id) ON DELETE CASCADE,
  sensor_name VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'OK', -- OK, WARNING, ERROR
  last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create robot_logs table
CREATE TABLE IF NOT EXISTS robot_logs (
  id SERIAL PRIMARY KEY,
  robot_id UUID REFERENCES robots(id) ON DELETE CASCADE,
  log_type VARCHAR(50), -- INFO, WARN, ERROR, DEBUG
  message TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create robot_events table
CREATE TABLE IF NOT EXISTS robot_events (
  id SERIAL PRIMARY KEY,
  robot_id UUID REFERENCES robots(id) ON DELETE CASCADE,
  event_type VARCHAR(100),
  description TEXT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_robot_sensors_robot_id ON robot_sensors(robot_id);
CREATE INDEX IF NOT EXISTS idx_robot_logs_robot_id ON robot_logs(robot_id);
CREATE INDEX IF NOT EXISTS idx_robot_events_robot_id ON robot_events(robot_id);
