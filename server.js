const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();


const app = express();
app.use(express.json());
const PORT = process.env.PORT || 6969;  // Use environment variable or default to 6969
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);  // Use Gemini API key from .env

// Enable CORS
app.use(cors());

// Generate a unique session ID
function generateSessionId() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
}

// Store conversation history in memory
const conversationHistory = [];

// Chat endpoint with conversation memory
app.post('/chat', async (req, res) => {
    const { userMessage, sessionId, userInfo } = req.body;
    
    // Generate or use existing session ID
    const currentSessionId = sessionId || generateSessionId();
    
    if (!userMessage) {
        return res.status(400).json({ error: 'No message provided' });
    }

    try {
        // Prepare dynamic system instruction
        const systemInstruction = userInfo && userInfo.name 
            ? `You are Monkey D. Luffy from One Piece. You are talking to ${userInfo.name}. Respond in an energetic, adventurous, and straightforward style. Always remember the user's name and context of previous conversations.`
            : "You are Monkey D. Luffy from One Piece. Respond in an energetic, adventurous, and straightforward style. Keep responses short and true to Luffy's character.";

        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            systemInstruction: systemInstruction,
        });

        // Start chat session with conversation history
        const chatSession = model.startChat({
            history: conversationHistory,
            generationConfig: {
                temperature: 1.75,
                topP: 0.95,
                topK: 40,
                maxOutputTokens: 8192,
            },
        });

        // Send message and get response
        const result = await chatSession.sendMessage(userMessage);
        const botResponse = result.response.text();

        // Save messages to conversation history
        conversationHistory.push({
            role: 'user',
            parts: [{ text: userMessage }]
        });
        conversationHistory.push({
            role: 'model',
            parts: [{ text: botResponse }]
        });

        return res.json({ 
            botResponse: botResponse,
            sessionId: currentSessionId
        });
    } catch (error) {
        console.error('Server Error:', error.message);
        return res.status(500).json({
            error: 'Internal server error',
            details: error.message,
        });
    }
});

// Root endpoint for health check
app.get("/", (req, res) => {
    res.send("Luffy Chatbot Server is up and running!");
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
