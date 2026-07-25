import Redis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const isSecure = redisUrl.startsWith('rediss://');


const bullConnection = new Redis(redisUrl, {
  maxRetriesPerRequest: null, // Required by BullMQ
  socket: isSecure ? {
    tls: true,
    rejectUnauthorized: false
  } : undefined
});

bullConnection.on('connect', () => {
});

bullConnection.on('error', (err) => {
});

export default bullConnection;
