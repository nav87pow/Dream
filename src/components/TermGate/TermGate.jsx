// src/components/TermGate/TermGate.jsx
import React, { useState } from "react";
import NoConsentPage from "./NoConsentPage";

// ✨ תרגום
import { useTranslation } from "../../TranslationContext";
import LanguageSwitcher from "../LanguageSwitcher/LanguageSwitcher";

function TermGate({ onAccept }) {
  const [declined, setDeclined] = useState(false);

  // הוספה: שימוש בפונקציית התרגום
  const { t } = useTranslation();

  // אם המשתמש/ת לחץ "אינני מסכים/ה" – עוברים למסך מידע בלבד
  if (declined) {
    return <NoConsentPage />;
  }

  return (
    <div className="terms-wrapper">
      <div className="terms-card">
        <h1>{t("terms.title")}</h1>

        {/* בורר שפה – בלי לשנות את המבנה הקיים, רק מוסיפים שורה */}
        <LanguageSwitcher />

        <p>
          {t("terms.intro")}
        </p>

        <ul>
          <li>
            {t("terms.points.experientialOnly")}
          </li>
          <li>
            {t("terms.points.localStorageOnly")}
          </li>
          <li>
            {t("terms.points.noGuarantee")}
          </li>
          <li>
            {t("terms.points.userResponsibility")}
          </li>
        </ul>

        <p>
          {t("terms.consentNote")}
        </p>

        <div className="terms-actions">
          {/* זה הכפתור שצריך להעביר לצ'ט */}
          <button
            type="button"
            className="terms-button accept bg-violet-100"
            onClick={onAccept}
          >
            {t("terms.buttons.accept")}
          </button>

          {/* זה הכפתור שמוביל למסך "לא מסכים" */}
          <button
            type="button"
            className="terms-button decline"
            onClick={() => setDeclined(true)}
          >
            {t("terms.buttons.decline")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TermGate;
