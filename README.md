# SablonAI

**Dari Cerita Jadi Karya** — "From a story into a creation."

SablonAI is a web store and design studio for a real DTF (Direct-to-Film) t-shirt printing shop in Indonesia, built for the **Meta Global AI Developer Hackathon 2026** (indie track, theme **Build for Your World**).

**Live demo: https://sablon-ai-omega.vercel.app** — the Meta Model API is live in production.

## The problem

My customers order custom shirts through chat. They arrive with a story or an idea — never with print-ready artwork — and they can't picture how a design will look on a real shirt. Print size, position, and the final result are all guesswork, which means endless back-and-forth and designs that miss expectations.

## What SablonAI does

Customers can order ready-made designs from the shop's real collection, or design their own shirt and preview the result **on a rotatable 3D shirt** and **on a photo mockup of the shop's actual shirt**, where the design follows the fabric instead of looking pasted on. Print sizes follow **real centimeters**, prices are the **shop's real prices**, and checkout runs through **WhatsApp** — the channel my customers already use.

## Features

- **Home** — hero shirt with clickable colors (the shirt in the photo actually changes color), how-to-order, WhatsApp CTA; Indonesian / English toggle.
- **Collection** — 8 real products from the shop as marketplace-style cards (Wortel Balap, Nemuraa, Brainwash, Terlanjur Basah, Sabila Sayur, Baby Painter, Denjaka 999, Kucing Meme), each customizable or addable to cart.
- **Studio DIY**
  - 3D viewer (Three.js): front and back, camera follows the side being edited.
  - Photo view: the shop's real shirt photo; artwork blends with fabric folds and shading.
  - Real-cm print sizes with print-area guides: 10×10, 10×15, A5 (15×20), A4 (21×28), A3 (32×42); front and back sides, each independently on/off.
  - Design sources: **AI Generate**, upload, gallery & stock photos (Pexels/Pixabay), text (including curved/circular text), graphic elements & templates.
  - Arrange mode: drag, scale, and rotate the design directly on the shirt, in both 3D and photo view; an outline always matches the design's true size and position.
  - Save/open designs (IndexedDB), download the mockup as PNG, add to cart.
- **Cart & checkout** — buyer form with Indonesian WhatsApp number validation; the order is stored and a prefilled order summary opens in WhatsApp to the shop.
- **Orders** — tracking page with statuses: Diproses → Dicek → Produksi → Dikirim → Diterima (Processing → Checking → Production → Shipped → Delivered).

## Meta AI pipeline

One flow in the Studio's AI Generate tab, integrated server-side via `app/api/meta` (the API key lives only in an environment variable, never in the browser):

1. **Muse Spark 1.3** turns the customer's plain-language story into a detailed image prompt.
2. **Muse Image 1.0** generates the artwork; a fixed server-side instruction enforces a fully transparent background so the result is print-ready.
3. **SAM 3.1** removes backgrounds from design images so artwork sits cleanly on the shirt.

If the API is unavailable, the app automatically falls back to a demo mode with sample designs, so the store never breaks.

## Real shop prices (IDR)

| Item | Price |
|---|---|
| Short sleeve S–XL | 50,000 (+10,000 per extra X) |
| Long sleeve S–XL | 60,000 (+10,000 per extra X) |
| Hoodie (all size) | 100,000 |
| Totebag | 25,000 |
| Kids XS–XL | 40,000 (XXL 45,000) |

Print per side: 10×10 = 10,000 · 10×15 = 15,000 · A5 = 20,000 · A4 = 30,000 · A3 = 40,000. Total = product + front print + back print.

## Tech stack

Next.js (App Router) + React, Three.js for the 3D viewer, Tailwind CSS, Meta Model API (OpenAI-compatible endpoint), Vercel hosting, IndexedDB for orders and saved designs.

## Run locally

```bash
npm install
npm run dev        # http://127.0.0.1:3000
```

Environment variables (`.env.local`, never commit real keys):

```
META_API_KEY=           # your Meta Model API key
META_LIVE_ENABLED=true  # enable live Meta calls
PEXELS_API_KEY=         # optional, for the Stock tab
PIXABAY_API_KEY=        # optional, for the Stock tab
```

Without a key, the app runs in demo mode. Tests: `npm test` (38 tests) · Production build: `npm run build`.

## Credits

- 3D shirt model `public/models/white-tee.glb` by **hasar** (Sketchfab), licensed **CC-BY-4.0**; attribution is also shown in the 3D viewer.
- Stock photos via Pexels / Pixabay APIs.

## About this build

Built during the hackathon window (27 Oct – 5 Nov 2026) by **DamantaraStudio** — a solo DTF print shop owner with no IT background, directing AI coding assistants (Muse and Codex) to build the store he actually needed. Submitted to the Meta Global AI Developer Hackathon 2026.
