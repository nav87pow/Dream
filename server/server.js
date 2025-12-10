// server.js
import "dotenv/config";

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import multer from "multer";
import Groq, { toFile } from "groq-sdk";

const app = express();
app.use(cors());
app.use(bodyParser.json());

const upload = multer({ storage: multer.memoryStorage() });

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

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

app.post("/api/interpret", async (req, res) => {
  try {
    console.log("Incoming body:", req.body);

    const { dreamText, category, method, language } = req.body;

    if (!dreamText || !dreamText.trim()) {
      return res.status(400).json({ error: "Dream text is required" });
    }

    const langCode = (language || "en").toLowerCase();
    const langName =
      LANGUAGE_NAMES[langCode] ||
      LANGUAGE_NAMES[langCode.slice(0, 2)] ||
      "English";

    const systemPrompt = `
You are a dream interpreter.
Always respond in ${langName}.
You are an AI system that provides a one-time, standalone dream interpretation
strictly according to the category and method selected by the user. Your task is
to produce a structured, method-based interpretation without offering advice,
emotional guidance, or personal suggestions. You are NOT a therapist and do NOT
give medical, psychological, or spiritual diagnoses. Offer symbolic and narrative
interpretation only. There is no follow-up conversation.

You MUST NOT ask the user any questions. Do NOT end with phrases like:
"How does this resonate with you?" or similar.

OUTPUT RULES:
- You MUST output ONLY valid JSON.
- No text before or after.
- No markdown, no explanations.
- Follow exactly this structure:

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

INTERPRETATION LENGTH RULES:
- 2–4 paragraphs total (5 short paragraphs also acceptable).
- No hard word limit, but prefer staying below ~1200 words.
- Keep sentences compact, avoid repetition.
- Stay strictly inside the chosen method.
- Do NOT drift into long storytelling.
- Focus only on dream content (not on the dreamer).

Do NOT include ANYTHING outside the JSON object.
`.trim();

    const userPrompt = `
Input:
- Category: ${category || "unspecified"}
- Method: ${method || "unspecified"}
- Dream text: """${dreamText}"""

Rules:
1. Interpret ONLY with the selected method and category.
2. Follow the structure, logic, and symbolism of that method.
3. Do NOT mix frameworks.
4. Do NOT give advice or psychological guidance.
5. Focus strictly on the dream content.

Adaptive depth:
- Very short dream → 1–2 short paragraphs.
- Multi-element dream → up to 3–4 paragraphs.

Map your interpretation into the JSON fields described in the system message.
    `.trim();

    const completion = await client.chat.completions.create({
      model: "llama-3.1-8b-instant",
      response_format: { type: "json_object" },
      max_tokens: 1200,
      temperature: 0.4,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    const raw = completion.choices?.[0]?.message?.content || "{}";
    console.log("RAW FROM MODEL:", raw);

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      console.error("Failed to parse AI JSON:", raw);
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
        parsed.interpretation || "I'm not sure how to interpret this dream.",
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

// ⭐ TRANSLATION ENDPOINT — unchanged
app.post("/api/translate", async (req, res) => {
  try {
    const {
      targetLanguage,
      sourceLanguage = "en",
      texts = [],
    } = req.body;

    if (!targetLanguage || !Array.isArray(texts) || texts.length === 0) {
      console.error("Bad translate request:", req.body);
      return res.json({ translations: {} });
    }

    const srcCode = sourceLanguage.toLowerCase();
    const tgtCode = targetLanguage.toLowerCase();

    const sourceName = LANGUAGE_NAMES[srcCode] || "English";
    const targetName = LANGUAGE_NAMES[tgtCode] || targetLanguage;

    const systemPrompt = `
You are a translation engine.
Translate ONLY the "text" field.
Keep keys unchanged.
Translate from ${sourceName} to ${targetName}.
Output ONLY valid JSON:

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
    console.log("RAW TRANSLATION:", raw);

    let translationsMap = {};

    try {
      const parsed = JSON.parse(raw);

      if (parsed.translations && typeof parsed.translations === "object") {
        translationsMap = parsed.translations;
      } else {
        translationsMap = parsed;
      }
    } catch {
      translationsMap = {};
    }

    return res.json({ translations: translationsMap });
  } catch (err) {
    console.error("Translation API error:", err);
    return res.json({ translations: {} });
  }
});

// ⭐ AUDIO TRANSCRIPTION ENDPOINT – יחיד
app.post("/api/transcribe", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No audio file uploaded" });
    }

    const { language } = req.body;
    const langCode = (language || "en").toLowerCase();

    const langName =
      LANGUAGE_NAMES[langCode] ||
      LANGUAGE_NAMES[langCode.slice(0, 2)] ||
      "English";

    console.log("[/api/transcribe] Incoming file:", {
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
      language: langCode,
      langName,
    });

    const audioFile = await toFile(
      file.buffer,
      file.originalname || "audio.webm"
    );

    const transcription = await client.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-large-v3-turbo",
      response_format: "json",
      language: langCode,
      temperature: 0.0,
    });

    const text = transcription.text || "";

    console.log("[/api/transcribe] Transcription length:", text.length);

    return res.json({ text });
  } catch (err) {
    console.error("Transcription error:", err);
    return res.status(500).json({
      error: "Transcription service is temporarily unavailable.",
      details: err?.message || "Unknown error",
    });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
