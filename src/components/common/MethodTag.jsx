import React from "react";

export default function MethodTag({ icon, label }) {
  return (
    <div
      className="inline-flex items-center border bg-white px-2 py-[6px]"
      style={{
        borderRadius: "0px", // לפי המוקאפ (אפשר לשנות אם יש רדיוס)
        borderWidth: "0.8px",
        borderColor: "var(--color-baby-blue-ice, #ABC4FF)",
        gap: "4px", // spec: icon-text gap 4px
      }}
    >
      <span
        className="text-[12px] leading-none"
        style={{ color: "var(--color-baby-blue-ice, #ABC4FF)" }}
        aria-hidden="true"
      >
        {icon}
      </span>

      <span className="text-[10px] font-medium tracking-[0.025rem] uppercase text-black">
        {label}
      </span>
    </div>
  );
}
