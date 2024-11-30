const express = require("express");
const cors = require("cors");
const session = require("express-session");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const PORT = process.env.PORT || 5000;

// Configure environment variables
const apiKey = process.env.GEMINI_API_KEY;

// Initialize Google Generative AI client
const genAI = new GoogleGenerativeAI(apiKey);

// Middleware
app.use(cors({ origin: "*", methods: "GET,POST", allowedHeaders: "*" })); // Accept requests from all origins
app.use(express.json());
app.use(
    session({
        secret: "luffy-chat-secret", // Replace with a strong secret in production
        resave: false,
        saveUninitialized: true,
        cookie: { secure: false }, // Set to true if using HTTPS
    })
);

// API Route
app.post("/chat", async (req, res) => {
    console.log("Request received at /chat"); // Debugging: Log when request is received
    const { userMessage } = req.body;

    if (!userMessage) {
        console.error("Error: No message provided"); // Debugging: Log missing message
        return res.status(400).json({ error: "No message provided" });
    }

    // Initialize session data
    if (!req.session.chatHistory) {
        req.session.chatHistory = [];
        console.log("Initialized chat history"); // Debugging: Log session initialization
    }
    if (!req.session.userName) {
        req.session.userName = null;
        console.log("Initialized user name"); // Debugging: Log session initialization
    }

    try {
        // If the name is not stored, identify and remember it
        if (!req.session.userName && /my name is (\w+)/i.test(userMessage)) {
            req.session.userName = userMessage.match(/my name is (\w+)/i)[1];
            const botResponse = `Nice to meet you, ${req.session.userName}! How can I help you today?`;
            req.session.chatHistory.push({ user: userMessage, bot: botResponse });
            console.log(`Remembered user name: ${req.session.userName}`); // Debugging: Log remembered name
            return res.json({ botResponse });
        }

        // Build system instruction
        const systemInstruction = req.session.userName
            ? `You are chatting with ${req.session.userName}. Remember this name and personalize your responses for them.`
            : "You are a friendly chatbot. Ask the user their name if they haven't provided it yet.";

        console.log("Generating response with system instruction:", systemInstruction); // Debugging: Log system instruction

        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction,
        });

        const chatSession = model.startChat({
            generationConfig: {
                temperature: 1.75,
                topP: 0.95,
                topK: 40,
                maxOutputTokens: 8192,
                responseMimeType: "text/plain",
            },
            history: req.session.chatHistory.map((entry) => ({
                role: "assistant",
                content: entry.bot,
            })),
        });

        const result = await chatSession.sendMessage(userMessage);

        // Store chat in session
        const botResponse = result.response.text();
        req.session.chatHistory.push({ user: userMessage, bot: botResponse });

        console.log("Bot response:", botResponse); // Debugging: Log bot response
        return res.json({ botResponse });
    } catch (error) {
        console.error("Server Error:", error.message); // Debugging: Log server error
        return res.status(500).json({
            error: "Internal server error",
            details: error.message,
        });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`); // Debugging: Confirm server startup
});
