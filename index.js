import "dotenv/config.js";
const PORT = process.env.PORT || 3000;

import express from "express";
import cors from "cors";
import { redisClient, redisSubscriber } from "./redisClient.js";

const app = express();

app.use(
    cors({
        origin: "*",
    })
);
app.use(express.json());

app.get("/subscribe/:address", async (req, res) => {
    const { address } = req.params;

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    redisSubscriber.subscribe(address, async (emailId) => {
        const emailData = await redisClient.hGet(address, emailId);
        res.write(`data: ${emailData}\n\n`);
    });

    req.on("close", () => {
        redisSubscriber.unsubscribe(address);
        res.end();
    });
});

app.get("/emails/:address", async (req, res) => {
    const { address } = req.params;
    const emails = await redisClient.hGetAll(address);
    const parsedEmails = Object.values(emails).map((email) =>
        JSON.parse(email)
    );
    res.json(parsedEmails);
});

app.listen(PORT, () => {
    console.log(`Listening on port: ${PORT}`);
});
