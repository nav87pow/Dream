import React, { useState } from "react";
import CategoryStep from "./categories/CategoryStep";
import TagsList from "./tags/TagsList";

function DreamChat() {
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "system",
      text: "Welcome to your dream sanctuary. Share your dream with me, and I’ll help you unlock its meaning. 🌙",
    },
  ]);

  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [selectedMethodId, setSelectedMethodId] = useState(null);
  const [flowStep, setFlowStep] = useState("idle");
  const [pendingDreamText, setPendingDreamText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const addMessage = (msg) =>
    setMessages((prev) => [
      ...prev,
      { id: Date.now() + Math.random(), ...msg },
    ]);

  const handleSend = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isLoading) return;

    if (flowStep === "category" || flowStep === "method") return;

    addMessage({ type: "user", text: trimmed });
    setInputValue("");

    setPendingDreamText(trimmed);
    setSelectedCategoryId(null);
    setSelectedMethodId(null);
    setFlowStep("category");
  };

  const handleCategorySelect = (categoryId) => {
    setSelectedCategoryId(categoryId);
    setSelectedMethodId(null);
    setFlowStep("method");
  };

  const handleMethodSelect = async (methodId) => {
    if (!pendingDreamText || isLoading) return;

    setSelectedMethodId(methodId);
    setFlowStep("interpreting");
    setIsLoading(true);

    addMessage({
      type: "system",
      text: "Interpreting your dream... ✨",
      temp: true,
    });

    try {
      const response = await fetch(
 /*"http://localhost:4000/api/interpret"*/
       "https://dream-eyyq.onrender.com/api/interpret",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          // 🔹 כאן השינוי היחיד: שמות שדות תואמים ל-server
          body: JSON.stringify({
            dreamText: pendingDreamText,
            category: selectedCategoryId,
            method: methodId,
          }),
        }
      );

      const data = await response.json();

      setMessages((prev) => prev.filter((m) => !m.temp));

      if (!response.ok || !data.interpretation) {
        addMessage({
          type: "system",
          text:
            data.error ||
            "Sorry, I couldn’t interpret your dream right now. Please try again.",
        });
   } else {
  addMessage({
    type: "system",
    text: data.interpretation,
    title: data.title,
    methodUsed: data.methodUsed,
    tags: data.tags,   // 👈 זה מה שמאפשר ל־TagsList לעבוד
  });
}

    } catch (err) {
      console.error(err);
      setMessages((prev) => prev.filter((m) => !m.temp));
      addMessage({
        type: "system",
        text: "Something went wrong while interpreting your dream.",
      });
    } finally {
      setIsLoading(false);
      setFlowStep("idle");
      setPendingDreamText("");
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="app-root">
      <div className="phone-frame">
        <div className="chat-screen">


 <div className="messages-area">
  {messages.map((msg) => (
    <div
      key={msg.id}
      className={`message-bubble ${
        msg.type === "system" ? "system" : "user"
      }`}
    >
      {msg.text}

      {msg.type === "system" && msg.tags && (
        <TagsList
          tags={msg.tags}
          setTags={(updatedTags) => {
            // מעדכנים את התגיות רק בהודעה הזאת
            setMessages((prev) =>
              prev.map((m) =>
                m.id === msg.id ? { ...m, tags: updatedTags } : m
              )
            );
          }}
        />
      )}
    </div>
  ))}
</div>



          {(flowStep === "category" || flowStep === "method") && (
            <CategoryStep
              selectedCategoryId={selectedCategoryId}
              onCategorySelect={handleCategorySelect}
              onMethodSelect={handleMethodSelect}
            />
            
          )}

          <div className="input-bar">
            <button
              className="input-icon-button send"
              onClick={handleSend}
              disabled={isLoading}
            >
              &lt;
            </button>

            <input
              className="input-field"
              type="text"
              placeholder={
                isLoading
                  ? "Interpreting your dream..."
                  : "Type your dream here..."
              }
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
            />

            <button className="input-icon-button mic" disabled={isLoading}>
              🎙
            </button>
          </div>

          <nav className="bottom-nav">
            <button className="nav-item">
              <span className="nav-icon">📓</span>
              <span className="nav-label">diary</span>
            </button>
            <button className="nav-item nav-item-active">
              <span className="nav-icon">◯</span>
              <span className="nav-label">interpretation</span>
            </button>
            <button className="nav-item">
              <span className="nav-icon">👤</span>
              <span className="nav-label">profile</span>
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
}

export default DreamChat;
