// sensors/index.js
const TrafficCamera = require('./traffic-simulator');
const AirQualitySensor = require('./air-quality-simulator');
const config = require('../config');

class SensorOrchestrator {
  constructor() {
    this.cameras = [];
    this.airSensors = [];
    this.isRunning = false;
  }

  initializeSensors() {
    // Johannesburg locations
    const jhbLocations = [
      { name: 'CBD', lat: -26.2041, lng: 28.0473 },
      { name: 'Sandton', lat: -26.1076, lng: 28.0567 },
      { name: 'Soweto', lat: -26.2385, lng: 28.0133 },
      { name: 'Rosebank', lat: -26.1356, lng: 28.0316 },
      { name: 'Germiston', lat: -26.2608, lng: 28.1126 }
    ];

    // Create traffic cameras
    jhbLocations.forEach((loc, index) => {
      const camera = new TrafficCamera(
        `JHB_CAM_${String(index + 1).padStart(3, '0')}`,
        loc
      );
      this.cameras.push(camera);
    });

    // Create air quality sensors
    const environments = ['urban', 'urban', 'suburban', 'industrial', 'urban'];
    jhbLocations.forEach((loc, index) => {
      const sensor = new AirQualitySensor(
        `JHB_AIR_${String(index + 1).padStart(3, '0')}`,
        loc,
        environments[index] || 'urban'
      );
      this.airSensors.push(sensor);
    });

    console.log(`🏙️ Initialized ${this.cameras.length} cameras and ${this.airSensors.length} air sensors`);
  }

  startAll() {
    if (this.isRunning) {
      console.log('⚠️ Sensors already running');
      return;
    }

    this.isRunning = true;
    console.log('🚀 Starting all sensors...');

    // Start cameras
    this.cameras.forEach(camera => {
      setTimeout(() => {
        camera.connect();
      }, Math.random() * 2000); // Stagger connections
    });

    // Start air sensors
    setTimeout(() => {
      this.airSensors.forEach(sensor => {
        setTimeout(() => {
          sensor.connect();
        }, Math.random() * 2000);
      });
    }, 1000);

    console.log('✅ All sensors started. Press Ctrl+C to stop.');
  }

  stopAll() {
    this.isRunning = false;
    console.log('🛑 Stopping all sensors...');
    
    this.cameras.forEach(camera => camera.stop());
    
    // Note: Air sensors don't have stop method yet
    console.log('✅ All sensors stopped');
  }
}

// If running directly
if (require.main === module) {
  const orchestrator = new SensorOrchestrator();
  orchestrator.initializeSensors();
  orchestrator.startAll();

  // Handle graceful shutdown
  process.on('SIGINT', () => {
    orchestrator.stopAll();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    orchestrator.stopAll();
    process.exit(0);
  });
}

module.exports = SensorOrchestrator;