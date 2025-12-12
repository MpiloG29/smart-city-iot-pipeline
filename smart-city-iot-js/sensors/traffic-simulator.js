// sensors/traffic-simulator.js
const mqtt = require('mqtt');
const config = require('../config');

class TrafficCamera {
  constructor(cameraId, location) {
    this.cameraId = cameraId;
    this.location = location;
    this.client = null;
    this.interval = null;
  }

  connect() {
    this.client = mqtt.connect(`mqtt://${config.mqtt.host}:${config.mqtt.port}`);
    
    this.client.on('connect', () => {
      console.log(`✅ Camera ${this.cameraId} connected to MQTT`);
      this.startStreaming();
    });

    this.client.on('error', (err) => {
      console.error(`❌ Camera ${this.cameraId} MQTT error:`, err);
    });
  }

  generateData() {
    const hour = new Date().getHours();
    const minute = new Date().getMinutes();
    
    // Traffic patterns
    let baseTraffic, baseSpeed;
    if ((hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 18)) {
      // Rush hour
      baseTraffic = 40;
      baseSpeed = 30;
    } else if (hour >= 22 || hour <= 5) {
      // Night
      baseTraffic = 10;
      baseSpeed = 60;
    } else {
      // Normal hours
      baseTraffic = 25;
      baseSpeed = 50;
    }

    // Add randomness
    const vehicleCount = Math.max(0, Math.min(50, 
      baseTraffic + Math.floor(Math.random() * 20) - 10
    ));
    
    const avgSpeed = Math.max(5, Math.min(120,
      baseSpeed + (Math.random() * 20) - 10
    ));

    // Determine congestion
    let congestionLevel;
    if (avgSpeed < 20) congestionLevel = 'severe';
    else if (avgSpeed < 40) congestionLevel = 'high';
    else if (avgSpeed < 60) congestionLevel = 'moderate';
    else congestionLevel = 'low';

    // Simulate incidents (5% chance)
    const incidentDetected = Math.random() < 0.05;
    const incidentTypes = ['accident', 'breakdown', 'roadwork', 'debris', null];
    const incidentType = incidentDetected ? 
      incidentTypes[Math.floor(Math.random() * (incidentTypes.length - 1))] : null;

    return {
      sensorId: this.cameraId,
      sensorType: 'traffic_camera',
      timestamp: new Date().toISOString(),
      location: this.location,
      vehicleCount,
      avgSpeed: parseFloat(avgSpeed.toFixed(1)),
      congestionLevel,
      incidentDetected,
      incidentType,
      laneStatus: {
        lane_1: Math.random() > 0.1 ? 'open' : 'slow',
        lane_2: Math.random() > 0.1 ? 'open' : 'slow',
        lane_3: Math.random() > 0.1 ? 'open' : 'slow'
      }
    };
  }

  startStreaming(interval = 5000) {
    this.interval = setInterval(() => {
      const data = this.generateData();
      const topic = `smartcity/traffic/${this.cameraId}`;
      
      this.client.publish(topic, JSON.stringify(data), { qos: 1 }, (err) => {
        if (err) {
          console.error(`Failed to publish from ${this.cameraId}:`, err);
        }
      });

      console.log(`📡 ${this.cameraId}: ${data.vehicleCount} vehicles, ${data.avgSpeed} km/h`);
    }, interval);
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
    }
    if (this.client) {
      this.client.end();
    }
    console.log(`🛑 Camera ${this.cameraId} stopped`);
  }
}

module.exports = TrafficCamera;