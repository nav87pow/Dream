import React from "react";
import { useTranslation } from "../../TranslationContext"; // 👈 חדש

export default function SendEditButton({ mode, onClick }) {
  const { t } = useTranslation(); // 👈 חדש

  const icon = mode === "send" ? "✉️" : "✏️";
  const label =
    mode === "send"
      ? t("chat.input.button.send")
      : t("chat.input.button.edit");

  return (
    <button className={`send-edit-btn ${mode}`} onClick={onClick}>
      <span className="send-edit-icon" aria-hidden="true">
        {icon}
      </span>
      <span className="send-edit-label">{label}</span>
    </button>
  );
}
