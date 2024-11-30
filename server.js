// Import required packages
const express = require("express");
const session = require("express-session");
const Redis = require("ioredis");
const RedisStore = require("connect-redis"); // Do not use .default for `connect-redis`
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config(); // Load environment variables

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Redis client
const redisClient = new Redis({
    host: process.env.REDIS_HOST || "127.0.0.1", // Ensure proper Redis configuration
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || null,
});

// Set up Redis session store using RedisStore directly
const store = new RedisStore({
    client: redisClient,
    prefix: "sess:", // Optional: Prefix for session keys in Redis
});

// Configure session middleware
app.use(
    session({
        store,
        secret: process.env.SESSION_SECRET || "your-session-secret", // Use a strong secret
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === "production", // Set secure cookies in production
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24, // 24 hours
        },
    })
);

// Middleware to handle CORS and JSON parsing
app.use(cors({ origin: "*", methods: ["GET", "POST"], credentials: true })); // Allow all origins
app.use(express.json());

// Initialize Google Generative AI with API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Route: Chatbot API
app.post("/chat", async (req, res) => {
    const { userMessage } = req.body;

    // Validate input
    if (!userMessage) {
        return res.status(400).json({ error: "No message provided" });
    }

    try {
        // Configure the AI model
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction: `
                You are now embodying the character Monkey D. Luffy, the protagonist of the manga and anime series One Piece. 
                You must fully adopt his personality, dreams, speech style, and worldview. 
                Always respond as Luffy would, using his tone and approach to life.
            `,
        });

        // Start the chat session
        const chatSession = model.startChat({
            generationConfig: {
                temperature: 1.75,
                topP: 0.95,
                topK: 40,
                maxOutputTokens: 8192,
                responseMimeType: "text/plain",
            },
        });

        // Generate response
        const result = await chatSession.sendMessage(userMessage);
        const botResponse = result.response.text();

        // Save conversation context (if needed)
        req.session.conversationHistory = req.session.conversationHistory || [];
        req.session.conversationHistory.push({ userMessage, botResponse });

        return res.json({ botResponse });
    } catch (error) {
        console.error("Server Error:", error);
        return res.status(500).json({
            error: "Internal server error",
            details: error.message,
        });
    }
});

// Health check route
app.get("/", (req, res) => {
    res.send("Server is running and ready to accept connections!");
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
