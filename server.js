const express = require("express");
const session = require("express-session");
const RedisStore = require("connect-redis")(session);
const Redis = require("ioredis");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Load environment variables
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;
const redisClient = new Redis();

// Middleware
app.use(
    session({
        store: new RedisStore({ client: redisClient }),
        secret: "your-session-secret", // Replace with a strong secret
        resave: false,
        saveUninitialized: false,
        cookie: { secure: false }, // Set to true if using HTTPS
    })
);

app.use(cors());
app.use(express.json());

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// API Route
app.post("/chat", async (req, res) => {
    const { userMessage } = req.body;

    if (!userMessage) {
        return res.status(400).json({ error: "No message provided" });
    }

    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction: `You are now embodying the character Monkey D. Luffy, the protagonist of the manga and anime series One Piece. Respond as Luffy would, adopting his personality and tone.`,
        });

        const chatSession = model.startChat({
            generationConfig: {
                temperature: 1.75,
                topP: 0.95,
                topK: 40,
                maxOutputTokens: 8192,
                responseMimeType: "text/plain",
            },
        });

        const result = await chatSession.sendMessage(userMessage);
        return res.json({ botResponse: result.response.text() });
    } catch (error) {
        console.error("Server Error:", error.message);
        return res.status(500).json({
            error: "Internal server error",
            details: error.message,
        });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
