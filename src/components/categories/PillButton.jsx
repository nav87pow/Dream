import React from "react";

function PillButton({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-4 py-2 rounded-full border border-gray-300 bg-white text-sm mr-2 mb-2 hover:bg-gray-50"
    >
      {children}
    </button>
  );
}

export default PillButton;
