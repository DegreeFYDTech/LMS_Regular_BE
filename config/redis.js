
import Redis from "ioredis";
import dotenv from "dotenv";
dotenv.config();
const redisUrl = process.env.REDIS_URL;
const isSecure = redisUrl && redisUrl.startsWith('rediss://');
const redis = new Redis(redisUrl, {
    socket: isSecure ? {
        tls: true,
        rejectUnauthorized: false 
    } : undefined   
});

redis.on("connect", () => {
    console.log("Redis connected successfully!");
});

redis.on("error", (err) => {
    // console.error("Redis connection error:", err);
});

export default redis;
