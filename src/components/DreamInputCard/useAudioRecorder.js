// src/components/DreamInputCard/useAudioRecorder.js
import { useCallback, useRef, useState } from "react";

// 👇 בסיס ל-API: מנסה REACT_APP_API_URL, אחרת מחליט לפי דומיין
const API_BASE_URL =
  process.env.REACT_APP_API_URL ||
  (window.location.hostname === "localhost"
    ? "http://localhost:4000"
    : "https://dream-eyyq.onrender.com");

// תבנית זמני הטריגר במילישניות: 5, 10, 20, 30, 40, 50 שניות
const TRIGGER_PATTERN = [5000, 10000, 20000, 30000, 40000, 50000];
// אחרי שהגענו לפעם הראשונה של 50 שניות – נוסיף עוד 50 שניות כל פעם

/**
 * useAudioRecorder
 *
 * - מקליט אודיו מהמיקרופון ע״י MediaRecorder עם timeslice = 1000ms (שניה).
 * - שומר את *כל* ה-chunks ב־chunksRef.
 * - בזמן ההקלטה יש טיימר פנימי שבודק כל חצי שניה:
 *   - אם עברו 5/10/20/... שניות מאז תחילת ההקלטה
 *   - נבנה Blob מכל מה שהוקלט עד עכשיו ושולחים אותו לתמלול (transcribeBlob)
 *   - הטקסט המצטבר נשמר ב-sessionTextRef
 *   - נשלח למעלה דרך onTranscriptionChunk – DreamInputCard כבר יודע לחבר את זה לטקסט המשתמש
 *
 * ה-API:
 * useAudioRecorder({ onTranscriptionChunk, language })
 * מחזיר: { startRecording, pauseRecording, resumeRecording, stopRecording, isRecording, isPaused }
 */

export default function useAudioRecorder(options = {}) {
  const { onTranscriptionChunk, language } = options;

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]); // כל ה-chunks מהתחלת ההקלטה
  const sessionTextRef = useRef(""); // טקסט מצטבר מכל הבקשות

  const isTranscribingRef = useRef(false); // כדי למנוע בקשות חופפות
  const timerIdRef = useRef(null);
  const startTimeRef = useRef(null);
  const nextTriggerTimeRef = useRef(null); // ms מאז תחילת ההקלטה
  const triggerIndexRef = useRef(0); // אינדקס בתוך TRIGGER_PATTERN

  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // --- שליחת Blob לשרת (ההקלטה המלאה עד עכשיו) ---
  const transcribeBlob = useCallback(
    async (blob) => {
      if (isTranscribingRef.current) {
        // יש כבר בקשה רצה – לא נשלח עוד אחת במקביל
        return;
      }

      isTranscribingRef.current = true;

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
        console.error("[useAudioRecorder] transcribeBlob error:", err);
      } finally {
        isTranscribingRef.current = false;
      }
    },
    [language, onTranscriptionChunk]
  );

  // --- התחלת טיימר טריגרים (5,10,20,30,40,50 ואז כל 50 שניות) ---
  const startTriggerTimer = useCallback(() => {
    // איפוס נתוני זמן
    startTimeRef.current = Date.now();
    triggerIndexRef.current = 0;
    nextTriggerTimeRef.current = TRIGGER_PATTERN[0]; // 5 שניות

    // אם היה טיימר קודם – ננקה
    if (timerIdRef.current) {
      clearInterval(timerIdRef.current);
      timerIdRef.current = null;
    }

    // טיימר כל 500ms – לבדוק אם עברנו את הטריגר הבא
    timerIdRef.current = window.setInterval(() => {
      const recorder = mediaRecorderRef.current;
      if (!recorder || !isRecording) {
        return;
      }

      if (!startTimeRef.current || nextTriggerTimeRef.current == null) {
        return;
      }

      const elapsed = Date.now() - startTimeRef.current; // ms מאז תחילת ההקלטה

      // אם עברנו את זמן הטריגר – שולחים את כל ההקלטה עד עכשיו
      if (
        elapsed >= nextTriggerTimeRef.current &&
        chunksRef.current.length > 0 &&
        !isTranscribingRef.current
      ) {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        transcribeBlob(blob);

        // עדכון זמן הטריגר הבא:
        if (triggerIndexRef.current < TRIGGER_PATTERN.length - 1) {
          // עוברים לטריגר הבא ברשימה
          triggerIndexRef.current += 1;
          nextTriggerTimeRef.current =
            TRIGGER_PATTERN[triggerIndexRef.current];
        } else {
          // כבר הגענו ל-50 שניות לפחות פעם אחת –
          // מעכשיו מוסיפים עוד 50 שניות בכל פעם (50,100,150,...)
          nextTriggerTimeRef.current += 50000;
        }
      }
    }, 500);
  }, [isRecording, transcribeBlob]);

  const stopTriggerTimer = useCallback(() => {
    if (timerIdRef.current) {
      clearInterval(timerIdRef.current);
      timerIdRef.current = null;
    }
  }, []);

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
      sessionTextRef.current = ""; // טקסט מצטבר חדש לסשן
      isTranscribingRef.current = false;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = (err) => {
        console.error("[useAudioRecorder] MediaRecorder error:", err);
      };

      // כשעוצרים את ההקלטה, ננסה לשלוח פעם אחרונה את ההקלטה המלאה (אם אין תמלול רץ)
      recorder.onstop = async () => {
        stopTriggerTimer();

        if (chunksRef.current.length && !isTranscribingRef.current) {
          const blob = new Blob(chunksRef.current, { type: "audio/webm" });
          await transcribeBlob(blob);
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start(1000); // כל שניה נקבל chunk קטן ל-chunksRef

      setIsRecording(true);
      setIsPaused(false);

      // מפעילים את לוגיקת הטריגרים 5/10/20/30/40/50...
      startTriggerTimer();
    } catch (err) {
      console.error("[useAudioRecorder] getUserMedia error:", err);
    }
  }, [isRecording, startTriggerTimer, stopTriggerTimer, transcribeBlob]);

  // --- Pause ---
  const pauseRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (!recorder || !isRecording || isPaused) return;

    try {
      if (typeof recorder.pause === "function") {
        recorder.pause();
      } else {
        recorder.stop();
      }
      stopTriggerTimer();
      setIsPaused(true);
      setIsRecording(false);
    } catch (err) {
      console.error("[useAudioRecorder] pause error:", err);
    }
  }, [isRecording, isPaused, stopTriggerTimer]);

  // --- Resume ---
  const resumeRecording = useCallback(async () => {
    const recorder = mediaRecorderRef.current;

    if (recorder && recorder.state === "paused") {
      try {
        recorder.resume();
        setIsPaused(false);
        setIsRecording(true);

        // כשממשיכים, מתחילים שוב את דפוס הטריגרים מהתחלה
        startTriggerTimer();
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
  }, [isRecording, startRecording, startTriggerTimer]);

  // --- Stop לגמרי ---
  const stopRecording = useCallback(() => {
    const recorder = mediaRecorderRef.current;

    try {
      if (recorder && recorder.state !== "inactive") {
        recorder.stop(); // onstop ידאג לשליחה אחרונה אם צריך
      }
    } catch (err) {
      console.error("[useAudioRecorder] stop error:", err);
    } finally {
      mediaRecorderRef.current = null;
      setIsRecording(false);
      setIsPaused(false);
      isTranscribingRef.current = false;
      stopTriggerTimer();

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    }
  }, [stopTriggerTimer]);

  return {
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    isRecording,
    isPaused,
  };
}
