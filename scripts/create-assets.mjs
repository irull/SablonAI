import sharp from "sharp";
import { writeFileSync } from "node:fs";
const path =
  "M226 115 L326 77 Q400 125 474 77 L574 115 L678 231 L595 309 L550 264 L558 624 Q400 648 242 624 L250 264 L205 309 L122 231 Z";
const head = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="740" viewBox="0 0 800 740">`;
const shirt = `${head}<defs><linearGradient id="base" x1="0" x2="1"><stop stop-color="#c9c8c3"/><stop offset=".22" stop-color="#f7f6f1"/><stop offset=".45" stop-color="#e7e6e1"/><stop offset=".63" stop-color="#faf9f5"/><stop offset=".84" stop-color="#e5e4df"/><stop offset="1" stop-color="#c9c8c3"/></linearGradient><filter id="shadow"><feGaussianBlur stdDeviation="14"/></filter><filter id="fold"><feGaussianBlur stdDeviation="7"/></filter><filter id="noise"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="3" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".09"/></feComponentTransfer></filter><clipPath id="shirt"><path d="${path}"/></clipPath></defs><path d="${path}" fill="#252c24" opacity=".17" transform="translate(0 16)" filter="url(#shadow)"/><path d="${path}" fill="url(#base)" stroke="#c9c8c2" stroke-width="2"/><g clip-path="url(#shirt)"><g filter="url(#fold)" fill="none" stroke-linecap="round"><path d="M274 199 Q300 333 278 566" stroke="#888a84" opacity=".23" stroke-width="16"/><path d="M526 199 Q491 338 530 587" stroke="#777a73" opacity=".2" stroke-width="17"/><path d="M338 164 Q348 296 330 462 T339 622" stroke="#fff" opacity=".55" stroke-width="18"/><path d="M455 211 Q445 344 465 424 T453 611" stroke="#96978f" opacity=".15" stroke-width="12"/><path d="M253 581 Q398 564 551 598" stroke="#b4b5ad" opacity=".22" stroke-width="9"/></g><rect width="800" height="740" filter="url(#noise)" opacity=".35"/></g><path d="M326 77 Q400 133 474 77 L466 98 Q400 151 334 98 Z" fill="#c6c7bf"/><path d="M330 82 Q400 139 470 82" fill="none" stroke="#f8f7f2" stroke-width="5"/><path d="M244 612 Q400 633 556 612 M139 233 L206 294 M594 294 L662 233" fill="none" stroke="#c1c2ba" stroke-width="2" opacity=".7"/><rect x="383" y="116" width="34" height="17" rx="2" fill="#eeede7"/><text x="400" y="128" text-anchor="middle" font-size="7" font-family="sans-serif" fill="#777">SABLONAI</text></svg>`;
writeFileSync("public/assets/mockup-placeholder.svg", shirt);
await sharp(Buffer.from(shirt))
  .flatten({ background: "#ffffff" })
  .jpeg({ quality: 96 })
  .toFile("public/assets/mockup-kaos-putih.jpg");
await sharp(Buffer.from(`${head}<path d="${path}" fill="white"/></svg>`))
  .png()
  .toFile("public/assets/mockup-kaos-mask.png");
const base = (body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="900" viewBox="0 0 800 900">${body}</svg>`;
const art = [
  [
    "gowes",
    base(
      `<g fill="#284f3f"><path d="M122 390 L302 155 L401 292 L488 204 L682 390 Z"/><path d="M278 187 L303 155 L400 292 L351 268 L320 284 L296 239 L259 254 Z M463 240 L488 204 L559 300 L518 282 L493 289 Z" fill="#eed8a4"/><path d="M105 409 Q400 329 695 409 L695 434 Q400 360 105 434Z"/><circle cx="210" cy="515" r="73" fill="none" stroke="#284f3f" stroke-width="17"/><circle cx="575" cy="515" r="73" fill="none" stroke="#284f3f" stroke-width="17"/><path d="M210 515 L322 401 L391 515 L210 515 L292 372 M391 515 L490 401 L575 515 M464 372 L503 372 M276 371 L315 371" fill="none" stroke="#284f3f" stroke-width="15" stroke-linecap="round"/><text x="400" y="699" text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="106" letter-spacing="-5">GOWES</text><text x="400" y="795" text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="112" letter-spacing="16">PAGI</text><text x="400" y="853" text-anchor="middle" font-family="Arial,sans-serif" font-size="23" letter-spacing="6">PELAN PELAN • SAMPAI TUJUAN</text></g>`,
    ),
  ],
  [
    "kopi",
    base(
      `<g fill="#b95230"><circle cx="400" cy="310" r="170" fill="#e7b65d"/><path d="M180 342 H548 V438 Q548 592 364 592 Q180 592 180 438Z"/><path d="M548 368 H590 Q703 368 650 485 Q625 534 548 512" fill="none" stroke="#b95230" stroke-width="32"/><path d="M299 280 Q250 220 310 168 M407 282 Q357 222 417 167" fill="none" stroke="#b95230" stroke-width="19" stroke-linecap="round"/><path d="M157 616 H645" stroke="#b95230" stroke-width="16"/><text x="400" y="737" text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="112">KOPI DULU</text><text x="400" y="796" text-anchor="middle" font-family="Arial,sans-serif" font-size="26" letter-spacing="7">BARU LANJUT LAGI</text></g>`,
    ),
  ],
  [
    "main",
    base(
      `<g fill="#385d9b"><path d="M250 254 Q161 253 142 372 L105 514 Q89 608 169 611 L298 510 H502 L631 611 Q711 608 695 514 L658 372 Q639 253 550 254Z"/><path d="M240 330 V443 M183 387 H297" stroke="#efe5be" stroke-width="27" stroke-linecap="round"/><circle cx="551" cy="352" r="21" fill="#efe5be"/><circle cx="601" cy="402" r="21" fill="#efe5be"/><path d="M400 101 L417 150 L472 151 L429 185 L444 239 L400 208 L356 239 L371 185 L328 151 L383 150Z" fill="#dc8e44"/><text x="400" y="730" text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="110">MAIN</text><text x="400" y="828" text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="104">BARENG</text></g>`,
    ),
  ],
];
for (const [name, svg] of art) {
  writeFileSync(`public/assets/design-${name}.svg`, svg);
  await sharp(Buffer.from(svg))
    .png()
    .toFile(`public/assets/design-${name}.png`);
}
// A white-background logo for repeatable upload/cut-out QA.
await sharp("public/assets/design-kopi.png")
  .flatten({ background: "#ffffff" })
  .jpeg()
  .toFile("public/assets/upload-demo.jpg");
console.log(
  "Created one synthetic shirt + alpha mask and 3 original demo graphics. These are placeholders, not Meta outputs.",
);
