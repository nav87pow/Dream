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
      console.warn("[useAudioRecorder] SpeechRecognition is not supported in this browser.");
      recognitionRef.current = null;
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang =
      LANGUAGE_TO_LOCALE[language] || language || "en-US";

    console.log("[useAudioRecorder] init recognition", {
      lang: recognition.lang,
      languageFromContext: language,
    });

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

      console.log("[useAudioRecorder] onresult", {
        sessionText,
        recognizedSoFar: recognizedSoFarRef.current,
        combined,
      });

      if (combined && typeof onTranscriptionChunk === "function") {
        onTranscriptionChunk(combined);
      }
    };

    recognition.onerror = (e) => {
      // "aborted" קורה כשאנחנו בעצמנו קוראים stop() או מתחילים הקלטה חדשה
      if (e.error === "aborted") {
        // לא שגיאה אמיתית – לא מציף את הקונסול
        console.log("[useAudioRecorder] onerror: aborted (expected stop)");
        return;
      }

      console.error(
        "[useAudioRecorder] Speech recognition error:",
        e.error,
        e.message || "",
        e
      );
      setRecordingState("idle");
    };

    recognition.onend = () => {
      console.log("[useAudioRecorder] onend", {
        manualPause: manualPauseRef.current,
        lastCombined: lastCombinedRef.current,
      });

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
        console.log("[useAudioRecorder] cleanup stop error (ignored):", e);
      }
      recognitionRef.current = null;
    };
  }, [language, onTranscriptionChunk]);

  const startRecording = () => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      console.warn("[useAudioRecorder] startRecording: recognition not initialized");
      return;
    }

    // התחלה חדשה לגמרי
    recognizedSoFarRef.current = "";
    lastCombinedRef.current = "";
    manualPauseRef.current = false;

    try {
      recognition.lang =
        LANGUAGE_TO_LOCALE[language] || language || "en-US";
      console.log("[useAudioRecorder] startRecording: calling recognition.start()", {
        lang: recognition.lang,
      });
      recognition.start();
      setRecordingState("recording");
    } catch (e) {
      console.error("[useAudioRecorder] Failed to start recognition:", e);
    }
  };

  const pauseRecording = () => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      console.warn("[useAudioRecorder] pauseRecording: recognition not initialized");
      return;
    }

    manualPauseRef.current = true;

    try {
      console.log("[useAudioRecorder] pauseRecording: calling recognition.stop()");
      recognition.stop();
      // onend יעדכן ל-"paused"
    } catch (e) {
      console.error("[useAudioRecorder] Failed to pause recognition:", e);
    }
  };

  const resumeRecording = () => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      console.warn("[useAudioRecorder] resumeRecording: recognition not initialized");
      return;
    }

    manualPauseRef.current = false;

    try {
      console.log("[useAudioRecorder] resumeRecording: calling recognition.start()");
      recognition.start();
      setRecordingState("recording");
    } catch (e) {
      console.error("[useAudioRecorder] Failed to resume recognition:", e);
    }
  };

  const stopRecording = () => {
    const recognition = recognitionRef.current;
    if (!recognition) {
      console.warn("[useAudioRecorder] stopRecording: recognition not initialized");
      return;
    }

    // זה לא פאוז, זה סיום – חוזרים ל-idle
    manualPauseRef.current = false;

    try {
      console.log("[useAudioRecorder] stopRecording: calling recognition.stop()");
      recognition.stop();
    } catch (e) {
      console.error("[useAudioRecorder] Failed to stop recognition:", e);
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
