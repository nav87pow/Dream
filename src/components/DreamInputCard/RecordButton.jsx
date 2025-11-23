import React from "react";
import { useTranslation } from "../../TranslationContext"; // 👈 חדש

export default function RecordButton({ state, onStart, onPause, onResume }) {
  const { t } = useTranslation(); // 👈 חדש

  let icon = "🎙️";
  let label = t("chat.input.button.record");
  let handler = onStart;

  if (state === "recording") {
    icon = "⏸️";
    label = t("chat.input.button.pause");
    handler = onPause;
  } else if (state === "paused") {
    icon = "⭕";
    label = t("chat.input.button.resume");
    handler = onResume;
  }

  return (
    <button className={`record-btn ${state}`} onClick={handler}>
      <span className="record-icon" aria-hidden="true">
        {icon}
      </span>
      <span className="record-label">{label}</span>
    </button>
  );
}
