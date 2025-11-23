// src/components/LanguageSwitcher.jsx
import React from "react";
import { useTranslation } from "../../TranslationContext";

function LanguageSwitcher() {
  const { language, loadLanguage, t } = useTranslation();

const handleChange = (e) => {
  const newLang = e.target.value;
  loadLanguage(newLang);
    // כאן בעתיד אפשר:
    // 1. לקרוא לשרת שיביא תרגומים מ-Groq
    // 2. לשמור אותם ב-setDynamicTranslations(newLang, mapFromServer)
  };

  return (
    <div className="language-switcher">
      <label className="language-label">
        {t("settings.language.label")}
      </label>

      <select
        className="language-select"
        value={language}
        onChange={handleChange}
      >
        {/* ⭐ כל השפות שביקשת */}
<option value="en">English</option>
<option value="he">עברית</option>
<option value="hu">Magyar (Hungarian)</option>
<option value="pt">Português (Portuguese)</option>
<option value="es">Español (Spanish)</option>
<option value="ro">Română (Romanian)</option>
<option value="de">Deutsch (German)</option>
<option value="it">Italiano (Italian)</option>
<option value="fr">Français (French)</option>
<option value="et">Eesti (Estonian)</option>
<option value="ru">Русский (Russian)</option>
<option value="uk">Українська (Ukrainian)</option>
<option value="ar">العربية (Arabic)</option>
<option value="pl">Polski (Polish)</option>
<option value="is">Íslenska (Icelandic)</option>
<option value="el">Ελληνικά (Greek)</option>
<option value="cs">Čeština (Czech)</option>
<option value="no">Norsk (Norwegian)</option>
<option value="fi">Suomi (Finnish)</option>
<option value="sv">Svenska (Swedish)</option>
<option value="ja">日本語 (Japanese)</option>

      </select>
    </div>
  );
}

export default LanguageSwitcher;
