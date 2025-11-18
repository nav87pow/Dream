// server.js
import "dotenv/config";

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
        console.log("Incoming body:", req.body);

    // ✅ הוספתי category ו-method אבל השארתי את dreamText כמו שהוא
    const { dreamText, category, method } = req.body;

    if (!dreamText || !dreamText.trim()) {
      return res.status(400).json({ error: "Dream text is required" });
    }

    // ✅ systemPrompt עודכן כך שישמור על הרוח העדינה + ההפרדה הלא-קלינית
    const systemPrompt = `
You are an AI system that provides a one-time, standalone dream interpretation
strictly according to the category and method selected by the user. Your task is
to produce a structured, method-based interpretation without offering advice,
emotional guidance, or personal suggestions. You are NOT a therapist and do NOT
give medical, psychological, or spiritual diagnoses. Offer symbolic and narrative
interpretation only. There is no follow-up conversation.

You MUST NOT ask the user any questions. Do NOT end with sentences like:
"How does this resonate with you?" or "Let me know if..." or similar.
Simply present the interpretation and then stop.

For testing purposes ONLY, begin your response with exactly one line:
(Using method: ${method || "unspecified"})
`.trim();


    // ✅ כאן הטמענו את הפרומפט "היפה" שבנינו, בתור תוכן הודעת ה-user
const userPrompt = `
Input:
- Category: ${category || "unspecified"}
- Method: ${method || "unspecified"}
- Dream text: """${dreamText}"""

Rules:
1. Interpret the dream ONLY through the selected category and method (if provided).
2. Follow the theoretical concepts, symbols, logic, and structure of that method.
3. Do not switch frameworks or mix methods.
4. Do NOT give advice, emotional guidance, or tell the dreamer what to do.
5. Do NOT analyze the dreamer as a person — only the dream content.
6. Maintain a neutral, descriptive, method-based tone.

Adaptive depth rule:
- If the dream is very short or minimal (e.g., one line or one scene),
  provide a concise interpretation (1–2 paragraphs).
- If the dream contains multiple elements, symbolism, or narrative structure,
  give a more detailed interpretation (up to 4–5 paragraphs).

Output:
1. Title (one short descriptive line).
2. Interpretation (adaptive length based on dream complexity, method-based only).
3. Key Elements extracted from the dream:
   - Places
   - Characters / people
   - Symbols / motifs
   - Colors
   - Objects / elements
`.trim();


    const completion = await client.chat.completions.create({
     model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const aiText =
      completion.choices?.[0]?.message?.content ||
      "I'm not sure how to interpret this dream.";

    // השארתי את הפורמט של התגובה כמו שהוא
    res.json({ interpretation: aiText });
  }  catch (err) {
  console.error("Interpretation error:", err?.response?.data || err);
  res.status(500).json({
    error:   "The dream interpretation service is temporarily unavailable. Please try again later.",
    details: err?.message || "Unknown error",
  });
}})



const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
