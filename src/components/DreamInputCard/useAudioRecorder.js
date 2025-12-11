// src/components/DreamInputCard/useAudioRecorder.js
import { useCallback, useRef, useState } from "react";

// 👇 בסיס ל-API: מנסה REACT_APP_API_URL, אחרת מחליט לפי דומיין
const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (window.location.hostname === "localhost"
    ? "http://localhost:4000"
    : "https://dream-eyyq.onrender.com");

/**
 * useAudioRecorder
 *
 * מקליט אודיו מהמיקרופון, ושולח כל 5 שניות chunk לשרת התמלול.
 * כל תשובה מהשרת מצטברת ל-sessionTextRef ונשלחת למעלה דרך onTranscriptionChunk.
 *
 * ה-API:
 * useAudioRecorder({ onTranscriptionChunk, language })
 * מחזיר: { startRecording, pauseRecording, resumeRecording, stopRecording, isRecording, isPaused }
 */

export default function useAudioRecorder(options = {}) {
  const { onTranscriptionChunk, language } = options;

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);

  // טקסט מצטבר של ההקלטה הנוכחית
  const sessionTextRef = useRef("");

  // דגל למניעת בקשות חופפות לשרת
  const isTranscribingRef = useRef(false);

  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // --- שליחת chunk יחיד לשרת ---
  const transcribeChunk = useCallback(
    async (blob) => {
      if (isTranscribingRef.current) {
        // כבר יש בקשה רצה – כדי לא להפציץ את השרת, נדלג על ה-chunk הזה
        return;
      }

      isTranscribingRef.current = true;

      try {
        const formData = new FormData();
        formData.append("file", blob, "chunk.webm");

        if (language) {
          formData.append("language", language);
        }

        const res = await fetch(`${API_BASE_URL}/api/transcribe`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          console.error(
            "[useAudioRecorder] /api/transcribe failed:",
            res.status
          );
          return;
        }

        const data = await res.json();
        const text = (data && data.text) || "";

        if (!text.trim()) {
          return;
        }

        // צבירת טקסט הסשן
        if (!sessionTextRef.current) {
          sessionTextRef.current = text.trim();
        } else {
          const needsSpace =
            !sessionTextRef.current.endsWith(" ") && !text.startsWith(" ");

          sessionTextRef.current =
            sessionTextRef.current +
            (needsSpace ? " " : "") +
            text.trim();
        }

        if (typeof onTranscriptionChunk === "function") {
          onTranscriptionChunk(sessionTextRef.current);
        }
      } catch (err) {
        console.error("[useAudioRecorder] transcribeChunk error:", err);
      } finally {
        isTranscribingRef.current = false;
      }
    },
    [language, onTranscriptionChunk]
  );

  // --- התחלת הקלטה ---
  const startRecording = useCallback(async () => {
    if (isRecording) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const recorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });

      // איפוס טקסט הסשן בתחילת הקלטה חדשה
      sessionTextRef.current = "";

      recorder.ondataavailable = async (event) => {
        // נקרא כל 5 שניות
        if (!event.data || event.data.size === 0) return;
        await transcribeChunk(event.data);
      };

      recorder.onerror = (err) => {
        console.error("[useAudioRecorder] MediaRecorder error:", err);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(5000); // 👈 כל 5000ms נקבל ondataavailable

      setIsRecording(true);
      setIsPaused(false);
    } catch (err) {
      console.error("[useAudioRecorder] getUserMedia error:", err);
    }
  }, [isRecording, transcribeChunk]);

  // --- Pause ---
  const pauseRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || !isRecording || isPaused) return;

    try {
      if (typeof recorder.pause === "function") {
        recorder.pause();
      } else {
        // fallback: אם אין pause, נעצור
        recorder.stop();
      }
      setIsPaused(true);
    } catch (err) {
      console.error("[useAudioRecorder] pause error:", err);
    }
  }, [isRecording, isPaused]);

  // --- Resume ---
  const resumeRecording = useCallback(async () => {
    const recorder = mediaRecorderRef.current;

    if (recorder && recorder.state === "paused") {
      try {
        recorder.resume();
        setIsPaused(false);
        return;
      } catch (err) {
        console.error("[useAudioRecorder] resume error:", err);
      }
    }

    // fallback: אם אין recorder פעיל – מתחילים הקלטה חדשה
    if (!isRecording) {
      await startRecording();
    } else {
      setIsPaused(false);
    }
  }, [isRecording, startRecording]);

  // --- Stop לגמרי ---
  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;

    try {
      if (recorder && recorder.state !== "inactive") {
        recorder.stop();
      }
    } catch (err) {
      console.error("[useAudioRecorder] stop error:", err);
    } finally {
      mediaRecorderRef.current = null;
      setIsRecording(false);
      setIsPaused(false);
      isTranscribingRef.current = false;

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      // לא מאפסים כאן sessionTextRef.current – הטקסט כבר נשלח למעלה
    }
  }, []);

  return {
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    isRecording,
    isPaused,
  };
}
