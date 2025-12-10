import { useState, useRef, useEffect } from "react";
import { useTranslation } from "../../TranslationContext";
import { TRANSCRIBE_URL } from "../../config/api";

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


// שליחת Blob של אודיו לשרת וקבלת טקסט בחזרה
async function uploadAndTranscribe(blob, language) {
  const formData = new FormData();
  formData.append("file", blob, "recording.webm");

  if (language) {
    formData.append("language", language.toLowerCase());
  }

  const response = await fetch(TRANSCRIBE_URL, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    console.error(
      "[useAudioRecorder] Transcribe request failed:",
      response.status
    );
    return "";
  }

  try {
    const data = await response.json();
    return data.text || "";
  } catch (e) {
    console.error("[useAudioRecorder] Failed to parse transcription JSON:", e);
    return "";
  }
}




export default function useAudioRecorder(options = {}) {
  const { onTranscriptionChunk } = options;
  const { language } = useTranslation();

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);

  // שומרים את callback ברפרנס כדי לא להיתקע על סגירה ישנה
  const callbackRef = useRef(onTranscriptionChunk);
  useEffect(() => {
    callbackRef.current = onTranscriptionChunk;
  }, [onTranscriptionChunk]);

  const startRecording = async () => {
    // אם כבר יש הקלטה פעילה – לא מתחילים שוב
    if (mediaRecorderRef.current) {
      console.warn(
        "[useAudioRecorder] startRecording called while recorder exists"
      );
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn(
        "[useAudioRecorder] getUserMedia not available in this browser"
      );
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      // ננסה סוג MIME נפוץ, ואם לא נתמך – ניתן לדפדפן לבחור
      let recorder;
      const preferredType = "audio/webm;codecs=opus";

      if (
        window.MediaRecorder &&
        window.MediaRecorder.isTypeSupported &&
        window.MediaRecorder.isTypeSupported(preferredType)
      ) {
        recorder = new MediaRecorder(stream, { mimeType: preferredType });
      } else {
        recorder = new MediaRecorder(stream);
      }

      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onerror = (event) => {
        console.error("[useAudioRecorder] MediaRecorder error:", event.error || event);
      };

      recorder.onstop = async () => {
        try {
          const mimeType =
            recorder.mimeType ||
            preferredType ||
            "audio/webm";

          const blob = new Blob(chunksRef.current, { type: mimeType });
          chunksRef.current = [];

          // סגירת המיקרופון
          if (streamRef.current) {
            streamRef.current.getTracks().forEach((track) => track.stop());
            streamRef.current = null;
          }

          if (!blob || blob.size === 0) {
            console.warn("[useAudioRecorder] Recorded blob is empty");
            mediaRecorderRef.current = null;
            return;
          }

          const langCode = (language || "en").toLowerCase();
          const sessionText = await uploadAndTranscribe(blob, langCode);

          if (callbackRef.current && sessionText) {
            // מחזירים את כל הטקסט של הסשן – הלוגיקה של הוספה בלי כפילות
            // כבר קיימת ב-DreamInputCard (baseTextRef ועוד).
            callbackRef.current(sessionText);
          }
        } catch (e) {
          console.error(
            "[useAudioRecorder] Failed to handle recording stop / transcription:",
            e
          );
        } finally {
          mediaRecorderRef.current = null;
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      console.log("[useAudioRecorder] Recording started");
    } catch (e) {
      console.error("[useAudioRecorder] Failed to start recording:", e);
    }
  };

  const pauseRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) {
      console.warn("[useAudioRecorder] pauseRecording: no active recorder");
      return;
    }
    if (recorder.state !== "recording") {
      console.warn(
        "[useAudioRecorder] pauseRecording: recorder is not in 'recording' state"
      );
      return;
    }

    try {
      recorder.pause();
      console.log("[useAudioRecorder] Recording paused");
    } catch (e) {
      console.error("[useAudioRecorder] Failed to pause recording:", e);
    }
  };

  const resumeRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) {
      console.warn("[useAudioRecorder] resumeRecording: no active recorder");
      return;
    }
    if (recorder.state !== "paused") {
      console.warn(
        "[useAudioRecorder] resumeRecording: recorder is not in 'paused' state"
      );
      return;
    }

    try {
      recorder.resume();
      console.log("[useAudioRecorder] Recording resumed");
    } catch (e) {
      console.error("[useAudioRecorder] Failed to resume recording:", e);
    }
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) {
      console.warn("[useAudioRecorder] stopRecording: no active recorder");
      return;
    }
    if (recorder.state === "inactive") {
      console.warn(
        "[useAudioRecorder] stopRecording: recorder already inactive"
      );
      return;
    }

    try {
      console.log("[useAudioRecorder] Stopping recording");
      recorder.stop();
      // onstop מטפל בשאר (סגירת stream, שליחה לשרת, callback)
    } catch (e) {
      console.error("[useAudioRecorder] Failed to stop recording:", e);
      mediaRecorderRef.current = null;

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    }
  };

  // הממשק החיצוני בדיוק כמו קודם – DreamInputCard משתמש רק בזה
  return {
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
  };
}
