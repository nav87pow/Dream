import { useState } from "react";

/**
 * שכבה ראשונה:
 * - מנהל רק מצב "idle" | "recording" | "paused"
 * - עדיין לא מקליט אודיו אמיתי
 * - onTranscriptionChunk שמור לעתיד (כשנחבר תמלול)
 */
export default function useAudioRecorder(options = {}) {
  const { onTranscriptionChunk } = options;
  const [recordingState, setRecordingState] = useState("idle");

  const startRecording = () => {
    setRecordingState("recording");
    // כאן בעתיד נוסיף:
    // - גישה למיקרופון
    // - שליחת אודיו לשרת
    // - קריאה ל-onTranscriptionChunk(...)
  };

  const pauseRecording = () => {
    setRecordingState("paused");
    // בעתיד: pause ל-MediaRecorder וכו'
  };

  const resumeRecording = () => {
    setRecordingState("recording");
    // בעתיד: resume ל-MediaRecorder וכו'
  };

  return {
    recordingState,
    startRecording,
    pauseRecording,
    resumeRecording,
  };
}
