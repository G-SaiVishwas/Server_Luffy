const express = require("express");
const cors = require("cors");
const { Firestore } = require("@google-cloud/firestore");

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Firestore
const firestore = new Firestore();

app.use(cors());
app.use(express.json());

async function getUserData(userId) {
    const userDoc = firestore.collection("users").doc(userId);
    const userSnapshot = await userDoc.get();
    return userSnapshot.exists ? userSnapshot.data() : null;
}

async function updateUserData(userId, data) {
    const userDoc = firestore.collection("users").doc(userId);
    await userDoc.set(data, { merge: true });
}

app.post("/chat", async (req, res) => {
    const { userId, userMessage } = req.body;

    if (!userId || !userMessage) {
        return res.status(400).json({ error: "Invalid request data" });
    }

    try {
        let userData = await getUserData(userId);

        if (!userData) {
            userData = { userId, name: null, conversationHistory: [] };
            await updateUserData(userId, userData);
        }

        userData.conversationHistory.push({ sender: "user", text: userMessage });

        // Simulate a bot response
        const botResponse = `Hello ${userData.name || "there"}, you said: ${userMessage}`;
        userData.conversationHistory.push({ sender: "bot", text: botResponse });

        await updateUserData(userId, userData);

        res.json({ botResponse });
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
