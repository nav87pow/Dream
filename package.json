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
 * מקליט אודיו מהמיקרופון, שומר את ההקלטה כ-buffer,
 * ושולח את כל ההקלטה בפעם אחת לשרת התמלול
 * כשנלחץ Pause או Stop.
 *
 * ה-API:
 * useAudioRecorder({ onTranscriptionChunk, language })
 * מחזיר: { startRecording, pauseRecording, resumeRecording, stopRecording, isRecording, isPaused }
 */

export default function useAudioRecorder(options = {}) {
  const { onTranscriptionChunk, language } = options;

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]); // אוסף את כל ה-chunks של הסשן

  // טקסט מצטבר של ההקלטה הנוכחית (מאפס עם start חדש, אבל נשמר מחוץ ל-hook ב-baseTextRef)
  const sessionTextRef = useRef("");

  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // --- פונקציה פנימית: שליחה לשרת של Blob אחד מלא ---
  const transcribeBlob = useCallback(
    async (blob) => {
      try {
        const formData = new FormData();
        formData.append("file", blob, "audio.webm");

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

        // עדכון המצטבר של הסשן
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
        console.error("[useAudioRecorder] transcribeBlob error:", err);
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

      chunksRef.current = []; // איפוס

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = (err) => {
        console.error("[useAudioRecorder] MediaRecorder error:", err);
      };

      recorder.onstop = async () => {
        // כשעוצרים – מחברים את כל ה-chunks ושולחים לשרת
        if (!chunksRef.current.length) {
          return;
        }

        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const currentChunks = [...chunksRef.current];
        chunksRef.current = [];

        // שולחים את ה-blob המלא לתמלול
        await transcribeBlob(blob);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(); // בלי timeslice – chunk אחד גדול עד עצירה

      setIsRecording(true);
      setIsPaused(false);
    } catch (err) {
      console.error("[useAudioRecorder] getUserMedia error:", err);
    }
  }, [isRecording, transcribeBlob]);

  // --- Pause: עצירה + תמלול ההקלטה עד עכשיו ---
  const pauseRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || !isRecording || isPaused) return;

    try {
      if (recorder.state !== "inactive") {
        recorder.stop(); // יפעיל onstop → transcribeBlob
      }
      setIsRecording(false);
      setIsPaused(true);
    } catch (err) {
      console.error("[useAudioRecorder] pause error:", err);
    }
  }, [isRecording, isPaused]);

  // --- Resume: מתחיל סשן חדש, על גבי הטקסט שכבר תומלל ---
  const resumeRecording = useCallback(async () => {
    if (isRecording) return;

    setIsPaused(false);
    await startRecording();
  }, [isRecording, startRecording]);

  // --- Stop: עצירה מלאה + סגירת מיקרופון ---
  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;

    try {
      if (recorder && recorder.state !== "inactive") {
        recorder.stop(); // onstop ידאג לתמלול
      }
    } catch (err) {
      console.error("[useAudioRecorder] stop error:", err);
    } finally {
      mediaRecorderRef.current = null;
      setIsRecording(false);
      setIsPaused(false);

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      // אם תרצה לאפס את הטקסט של הסשן בסוף לחלוטין:
      // sessionTextRef.current = "";
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
