const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(express.json());
app.use(cors());

const TOKEN = "8778206124:AAE6ds3PMFzO3uGKvD2YHOD8BhZ0wqbrLXA";
const CHAT_ID = "8756568068";

app.post("/send-alert", async (req, res) => {
    const message = req.body.message;

    try {
        await axios.post(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
            chat_id: CHAT_ID,
            text: message
        });

        res.json({ status: "sent" });
    } catch (err) {
        res.status(500).json({ error: "telegram failed" });
    }
});

app.listen(3000, () => {
    console.log("Alert server running on port 3000");
});