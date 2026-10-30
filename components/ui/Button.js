"use client";
// Tombol seragam Stage 1. Memakai kelas .primary/.secondary yang sudah
// ada di globals.css, supaya tampilannya tidak berubah dari yang
// sudah lolos build; Tailwind hanya untuk layout kecil di dalamnya.
export default function Button({ variant = "primary", className = "", children, ...props }) {
  const cls = variant === "secondary" ? "secondary" : "primary";
  return (
    <button className={`${cls} ${className}`} {...props}>
      {children}
    </button>
  );
}
