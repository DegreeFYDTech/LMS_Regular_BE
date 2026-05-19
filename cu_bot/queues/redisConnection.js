import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const isSecure = redisUrl.startsWith('rediss://');

console.log('[BullMQ Redis] Initializing dedicated Redis client...');

const bullConnection = new Redis(redisUrl, {
  maxRetriesPerRequest: null, // Required by BullMQ
  socket: isSecure ? {
    tls: true,
    rejectUnauthorized: false
  } : undefined
});

bullConnection.on('connect', () => {
  console.log('✅ [BullMQ Redis] Connected successfully!');
});

bullConnection.on('error', (err) => {
  console.error('❌ [BullMQ Redis] Error:', err.message);
});

export default bullConnection;
