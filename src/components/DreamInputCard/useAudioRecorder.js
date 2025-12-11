// src/components/DreamInputCard/useAudioRecorder.js
import { useRef, useState } from "react";

export default function useAudioRecorder() {
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);

  const startRecording = async () => {
    console.log("[TEST] start recording clicked");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log("[TEST] getUserMedia OK");

      streamRef.current = stream;

      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.onstart = () => console.log("[TEST] recorder started");
      recorder.onstop = () => console.log("[TEST] recorder stopped");
      recorder.onerror = (e) => console.error("[TEST] recorder error:", e);
      recorder.ondataavailable = (e) =>
        console.log("[TEST] dataavailable:", e.data.size);

      recorder.start(1000); // כל שנייה
      setIsRecording(true);

      console.log("[TEST] recorder.start() called");
    } catch (err) {
      console.error("[TEST] getUserMedia failed:", err);
    }
  };

  const stopRecording = () => {
    console.log("[TEST] stop recording clicked");

    const recorder = mediaRecorderRef.current;
    if (recorder) {
      recorder.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
    }

    setIsRecording(false);
  };

  return {
    startRecording,
    stopRecording,
    isRecording,
  };
}
