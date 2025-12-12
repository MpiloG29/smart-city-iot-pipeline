// api/websocket.js
const { Server } = require('socket.io');
const { redisClient } = require('../config/database');

class WebSocketServer {
  constructor(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.CORS_ORIGIN || '*',
        methods: ['GET', 'POST']
      }
    });
    
    this.setupConnection();
    this.setupRedisSubscriptions();
  }

  setupConnection() {
    this.io.on('connection', (socket) => {
      console.log(`🔌 New client connected: ${socket.id}`);
      
      // Send initial data
      socket.emit('connected', {
        message: 'Connected to Smart City WebSocket',
        timestamp: new Date().toISOString(),
        clientId: socket.id
      });

      // Handle client messages
      socket.on('subscribe', (data) => {
        const { topics } = data;
        if (topics && Array.isArray(topics)) {
          topics.forEach(topic => {
            socket.join(topic);
            console.log(`Client ${socket.id} subscribed to ${topic}`);
          });
        }
      });

      socket.on('unsubscribe', (data) => {
        const { topics } = data;
        if (topics && Array.isArray(topics)) {
          topics.forEach(topic => {
            socket.leave(topic);
            console.log(`Client ${socket.id} unsubscribed from ${topic}`);
          });
        }
      });

      socket.on('disconnect', () => {
        console.log(`🔌 Client disconnected: ${socket.id}`);
      });
    });
  }

  setupRedisSubscriptions() {
    // Subscribe to Redis channels for real-time updates
    const subscriber = redisClient.duplicate();
    
    subscriber.connect().then(() => {
      // Subscribe to traffic updates
      subscriber.subscribe('traffic:updates', (message) => {
        try {
          const data = JSON.parse(message);
          this.io.to('traffic').emit('traffic_update', data);
        } catch (error) {
          console.error('Error parsing Redis message:', error);
        }
      });

      // Subscribe to air quality updates
      subscriber.subscribe('air_quality:updates', (message) => {
        try {
          const data = JSON.parse(message);
          this.io.to('air_quality').emit('air_quality_update', data);
        } catch (error) {
          console.error('Error parsing Redis message:', error);
        }
      });

      console.log('✅ Redis subscriptions established');
    }).catch(error => {
      console.error('❌ Failed to setup Redis subscriptions:', error);
    });
  }

  broadcastToRoom(room, event, data) {
    this.io.to(room).emit(event, data);
  }

  broadcastToAll(event, data) {
    this.io.emit(event, data);
  }
}

module.exports = WebSocketServer;