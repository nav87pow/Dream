import React from "react";
import SendEditButton from "./SendEditButton";
import AudioRecorderBar from "./AudioRecorderBar";

export default function DreamActionsRow({
  mode,
  onSend,
  onEdit,
  recordingState,
  onStart,
  onPause,
  onResume,
}) {
  const handlePrimaryClick = mode === "send" ? onSend : onEdit;

  return (
    <div className="dream-actions-row">
      <SendEditButton mode={mode} onClick={handlePrimaryClick} />

      <AudioRecorderBar
        recordingState={recordingState}
        onStart={onStart}
        onPause={onPause}
        onResume={onResume}
      />
    </div>
  );
}
