import { config } from './config.js';
export function calculatePrice({size, width, height, quantity = 1}) {
  if (!Object.hasOwn(config.shirtPrices, size)) throw new Error('Ukuran kaos tidak valid.');
  if (![width,height,quantity].every(Number.isFinite) || width < 1 || width > 32 || height < 1 || height > 45 || quantity < 1 || quantity > 100 || !Number.isInteger(quantity)) throw new Error('Ukuran cetak atau jumlah tidak valid.');
  const area = Math.round(width * height * 100) / 100;
  const shirt = config.shirtPrices[size];
  const print = Math.round(area * config.printPricePerCm2);
  const extra = config.additionalFee;
  return {area,shirt,print,extra,unit:shirt+print+extra,total:(shirt+print+extra)*quantity,quantity};
}
