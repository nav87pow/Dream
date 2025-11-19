import React, { useEffect, useRef } from "react";

function EditableUserBubble({
  message,
  dreamText,
  setDreamText,
  isEditingDream,
  setIsEditingDream,
  onSendAgain,
  isLoading,
  lastCategory,
  lastMethod,
}) {
  const textareaRef = useRef(null);
  const effectiveDreamText = dreamText || message.text;

  const handleEditClick = () => {
    if (!dreamText) setDreamText(message.text);
    setIsEditingDream(true);
  };

  const handleChange = (e) => {
    setDreamText(e.target.value);

    // auto-resize
    e.target.style.height = "auto";
    e.target.style.height = e.target.scrollHeight + "px";
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        textareaRef.current.scrollHeight + "px";
    }
  }, [dreamText]);

  const canSendAgain =
    !isLoading &&
    !!lastCategory &&
    !!lastMethod &&
    !!(effectiveDreamText && effectiveDreamText.trim());

  return (
    <>
      <textarea
        ref={textareaRef}
        className={`user-dream-textarea ${isEditingDream ? "editing" : ""}`}
        value={effectiveDreamText}
        readOnly={!isEditingDream}
        onChange={handleChange}
        placeholder={isEditingDream ? "edit your dream text..." : ""}
      />
      <div className="dream-bubble-actions">
        <button type="button" className="edit-button m-2 send-again-button p-2 ring-2 ring-violet-500 ring-offset-2" onClick={handleEditClick}>
          ✏️
        </button>
        <button
          type="button"
          className="send-again-button p-2 ring-2 ring-violet-500 ring-offset-2 "
          onClick={onSendAgain}
          disabled={!canSendAgain}
        >
          send again
        </button>
      </div>
    </>
  );
}

export default EditableUserBubble;
