import Redis from 'ioredis';

// Redis connection configuration
const redisConfig = {
  host: process.env.REDIS_HOST || 'redis',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: null,
};

// Create Redis connection
export const redisConnection = new Redis(redisConfig);

// Handle connection events
redisConnection.on('connect', () => {
  console.log('✅ Connected to Redis');
});

redisConnection.on('error', (error: Error) => {
  console.error('❌ Redis connection error:', error);
});

redisConnection.on('close', () => {
  console.log('🔌 Redis connection closed');
});

export default redisConnection;