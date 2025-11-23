import React from "react";

export default function WaveAnimation({ state }) {
  return (
    <div className={`wave-animation wave-${state}`}>
      <div className="wave-bar" />
      <div className="wave-bar" />
      <div className="wave-bar" />
      <div className="wave-bar" />
    </div>
  );
}
