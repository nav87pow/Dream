import React from "react";
import trans from "../../data/trans.json";

const fallbackT = (key) => trans[key] || key;

function BottomNav({ currentScreen, onChangeScreen, t }) {
  const translate = t || fallbackT;

  const items = [
    { id: "diary",         icon: "📓", labelKey: "chat.nav.diary" },
    { id: "interpretation", icon: "◯", labelKey: "chat.nav.interpretation" },
    { id: "profile",       icon: "👤", labelKey: "chat.nav.profile" },
  ];

  return (
    <nav className="bottom-nav">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`nav-item ${
            currentScreen === item.id ? "nav-item-active" : ""
          }`}
          onClick={() => onChangeScreen && onChangeScreen(item.id)}
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label">{translate(item.labelKey)}</span>
        </button>
      ))}
    </nav>
  );
}

export default BottomNav;
