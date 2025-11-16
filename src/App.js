// src/App.js
import React, { useEffect, useState } from "react";
import "./App.css";

import TermGate from "./components/TermGate/TermGate";
import DreamChat from "./components/DreamChat";

function App() {
  // ברירת מחדל: עדיין לא קיבלנו הסכמה
  const [tosAccepted, setTosAccepted] = useState(false);
  // כדי לא להציג כלום עד שנסיים לבדוק localStorage
  const [checkedStorage, setCheckedStorage] = useState(false);

  useEffect(() => {
    // קורא פעם אחת כשאפליקציה נטענת
    const stored = localStorage.getItem("tosAccepted");
    if (stored === "yes") {
      setTosAccepted(true);
    }
    setCheckedStorage(true);
  }, []);

  const handleAccept = () => {
    // כשמשתמש מאשר תנאים
    localStorage.setItem("tosAccepted", "yes");
    setTosAccepted(true);
  };

  // עד שלא סיימנו לבדוק localStorage – לא מציגים כלום (מונע קפיצה מסך)
  if (!checkedStorage) {
    return null;
  }

  // אם המשתמש עדיין לא הסכים – מציגים את מסך תנאי השימוש
  if (!tosAccepted) {
    return <TermGate onAccept={handleAccept} />;
  }

  // אם המשתמש הסכים – מציגים את מסך הצ'ט
  return <DreamChat />;
}

export default App;
