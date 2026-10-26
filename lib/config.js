export const config = {
  demoMode: true,
  pricingIsExample: true,
  printPricePerCm2: 12,
  additionalFee: 3000,
  shirtPrices: { S: 35000, M: 35000, L: 38000, XL: 40000, XXL: 45000 },
  colors: [
    {name:'Putih', hex:'#f2f0e8'}, {name:'Hitam', hex:'#292b2b'},
    {name:'Navy', hex:'#28374c'}, {name:'Merah', hex:'#ae413a'},
    {name:'Hijau Tua', hex:'#354e40'}, {name:'Kuning', hex:'#e7bd51'}
  ],
};
export const sampleBriefs = [
  { id:'gowes', title:'Gowes Pagi', category:'KOMUNITAS', brief:'Kaos komunitas sepeda, gambar gunung sederhana, tulisan GOWES PAGI, warna hijau tua.', image:'/assets/design-gowes.png', prompt:'Vintage outdoor badge, simple mountain and bicycle, forest green and warm cream, bold readable typography GOWES PAGI, isolated graphic for DTF printing.' },
  { id:'kopi', title:'Kopi Dulu', category:'USAHA LOKAL', brief:'Desain kaos kedai kopi, gambar cangkir dengan matahari, gaya retro oranye, tulisan KOPI DULU.', image:'/assets/design-kopi.png', prompt:'Retro coffee shop graphic, warm burnt orange cup and rising sun, bold typography KOPI DULU, isolated graphic for DTF printing.' },
  { id:'main', title:'Main Bareng', category:'GAMING', brief:'Kaos rental PlayStation, controller dan bintang, tulisan MAIN BARENG, gaya playful biru.', image:'/assets/design-main.png', prompt:'Playful blue gaming controller with stars, bold typography MAIN BARENG, isolated graphic for DTF printing.' }
];
export const formatRupiah = n => new Intl.NumberFormat('id-ID', {style:'currency',currency:'IDR',maximumFractionDigits:0}).format(n);
