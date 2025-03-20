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
    res.setHeader("X-Accel-Buffering", "no"); // Disable buffering

    // Send initial comments or empty data to prevent initial Cloudflare timeout
    res.write(": keep-alive\n\n");

    const keepAliveInterval = setInterval(() => {
        // Send keep-alive message every ~50 seconds (less than 100s Cloudflare timeout)
        res.write(": keep-alive\n\n");
    }, 50000);

    redisSubscriber.subscribe(address, async (emailId) => {
        try {
            const emailData = await redisClient.hGet(address, emailId);
            if (emailData) {
                res.write(`data: ${emailData}\n\n`);
            }
        } catch (error) {
            console.error("Error fetching email data:", error);
            res.write(
                `event: error\ndata: ${JSON.stringify({
                    message: "Error fetching data",
                })}\n\n`
            );
        }
    });

    req.on("close", () => {
        redisSubscriber.unsubscribe(address);
        clearInterval(keepAliveInterval); // Clear the interval
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
