const express = require("express");
const cors = require("cors");
const session = require("express-session");
const Redis = require("ioredis");
const RedisStore = require("connect-redis")(session); // Correct import and initialization
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Redis setup for session storage
const redisClient = new Redis({
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || null,
});

// Session middleware using Redis for session storage
app.use(
    session({
        store: new RedisStore({ client: redisClient }),
        secret: process.env.SESSION_SECRET || "your-session-secret",
        resave: false,
        saveUninitialized: false,
        cookie: {
            secure: process.env.NODE_ENV === "production",
            httpOnly: true,
            maxAge: 1000 * 60 * 60 * 24, // 24 hours
        },
    })
);

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);

// Function to save chat history to session
function saveChatHistory(req, chatHistory) {
    req.session.chatHistory = chatHistory;
    req.session.save();
}

// Function to retrieve chat history from session
function getChatHistory(req) {
    return req.session.chatHistory || [];
}

// Chat endpoint with conversation memory
app.post('/chat', async (req, res) => {
    const { userMessage } = req.body;
    
    if (!userMessage) {
        return res.status(400).json({ error: 'No message provided' });
    }

    try {
        // Retrieve existing chat history
        const chatHistory = getChatHistory(req);

        // Prepare the model with system instruction and conversation context
        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            systemInstruction: "You are now embodying the character Monkey D. Luffy from One Piece. Respond in his energetic, adventurous, and straightforward style.",
        });

        // Start chat session with full context
        const chatSession = model.startChat({
            history: chatHistory,
            generationConfig: {
                temperature: 1.75,
                topP: 0.95,
                topK: 40,
                maxOutputTokens: 8192,
                responseMimeType: 'text/plain',
            },
        });

        // Send message and get response
        const result = await chatSession.sendMessage(userMessage);
        const botResponse = result.response.text();

        // Update and save chat history
        const updatedChatHistory = [
            ...chatHistory,
            { role: "user", parts: [{ text: userMessage }] },
            { role: "model", parts: [{ text: botResponse }] }
        ];
        saveChatHistory(req, updatedChatHistory);

        return res.json({ 
            botResponse: botResponse,
            chatHistoryLength: updatedChatHistory.length
        });
    } catch (error) {
        console.error('Server Error:', error.message);
        return res.status(500).json({
            error: 'Internal server error',
            details: error.message,
        });
    }
});

// Clear chat history endpoint
app.post('/clear-history', (req, res) => {
    req.session.chatHistory = [];
    req.session.save();
    res.json({ message: 'Chat history cleared' });
});

// Root endpoint for health check
app.get("/", (req, res) => {
    res.send("Luffy Chatbot Server is up and running!");
});

// Error handling for Redis connection
redisClient.on('error', (err) => {
    console.error('Redis Client Error:', err);
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
