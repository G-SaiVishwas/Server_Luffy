const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function generateSessionId() {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
}

app.post("/chat", async (req, res) => {
    const { userMessage, sessionId, conversationHistory, userInfo } = req.body;
    const currentSessionId = sessionId || generateSessionId();

    if (!userMessage) return res.status(400).json({ error: "No message provided" });

    try {
        const systemInstruction = userInfo?.name
            ? `You are Monkey D. Luffy. Speak energetically and remember ${userInfo.name}.`
            : "You are Monkey D. Luffy. Speak energetically.";
        
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash", 
            systemInstruction 
        });

        const contextHistory = conversationHistory.slice(-10).map((entry) => ({
            role: entry.sender === "user" ? "user" : "model",
            parts: [{ text: entry.text }],
        }));

        const chatSession = model.startChat({
            history: contextHistory,
            generationConfig: {
                temperature: 1.75,
                topP: 0.95,
                topK: 40,
                maxOutputTokens: 8192,
            },
        });

        const result = await chatSession.sendMessage(userMessage);
        return res.json({
            botResponse: result.response.text(),
            sessionId: currentSessionId,
        });
    } catch (error) {
        console.error("Error:", error.message);
        return res.status(500).json({ error: "Internal server error" });
    }
});

app.get("/", (req, res) => res.send("Server is running!"));

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
