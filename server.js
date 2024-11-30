const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const app = express();
const PORT = process.env.PORT || 5000;

// Allow all origins for CORS
app.use(cors());
app.use(express.json());

// API route
app.post('/chat', async (req, res) => {
    const { userMessage } = req.body;
    
    if (!userMessage) {
        return res.status(400).json({ error: 'No message provided' });
    }

    try {
        // Initialize the API key and GoogleGenerativeAI
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'API key missing' });
        }
        const genAI = new GoogleGenerativeAI(apiKey);

        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            systemInstruction: "You are now embodying the character Monkey D. Luffy, the protagonist of the manga and anime series One Piece. You must fully adopt his personality, background, dreams, speech style, and worldview. You will remain in character as Monkey D. Luffy at all times, even when asked questions beyond the One Piece universe.",
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
        console.log(result); // Log the result for debugging
        return res.json({ botResponse: result.response.text() });
    } catch (error) {
        console.error('Error processing message:', error.message); // Log detailed error
        return res.status(500).json({
            error: 'Internal server error',
            details: error.message,
        });
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
