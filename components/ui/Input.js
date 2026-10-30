"use client";
// Input seragam Stage 1. Label + input, gaya mengikuti input yang
// sudah ada di globals.css (font inherit, focus outline).
export default function Input({ label, id, className = "", ...props }) {
  return (
    <label className="field-label" htmlFor={id}>
      {label}
      <input id={id} className={className} {...props} />
    </label>
  );
}
