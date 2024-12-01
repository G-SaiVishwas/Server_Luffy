const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Google Generative AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Generate a unique session ID
function generateSessionId() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
}

// Chat endpoint with conversation memory
app.post('/chat', async (req, res) => {
    const { userMessage, sessionId, conversationHistory } = req.body;
    
    // Generate or use existing session ID
    const currentSessionId = sessionId || generateSessionId();
    
    if (!userMessage) {
        return res.status(400).json({ error: 'No message provided' });
    }

    try {
        // Prepare the model with system instruction
        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            systemInstruction: "You are Monkey D. Luffy from One Piece. Respond in an energetic, adventurous, and straightforward style. Keep responses short and true to Luffy's character.",
        });

        // Prepare chat history (use existing or start new)
        const existingHistory = conversationHistory || [];

        // Start chat session with full context
        const chatSession = model.startChat({
            history: existingHistory,
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

        // Update conversation history
        const updatedConversationHistory = [
            ...existingHistory,
            { 
                sender: 'user', 
                text: userMessage 
            },
            { 
                sender: 'bot', 
                text: botResponse 
            }
        ];

        // Limit history to last 10 messages
        const limitedConversationHistory = updatedConversationHistory.slice(-10);

        return res.json({ 
            botResponse: botResponse,
            sessionId: currentSessionId,
            conversationHistory: limitedConversationHistory
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
    const { sessionId } = req.body;
    
    // In this implementation, session clearing is handled client-side
    res.json({ message: 'Chat history cleared' });
});

// Root endpoint for health check
app.get("/", (req, res) => {
    res.send("Luffy Chatbot Server is up and running!");
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
