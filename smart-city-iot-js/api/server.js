// server.js - Complete Smart City Server
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
require('dotenv').config();

// Create Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(require('cors')());
app.use(express.json());
app.use(express.static('public'));

// Data storage
let trafficData = [];
let airQualityData = [];
let alerts = [];

// Johannesburg locations
const locations = [
  { name: 'CBD', lat: -26.2041, lng: 28.0473, type: 'urban' },
  { name: 'Sandton', lat: -26.1076, lng: 28.0567, type: 'commercial' },
  { name: 'Soweto', lat: -26.2385, lng: 28.0133, type: 'residential' },
  { name: 'Rosebank', lat: -26.1356, lng: 28.0316, type: 'commercial' },
  { name: 'Germiston', lat: -26.2608, lng: 28.1126, type: 'industrial' }
];

// Generate traffic data
function generateTrafficData(location) {
  const hour = new Date().getHours();
  const minute = new Date().getMinutes();
  
  // Traffic patterns based on time
  let baseVehicles, baseSpeed;
  if ((hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 18)) {
    // Rush hour
    baseVehicles = 35 + Math.sin(minute / 60 * Math.PI) * 15;
    baseSpeed = 25 + Math.cos(minute / 60 * Math.PI) * 10;
  } else if (hour >= 22 || hour <= 5) {
    // Night
    baseVehicles = 5 + Math.random() * 10;
    baseSpeed = 60 + Math.random() * 20;
  } else {
    // Normal hours
    baseVehicles = 15 + Math.sin(hour / 24 * Math.PI) * 10;
    baseSpeed = 45 + Math.cos(hour / 24 * Math.PI) * 15;
  }
  
  // Add randomness
  const vehicles = Math.max(0, Math.min(60, 
    baseVehicles + (Math.random() * 20 - 10)
  ));
  
  const speed = Math.max(5, Math.min(120,
    baseSpeed + (Math.random() * 15 - 7.5)
  ));
  
  // Determine congestion
  let congestion;
  if (speed < 20) congestion = 'severe';
  else if (speed < 40) congestion = 'high';
  else if (speed < 60) congestion = 'moderate';
  else congestion = 'low';
  
  // Check for incidents (8% chance during rush hour, 3% otherwise)
  const incidentChance = ((hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 18)) ? 0.08 : 0.03;
  const incidentDetected = Math.random() < incidentChance;
  const incidentTypes = ['accident', 'breakdown', 'roadwork', 'debris', 'flooding'];
  const incidentType = incidentDetected ? 
    incidentTypes[Math.floor(Math.random() * incidentTypes.length)] : null;
  
  return {
    camera_id: `JHB_CAM_${location.name.toUpperCase().substring(0, 3)}`,
    location: location,
    vehicles: Math.round(vehicles),
    speed: Math.round(speed * 10) / 10,
    congestion: congestion,
    incident_detected: incidentDetected,
    incident_type: incidentType,
    timestamp: new Date().toISOString()
  };
}

