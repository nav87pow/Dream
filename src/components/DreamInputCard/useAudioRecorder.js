import { useState } from "react";

/**
 * שכבה ראשונה:
 * - מנהל רק מצב "idle" | "recording" | "paused"
 * - עדיין לא מקליט אודיו אמיתי
 * - onTranscriptionChunk ייכנס לפעולה כשנחבר תמלול אמיתי
 */
export default function useAudioRecorder(options = {}) {
  const { onTranscriptionChunk } = options;
  const [recordingState, setRecordingState] = useState("idle");

  const startRecording = () => {
    setRecordingState("recording");

    // ❗ שימוש "דמי" כדי ש-ESLint לא יתלונן שהוא לא בשימוש
    if (typeof onTranscriptionChunk === "function") {
      // בשלב הבא נוסיף כאן קריאה אמיתית אחרי תמלול אודיו
      // כרגע זה no-op כדי לעבור build ב-CI
    }
  };

  const pauseRecording = () => {
    setRecordingState("paused");
  };

  const resumeRecording = () => {
    setRecordingState("recording");
  };

  return {
    recordingState,
    startRecording,
    pauseRecording,
    resumeRecording,
  };
}
