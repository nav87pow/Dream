// src/components/TermGate/TermGate.jsx
import React, { useState } from "react";
import NoConsentPage from "./NoConsentPage";

function TermGate({ onAccept }) {
  const [declined, setDeclined] = useState(false);

  // אם המשתמש/ת לחץ "אינני מסכים/ה" – עוברים למסך מידע בלבד
  if (declined) {
    return <NoConsentPage />;
  }

  return (
    <div className="terms-wrapper">
      <div className="terms-card">
   <h1>Terms of Use</h1>

<p>
Before using the dream analysis app, it is important to us that you understand the nature of the service:
</p>

<ul>
<li>
The service is experiential and creative only, and does not constitute therapeutic, medical or psychological advice.
</li>
<li>
Dreams are saved only on your device (in the browser), and are not saved on our server.
</li>
<li>
We do not guarantee the accuracy, completeness or specific result of the interpretation.
</li>
<li>
Use of the app is the sole responsibility of the user.
</li>
</ul>

    <p>
By clicking &quot;I accept the Terms of Use&quot; you acknowledge that you have read
and understood the terms, and agree to continue using the application.
</p>

        <div className="terms-actions">
          {/* זה הכפתור שצריך להעביר לצ'ט */}
          <button
            type="button"
            className="terms-button accept bg-violet-100"
            onClick={onAccept}
          >
I agree to the terms of use.          </button>

          {/* זה הכפתור שמוביל למסך "לא מסכים" */}
          <button
            type="button"
            className="terms-button decline"
            onClick={() => setDeclined(true)}
          >
I do not agree.          </button>
        </div>
      </div>
    </div>
  );
}

export default TermGate;
