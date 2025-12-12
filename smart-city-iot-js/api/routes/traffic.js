// api/routes/traffic.js
const express = require('express');
const router = express.Router();
const { pgPool, redisClient } = require('../../config/database');

// GET /api/v1/traffic - Get traffic data
router.get('/', async (req, res) => {
  try {
    const { 
      camera_id: cameraId, 
      limit = 100, 
      hours = 24,
      sort = 'desc'
    } = req.query;

    let query = 'SELECT * FROM traffic_data WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (cameraId) {
      query += ` AND camera_id = $${paramCount}`;
      params.push(cameraId);
      paramCount++;
    }

    if (hours) {
      query += ` AND timestamp >= NOW() - INTERVAL '${hours} hours'`;
    }

    query += ` ORDER BY timestamp ${sort.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'}`;
    query += ` LIMIT $${paramCount}`;
    params.push(Math.min(parseInt(limit), 1000));

    const result = await pgPool.query(query, params);
    
    // Cache in Redis for 30 seconds
    const cacheKey = `traffic:${cameraId || 'all'}:${limit}:${hours}`;
    await redisClient.setEx(cacheKey, 30, JSON.stringify(result.rows));

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching traffic data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch traffic data'
    });
  }
});

// POST /api/v1/traffic - Receive traffic data from sensors
router.post('/', async (req, res) => {
  try {
    const { 
      camera_id: cameraId,
      location,
      vehicle_count: vehicleCount,
      avg_speed: avgSpeed,
      congestion_level: congestionLevel,
      incident_detected: incidentDetected,
      incident_type: incidentType
    } = req.body;

    // Validate required fields
    if (!cameraId || !location || vehicleCount === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields'
      });
    }

    const query = `
      INSERT INTO traffic_data 
      (camera_id, location, vehicle_count, avg_speed, congestion_level, incident_detected, incident_type)
      VALUES ($1, $2::jsonb, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const values = [
      cameraId,
      JSON.stringify(location),
      vehicleCount,
      avgSpeed,
      congestionLevel,
      incidentDetected || false,
      incidentType || null
    ];

    const result = await pgPool.query(query, values);

    // Publish to Redis Pub/Sub for real-time updates
    await redisClient.publish('traffic:updates', JSON.stringify({
      type: 'new_traffic_data',
      data: result.rows[0],
      timestamp: new Date().toISOString()
    }));

    res.status(201).json({
      success: true,
      message: 'Traffic data received',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error saving traffic data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save traffic data'
    });
  }
});

// GET /api/v1/traffic/analytics - Get traffic analytics
router.get('/analytics', async (req, res) => {
  try {
    const { hours = 24 } = req.query;

    const query = `
      SELECT 
        camera_id,
        COUNT(*) as reading_count,
        AVG(vehicle_count) as avg_vehicles,
        AVG(avg_speed) as avg_speed,
        COUNT(CASE WHEN incident_detected THEN 1 END) as incident_count,
        MIN(timestamp) as first_reading,
        MAX(timestamp) as last_reading
      FROM traffic_data
      WHERE timestamp >= NOW() - INTERVAL '${hours} hours'
      GROUP BY camera_id
      ORDER BY avg_vehicles DESC
    `;

    const result = await pgPool.query(query);

    // Calculate overall statistics
    const overallStats = {
      total_readings: result.rows.reduce((sum, row) => sum + parseInt(row.reading_count), 0),
      total_cameras: result.rows.length,
      overall_avg_speed: result.rows.reduce((sum, row) => sum + parseFloat(row.avg_speed), 0) / result.rows.length,
      total_incidents: result.rows.reduce((sum, row) => sum + parseInt(row.incident_count), 0)
    };

    // Identify hotspots
    const hotspots = result.rows
      .filter(row => parseFloat(row.avg_speed) < 30 || parseInt(row.incident_count) > 0)
      .map(row => ({
        camera_id: row.camera_id,
        avg_speed: parseFloat(row.avg_speed),
        incident_count: parseInt(row.incident_count),
        congestion_level: parseFloat(row.avg_speed) < 20 ? 'Severe' : 
                         parseFloat(row.avg_speed) < 40 ? 'High' : 'Moderate'
      }));

    res.json({
      success: true,
      analytics: result.rows,
      overall_stats: overallStats,
      hotspots: hotspots,
      analysis_period: `${hours} hours`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error calculating analytics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate analytics'
    });
  }
});

module.exports = router;