const express = require("express");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 10000;

// Configure CORS to allow requests from your GitHub Pages domain
const corsOptions = {
    origin: "https://g-saivishwas.github.io/Luffy_website/", // Your exact GitHub Pages origin
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"],
};
app.use(cors(corsOptions));

app.use(express.json());

// Sample route
app.post("/chat", async (req, res) => {
    const userMessage = req.body.userMessage;
    console.log("Received message:", userMessage);

    // Simulating a reply
    const reply = `Hello! You said: "${userMessage}"`;
    res.json({ reply });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
