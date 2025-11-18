// src/components/tags/TagsInput.jsx
import { useState } from "react";

export default function TagsInput({ onAdd }) {
  const [value, setValue] = useState("");

  const handleSubmit = () => {
    const cleaned = value.trim();
    if (!cleaned) return;
    onAdd(cleaned);
    setValue("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="tags-input">
      <input
        className="tags-input__field"
        placeholder="add tags we missed .."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
      />
      <button
        type="button"
        className="tags-input__button"
        onClick={handleSubmit}
      >
        ▶
      </button>
    </div>
  );
}
