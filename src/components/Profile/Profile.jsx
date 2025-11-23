// src/components/Profile.jsx
import React from "react";
import { useTranslation } from "../../TranslationContext";
import LanguageSwitcher from "../LanguageSwitcher/LanguageSwitcher";
import BottomNav from "../BottomNav/BottomNav";

function Profile({ currentScreen, onChangeScreen }) {
  const { t } = useTranslation();

  return (
    <div className="profile-screen">
      <header className="profile-header">
        <h1>{t("profile.title")}</h1>
        <LanguageSwitcher />
      </header>

      <p className="profile-subtitle">
        {t("profile.subtitle")}
      </p>

      <section className="profile-section">
        <h2>{t("profile.section.preferences")}</h2>
        <p>{t("profile.section.preferences.description")}</p>
      </section>

      {/* בהמשך אפשר להוסיף שדות אמיתיים של פרופיל, שמות, וכו' */}
      <BottomNav
        currentScreen={currentScreen}
        onChangeScreen={onChangeScreen}
        t={t}
      />
    </div>
  );
}

export default Profile;

