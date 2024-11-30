const express = require("express");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 5000;

// Allow all origins
app.use(cors());
app.use(express.json());

// API route
app.post("/chat", (req, res) => {
    const userMessage = req.body.userMessage;
    console.log("Received message:", userMessage);

    const reply = `Server says: You sent "${userMessage}"`;
    res.json({ reply });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
