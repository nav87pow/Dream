/*import { Button } from "./components/ui/button";

function App() {
  return (
    <div className="min-h-screen bg-violet-100 text-foreground p-10 space-y-6">
      <div className="space-x-3">
        <Button>Default</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="outline">Outline</Button>
        <Button variant="destructive">Delete</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="link">Learn more →</Button>
      </div>
    </div>
  );
}

export default App;
*/

// App.js
import React, { useState } from "react";
import "./App.css";

function App() {
  const [inputValue, setInputValue] = useState("");
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: "system",
      text: "Welcome to your dream sanctuary. Share your dream with me, and I’ll help you unlock its meaning. 🌙",
    },
    {
      id: 2,
      type: "user",
      text: "i dream of me flying above the see and painting the stars in many colors - i pass night and days just flying - felled the wind under my arms - the colors were going through my fingers",
    },
  ]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    const newMessage = {
      id: Date.now(),
      type: "user",
      text: inputValue.trim(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputValue("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="app-root">
     
        <div className="chat-screen">
          {/* אזור ההודעות */}
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

          {/* אזור קלט טקסט + כפתורי שליחה/מיקרופון */}
          <div className="input-bar">
            <button className="input-icon-button send" onClick={handleSend}>
              {/* שמרתי על הצורה "<" כמו בסקיצה, אבל הפונקציה היא שליחה */}
              &lt;
            </button>

            <input
              className="input-field"
              type="text"
              placeholder="Type your dream here..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
            />

            <button className="input-icon-button mic">
              🎙
            </button>
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
  );
}

export default App;
