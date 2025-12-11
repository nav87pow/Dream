// src/components/DreamInputCard/useAudioRecorder.js
import { useCallback, useRef, useState } from "react";

/**
 * useAudioRecorder
 *
 * אחראי להקלטת אודיו מהמיקרופון, שליחת chunk כל שניה לשרת התמלול,
 * והחזרת טקסט מצטבר של ההקלטה הנוכחית דרך onTranscriptionChunk.
 *
 * ה־API נשאר כמו שהיה בדREAMInputCard:
 * useAudioRecorder({ onTranscriptionChunk })
 * מחזיר: { startRecording, pauseRecording, resumeRecording, stopRecording }
 */

export default function useAudioRecorder(options = {}) {
  const { onTranscriptionChunk, language } = options;

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);

  // טקסט מצטבר של ההקלטה הנוכחית (מאפס עם start חדש)
  const sessionTextRef = useRef("");

  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // --- פונקציה פנימית: שליחה לשרת של chunk יחיד ---
  const transcribeChunk = useCallback(
    async (blob) => {
      try {
        const formData = new FormData();
        formData.append("file", blob, "chunk.webm");

        // אם יש שפת הקשר – מוסיפים, אחרת השרת יתפוס ברירת מחדל (English)
        if (language) {
          formData.append("language", language);
        }

        const res = await fetch("/api/transcribe", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          console.error("[useAudioRecorder] /api/transcribe failed:", res.status);
          return;
        }

        const data = await res.json();
        const chunkText = (data && data.text) || "";

        if (!chunkText.trim()) {
          return;
        }

        // עדכון המצטבר של הסשן
        if (!sessionTextRef.current) {
          sessionTextRef.current = chunkText.trim();
        } else {
          // מוסיפים רווח אם צריך
          const needsSpace =
            !sessionTextRef.current.endsWith(" ") && !chunkText.startsWith(" ");

          sessionTextRef.current =
            sessionTextRef.current + (needsSpace ? " " : "") + chunkText.trim();
        }

        // החזרה למעלה – DREAMInputCard כבר יודע לחבר על בסיס baseTextRef
        if (typeof onTranscriptionChunk === "function") {
          onTranscriptionChunk(sessionTextRef.current);
        }
      } catch (err) {
        console.error("[useAudioRecorder] transcribeChunk error:", err);
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

      // MediaRecorder עם חלוקה ל-chunk אחד כל 1000ms
      const recorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });

      // איפוס טקסט הסשן בתחילת הקלטה
      sessionTextRef.current = "";

      recorder.ondataavailable = async (event) => {
        // הפונקציה הזאת נקראת כל פעם שנוצר chunk (כל שניה)
        if (!event.data || event.data.size === 0) return;

        // שולחים את ה-chunk לשרת
        await transcribeChunk(event.data);
      };

      recorder.onerror = (err) => {
        console.error("[useAudioRecorder] MediaRecorder error:", err);
      };

      mediaRecorderRef.current = recorder;
      recorder.start(1000); // 👈 כל 1000ms נקבל ondataavailable
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
        // אם הדפדפן לא תומך – נ fallback ל-stop חלקי (ניתן לשפר בהמשך)
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

    // אם יש pause מובנה – משתמשים בו
    if (recorder && typeof recorder.resume === "function") {
      try {
        recorder.resume();
        setIsPaused(false);
        return;
      } catch (err) {
        console.error("[useAudioRecorder] resume error:", err);
      }
    }

    // fallback: אם אין recorder פעיל – נתחיל הקלטה חדשה מאותו stream
    if (!isRecording) {
      await startRecording();
    } else {
      setIsPaused(false);
    }
  }, [isRecording, startRecording]);

  // --- Stop לגמרי ---
  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return;

    try {
      if (recorder.state !== "inactive") {
        recorder.stop();
      }
    } catch (err) {
      console.error("[useAudioRecorder] stop error:", err);
    } finally {
      mediaRecorderRef.current = null;
      setIsRecording(false);
      setIsPaused(false);

      // עצירת המיקרופון
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
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
