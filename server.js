const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { v4: uuidv4 } = require("uuid");

// Initialize Firebase Admin SDK
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL,
});

const db = admin.firestore();

// Initialize Google Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Generate a unique session ID
function generateSessionId() {
    return uuidv4();
}

// Chat endpoint
app.post("/chat", async (req, res) => {
    const { userMessage, sessionId, conversationHistory, userInfo } = req.body;

    if (!userMessage) {
        return res.status(400).json({ error: "No message provided" });
    }

    // Use or generate a session ID
    const currentSessionId = sessionId || generateSessionId();

    try {
        // Fetch or create session in Firestore
        const sessionRef = db.collection("sessions").doc(currentSessionId);
        const sessionDoc = await sessionRef.get();

        let chatHistory = conversationHistory || [];

        if (!sessionDoc.exists) {
            await sessionRef.set({
                sessionId: currentSessionId,
                userInfo: userInfo || {},
                chatHistory: [],
            });
        } else {
            const sessionData = sessionDoc.data();
            chatHistory = sessionData.chatHistory || [];
        }

        // Update chat history with the user's message
        chatHistory.push({ sender: "user", text: userMessage });

        // Prepare dynamic system instruction for Luffy
        const systemInstruction = userInfo && userInfo.name
            ? `You are Monkey D. Luffy from One Piece. You are talking to ${userInfo.name}. Respond in an energetic, adventurous, and straightforward style. Always remember the user's name and the context of previous conversations.`
            : "You are Monkey D. Luffy from One Piece. Respond in an energetic, adventurous, and straightforward style. Keep responses short and true to Luffy's character.";

        // Prepare chat history for Gemini
        const contextHistory = chatHistory.slice(-10).map((entry) => ({
            role: entry.sender === "user" ? "user" : "model",
            parts: [{ text: entry.text }],
        }));

        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            systemInstruction: systemInstruction,
        });

        // Send user's message to Gemini AI
        const chatSession = model.startChat({
            history: contextHistory,
            generationConfig: {
                temperature: 1.75,
                topP: 0.95,
                topK: 40,
                maxOutputTokens: 256,
            },
        });

        const result = await chatSession.sendMessage(userMessage);
        const botResponse = result.response.text();

        // Update chat history with bot's response
        chatHistory.push({ sender: "bot", text: botResponse });

        // Save updated chat history to Firestore
        await sessionRef.update({
            chatHistory,
        });

        res.json({
            botResponse,
            sessionId: currentSessionId,
        });
    } catch (error) {
        console.error("Error in Luffy chatbot:", error);
        res.status(500).json({
            error: "Internal server error",
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
