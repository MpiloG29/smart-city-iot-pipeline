// scripts/start.js
#!/usr/bin/env node

require('dotenv').config();
const { exec } = require('child_process');
const { promisify } = require('util');
const APIServer = require('../api/server');
const SensorOrchestrator = require('../sensors');
const WebSocketServer = require('../api/websocket');

const execAsync = promisify(exec);

class SmartCityPipeline {
  constructor() {
    this.apiServer = null;
    this.sensorOrchestrator = null;
    this.wsServer = null;
    this.isRunning = false;
  }

  async start() {
    console.log('='.repeat(60));
    console.log('🏙️  JOHANNESBURG SMART CITY IOT PIPELINE');
    console.log('='.repeat(60));

    try {
      // 1. Check Docker services
      await this.checkDockerServices();
      
      // 2. Start API Server
      this.apiServer = new APIServer();
      const server = await this.apiServer.start();
      
      // 3. Start WebSocket Server
      this.wsServer = new WebSocketServer(server);
      
      // 4. Start Sensor Simulators
      this.sensorOrchestrator = new SensorOrchestrator();
      this.sensorOrchestrator.initializeSensors();
      
      // Wait a moment for API to be ready
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 5. Start sensors
      this.sensorOrchestrator.startAll();
      
      this.isRunning = true;
      
      console.log('\n✅ PIPELINE STARTED SUCCESSFULLY!');
      console.log('='.repeat(60));
      console.log('\n🌐 ACCESS POINTS:');
      console.log('   📚 API Server:    http://localhost:3000');
      console.log('   📊 Dashboard:     http://localhost:3001 (if started)');
      console.log('   🔌 WebSocket:     ws://localhost:3000');
      console.log('   🗄️  Database:      localhost:5432');
      console.log('   📡 MQTT Broker:   localhost:1883');
      console.log('\n👤 Database Credentials:');
      console.log('   Username: admin');
      console.log('   Password: admin123');
      console.log('   Database: smartcity');
      console.log('\n' + '='.repeat(60));
      console.log('Press Ctrl+C to stop the pipeline');
      console.log('='.repeat(60));
      
    } catch (error) {
      console.error('❌ Failed to start pipeline:', error);
      this.cleanup();
      process.exit(1);
    }
  }

  async checkDockerServices() {
    console.log('\n🔍 Checking Docker services...');
    
    try {
      const { stdout } = await execAsync('docker ps --format "table {{.Names}}\t{{.Status}}"');
      console.log('Docker containers running:');
      console.log(stdout);
      
      // Check for required services
      const services = ['mosquitto', 'timescaledb', 'redis'];
      for (const service of services) {
        if (stdout.includes(service)) {
          console.log(`✅ ${service} is running`);
        } else {
          console.log(`⚠️ ${service} is not running`);
        }
      }
      
    } catch (error) {
      console.warn('⚠️ Could not check Docker services:', error.message);
      console.log('Continuing anyway...');
    }
  }

  cleanup() {
    console.log('\n🛑 Cleaning up...');
    
    if (this.sensorOrchestrator) {
      this.sensorOrchestrator.stopAll();
    }
    
    if (this.apiServer) {
      this.apiServer.stop();
    }
    
    this.isRunning = false;
    console.log('✅ Cleanup complete');
  }

  setupSignalHandlers() {
    process.on('SIGINT', () => {
      console.log('\n\n🛑 Received SIGINT, shutting down...');
      this.cleanup();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('\n\n🛑 Received SIGTERM, shutting down...');
      this.cleanup();
      process.exit(0);
    });

    process.on('uncaughtException', (error) => {
      console.error('❌ Uncaught Exception:', error);
      this.cleanup();
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      this.cleanup();
      process.exit(1);
    });
  }
}

// Main execution
(async () => {
  const pipeline = new SmartCityPipeline();
  pipeline.setupSignalHandlers();
  
  try {
    await pipeline.start();
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
})();