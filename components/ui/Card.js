"use client";
// Kartu seragam Stage 1, memakai kelas .card yang sudah ada.
export default function Card({ className = "", children, ...props }) {
  return (
    <section className={`card ${className}`} {...props}>
      {children}
    </section>
  );
}
