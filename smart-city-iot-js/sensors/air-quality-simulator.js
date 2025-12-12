// sensors/air-quality-simulator.js
const mqtt = require('mqtt');
const config = require('../config');

class AirQualitySensor {
  constructor(sensorId, location, environment = 'urban') {
    this.sensorId = sensorId;
    this.location = location;
    this.environment = environment;
    this.client = null;
    
    // Baseline pollution levels
    this.baselines = {
      industrial: { pm2_5: 50, pm10: 75, co: 5, no2: 0.05, o3: 0.04, so2: 0.01 },
      urban: { pm2_5: 25, pm10: 40, co: 2, no2: 0.03, o3: 0.03, so2: 0.005 },
      suburban: { pm2_5: 15, pm10: 25, co: 1, no2: 0.02, o3: 0.02, so2: 0.003 },
      rural: { pm2_5: 10, pm10: 15, co: 0.5, no2: 0.01, o3: 0.01, so2: 0.001 }
    };
    
    this.baseline = this.baselines[environment] || this.baselines.urban;
  }

  connect() {
    this.client = mqtt.connect(`mqtt://${config.mqtt.host}:${config.mqtt.port}`);
    
    this.client.on('connect', () => {
      console.log(`✅ Air sensor ${this.sensorId} connected`);
      this.startStreaming();
    });
  }

  calculateAQI(pm2_5) {
    // Simplified AQI calculation
    if (pm2_5 <= 12) return { aqi: (pm2_5 / 12) * 50, category: 'Good' };
    if (pm2_5 <= 35.4) return { aqi: 50 + ((pm2_5 - 12.1) / (35.4 - 12.1)) * 50, category: 'Moderate' };
    if (pm2_5 <= 55.4) return { aqi: 100 + ((pm2_5 - 35.5) / (55.4 - 35.5)) * 50, category: 'Unhealthy for Sensitive' };
    if (pm2_5 <= 150.4) return { aqi: 150 + ((pm2_5 - 55.5) / (150.4 - 55.5)) * 100, category: 'Unhealthy' };
    if (pm2_5 <= 250.4) return { aqi: 200 + ((pm2_5 - 150.5) / (250.4 - 150.5)) * 100, category: 'Very Unhealthy' };
    return { aqi: 300 + ((pm2_5 - 250.5) / (500.4 - 250.5)) * 200, category: 'Hazardous' };
  }

  generateData() {
    const hour = new Date().getHours();
    const weekday = new Date().getDay();
    
    // Time-based patterns
    let trafficFactor;
    if ((hour >= 7 && hour <= 9) || (hour >= 16 && hour <= 18)) {
      trafficFactor = 1.5; // Rush hour
    } else if (hour >= 22 || hour <= 5) {
      trafficFactor = 0.7; // Night
    } else {
      trafficFactor = 1.0; // Normal
    }
    
    // Weekend effect
    if (weekday >= 5) { // Weekend
      if (this.environment === 'industrial') {
        trafficFactor *= 0.5;
      } else {
        trafficFactor *= 1.2;
      }
    }
    
    // Generate pollutant readings
    const measurements = {};
    for (const [pollutant, baseline] of Object.entries(this.baseline)) {
      let value = baseline * trafficFactor;
      
      // Add daily cycle (sinusoidal)
      value *= (1 + 0.1 * Math.sin(hour * Math.PI / 12));
      
      // Add random noise
      value *= (1 + (Math.random() * 0.2 - 0.1));
      
      measurements[pollutant] = parseFloat(value.toFixed(3));
    }
    
    // Calculate AQI
    const { aqi, category } = this.calculateAQI(measurements.pm2_5);
    
    return {
      sensorId: this.sensorId,
      sensorType: 'air_quality',
      timestamp: new Date().toISOString(),
      location: this.location,
      environment: this.environment,
      measurements,
      aqi: parseFloat(aqi.toFixed(1)),
      aqiCategory: category,
      temperature: 20 + 10 * Math.sin(hour * Math.PI / 12),
      humidity: 50 + 20 * Math.cos(hour * Math.PI / 12),
      windSpeed: parseFloat((Math.random() * 10).toFixed(1))
    };
  }

  startStreaming(interval = 10000) {
    setInterval(() => {
      const data = this.generateData();
      const topic = `smartcity/air/${this.sensorId}`;
      
      this.client.publish(topic, JSON.stringify(data), { qos: 1 }, (err) => {
        if (err) {
          console.error(`Failed to publish from ${this.sensorId}:`, err);
        }
      });

      console.log(`🌫️ ${this.sensorId}: AQI ${data.aqi}, ${data.aqiCategory}`);
    }, interval);
  }
}

module.exports = AirQualitySensor;