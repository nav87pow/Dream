import React, { useState } from "react";
import DreamTextArea from "./DreamTextArea";
import DreamActionsRow from "./DreamActionsRow";
import useAudioRecorder from "./useAudioRecorder";
import { useTranslation } from "../../TranslationContext"; // 👈 חדש

export default function DreamInputCard({ onSend }) {
  const [draftText, setDraftText] = useState("");
  const [sentText, setSentText] = useState("");
  const [isEditable, setIsEditable] = useState(true);

  const { t } = useTranslation(); // 👈 חדש

  const {
    recordingState,
    startRecording,
    pauseRecording,
    resumeRecording,
  } = useAudioRecorder({
    onTranscriptionChunk: (chunk) => {
      setDraftText((prev) => (prev ? prev + " " + chunk : chunk));
    },
  });

  const trimmedDraft = draftText.trim();
  const trimmedSent = sentText.trim();

  const mode =
    !trimmedSent || trimmedDraft !== trimmedSent ? "send" : "edit";

  const handleSend = () => {
    if (!trimmedDraft) return;
    onSend(draftText);
    setSentText(draftText);
    setIsEditable(false);
  };

  const handleEnterEditMode = () => {
    setIsEditable(true);
  };

  return (
    <div className="dream-input-card">
      <DreamTextArea
        value={draftText}
        onChange={setDraftText}
        isEditable={isEditable}
        // 👇 במקום טקסט קשיח – תרגום
        placeholder={t("chat.input.placeholder.default")}
      />

      <DreamActionsRow
        mode={mode}
        onSend={handleSend}
        onEdit={handleEnterEditMode}
        recordingState={recordingState}
        onStart={startRecording}
        onPause={pauseRecording}
        onResume={resumeRecording}
      />
    </div>
  );
}
