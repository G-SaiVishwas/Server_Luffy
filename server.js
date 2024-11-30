require('dotenv').config();
const express = require('express');
const cors = require('cors');

app.use(
    cors({
        origin: 'https://g-saivishwas.github.io/Luffy_website/', // Allow requests from your GitHub Pages site
        methods: ['GET', 'POST'], // Allow the methods you need
        credentials: true, // If cookies or authentication headers are involved
    })
);

const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize app
const app = express();

// Enable CORS and JSON parsing middleware
app.use(express.json()); // To parse incoming JSON requests
//temporary





// Load API key from environment variables
const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

// Chat endpoint
app.post('/chat', (req, res) => {
    const userMessage = req.body.userMessage;
    res.json({ botResponse: `You said: ${userMessage}` });
});


  if (!userMessage) {
    return res.status(400).send('No message provided');
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      systemInstruction: 'You are now embodying the character Monkey D. Luffy...',
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
    console.error('Error processing request:', error.message, error.stack);
    return res.status(500).send('Error processing your request');
  }
});

// Start the server
const port = process.env.PORT || 5000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
