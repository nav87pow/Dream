// src/TranslationContext.jsx
import React, {
  createContext,
  useContext,
  useState,
  useMemo,
  useCallback,
} from "react";
import baseTrans from "./data/trans.json";

const TranslationContext = createContext(null);
const DEFAULT_LANG = "en";

// ⭐ הכתובת של השרת – כאן משתמשים בפועל ולכן אין warning
//const API_URL = "http://localhost:4000";
// ⭐ השרת ברנדר – בסיס אחד בלי /api כפול
const API_URL = "https://dream-eyyq.onrender.com";

export function TranslationProvider({ children }) {
  const [language, setLanguage] = useState(DEFAULT_LANG);
  const [dynamicTranslations, setDynamicTranslations] = useState({});

  // ⭐ פונקציה שמביאה תרגומים מהשרת
  const loadLanguage = useCallback(
    async (newLang) => {
      setLanguage(newLang);

      // אנגלית – לא צריך תרגום מהשרת
      if (newLang === DEFAULT_LANG) return;

      // אם כבר טענו קודם את השפה הזו – לא נטען שוב
      if (dynamicTranslations[newLang]) return;

      try {
        // ⭐ בוחרים רק מפתחות שרוצים לתרגם
        const keysToTranslate = Object.keys(baseTrans).filter((key) => {
          // methods.* – רק label נשלח לתרגום, לא טקסטים ארוכים
          if (key.startsWith("methods.")) {
            return key.endsWith(".label");
          }

          return (
            key === "settings.language.label" ||
            key.startsWith("terms.") ||
            key.startsWith("noConsent.") ||
            key.startsWith("chat.") ||
            key.startsWith("categoryStep.") ||
            key.startsWith("interpretationCategories.") ||
            key.startsWith("tags.")
          );
        });

        const response = await fetch(`${API_URL}/api/translate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            targetLanguage: newLang,
            sourceLanguage: DEFAULT_LANG,
            texts: keysToTranslate.map((key) => ({
              key,
              text: baseTrans[key],
            })),
          }),
        });

        if (!response.ok) {
          console.error("Failed to load translations:", response.status);
          return;
        }

        const data = await response.json();

        setDynamicTranslations((prev) => ({
          ...prev,
          [newLang]: data.translations || {},
        }));
      } catch (err) {
        console.error("Translation fetch error:", err);
      }
    },
    [dynamicTranslations]
  );

  // ⭐ פונקציית תרגום עם placeholders {{var}}
  const t = useCallback(
    (key, vars = {}) => {
      let text;

      // קודם מנסים תרגום דינמי מהשרת
      if (language !== DEFAULT_LANG) {
        const map = dynamicTranslations[language];
        if (map && map[key]) {
          text = map[key];
        }
      }

      // אם אין – נופלים ל-trans.json המקורי
      if (!text) {
        text = baseTrans[key] || key;
      }

      // מחליפים placeholders בצורה פשוטה: {{varName}}
      Object.entries(vars).forEach(([varName, value]) => {
        text = text.replace(`{{${varName}}}`, String(value));
      });

      return text;
    },
    [language, dynamicTranslations]
  );

  // ⭐ value יציב לקונטקסט
  const value = useMemo(
    () => ({
      language,
      // setLanguage ההיסטורי – בפועל משנה שפה דרך loadLanguage
      setLanguage: loadLanguage,
      loadLanguage,
      t,
      dynamicTranslations,
      setDynamicTranslations,
    }),
    [language, loadLanguage, t, dynamicTranslations]
  );

  return (
    <TranslationContext.Provider value={value}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(TranslationContext);
  if (!ctx) {
    throw new Error(
      "useTranslation must be used inside <TranslationProvider>."
    );
  }
  return ctx;
}

export default TranslationContext;
