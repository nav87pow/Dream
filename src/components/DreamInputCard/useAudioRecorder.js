// src/components/DreamInputCard/useAudioRecorder.js
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "../../TranslationContext";

// מיפוי קוד שפה -> לוקאל של הדפדפן
const LANGUAGE_TO_LOCALE = {
  en: "en-US",
  he: "he-IL",
  hu: "hu-HU",
  pt: "pt-PT",
  es: "es-ES",
  ro: "ro-RO",
  de: "de-DE",
  it: "it-IT",
  fr: "fr-FR",
  et: "et-EE",
  ru: "ru-RU",
  uk: "uk-UA",
  ar: "ar-SA",
  pl: "pl-PL",
  is: "is-IS",
  el: "el-GR",
  cs: "cs-CZ",
  no: "nb-NO",
  fi: "fi-FI",
  sv: "sv-SE",
  ja: "ja-JP",
};

export default function useAudioRecorder(options = {}) {
  const { onTranscriptionChunk } = options;
  const { language } = useTranslation();

  const [recordingState, setRecordingState] = useState("idle"); // "idle" | "recording" | "paused"

  const recognitionRef = useRef(null);
  const manualPauseRef = useRef(false);

  // טקסט שכבר נאמר ונשמר בין פאוזים
  const recognizedSoFarRef = useRef("");
  // הטקסט המלא האחרון שחושב ב-onresult
  const lastCombinedRef = useRef("");

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("SpeechRecognition is not supported in this browser.");
      recognitionRef.current = null;
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang =
      LANGUAGE_TO_LOCALE[language] || language || "en-US";

    recognition.onresult = (event) => {
      // כל מה שנאמר בסשן הנוכחי
      let sessionText = "";

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;
        sessionText += transcript + " ";
      }

      sessionText = sessionText.trim();

      // טקסט מלא = מה שנאמר בסשנים קודמים + מה שנאמר עכשיו
      const combined = (
        recognizedSoFarRef.current +
        (sessionText ? " " + sessionText : "")
      ).trim();

      lastCombinedRef.current = combined;

      if (combined && typeof onTranscriptionChunk === "function") {
        onTranscriptionChunk(combined);
      }
    };

   recognition.onerror = (e) => {
  // "aborted" קורה כשאנחנו בעצמנו קוראים stop() או מתחילים הקלטה חדשה
  if (e.error === "aborted") {
    // לא שגיאה אמיתית – פשוט מתעלמים כדי לא להציף את הקונסול
    return;
  }

  console.error("Speech recognition error:", e);
  setRecordingState("idle");
};


    recognition.onend = () => {
      // שומרים מה היה הטקסט האחרון
      recognizedSoFarRef.current =
        lastCombinedRef.current || recognizedSoFarRef.current;

      if (manualPauseRef.current) {
        setRecordingState("paused");
      } else {
        setRecordingState("idle");
      }
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch (e) {
        // מתעלמים משגיאת stop כפול
      }
      recognitionRef.current = null;
    };
  }, [language, onTranscriptionChunk]);

  const startRecording = () => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      console.warn("SpeechRecognition not initialized.");
      return;
    }

    // התחלה חדשה לגמרי
    recognizedSoFarRef.current = "";
    lastCombinedRef.current = "";
    manualPauseRef.current = false;

    try {
      recognition.lang =
        LANGUAGE_TO_LOCALE[language] || language || "en-US";
      recognition.start();
      setRecordingState("recording");
    } catch (e) {
      console.error("Failed to start recognition:", e);
    }
  };

  const pauseRecording = () => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    manualPauseRef.current = true;

    try {
      recognition.stop();
      // onend יעדכן ל-"paused"
    } catch (e) {
      console.error("Failed to pause recognition:", e);
    }
  };

  const resumeRecording = () => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    manualPauseRef.current = false;

    try {
      recognition.start();
      setRecordingState("recording");
    } catch (e) {
      console.error("Failed to resume recognition:", e);
    }
  };

  const stopRecording = () => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    // זה לא פאוז, זה סיום – חוזרים ל-idle
    manualPauseRef.current = false;

    try {
      recognition.stop();
    } catch (e) {
      console.error("Failed to stop recognition:", e);
    }

    setRecordingState("idle");
  };

  return {
    recordingState,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
  };
}
