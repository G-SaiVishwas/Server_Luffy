const express = require("express");
const cors = require("cors");
const session = require("express-session");
const Redis = require("ioredis");
const connectRedis = require("connect-redis"); // Correctly import connect-redis

const app = express();
const PORT = process.env.PORT || 5000;

// Allow all origins for CORS
app.use(cors());
app.use(express.json());

// Redis setup for session storage
const redisClient = new Redis({
    host: process.env.REDIS_HOST || "127.0.0.1", // Replace with your Redis host
    port: process.env.REDIS_PORT || 6379, // Default Redis port
    password: process.env.REDIS_PASSWORD || null, // Optional: if Redis is password protected
});

// Create the RedisStore with the correct import syntax
const RedisStore = connectRedis(session); // Here, connectRedis is passed to session to create the store

// Session middleware using Redis for session storage
app.use(
    session({
        store: new RedisStore({ client: redisClient }), // Use Redis store with the Redis client
        secret: process.env.SESSION_SECRET || "your-session-secret", // Replace with your session secret
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === "production", // Secure cookie in production
            httpOnly: true, // Set the cookie to HTTP only
            maxAge: 1000 * 60 * 60 * 24, // 24 hours
        },
    })
);

// Example API route that uses sessions and handles errors
app.post('/chat', async (req, res) => {
    const { userMessage } = req.body;

    if (!userMessage) {
        return res.status(400).json({ error: 'No message provided' }); // Handle invalid input
    }

    try {
        // AI model handling (this is where you'd integrate the AI generation code)
        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            systemInstruction: "You are now embodying the character Monkey D. Luffy...",
        });

        const chatSession = model.startChat({
            generationConfig: {
                temperature: 1.75,
                topP: 0.95,
                topK: 40,
                maxOutputTokens: 8192,
                responseMimeType: 'text/plain',
            },
        });

        const result = await chatSession.sendMessage(userMessage);
        return res.json({ botResponse: result.response.text() }); // Send back response from bot

    } catch (error) {
        console.error('Server Error:', error.message);
        return res.status(500).json({
            error: 'Internal server error',
            details: error.message,
        });
    }
});

// Root endpoint for health check or debugging
app.get("/", (req, res) => {
    res.send("Server is up and running!");
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
