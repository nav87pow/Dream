// src/components/DreamChat.jsx
import React, { useState, useEffect } from "react";
import CategoryStep from "./categories/CategoryStep";
import TagsList from "./tags/TagsList";
// import EditableUserBubble from "./EditableUserBubble"; // גיבוי – כרגע לא בשימוש
import BottomNav from "./BottomNav/BottomNav";
import { useTranslation } from "../TranslationContext";
import DreamInputCard from "./DreamInputCard/DreamInputCard";

// const API_URL = "http://localhost:4000/api/interpret";
const API_URL = "https://dream-eyyq.onrender.com/api/interpret";

function DreamChat({ currentScreen, onChangeScreen }) {
  const { language, t } = useTranslation();

  const [inputValue, setInputValue] = useState("");

  const [messages, setMessages] = useState(() => [
    {
      id: 1,
      type: "system",
      text: t("chat.welcome"),
      messageKey: "chat.welcome",
    },
  ]);

  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  // eslint-disable-next-line no-unused-vars
  const [selectedMethodId, setSelectedMethodId] = useState(null);
  const [flowStep, setFlowStep] = useState("idle");
  const [pendingDreamText, setPendingDreamText] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [dreamText, setDreamText] = useState("");

  // eslint-disable-next-line no-unused-vars
  const [isEditingDream, setIsEditingDream] = useState(false);

  const [lastCategory, setLastCategory] = useState(null);
  const [lastMethod, setLastMethod] = useState(null);

  useEffect(() => {
    setMessages((prev) =>
      prev.map((m) =>
        m.messageKey === "chat.welcome"
          ? { ...m, text: t("chat.welcome") }
          : m
      )
    );
  }, [language, t]);

  const addMessage = (msg) =>
    setMessages((prev) => [
      ...prev,
      { id: Date.now() + Math.random(), ...msg },
    ]);

  // גיבוי – שליחה דרך input הישן (לא בשימוש כרגע)
  // eslint-disable-next-line no-unused-vars
  const handleSend = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || isLoading) return;

    if (flowStep === "category" || flowStep === "method") return;

    addMessage({ type: "user", text: trimmed });
    setInputValue("");

    setDreamText(trimmed);
    setIsEditingDream(false);
    setLastCategory(null);
    setLastMethod(null);

    setPendingDreamText(trimmed);
    setSelectedCategoryId(null);
    setSelectedMethodId(null);
    setFlowStep("category");
  };

  // שליחה מתוך הכרטיס החדש
  const handleSendFromCard = async (textFromCard) => {
    const trimmed = (textFromCard || "").trim();
    if (!trimmed || isLoading) return;

    if (flowStep === "category" || flowStep === "method") return;

    // מצב 1 – כבר יש קטגוריה ושיטה → עדכון פירוש אחרון
    if (lastCategory && lastMethod) {
      setDreamText(trimmed);

      setIsLoading(true);
      setFlowStep("interpreting");

      addMessage({
        type: "system",
        text: t("chat.system.interpretingUpdated"),
        temp: true,
      });

      try {
        const response = await fetch(API_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            dreamText: trimmed,
            category: lastCategory,
            method: lastMethod,
            language,
          }),
        });

        const data = await response.json();

        setMessages((prev) => {
          const withoutTemp = prev.filter((m) => !m.temp);

          if (!response.ok || !data.interpretation) {
            return [
              ...withoutTemp,
              {
                id: Date.now() + Math.random(),
                type: "system",
                text:
                  data.error ||
                  t("chat.system.error.couldNotInterpret"),
              },
            ];
          }

          const updated = [...withoutTemp];
          const lastSystemIndexFromEnd = [...updated]
            .reverse()
            .findIndex((m) => m.type === "system");

          if (lastSystemIndexFromEnd === -1) {
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
              text: t("chat.system.error.generic"),
            },
          ];
        });
      } finally {
        setIsLoading(false);
        setFlowStep("idle");
        setIsEditingDream(false);
      }

      return;
    }

    // מצב 2 – פירוש חדש (אין קטגוריה/שיטה אחרונות)
    addMessage({ type: "user", text: trimmed });

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

    setLastCategory(selectedCategoryId);
    setLastMethod(methodId);

    addMessage({
      type: "system",
      text: t("chat.system.interpreting"),
      temp: true,
    });

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          dreamText: pendingDreamText,
          category: selectedCategoryId,
          method: methodId,
          language,
        }),
      });

      const data = await response.json();

      setMessages((prev) => prev.filter((m) => !m.temp));

      if (!response.ok || !data.interpretation) {
        addMessage({
          type: "system",
          text:
            data.error || t("chat.system.error.couldNotInterpret"),
        });
      } else {
        addMessage({
          type: "system",
          text: data.interpretation,
          title: data.title,
          methodUsed: data.methodUsed,
          tags: data.tags,
        });
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => prev.filter((m) => !m.temp));
      addMessage({
        type: "system",
        text: t("chat.system.error.generic"),
      });
    } finally {
      setIsLoading(false);
      setFlowStep("idle");
      setPendingDreamText("");
    }
  };

  // eslint-disable-next-line no-unused-vars
  const handleSendAgain = async () => {
    if (!dreamText.trim() || !lastCategory || !lastMethod || isLoading)
      return;

    setIsLoading(true);
    setFlowStep("interpreting");

    addMessage({
      type: "system",
      text: t("chat.system.interpretingUpdated"),
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
            dreamText: dreamText,
            category: lastCategory,
            method: lastMethod,
            language,
          }),
        }
      );

      const data = await response.json();

      setMessages((prev) => {
        const withoutTemp = prev.filter((m) => !m.temp);

        if (!response.ok || !data.interpretation) {
          return [
            ...withoutTemp,
            {
              id: Date.now() + Math.random(),
              type: "system",
              text:
                data.error ||
                t("chat.system.error.couldNotInterpret"),
            },
          ];
        }

        const updated = [...withoutTemp];
        const lastSystemIndexFromEnd = [...updated]
          .reverse()
          .findIndex((m) => m.type === "system");

        if (lastSystemIndexFromEnd === -1) {
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
            text: t("chat.system.error.generic"),
          },
        ];
      });
    } finally {
      setIsLoading(false);
      setFlowStep("idle");
      setIsEditingDream(false);
    }
  };

  // גיבוי – קיצור מקלדת ל-input הישן
  // eslint-disable-next-line no-unused-vars
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
            {/* מציגים רק הודעות system – בועות user מוסתרות */}
            {messages
              .filter((msg) => msg.type === "system")
              .map((msg) => (
                <div
                  key={msg.id}
                  className="message-bubble system"
                >
                  {msg.text}
                  {msg.tags && (
                    <TagsList
                      tags={msg.tags}
                      setTags={(updatedTags) => {
                        setMessages((prev) =>
                          prev.map((m) =>
                            m.id === msg.id
                              ? { ...m, tags: updatedTags }
                              : m
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

          <DreamInputCard onSend={handleSendFromCard} />

          {/* גיבוי – input ישן, לא בשימוש */}
          {/*
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
                  ? t("chat.input.placeholder.loading")
                  : t("chat.input.placeholder.default")
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
          */}

          <BottomNav
            currentScreen={currentScreen || "interpretation"}
            onChangeScreen={onChangeScreen}
            t={t}
          />
        </div>
      </div>
    </div>
  );
}

export default DreamChat;
