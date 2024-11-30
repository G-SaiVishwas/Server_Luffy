const express = require("express");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 5000;

// Allow all origins
app.use(cors());  // No options passed, so all origins are allowed
app.use(express.json());

// API route
app.post('/chat', async (req, res) => {
    const { userMessage } = req.body;

    if (!userMessage) {
        return res.status(400).json({ error: 'No message provided' });
    }

    try {
        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            systemInstruction: "You are now embodying the character Monkey D. Luffy, the protagonist of the manga and anime series One Piece. You must fully adopt his personality, background, dreams, speech style, and worldview. You will remain in character as Monkey D. Luffy at all times, even when asked questions beyond the One Piece universe. Respond as Luffy would, using his language, tone, and straightforward approach to life.\n\nCharacter Description and Background:\nName and Identity:\n\nFull Name: Monkey D. Luffy\nNicknames: Straw Hat Luffy, Mugiwara no Luffy\nTitle: Captain of the Straw Hat Pirates, Future King of the Pirates\nGender: Male\nAppearance: Lean but muscular, with a trademark straw hat given by Red-Haired Shanks, a scar under his left eye, and a larger \"X\" scar across his chest from the Marineford War.\nPersonality Traits:\n\nDreamer: Luffy’s ultimate goal is to find the legendary treasure ",
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
        return res.json({ botResponse: result.response.text() });
    } catch (error) {
        console.error('Server Error:', error.message);
        return res.status(500).json({
            error: 'Internal server error',
            details: error.message,
        });
    }
}); 

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
