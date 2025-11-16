// src/components/DreamChat.jsx
import React, { useState } from "react";

function DreamChat() {
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "system",
      text: "Welcome to your dream sanctuary. Share your dream with me, and I’ll help you unlock its meaning. 🌙",
    },
  ]);

  const [isLoading, setIsLoading] = useState(false);

  const addMessage = (msg) =>
    setMessages((prev) => [
      ...prev,
      { id: Date.now() + Math.random(), ...msg },
    ]);

  const handleSend = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isLoading) return;

    // 1) מוסיפים את הודעת המשתמש לצ'ט
    addMessage({ type: "user", text: trimmed });
    setInputValue("");

    // 2) מראים הודעת "חושב..."
    setIsLoading(true);
    addMessage({
      type: "system",
      text: "Interpreting your dream... ✨",
      temp: true,
    });

    try {
      const response = await fetch("http://localhost:4000/api/interpret", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ dreamText: trimmed }),
      });

      const data = await response.json();

      // מסירים את ההודעה הזמנית "Interpreting..."
      setMessages((prev) => prev.filter((m) => !m.temp));

      if (!response.ok || !data.interpretation) {
        addMessage({
          type: "system",
          text:
            data.error ||
            "Sorry, I couldn’t interpret your dream right now. Please try again.",
        });
      } else {
        // 3) מוסיפים את הפירוש מה-AI
        addMessage({
          type: "system",
          text: data.interpretation,
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
          {/* הודעות */}
          <div className="messages-area">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`message-bubble ${
                  msg.type === "system" ? "system" : "user"
                }`}
              >
                {msg.text}
              </div>
            ))}
          </div>

          {/* קלט */}
          <div className="input-bar">
            <button className="input-icon-button send" onClick={handleSend}>
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

            <button className="input-icon-button mic">🎙</button>
          </div>

          {/* ניווט תחתון */}
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
