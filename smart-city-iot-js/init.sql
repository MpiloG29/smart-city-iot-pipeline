-- sql/init.sql
-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Traffic data table
CREATE TABLE IF NOT EXISTS traffic_data (
    id SERIAL PRIMARY KEY,
    camera_id VARCHAR(50) NOT NULL,
    location JSONB NOT NULL,
    vehicle_count INTEGER NOT NULL CHECK (vehicle_count >= 0),
    avg_speed DECIMAL(5,2) NOT NULL CHECK (avg_speed >= 0 AND avg_speed <= 200),
    congestion_level VARCHAR(20) CHECK (congestion_level IN ('low', 'moderate', 'high', 'severe')),
    incident_detected BOOLEAN DEFAULT FALSE,
    incident_type VARCHAR(50),
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Convert to hypertable for time-series optimization
SELECT create_hypertable('traffic_data', 'timestamp', if_not_exists => TRUE);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_traffic_camera_timestamp ON traffic_data (camera_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_traffic_incidents ON traffic_data (incident_detected, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_traffic_congestion ON traffic_data (congestion_level, timestamp DESC);

-- Air quality table
CREATE TABLE IF NOT EXISTS air_quality (
    id SERIAL PRIMARY KEY,
    sensor_id VARCHAR(50) NOT NULL,
    location JSONB NOT NULL,
    pm2_5 DECIMAL(6,3) NOT NULL CHECK (pm2_5 >= 0),
    pm10 DECIMAL(6,3) NOT NULL CHECK (pm10 >= 0),
    co DECIMAL(6,3) NOT NULL CHECK (co >= 0),
    no2 DECIMAL(6,3) NOT NULL CHECK (no2 >= 0),
    o3 DECIMAL(6,3) NOT NULL CHECK (o3 >= 0),
    so2 DECIMAL(6,3) NOT NULL CHECK (so2 >= 0),
    aqi DECIMAL(5,1) NOT NULL CHECK (aqi >= 0),
    aqi_category VARCHAR(50) NOT NULL,
    temperature DECIMAL(5,2),
    humidity DECIMAL(5,2),
    wind_speed DECIMAL(5,2),
    timestamp TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Convert to hypertable
SELECT create_hypertable('air_quality', 'timestamp', if_not_exists => TRUE);

-- Create indexes for air quality
CREATE INDEX IF NOT EXISTS idx_air_sensor_timestamp ON air_quality (sensor_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_air_aqi ON air_quality (aqi, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_air_category ON air_quality (aqi_category, timestamp DESC);

-- Create materialized view for daily aggregates
CREATE MATERIALIZED VIEW IF NOT EXISTS daily_traffic_summary AS
SELECT 
    camera_id,
    DATE(timestamp) as date,
    COUNT(*) as reading_count,
    AVG(vehicle_count) as avg_vehicles,
    AVG(avg_speed) as avg_speed,
    COUNT(CASE WHEN incident_detected THEN 1 END) as incident_count,
    MIN(timestamp) as first_reading,
    MAX(timestamp) as last_reading
FROM traffic_data
WHERE timestamp >= NOW() - INTERVAL '30 days'
GROUP BY camera_id, DATE(timestamp)
ORDER BY date DESC, camera_id;

-- Refresh the view periodically (you can set up a cron job)
CREATE INDEX IF NOT EXISTS idx_daily_traffic ON daily_traffic_summary (date, camera_id);

-- Create user for application
CREATE USER IF NOT EXISTS app_user WITH PASSWORD 'app_password';
GRANT CONNECT ON DATABASE smartcity TO app_user;
GRANT SELECT, INSERT ON traffic_data, air_quality TO app_user;
GRANT SELECT ON daily_traffic_summary TO app_user;

-- Create function to get congestion hotspots
CREATE OR REPLACE FUNCTION get_congestion_hotspots(hours_interval INT DEFAULT 1)
RETURNS TABLE (
    camera_id VARCHAR(50),
    avg_speed DECIMAL(5,2),
    vehicle_count INTEGER,
    congestion_level VARCHAR(20),
    reading_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.camera_id,
        AVG(t.avg_speed) as avg_speed,
        AVG(t.vehicle_count)::INTEGER as vehicle_count,
        CASE 
            WHEN AVG(t.avg_speed) < 20 THEN 'severe'
            WHEN AVG(t.avg_speed) < 40 THEN 'high'
            WHEN AVG(t.avg_speed) < 60 THEN 'moderate'
            ELSE 'low'
        END as congestion_level,
        COUNT(*) as reading_count
    FROM traffic_data t
    WHERE t.timestamp >= NOW() - (hours_interval || ' hours')::INTERVAL
    GROUP BY t.camera_id
    HAVING AVG(t.avg_speed) < 40
    ORDER BY AVG(t.avg_speed) ASC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql;