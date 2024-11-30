const express = require("express");
const cors = require("cors");
require("dotenv").config(); // Load environment variables from .env

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: "https://g-saivishwas.github.io/Luffy_website/", // Replace with your frontend's actual URL
    methods: ["GET", "POST"], // Specify allowed methods
    allowedHeaders: ["Content-Type"] // Specify allowed headers
}));
app.use(express.json()); // Parse incoming JSON payloads

// Simple route for health check
app.get("/", (req, res) => {
    res.send("Server is up and running!");
});

// Chat endpoint
app.post("/chat", async (req, res) => {
    try {
        const { userMessage } = req.body;

        if (!userMessage) {
            return res.status(400).json({ error: "User message is required." });
        }

        // Simulate a response from your chat logic
        const reply = `You said: ${userMessage}`; // Replace with your chat logic

        res.json({ reply });
    } catch (error) {
        console.error("Error handling /chat request:", error);
        res.status(500).json({ error: "Internal server error." });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
