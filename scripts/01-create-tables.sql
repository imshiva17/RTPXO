-- Database schema for Train Traffic Controller System
-- This script creates the core tables for the railway management system

-- Stations table
CREATE TABLE IF NOT EXISTS stations (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    code VARCHAR(10) UNIQUE NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    platforms INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tracks table
CREATE TABLE IF NOT EXISTS tracks (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    from_station_id VARCHAR(50) REFERENCES stations(id),
    to_station_id VARCHAR(50) REFERENCES stations(id),
    length_km DECIMAL(8, 2) NOT NULL,
    max_speed_kmh INTEGER NOT NULL,
    status VARCHAR(20) DEFAULT 'operational' CHECK (status IN ('operational', 'maintenance', 'blocked')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Signals table
CREATE TABLE IF NOT EXISTS signals (
    id VARCHAR(50) PRIMARY KEY,
    station_id VARCHAR(50) REFERENCES stations(id),
    name VARCHAR(100) NOT NULL,
    signal_type VARCHAR(20) NOT NULL CHECK (signal_type IN ('entry', 'exit', 'intermediate')),
    status VARCHAR(10) DEFAULT 'green' CHECK (status IN ('green', 'yellow', 'red')),
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trains table
CREATE TABLE IF NOT EXISTS trains (
    id VARCHAR(50) PRIMARY KEY,
    train_number VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    train_type VARCHAR(20) NOT NULL CHECK (train_type IN ('express', 'freight', 'suburban', 'special', 'maintenance')),
    priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),
    current_station_id VARCHAR(50) REFERENCES stations(id),
    next_station_id VARCHAR(50) REFERENCES stations(id),
    status VARCHAR(20) DEFAULT 'on_time' CHECK (status IN ('on_time', 'delayed', 'cancelled', 'diverted')),
    delay_minutes INTEGER DEFAULT 0,
    current_speed_kmh INTEGER DEFAULT 0,
    current_latitude DECIMAL(10, 8),
    current_longitude DECIMAL(11, 8),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Train schedules table
CREATE TABLE IF NOT EXISTS train_schedules (
    id SERIAL PRIMARY KEY,
    train_id VARCHAR(50) REFERENCES trains(id),
    station_id VARCHAR(50) REFERENCES stations(id),
    scheduled_arrival TIME,
    scheduled_departure TIME,
    platform_number INTEGER,
    actual_arrival TIMESTAMP,
    actual_departure TIMESTAMP,
    delay_minutes INTEGER DEFAULT 0,
    sequence_order INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(train_id, station_id, sequence_order)
);

-- Conflicts table
CREATE TABLE IF NOT EXISTS conflicts (
    id VARCHAR(50) PRIMARY KEY,
    conflict_type VARCHAR(20) NOT NULL CHECK (conflict_type IN ('crossing', 'platform', 'signal', 'track')),
    location_id VARCHAR(50) NOT NULL, -- station or signal ID
    severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    estimated_delay_minutes INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'resolved', 'ignored')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP
);

-- Conflict trains (many-to-many relationship)
CREATE TABLE IF NOT EXISTS conflict_trains (
    conflict_id VARCHAR(50) REFERENCES conflicts(id),
    train_id VARCHAR(50) REFERENCES trains(id),
    PRIMARY KEY (conflict_id, train_id)
);

-- AI Recommendations table
CREATE TABLE IF NOT EXISTS ai_recommendations (
    id VARCHAR(50) PRIMARY KEY,
    conflict_id VARCHAR(50) REFERENCES conflicts(id),
    recommendation_type VARCHAR(20) NOT NULL CHECK (recommendation_type IN ('hold', 'proceed', 'reroute', 'priority_change')),
    target_train_id VARCHAR(50) REFERENCES trains(id),
    action_description TEXT NOT NULL,
    reasoning TEXT NOT NULL,
    confidence_score DECIMAL(3, 2) CHECK (confidence_score BETWEEN 0 AND 1),
    estimated_delay_reduction INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'implemented')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    decided_at TIMESTAMP,
    decided_by VARCHAR(100) -- controller ID or system
);

-- KPI tracking table
CREATE TABLE IF NOT EXISTS kpi_snapshots (
    id SERIAL PRIMARY KEY,
    snapshot_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    punctuality_percentage DECIMAL(5, 2),
    average_delay_minutes DECIMAL(8, 2),
    trains_per_hour DECIMAL(6, 2),
    conflicts_resolved INTEGER DEFAULT 0,
    ai_acceptance_rate DECIMAL(5, 2),
    section_id VARCHAR(50) -- for future multi-section support
);

-- Simulation scenarios table
CREATE TABLE IF NOT EXISTS simulation_scenarios (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    initial_state JSONB NOT NULL, -- stores trains, delays, blockages
    expected_outcome JSONB, -- stores expected KPIs
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_trains_status ON trains(status);
CREATE INDEX IF NOT EXISTS idx_trains_current_station ON trains(current_station_id);
CREATE INDEX IF NOT EXISTS idx_conflicts_status ON conflicts(status);
CREATE INDEX IF NOT EXISTS idx_train_schedules_train_id ON train_schedules(train_id);
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_status ON ai_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_kpi_snapshots_time ON kpi_snapshots(snapshot_time);