// Generate air quality data
function generateAirQualityData(location) {
  const hour = new Date().getHours();
  const weekday = new Date().getDay();
  
  // Base pollution based on location type
  let basePM25;
  switch(location.type) {
    case 'industrial': basePM25 = 45; break;
    case 'commercial': basePM25 = 30; break;
    case 'urban': basePM25 = 25; break;
    case 'residential': basePM25 = 20; break;
    default: basePM25 = 15;
  }
  
  // Time patterns (higher during day, lower at night)
  const timeFactor = 0.7 + 0.3 * Math.sin(hour / 24 * Math.PI);
  
  // Traffic impact (higher during rush hours)
  let trafficFactor = 1.0;
  if ((hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 18)) {
    trafficFactor = 1.5;
  }
  
  // Weekend effect
  if (weekday >= 5) { // Weekend
    if (location.type === 'industrial') trafficFactor *= 0.5;
    else if (location.type === 'commercial') trafficFactor *= 0.7;
    else trafficFactor *= 1.2;
  }
  
  // Generate pollutants
  const pm25 = Math.max(0, Math.min(300,
    basePM25 * timeFactor * trafficFactor * (1 + (Math.random() * 0.4 - 0.2))
  ));
  
  const pm10 = pm25 * 1.5;
  const co = (basePM25 / 10) * trafficFactor * (1 + Math.random() * 0.3);
  const no2 = (basePM25 / 20) * trafficFactor * (1 + Math.random() * 0.2);
  
  // Calculate AQI (simplified)
  let aqi, category;
  if (pm25 <= 12) {
    aqi = (pm25 / 12) * 50;
    category = 'Good';
  } else if (pm25 <= 35.4) {
    aqi = 50 + ((pm25 - 12.1) / (35.4 - 12.1)) * 50;
    category = 'Moderate';
  } else if (pm25 <= 55.4) {
    aqi = 100 + ((pm25 - 35.5) / (55.4 - 35.5)) * 50;
    category = 'Unhealthy for Sensitive Groups';
  } else if (pm25 <= 150.4) {
    aqi = 150 + ((pm25 - 55.5) / (150.4 - 55.5)) * 100;
    category = 'Unhealthy';
  } else {
    aqi = 200 + ((pm25 - 150.5) / (300 - 150.5)) * 100;
    category = 'Very Unhealthy';
  }
  
  return {
    sensor_id: `JHB_AIR_${location.name.toUpperCase().substring(0, 3)}`,
    location: location,
    pm25: Math.round(pm25 * 10) / 10,
    pm10: Math.round(pm10 * 10) / 10,
    co: Math.round(co * 100) / 100,
    no2: Math.round(no2 * 100) / 100,
    aqi: Math.round(aqi),
    category: category,
    temperature: 15 + 10 * Math.sin(hour / 24 * Math.PI) + (Math.random() * 5 - 2.5),
    humidity: 40 + 30 * Math.cos(hour / 24 * Math.PI) + (Math.random() * 20 - 10),
    timestamp: new Date().toISOString()
  };
}

// Start sensor simulation
function startSensorSimulation() {
  console.log('🚦 Starting sensor simulation...');
  
  // Traffic simulation (every 5 seconds)
  setInterval(() => {
    locations.forEach(location => {
      const traffic = generateTrafficData(location);
      trafficData.push(traffic);
      
      // Keep only last 1000 entries
      if (trafficData.length > 1000) {
        trafficData.shift();
      }
      
      // Broadcast via WebSocket
      io.emit('traffic_update', traffic);
      
      // Check for incidents and create alerts
      if (traffic.incident_detected) {
        const alert = {
          id: Date.now(),
          type: 'traffic_incident',
          location: location.name,
          severity: traffic.congestion === 'severe' ? 'high' : 'medium',
          message: `${traffic.incident_type} detected in ${location.name}`,
          timestamp: new Date().toISOString()
        };
        alerts.push(alert);
        io.emit('alert', alert);
        
        // Keep only last 50 alerts
        if (alerts.length > 50) {
          alerts.shift();
        }
      }
      
      // Log occasionally
      if (Math.random() < 0.2) {
        console.log(`📡 ${location.name}: ${traffic.vehicles} vehicles, ${traffic.speed} km/h, ${traffic.congestion}`);
      }
    });
  }, 5000);
  
  // Air quality simulation (every 10 seconds)
  setInterval(() => {
    locations.forEach(location => {
      const airQuality = generateAirQualityData(location);
      airQualityData.push(airQuality);
      
      // Keep only last 1000 entries
      if (airQualityData.length > 1000) {
        airQualityData.shift();
      }
      
      // Broadcast via WebSocket
      io.emit('air_quality_update', airQuality);
      
      // Create alert for poor air quality
      if (airQuality.aqi > 100) {
        const alert = {
          id: Date.now(),
          type: 'air_quality',
          location: location.name,
          severity: airQuality.aqi > 150 ? 'high' : 'medium',
          message: `Poor air quality in ${location.name} (AQI: ${airQuality.aqi})`,
          timestamp: new Date().toISOString()
        };
        alerts.push(alert);
        io.emit('alert', alert);
      }
      
      // Log occasionally
      if (Math.random() < 0.1) {
        console.log(`🌫️ ${location.name}: AQI ${airQuality.aqi}, ${airQuality.category}`);
      }
    });
  }, 10000);
}

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      api: 'running',
      websocket: 'active',
      simulation: 'running'
    },
    statistics: {
      traffic_readings: trafficData.length,
      air_quality_readings: airQualityData.length,
      active_alerts: alerts.length,
      locations_monitored: locations.length
    }
  });
});

