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
              "try{var l=localStorage.getItem('sablonai.lang');if(l==='en'){document.documentElement.lang='en';}}catch(e){}",
          }}
        />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Anton&family=Bebas+Neue&family=DM+Sans:wght@400;500;700&family=Dancing+Script:wght@600;700&family=Lobster&family=Manrope:wght@600;700;800&family=Montserrat:wght@500;700;800&family=Oswald:wght@500;600;700&family=Pacifico&family=Playfair+Display:ital,wght@0,700;1,600&family=Poppins:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
