const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const { v4: uuidv4 } = require("uuid");
const path = require("path");
require("dotenv").config();

// Initialize Express
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize Firebase Admin SDK
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || "./service-account-key.json";
admin.initializeApp({
    credential: admin.credential.cert(require(serviceAccountPath)),
});

// Firestore Database
const db = admin.firestore();

// Generate a unique session ID
function generateSessionId() {
    return uuidv4();
}

// Chat endpoint
app.post("/chat", async (req, res) => {
    const { userMessage, sessionId, conversationHistory, userInfo } = req.body;

    // Generate or use existing session ID
    const currentSessionId = sessionId || generateSessionId();

    if (!userMessage) {
        return res.status(400).json({ error: "No message provided" });
    }

    try {
        const chatCollection = db.collection("chatSessions").doc(currentSessionId);

        // Prepare system instruction
        const systemInstruction = userInfo?.name
            ? `You are a helpful and knowledgeable assistant. You are talking to ${userInfo.name}. Remember their name and context of previous conversations.`
            : "You are a helpful and knowledgeable assistant. Respond thoughtfully.";

        // Fetch conversation history
        let existingHistory = [];
        const doc = await chatCollection.get();
        if (doc.exists) {
            existingHistory = doc.data().conversationHistory || [];
        }

        // Append the new message to the history
        const fullHistory = [...existingHistory, { sender: "user", text: userMessage }];

        // Here, you would integrate your AI model or logic for generating responses
        const botResponse = `You said: "${userMessage}".`; // Replace with actual AI response logic

        // Append bot's response
        fullHistory.push({ sender: "bot", text: botResponse });

        // Save the updated history back to Firestore
        await chatCollection.set({ conversationHistory: fullHistory }, { merge: true });

        return res.json({
            botResponse,
            sessionId: currentSessionId,
        });
    } catch (error) {
        console.error("Error in chat endpoint:", error.message);
        return res.status(500).json({ error: "Internal server error", details: error.message });
    }
});

// Root endpoint for health check
app.get("/", (req, res) => {
    res.send("Chatbot server is up and running!");
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
