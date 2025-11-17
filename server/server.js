// server.js
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import Groq from "groq-sdk";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// שים את המפתח בקובץ .env ולא בקוד עצמו

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});


app.post("/api/interpret", async (req, res) => {
  try {
    const { dreamText } = req.body;

    if (!dreamText || !dreamText.trim()) {
      return res.status(400).json({ error: "Dream text is required" });
    }

    const systemPrompt =
      "You are an assistant who offers gentle, non-clinical dream reflections. " +
      "You are NOT a therapist and do not give medical or psychological diagnoses. " +
      "Offer symbolic and narrative interpretation only, in a supportive tone.";

const completion = await client.chat.completions.create({
    model: "llama-3.1-8b-instant",

  messages: [
    { role: "system", content: systemPrompt },
    { role: "user", content: `Here is a dream to interpret:\n\n${dreamText}` },
  ],
});

const aiText =
  completion.choices?.[0]?.message?.content ||
  "I'm not sure how to interpret this dream.";


    res.json({ interpretation: aiText });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to interpret dream" });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
