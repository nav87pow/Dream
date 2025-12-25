import React from "react";

export default function CategoryTag({ icon, label }) {
  return (
    <div
      className={[
        "inline-flex items-center",
        "rounded-[0.25rem_0] border",
        "bg-white",
        "shadow-[4px_4px_0_0_var(--color-pink-200)]",
        "border-[var(--color-pink-200)]",
        "px-3 py-2",
      ].join(" ")}
      style={{ gap: "6px" }} // spec: icon-text gap 6px
    >
      <span
        className="text-[18px] leading-none"
        style={{ color: "var(--color-pink-400)" }}
        aria-hidden="true"
      >
        {icon}
      </span>

      <span className="text-[16px] font-medium text-neutral-900 capitalize">
        {label}
      </span>
    </div>
  );
}
