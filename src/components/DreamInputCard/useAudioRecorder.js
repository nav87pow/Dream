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

  const callbackRef = useRef(onTranscriptionChunk);
  useEffect(() => {
    callbackRef.current = onTranscriptionChunk;
  }, [onTranscriptionChunk]);

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
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

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
        console.error(
          "[useAudioRecorder] MediaRecorder error:",
          event.error || event
        );
      };

      recorder.onstop = async () => {
        try {
          console.log("[useAudioRecorder] Recording stopped, building blob");

          const mimeType =
            recorder.mimeType || preferredType || "audio/webm";

          const blob = new Blob(chunksRef.current, { type: mimeType });
          chunksRef.current = [];

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
        "[useAudioRecorder] pauseRecording: recorder is not in 'recording' state, state=",
        recorder.state
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
        "[useAudioRecorder] resumeRecording: recorder is not in 'paused' state, state=",
        recorder.state
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
      // onstop יטפל בשאר
    } catch (e) {
      console.error("[useAudioRecorder] Failed to stop recording:", e);
      mediaRecorderRef.current = null;

      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    }
  };

  return {
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
  };
}
