// src/components/DreamChat.jsx
import React, { useState, useEffect } from "react";
import CategoryStep from "./categories/CategoryStep";
import TagsList from "./tags/TagsList";
import EditableUserBubble from "./EditableUserBubble";
import BottomNav from "./BottomNav/BottomNav";
import { useTranslation } from "../TranslationContext";
import DreamInputCard from "./DreamInputCard/DreamInputCard";
// כתובת השרת שמדבר עם Groq (מקומי)
//const API_URL = "http://localhost:4000/api/interpret";
// כשתרצה לעבוד מול Render:
 const API_URL = "https://dream-eyyq.onrender.com/api/interpret";

function DreamChat({ currentScreen, onChangeScreen }) {
  // ⭐ לוקחים גם t וגם language מהקונטקסט
  const { language, t } = useTranslation();

  const [inputValue, setInputValue] = useState("");

  // הודעת ברוך הבא – שומרת key כדי שנוכל לעדכן כשמשנים שפה
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

  // טקסט החלום האחרון של המשתמש (לעריכה בבועה)
  const [dreamText, setDreamText] = useState("");

  // האם הבועה כרגע במצב עריכה?
  const [isEditingDream, setIsEditingDream] = useState(false);

  // שמירת הבחירה האחרונה של קטגוריה ושיטה (ל-send again)
  const [lastCategory, setLastCategory] = useState(null);
  const [lastMethod, setLastMethod] = useState(null);

  // ⭐ אם השפה משתנה – מעדכן את הודעת ה-welcome לפי t()
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
  // שליחה דרך הכרטיס החדש (DreamInputCard) בלי לפגוע ב-input הישן
   // שליחה דרך הכרטיס החדש (DreamInputCard)
  // אם כבר יש lastCategory + lastMethod → נתנהג כמו "send again"
  // אם אין → נפתח בחירת קטגוריה/שיטה כמו ב-handleSend הרגיל
  const handleSendFromCard = async (textFromCard) => {
    const trimmed = (textFromCard || "").trim();
    if (!trimmed || isLoading) return;

    if (flowStep === "category" || flowStep === "method") return;

    // 🔁 מצב 1 – יש כבר קטגוריה ושיטה אחרונות → עדכון פירוש קיים
    if (lastCategory && lastMethod) {
      // נסנכרן את הסטייט של החלום לערך החדש מהכרטיס
      setDreamText(trimmed);

      setIsLoading(true);
      setFlowStep("interpreting");

      // הודעת ביניים זמנית – כמו ב-handleSendAgain
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
            // במקרה של שגיאה – נוסיף הודעת system חדשה
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

          // כמו ב-handleSendAgain: מעדכן את הפירוש האחרון במקום ליצור חדש
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

      // חשוב: במצב הזה אנחנו *לא* פותחים שוב בחירת קטגוריה
      return;
    }

    // 🆕 מצב 2 – אין עוד קטגוריה/שיטה → כמו handleSend הרגיל (חלום חדש)
    addMessage({ type: "user", text: trimmed });

    // כאן אנחנו לא נוגעים ב-inputValue כי זה השדה הישן
    // setInputValue("");

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
          language, // ⭐ שולחים גם שפה לשרת
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
          tags: data.tags, // 👈 זה מה שמאפשר ל־TagsList לעבוד
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

  // פירוש חדש בהתאם לעריכה של החלום בבועה
  const handleSendAgain = async () => {
    if (!dreamText.trim() || !lastCategory || !lastMethod || isLoading) return;

    setIsLoading(true);
    setFlowStep("interpreting");

    // הודעת "ביניים" זמנית
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
            dreamText: dreamText, // הטקסט המעודכן בבועת המשתמש
            category: lastCategory,
            method: lastMethod,
            language, // ⭐ גם כאן שולחים שפה
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
                t("chat.system.error.couldNotInterpret"),
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
          // אם אין הודעת system – נוסיף חדשה כ־fallback
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
                      // אפשר בהמשך להעביר גם t אם צריך
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
                      // גם כאן אפשר להעביר t אם צריך
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
              // אם תרצה – אפשר להוסיף כאן t ולהשתמש בו בתוך הקומפוננטה
            />
          )}
<DreamInputCard onSend={handleSendFromCard} />
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

          <BottomNav
            currentScreen={currentScreen || "interpretation"}
            onChangeScreen={onChangeScreen}
            t={t} // ⭐ התרגום של הניווט בא מהקונטקסט
          />
        </div>
      </div>
    </div>
  );
}

export default DreamChat;
