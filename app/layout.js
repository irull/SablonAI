import "./globals.css";
import "./tailwind.css";
export const metadata = {
  title: "SablonAI — Dari cerita jadi karya",
  description:
    "Studio desain kaos DTF. Ceritakan ide, edit desain, lihat mockup dan hitung harga.",
};
export default function RootLayout({ children }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{var t=localStorage.getItem('sablonai.theme');if(t==='dark'){document.documentElement.dataset.theme='dark';}var l=localStorage.getItem('sablonai.lang');if(l==='en'){document.documentElement.lang='en';}}catch(e){}",
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
