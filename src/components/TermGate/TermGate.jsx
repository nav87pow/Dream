import React, { useState } from "react";
import NoConsentPage from "./NoConsentPage";
import WelcomePage from "../Welcome/WelcomePage";

function TermGate({ onAccept }) {
  const [declined, setDeclined] = useState(false);

  if (declined) {
    return <NoConsentPage />;
  }

  return (
    <WelcomePage
      onContinue={onAccept}
      onDecline={() => setDeclined(true)}
      onLearnMore={() => {
        // TODO: route to future methods overview page
        console.log("Learn more - not implemented yet");
      }}
      onInstall={() => {
        // TODO: trigger PWA install flow when you implement it
        console.log("Install - not implemented yet");
      }}
    />
  );
}

export default TermGate;
