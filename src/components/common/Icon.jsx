import React from "react";
export default function Icon({ name, size = 24, filled = false, className = "" }) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{
        fontSize: size,
        fontVariationSettings: `"FILL" ${filled ? 1 : 0}, "wght" 400, "GRAD" 0, "opsz" 24`
      }}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}
