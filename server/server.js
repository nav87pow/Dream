// server.js
import "dotenv/config";

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import Groq from "groq-sdk";

const app = express();
app.use(cors());
app.use(bodyParser.json());

// מפת קודי שפה לשם שפה אנושי – תואם 1:1 ל־LanguageSwitcher
const LANGUAGE_NAMES = {
  en: "English",
  he: "Hebrew",
  hu: "Hungarian",
  pt: "Portuguese",
  es: "Spanish",
  ro: "Romanian",
  de: "German",
  it: "Italian",
  fr: "French",
  et: "Estonian",
  ru: "Russian",
  uk: "Ukrainian",
  ar: "Arabic",
  pl: "Polish",
  is: "Icelandic",
  el: "Greek",
  cs: "Czech",
  no: "Norwegian",
  fi: "Finnish",
  sv: "Swedish",
  ja: "Japanese",
};

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

app.post("/api/interpret", async (req, res) => {
  try {
    console.log("Incoming body:", req.body);

    const { dreamText, category, method, language } = req.body;

    if (!dreamText || !dreamText.trim()) {
      return res.status(400).json({ error: "Dream text is required" });
    }

    // language מגיע מהפרונט (למשל "he" או "en")
    const langCode = (language || "en").toLowerCase();

    // שם השפה שהמודל יבין טוב יותר
    const langName =
      LANGUAGE_NAMES[langCode] ||
      LANGUAGE_NAMES[langCode.slice(0, 2)] ||
      "English";

    // ⭐ systemPrompt – שמירה על הרוח שלך + דרישה ל-JSON עם methodUsed
    const systemPrompt = `
You are a dream interpreter.
Always respond in ${langName}.
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

Content rules:
- "interpretation" should be concise: up to 4 short paragraphs total (max ~400–500 words).
- Focus only on the dream content, not on the dreamer as a person.

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
  give a more detailed interpretation (up to 3–4 paragraphs total).

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
      // ❌ הורדנו response_format כדי למנוע json_validate_failed מה־API
      // response_format: { type: "json_object" },
      max_tokens: 600,
      temperature: 0.4,
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

// ⭐ endpoint לתרגום טקסטים של הממשק – יציב וסלחני
app.post("/api/translate", async (req, res) => {
  try {
    const {
      targetLanguage,
      sourceLanguage = "en",
      texts = [],
    } = req.body;

    // אם הגוף לא תקין – לא מפילים את האפליקציה
    if (!targetLanguage || !Array.isArray(texts) || texts.length === 0) {
      console.error("Bad translate request body:", req.body);
      return res.json({ translations: {} });
    }

    // ⭐ ממירים קודי שפה (he, en וכו') לשמות שפה אנושיים
    const srcCode = (sourceLanguage || "en").toLowerCase();
    const tgtCode = (targetLanguage || "en").toLowerCase();

    const sourceName = LANGUAGE_NAMES[srcCode] || "English";
    const targetName =
      LANGUAGE_NAMES[tgtCode] || targetLanguage || "English";

    const systemPrompt = `
You are a translation engine.
Translate ONLY the "text" field for each item.
Keep the same keys.
Translate from ${sourceName} to ${targetName}.
You MUST output the "${targetName}" translation, not English.
Return ONLY valid JSON in this exact shape:
{
  "translations": {
    "<key>": "<translated text>"
  }
}
No markdown, no commentary.
`.trim();

    const userPayload = JSON.stringify({ texts });

    const completion = await client.chat.completions.create({
      model: "llama-3.1-8b-instant",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPayload },
      ],
      temperature: 0.2,
    });

    const raw = completion.choices?.[0]?.message?.content || "{}";
    console.log("RAW TRANSLATION FROM MODEL:", raw);

    let translationsMap = {};

    try {
      const parsed = JSON.parse(raw);

      if (parsed && typeof parsed === "object") {
        if (parsed.translations && typeof parsed.translations === "object") {
          // המקרה הרגיל – מה שביקשנו
          translationsMap = parsed.translations;
        } else {
          // fallback – אם המודל החזיר ישר map של key -> text
          translationsMap = parsed;
        }
      }
    } catch (err) {
      console.error("Failed to parse JSON returned by the model:", err);
      translationsMap = {};
    }

    // תמיד מחזירים 200 – במקרה הכי גרוע אין תרגומים, נשארים באנגלית
    return res.json({ translations: translationsMap });
  } catch (err) {
    console.error("Translation API error:", err?.response?.data || err);
    return res.json({ translations: {} });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