app.get('/api/traffic', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  const data = trafficData.slice(-limit).reverse();
  
  // Calculate statistics
  const stats = {
    total_readings: trafficData.length,
    avg_vehicles: data.length > 0 ? 
      data.reduce((sum, d) => sum + d.vehicles, 0) / data.length : 0,
    avg_speed: data.length > 0 ? 
      data.reduce((sum, d) => sum + d.speed, 0) / data.length : 0,
    incidents: data.filter(d => d.incident_detected).length,
    congestion_distribution: {
      severe: data.filter(d => d.congestion === 'severe').length,
      high: data.filter(d => d.congestion === 'high').length,
      moderate: data.filter(d => d.congestion === 'moderate').length,
      low: data.filter(d => d.congestion === 'low').length
    }
  };
  
  res.json({
    success: true,
    count: data.length,
    data: data,
    statistics: stats,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/air-quality', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  const data = airQualityData.slice(-limit).reverse();
  
  res.json({
    success: true,
    count: data.length,
    data: data,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/alerts', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 100);
  const data = alerts.slice(-limit).reverse();
  
  res.json({
    success: true,
    count: data.length,
    data: data,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/analytics', (req, res) => {
  const recentTraffic = trafficData.slice(-100);
  const recentAir = airQualityData.slice(-100);
  
  // Traffic analytics
  const trafficByLocation = {};
  recentTraffic.forEach(data => {
    const loc = data.location.name;
    if (!trafficByLocation[loc]) {
      trafficByLocation[loc] = {
        readings: 0,
        total_vehicles: 0,
        total_speed: 0,
        incidents: 0
      };
    }
    trafficByLocation[loc].readings++;
    trafficByLocation[loc].total_vehicles += data.vehicles;
    trafficByLocation[loc].total_speed += data.speed;
    if (data.incident_detected) trafficByLocation[loc].incidents++;
  });
  
  const locationAnalytics = Object.entries(trafficByLocation).map(([location, stats]) => ({
    location,
    avg_vehicles: stats.total_vehicles / stats.readings,
    avg_speed: stats.total_speed / stats.readings,
    incident_rate: (stats.incidents / stats.readings) * 100,
    congestion_index: 100 - (stats.total_speed / stats.readings) * 1.5
  }));
  
  // Air quality analytics
  const avgAQI = recentAir.length > 0 ? 
    recentAir.reduce((sum, d) => sum + d.aqi, 0) / recentAir.length : 0;
  
  res.json({
    success: true,
    analytics: {
      traffic: {
        by_location: locationAnalytics,
        hotspots: locationAnalytics
          .filter(loc => loc.congestion_index > 60 || loc.incident_rate > 10)
          .sort((a, b) => b.congestion_index - a.congestion_index)
          .slice(0, 3)
      },
      air_quality: {
        avg_aqi: avgAQI,
        overall_health: avgAQI < 50 ? 'Good' : avgAQI < 100 ? 'Moderate' : 'Unhealthy',
        worst_location: recentAir.length > 0 ? 
          recentAir.reduce((worst, current) => current.aqi > worst.aqi ? current : worst) : null
      }
    },
    timestamp: new Date().toISOString()
  });
});

// WebSocket connection
io.on('connection', (socket) => {
  console.log(`🔌 New client connected: ${socket.id}`);
  
  socket.emit('welcome', {
    message: 'Connected to Johannesburg Smart City Dashboard',
    timestamp: new Date().toISOString(),
    locations: locations.map(l => l.name)
  });
  
  // Send initial data
  socket.emit('initial_data', {
    traffic: trafficData.slice(-20).reverse(),
    air_quality: airQualityData.slice(-10).reverse(),
    alerts: alerts.slice(-10).reverse()
  });
  
  socket.on('disconnect', () => {
    console.log(`🔌 Client disconnected: ${socket.id}`);
  });
});

// Start the server
server.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🏙️  JOHANNESBURG SMART CITY DASHBOARD');
  console.log('='.repeat(60));
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}`);
  console.log(`📚 API: http://localhost:${PORT}/api/health`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
  console.log('='.repeat(60));
  console.log('\n📡 Simulating 5 locations in Johannesburg:');
  locations.forEach(loc => console.log(`   📍 ${loc.name} (${loc.type})`));
  console.log('\n🎯 Press Ctrl+C to stop\n');
  
  // Start sensor simulation
  startSensorSimulation();
});