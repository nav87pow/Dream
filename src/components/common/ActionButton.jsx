import React from "react";

export default function ActionButton({ icon, children, variant = "outline", onClick }) {
  const base =
    "w-full inline-flex items-center justify-center px-3 py-2 border rounded-md";

  const variants = {
    outline:
      "bg-[#FFFEFD] border-[var(--color-pink-600)] text-neutral-900",
    primary:
      "bg-[var(--color-pink-600)] border-[var(--color-pink-600)] text-white",
  };

  return (
    <button
      type="button"
      className={[base, variants[variant] || variants.outline].join(" ")}
      onClick={onClick}
      style={{ gap: "8px" }} // spec: area 14 gap 8px
    >
      {icon ? (
        <span className="text-[12px]" aria-hidden="true">
          {icon}
        </span>
      ) : null}
      <span className="text-[12px] font-normal leading-[1.62]">{children}</span>
    </button>
  );
}
