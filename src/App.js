import React, { useEffect, useState } from "react";
import "./App.css";

import DreamChat from "./components/DreamChat";
import TermGate from "./components/TermGate/TermGate";
import Profile from "./components/Profile/Profile";
import { TranslationProvider } from "./TranslationContext";

function App() {
  const [dreams, setDreams] = useState(() => {
    try {
      const saved = localStorage.getItem("dreams");
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (error) {
      console.warn("Failed to load dreams:", error);
    }
    return [];
  });

  const [tosAccepted, setTosAccepted] = useState(false);
  const [checkedStorage, setCheckedStorage] = useState(false);

  // מסך נוכחי: interpretation / profile (ובהמשך אולי diary)
  const [screen, setScreen] = useState("interpretation");

  useEffect(() => {
    const stored = localStorage.getItem("tosAccepted");
    if (stored === "true") {
      setTosAccepted(true);
    }
    setCheckedStorage(true);
  }, []);

  const handleAccept = () => {
    localStorage.setItem("tosAccepted", "true");
    setTosAccepted(true);
  };

  const addDream = (newDream) => {
    const updated = [...dreams, newDream];
    setDreams(updated);
    localStorage.setItem("dreams", JSON.stringify(updated));
  };

  if (!checkedStorage) {
    return null;
  }

  return (
    <TranslationProvider>
      {!tosAccepted ? (
        <TermGate onAccept={handleAccept} />
      ) : screen === "profile" ? (
        <Profile
          currentScreen={screen}
          onChangeScreen={setScreen}
        />
      ) : (
        <DreamChat
          currentScreen={screen}
          onChangeScreen={setScreen}
          dreams={dreams}
          addDream={addDream}
        />
      )}
    </TranslationProvider>
  );
}

export default App;
