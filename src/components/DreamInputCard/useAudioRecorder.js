// src/components/DreamInputCard/useAudioRecorder.js
import { useRef, useEffect } from "react";
import { useTranslation } from "../../TranslationContext";
import { TRANSCRIBE_URL } from "../../config/api";

// שליחת Blob לשרת וקבלת טקסט מתומלל
async function uploadAndTranscribe(blob, language) {
  const formData = new FormData();
  formData.append("file", blob, "recording.webm");

  if (language) {
    formData.append("language", language.toLowerCase());
  }

  console.log("[useAudioRecorder] Uploading blob, size:", blob.size);

  const response = await fetch(TRANSCRIBE_URL, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    console.error(
      "[useAudioRecorder] Transcribe request failed:",
      response.status,
      response.statusText
    );
    return "";
  }

  try {
    const data = await response.json();
    console.log("[useAudioRecorder] Transcription response:", data);
    // השרת מחזיר text – אם אצלך השדה שונה, תעדכן כאן
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
  const aggregateTranscriptRef = useRef(""); // צבירת כל הטקסט עד עכשיו
  const stopReasonRef = useRef(null); // "pause" או "final"

  const callbackRef = useRef(onTranscriptionChunk);

  useEffect(() => {
    callbackRef.current = onTranscriptionChunk;
  }, [onTranscriptionChunk]);

  const cleanupStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const createAndStartRecorder = (stream) => {
    if (!stream) {
      console.warn("[useAudioRecorder] createAndStartRecorder: no stream");
      return;
    }

    let recorder;
    const preferredType = "audio/webm;codecs=opus";

    try {
      if (
        window.MediaRecorder &&
        window.MediaRecorder.isTypeSupported &&
        window.MediaRecorder.isTypeSupported(preferredType)
      ) {
        recorder = new MediaRecorder(stream, { mimeType: preferredType });
      } else {
        recorder = new MediaRecorder(stream);
      }
    } catch (e) {
      console.error("[useAudioRecorder] Failed to create MediaRecorder:", e);
      return;
    }

    chunksRef.current = [];

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    recorder.onerror = (event) => {
      console.error(
        "[useAudioRecorder] MediaRecorder error:",
        event.error || event
      );
    };

    recorder.onstop = async () => {
      const reason = stopReasonRef.current || "final";

      try {
        console.log("[useAudioRecorder] Recording stopped, building blob");

        const mimeType = recorder.mimeType || preferredType || "audio/webm";
        const blob = new Blob(chunksRef.current, { type: mimeType });
        chunksRef.current = [];

        // אם זה סטופ סופי – סוגרים סטרים; אם פאוז – משאירים כדי שנוכל להמשיך
        if (reason === "final") {
          cleanupStream();
        }

        if (!blob || blob.size === 0) {
          console.warn("[useAudioRecorder] Recorded blob is empty");
          mediaRecorderRef.current = null;
          stopReasonRef.current = null;
          return;
        }

        const langCode = (language || "en").toLowerCase();
        const sessionText = await uploadAndTranscribe(blob, langCode);

        if (!sessionText) {
          mediaRecorderRef.current = null;
          stopReasonRef.current = null;
          return;
        }

        if (!callbackRef.current) {
          mediaRecorderRef.current = null;
          stopReasonRef.current = null;
          return;
        }

        if (reason === "pause") {
          // פאוז – מוסיפים לטקסט המצטבר ושולחים ל־textarea
          const prev = aggregateTranscriptRef.current || "";
          const combined = (prev + " " + sessionText).trim();
          aggregateTranscriptRef.current = combined;
          callbackRef.current(combined);
        } else {
          // סטופ סופי – מחברים את כל מה שנאסף ומחזירים טקסט אחד
          const prev = aggregateTranscriptRef.current || "";
          const combined = (prev + " " + sessionText).trim() || sessionText;
          aggregateTranscriptRef.current = "";
          callbackRef.current(combined);
        }
      } catch (e) {
        console.error(
          "[useAudioRecorder] Failed to handle recording stop / transcription:",
          e
        );
      } finally {
        mediaRecorderRef.current = null;
        stopReasonRef.current = null;
      }
    };

    mediaRecorderRef.current = recorder;

    try {
      recorder.start();
      console.log("[useAudioRecorder] Recording started");
    } catch (e) {
      console.error("[useAudioRecorder] Failed to start recorder:", e);
      mediaRecorderRef.current = null;
    }
  };

  const startRecording = async () => {
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
      // מתחילים סשן חדש – מנקים טקסט מצטבר
      aggregateTranscriptRef.current = "";
      stopReasonRef.current = null;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      createAndStartRecorder(stream);
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
        "[useAudioRecorder] pauseRecording: recorder is not in 'recording' state, state=",
        recorder.state
      );
      return;
    }

    try {
      console.log(
        "[useAudioRecorder] pauseRecording: stopping current segment for transcription"
      );
      // במקום pause אמיתי – אנחנו עושים stop חלקי, כדי לקבל Blob ולשלוח לתמלול
      stopReasonRef.current = "pause";
      recorder.stop(); // onstop ידאג לתמלול ולעדכון ה־textarea
    } catch (e) {
      console.error("[useAudioRecorder] Failed to pause (stop) recording:", e);
    }
  };

  const resumeRecording = () => {
    // אם יש עדיין recorder במצב paused – ננסה לחזור ממנו
    const current = mediaRecorderRef.current;
    if (current && current.state === "paused") {
      try {
        current.resume();
        console.log("[useAudioRecorder] Recording resumed (native pause/resume)");
        return;
      } catch (e) {
        console.warn(
          "[useAudioRecorder] Failed native resume, will start new segment:",
          e
        );
      }
    }

    if (!streamRef.current) {
      console.warn(
        "[useAudioRecorder] resumeRecording: no active stream, starting new recording"
      );
      // אין סטרים – נתחיל מהתחלה
      startRecording();
      return;
    }

    try {
      console.log("[useAudioRecorder] resumeRecording: starting new segment");
      stopReasonRef.current = null;
      createAndStartRecorder(streamRef.current);
    } catch (e) {
      console.error("[useAudioRecorder] Failed to resume recording:", e);
    }
  };

  const stopRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) {
      console.warn("[useAudioRecorder] stopRecording: no active recorder");
      // בכל מקרה נוודא שסטרים סגור
      cleanupStream();
      return;
    }

    if (recorder.state === "inactive") {
      console.warn(
        "[useAudioRecorder] stopRecording: recorder already inactive"
      );
      cleanupStream();
      return;
    }

    try {
      console.log("[useAudioRecorder] Stopping recording (final)");
      stopReasonRef.current = "final";
      recorder.stop();
      // onstop יטפל בכל השאר (תמלול, ניקוי, סגירת סטרים)
    } catch (e) {
      console.error("[useAudioRecorder] Failed to stop recording:", e);
      mediaRecorderRef.current = null;
      stopReasonRef.current = null;
      cleanupStream();
    }
  };

  return {
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
  };
}
