import React from "react";
import RecordButton from "./RecordButton";
import WaveAnimation from "./WaveAnimation";

export default function AudioRecorderBar({
  recordingState,
  onStart,
  onPause,
  onResume,
}) {
  return (
    <div className="audio-recorder-bar">
      <RecordButton
        state={recordingState}
        onStart={onStart}
        onPause={onPause}
        onResume={onResume}
      />

      <WaveAnimation state={recordingState} />
    </div>
  );
}
