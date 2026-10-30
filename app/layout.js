import "./globals.css";
import "./tailwind.css";
export const metadata = {
  title: "SablonAI — Dari cerita jadi karya",
  description:
    "Studio desain kaos DTF. Ceritakan ide, edit desain, lihat mockup dan hitung harga.",
};
export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
