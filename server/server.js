// server.js
import "dotenv/config";

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import Groq from "groq-sdk";

const app = express();
app.use(cors());
app.use(bodyParser.json());

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

app.post("/api/interpret", async (req, res) => {
  try {
    console.log("Incoming body:", req.body);

    const { dreamText, category, method } = req.body;

    if (!dreamText || !dreamText.trim()) {
      return res.status(400).json({ error: "Dream text is required" });
    }

    // ⭐ systemPrompt – שמירה על הרוח שלך + דרישה ל-JSON עם methodUsed
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

IMPORTANT OUTPUT RULES:
- You MUST output your answer as VALID JSON ONLY.
- No extra text, no explanations, no markdown, no comments.
- The JSON MUST follow this exact structure:

{
  "methodUsed": "${method || "unspecified"}",
  "title": "one short descriptive title",
  "interpretation": "full interpretation text based strictly on the selected method",
  "tags": {
    "places": [],
    "people": [],
    "objects": [],
    "symbols": [],
    "colors": []
  }
}

Do NOT include ANY text before or after this JSON.
    `.trim();

    // ⭐ userPrompt – החוקים שלך + חיבור לשדות JSON
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

Map your response into the JSON fields described in the system message:
- "methodUsed" = the method or framework you used for this interpretation.
- "title" = 1 short descriptive line summarizing the dream.
- "interpretation" = the full method-based interpretation text.
- "tags" = extract only elements that appear in the dream text, grouped into:
  - places
  - people
  - objects
  - symbols
  - colors
    `.trim();

    const completion = await client.chat.completions.create({
      model: "llama-3.1-8b-instant",
      // 👇 זה החלק שיכריח את Groq להחזיר JSON טהור
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const raw = completion.choices?.[0]?.message?.content || "{}";
    console.log("RAW FROM MODEL:", raw); // לעזור בדיבאג אם צריך

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      console.error("Failed to parse AI JSON:", raw);

      // fallback – גם אם המודל יתפלק, לא מפילים את השרת
      parsed = {
        methodUsed: method || "unspecified",
        title: "Dream interpretation",
        interpretation: raw,
        tags: {
          places: [],
          people: [],
          objects: [],
          symbols: [],
          colors: [],
        },
      };
    }

    const safeResponse = {
      methodUsed: parsed.methodUsed || method || "unspecified",
      title: parsed.title || "Dream interpretation",
      interpretation:
        parsed.interpretation ||
        "I'm not sure how to interpret this dream.",
      tags: {
        places: parsed.tags?.places || [],
        people: parsed.tags?.people || [],
        objects: parsed.tags?.objects || [],
        symbols: parsed.tags?.symbols || [],
        colors: parsed.tags?.colors || [],
      },
    };

    res.json(safeResponse);
  } catch (err) {
    console.error("Interpretation error:", err?.response?.data || err);
    res.status(500).json({
      error:
        "The dream interpretation service is temporarily unavailable. Please try again later.",
      details: err?.message || "Unknown error",
    });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
