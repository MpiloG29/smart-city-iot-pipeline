// config/database.js
const { Pool } = require('pg');
const Redis = require('redis');
const config = require('./index');

// PostgreSQL connection
const pgPool = new Pool(config.database.postgres);

// Redis connection
const redisClient = Redis.createClient(config.database.redis);

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redisClient.connect();

// Test connections
async function testConnections() {
  try {
    const pgResult = await pgPool.query('SELECT NOW()');
    console.log('✅ PostgreSQL connected:', pgResult.rows[0].now);
    
    await redisClient.set('test', 'connected');
    const redisTest = await redisClient.get('test');
    console.log('✅ Redis connected:', redisTest);
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
  }
}

module.exports = {
  pgPool,
  redisClient,
  testConnections
};