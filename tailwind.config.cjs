/** @type {import('tailwindcss').Config} */
// Stage 1: token warna dari globals.css yang sudah ada.
// Token warna diambil dari globals.css PC yang sudah ada (1756 baris):
// bg #f8f9f5, ink #26362a, muted #889083, line #e8ebe3,
// olive #526a3e, olive-dark #344c29, soft #eff3e9, focus #b17a41.
// Catatan: globals.css lama dipertahankan dulu, Tailwind ditambahkan
// bertahap di komponen baru, bukan rewrite 1756 baris sekaligus —
// rewrite penuh berisiko merusak tampilan yang sudah lolos build.
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        paper: "var(--paper)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        line: "var(--line)",
        olive: "var(--olive)",
        "olive-dark": "var(--olive-dark)",
        soft: "var(--soft)",
        navy: "var(--navy)",
        "accent-mid": "var(--accent-mid)",
        pale: "var(--accent-pale)",
        violet: "var(--violet)",
        focus: "#3442CA",
      },
      fontFamily: {
        sans: ['"DM Sans"', "Arial", "sans-serif"],
        display: ['"Manrope"', "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};
