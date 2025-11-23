import React from "react";

export default function DreamTextArea({
  value,
  onChange,
  isEditable,
  placeholder,
}) {
  return (
    <textarea
      className="dream-textarea"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      readOnly={!isEditable}
    />
  );
}
