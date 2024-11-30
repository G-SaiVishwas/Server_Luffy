const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");  // Make sure this is imported correctly
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
        // Make sure API key is available
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ error: 'API key missing' });
        }

        // Initialize the GoogleGenerativeAI client with the API key
        const genAI = new GoogleGenerativeAI(apiKey);  // Initialize genAI here

        // Get the generative model with system instructions for Luffy
        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            systemInstruction: "You are now embodying the character Monkey D. Luffy, the protagonist of the manga and anime series One Piece. You must fully adopt his personality, background, dreams, speech style, and worldview. You will remain in character as Monkey D. Luffy at all times, even when asked questions beyond the One Piece universe.",
        });

        // Start chat session
        const chatSession = model.startChat({
            generationConfig: {
                temperature: 1.75,
                topP: 0.95,
                topK: 40,
                maxOutputTokens: 8192,
                responseMimeType: 'text/plain',
            },
        });

        // Send the user message and get a response
        const result = await chatSession.sendMessage(userMessage);

        // Fix: Call the `text` function to get the actual response text
        const botResponse = await result.response.text();  // Call the function to get the text response
        
        console.log(botResponse); // Log the response for debugging
        return res.json({ botResponse });  // Return the response to the frontend
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
