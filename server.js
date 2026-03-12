const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

// --- CONFIGURATION ---
const TELEGRAM_TOKEN = "8778206124:AAE6ds3PMFzO3uGKvD2YHOD8BhZ0wqbrLXA";
const CHAT_ID = "8756568068";
const TWELVE_DATA_KEY = "d082b96785544f2aae33cffad13045a6";

// This array stores alerts while the server is running
let cloudAlerts = [];

// Endpoint for the website to "register" an alert
app.post("/register-alert", (req, res) => {
    const { symbol, price } = req.body;
    if (!symbol || !price) return res.status(400).json({ error: "Missing data" });

    cloudAlerts.push({
        symbol: symbol.toUpperCase(),
        targetPrice: Number(price),
        triggered: false
    });

    console.log(`Alert registered for ${symbol} at $${price}`);
    res.json({ status: "Cloud monitoring started" });
});

// BACKGROUND WORKER: Runs every 60 seconds
setInterval(async () => {
    console.log(`Checking ${cloudAlerts.length} active alerts...`);

    for (let alert of cloudAlerts) {
        if (alert.triggered) continue;

        try {
            const url = `https://api.twelvedata.com/price?symbol=${alert.symbol}&apikey=${TWELVE_DATA_KEY}`;
            const response = await axios.get(url);
            const currentPrice = Number(response.data.price);

            if (currentPrice >= alert.targetPrice) {
                // Send Telegram Notification
                await axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
                    chat_id: CHAT_ID,
                    text: `🚀 CLOUD ALERT: ${alert.symbol} reached $${currentPrice}! (Target: $${alert.targetPrice})`
                });

                alert.triggered = true; // Mark as done so it doesn't spam you
                console.log(`Alert triggered for ${alert.symbol}`);
            }
        } catch (err) {
            console.error(`Error checking ${alert.symbol}:`, err.message);
        }
    }

    // Optional: Clean up triggered alerts to save memory
    cloudAlerts = cloudAlerts.filter(a => !a.triggered);

}, 60000); // 60 seconds is safer for free API limits

app.listen(3000, () => {
    console.log("Cloud Monitor Server running on port 3000");
});
