import { createClient } from "redis";

const redisClient = createClient({
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
    },
});

redisClient.on("error", (err) => console.error("Redis Client Error", err));

await redisClient.connect();

const redisSubscriber = redisClient.duplicate();

redisSubscriber.on("error", (err) =>
    console.error("Redis Subscriber Error", err)
);

await redisSubscriber.connect();

export { redisClient, redisSubscriber };
