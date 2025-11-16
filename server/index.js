// server/index.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const Groq = require("groq-sdk");

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
  })
);
app.use(express.json());

// מחבר ל-Groq עם המפתח מה-.env
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ראוט הפענוח
app.post("/api/interpret", async (req, res) => {
  const { dreamText } = req.body;

  if (!dreamText || typeof dreamText !== "string") {
    return res.status(400).json({ error: "dreamText is required" });
  }

  try {
    const completion = await groq.chat.completions.create({
  model: "llama-3.1-8b-instant",
  messages: [
    {
      role: "system",
      content:
        "You interpret dreams in a gentle, creative, non-therapeutic way. You never give psychological, medical, or legal advice.",
    },
    {
      role: "user",
      content: `Here is a dream to interpret: "${dreamText}"`,
    },
  ],
});


    const interpretation =
      completion.choices?.[0]?.message?.content?.trim() ||
      "I received your dream but could not interpret it.";

    return res.json({ interpretation });
  } catch (err) {
    console.error("Groq AI error:", err);
    return res.json({
      interpretation:
        "I received your dream, but I couldn't reach the AI model right now.",
    });
  }
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Dream server running at http://localhost:${PORT}`);
});
