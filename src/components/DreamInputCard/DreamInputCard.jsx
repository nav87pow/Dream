// src/components/DreamInputCard/DreamInputCard.jsx
import React, { useState, useRef } from "react";
import DreamTextArea from "./DreamTextArea";
import DreamActionsRow from "./DreamActionsRow";
import useAudioRecorder from "./useAudioRecorder";
import { useTranslation } from "../../TranslationContext";

export default function DreamInputCard({ onSend }) {
  const [draftText, setDraftText] = useState("");
  const [sentText, setSentText] = useState("");
  const [isEditable, setIsEditable] = useState(true);

  // 👇 state לייצוג מצב ההקלטה בצד ה־UI (לכפתור + אנימציה)
  const [recordingState, setRecordingState] = useState("idle");

  const { t } = useTranslation();

  // 👇 שומר את הטקסט שהיה לפני שמתחילים הקלטה/חוזרים מהפסקה
  const baseTextRef = useRef("");

  const { startRecording, pauseRecording, resumeRecording, stopRecording } =
    useAudioRecorder({
      // sessionText = הטקסט המצטבר של ההקלטה הנוכחית
      onTranscriptionChunk: (sessionText) => {
        setDraftText(() => {
          const base = baseTextRef.current || "";

          // אין טקסט חדש מההקלטה → נשארים עם מה שיש
          if (!sessionText && !base) return "";
          if (!sessionText) return base;
          if (!base) return sessionText;

          const b = base;
          const s = sessionText;

          // 🔍 מחפשים את *ההתחלה* הארוכה ביותר של sessionText
          // שמופיעה איפשהו בתוך base (לא רק בסוף)
          let overlap = 0;
          const maxOverlap = Math.min(b.length, s.length);

          for (let len = maxOverlap; len > 0; len--) {
            const prefix = s.slice(0, len);
            if (b.includes(prefix)) {
              overlap = len;
              break;
            }
          }

          // החלק החדש בלבד – זה שלא הופיע עדיין ב-base
          let suffix = s.slice(overlap);
          suffix = suffix.replace(/^\s+/, ""); // להסיר רווחים מיותרים בתחילת ההמשך

          if (!suffix) {
            // אין באמת טקסט חדש – נשארים עם הבייס
            return b;
          }

          const needsSpace = !b.endsWith(" ") && !suffix.startsWith(" ");
          const separator = needsSpace ? " " : "";

          return b + separator + suffix;
        });
      },
    });

  const trimmedDraft = draftText.trim();
  const trimmedSent = sentText.trim();

  const mode =
    !trimmedSent || trimmedDraft !== trimmedSent ? "send" : "edit";

  const handleSend = () => {
    if (!trimmedDraft) return;

    // אם עדיין מקליט/בהפסקה – לעצור לגמרי
    if (recordingState === "recording" || recordingState === "paused") {
      stopRecording();
      setRecordingState("idle");
    }

    onSend(draftText);
    setSentText(draftText);
    setIsEditable(false);
  };

  const handleEnterEditMode = () => {
    setIsEditable(true);
  };

  // 👇 כשמתחילים הקלטה – שומרים את הטקסט שקיים כרגע ומעדכנים state ל-"recording"
  const handleStartRecording = () => {
    baseTextRef.current = draftText || "";
    setRecordingState("recording");
    startRecording();
  };

  // 👇 כשעושים Pause – מעדכנים רק את מצב ה־UI ומעבירים לפונקציה מה־hook
  const handlePauseRecording = () => {
    setRecordingState("paused");
    pauseRecording();
  };

  // 👇 כשעושים Resume – מעדכנים baseText לטקסט הנוכחי ומחזירים state ל-"recording"
  const handleResumeRecording = () => {
    baseTextRef.current = draftText || "";
    setRecordingState("recording");
    resumeRecording();
  };

  return (
    <div className="dream-input-card">
      <DreamTextArea
        value={draftText}
        onChange={setDraftText}
        isEditable={isEditable}
        placeholder={t("chat.input.placeholder.default")}
      />

      <DreamActionsRow
        mode={mode}
        onSend={handleSend}
        onEdit={handleEnterEditMode}
        recordingState={recordingState}
        onStart={handleStartRecording} // 👈 לא מעבירים startRecording ישירות
        onPause={handlePauseRecording}
        onResume={handleResumeRecording}
      />
    </div>
  );
}
