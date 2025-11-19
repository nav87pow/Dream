import React, { useState } from "react";
import CategoryStep from "./categories/CategoryStep";
import TagsList from "./tags/TagsList";
import EditableUserBubble from "./EditableUserBubble";

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

  // טקסט החלום האחרון של המשתמש (לעריכה בבועה)
  const [dreamText, setDreamText] = useState("");

  // האם הבועה כרגע במצב עריכה?
  const [isEditingDream, setIsEditingDream] = useState(false);

  // שמירת הבחירה האחרונה של קטגוריה ושיטה (ל-send again)
  const [lastCategory, setLastCategory] = useState(null);
  const [lastMethod, setLastMethod] = useState(null);

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

    // נשמור את הטקסט גם לסטייט העריכה בבועה
    setDreamText(trimmed);
    setIsEditingDream(false);
    setLastCategory(null);
    setLastMethod(null);

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

    // נשמור גם את הבחירות האחרונות ל-send again
    setLastCategory(selectedCategoryId);
    setLastMethod(methodId);

    addMessage({
      type: "system",
      text: "Interpreting your dream... ✨",
      temp: true,
    });

    try {
      const response = await fetch(
       /* "http://localhost:4000/api/interpret"*/
        "https://dream-eyyq.onrender.com/api/interpret",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
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
          tags: data.tags, // 👈 זה מה שמאפשר ל־TagsList לעבוד
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

  // פירוש חדש בהתאם לעריכה של החלום בבועה
const handleSendAgain = async () => {
  if (!dreamText.trim() || !lastCategory || !lastMethod || isLoading) return;

  setIsLoading(true);
  setFlowStep("interpreting");

  // הודעת "ביניים" זמנית
  addMessage({
    type: "system",
    text: "Interpreting your updated dream... ✨",
    temp: true,
  });

  try {
    const response = await fetch(
      "https://dream-eyyq.onrender.com/api/interpret",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dreamText: dreamText, // הטקסט המעודכן בבועת המשתמש
          category: lastCategory,
          method: lastMethod,
        }),
      }
    );

    const data = await response.json();

    // מסירים את ההודעה הזמנית
    setMessages((prev) => {
      const withoutTemp = prev.filter((m) => !m.temp);

      if (!response.ok || !data.interpretation) {
        // במקרה של שגיאה – כן נוסיף הודעת system חדשה
        return [
          ...withoutTemp,
          {
            id: Date.now() + Math.random(),
            type: "system",
            text:
              data.error ||
              "Sorry, I couldn’t interpret your dream right now. Please try again.",
          },
        ];
      }

      // ✅ כאן הקסם: מעדכנים את *הפירוש האחרון הקיים* במקום ליצור חדש
      const updated = [...withoutTemp];

      // מוצאים את האינדקס של הודעת ה-system האחרונה (שאינה temp)
      const lastSystemIndexFromEnd = [...updated]
        .reverse()
        .findIndex((m) => m.type === "system");

      if (lastSystemIndexFromEnd === -1) {
        // אם מסיבה כלשהי אין הודעת system – נוסיף חדשה כfallback
        updated.push({
          id: Date.now() + Math.random(),
          type: "system",
          text: data.interpretation,
          title: data.title,
          methodUsed: data.methodUsed,
          tags: data.tags,
        });
        return updated;
      }

      const realIndex = updated.length - 1 - lastSystemIndexFromEnd;

      // מעדכנים את ההודעה הקיימת בפירוש החדש
      updated[realIndex] = {
        ...updated[realIndex],
        text: data.interpretation,
        title: data.title,
        methodUsed: data.methodUsed,
        tags: data.tags,
      };

      return updated;
    });
  } catch (err) {
    console.error(err);
    setMessages((prev) => {
      const withoutTemp = prev.filter((m) => !m.temp);
      return [
        ...withoutTemp,
        {
          id: Date.now() + Math.random(),
          type: "system",
          text: "Something went wrong while interpreting your dream.",
        },
      ];
    });
  } finally {
    setIsLoading(false);
    setFlowStep("idle");
    setIsEditingDream(false);
  }
};


  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  // מזהים את ההודעה האחרונה מסוג user
  const lastUserMessage = [...messages].reverse().find((m) => m.type === "user");
  const lastUserMessageId = lastUserMessage ? lastUserMessage.id : null;

  return (
    <div className="app-root">
      <div className="phone-frame">
        <div className="chat-screen">
          <div className="messages-area">
            {messages.map((msg) => {
              const isLastUser =
                msg.type === "user" && msg.id === lastUserMessageId;

              return (
                <div
                  key={msg.id}
                  className={`message-bubble ${
                    msg.type === "system" ? "system" : "user"
                  }`}
                >
                  {/* בועת המשתמש האחרונה – עם עריכה + send again */}
                  {isLastUser ? (
                    <EditableUserBubble
                      message={msg}
                      dreamText={dreamText}
                      setDreamText={setDreamText}
                      isEditingDream={isEditingDream}
                      setIsEditingDream={setIsEditingDream}
                      onSendAgain={handleSendAgain}
                      isLoading={isLoading}
                      lastCategory={lastCategory}
                      lastMethod={lastMethod}
                    />
                  ) : (
                    // כל ההודעות האחרות – טקסט רגיל
                    <>{msg.text}</>
                  )}

                  {/* תגיות מתחת להודעות ה-system עם tags */}
                  {msg.type === "system" && msg.tags && (
                    <TagsList
                      tags={msg.tags}
                      setTags={(updatedTags) => {
                        setMessages((prev) =>
                          prev.map((m) =>
                            m.id === msg.id ? { ...m, tags: updatedTags } : m
                          )
                        );
                      }}
                    />
                  )}
                </div>
              );
            })}
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
