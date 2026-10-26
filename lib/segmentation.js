import sharp from 'sharp';
import { decodeMaskToRaster, recordsOfKind } from '@meta-sam/parser';

export async function cutOutWithMasks(imageBuffer, result) {
  if(result.outcome.status!=='completed' || result.diagnostics.some(d=>d.severity==='error')) throw new Error('SAM tidak menyelesaikan mask yang valid.');
  const masks=recordsOfKind(result.records,'mask');
  if(!masks.length) throw new Error('Objek tidak ditemukan. Coba nama objek yang lebih spesifik.');
  const {data,info}=await sharp(imageBuffer,{limitInputPixels:12000000}).rotate().ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const alpha=new Uint8Array(info.width*info.height);
  for(const record of masks) {
    const {left,top,right,bottom}=record.bounds;
    const w=right-left,h=bottom-top;
    if(!Number.isInteger(w)||!Number.isInteger(h)||w<1||h<1||w>info.width||h>info.height) throw new Error('Dimensi mask SAM tidak sesuai gambar.');
    const raster=decodeMaskToRaster(record.mask);
    const expanded=await sharp(Buffer.from(raster.map(v=>v?255:0)),{raw:{width:record.mask.width,height:record.mask.height,channels:1}}).resize(w,h,{kernel:'nearest'}).greyscale().raw().toBuffer();
    for(let y=0;y<h;y++) for(let x=0;x<w;x++) {
      const px=left+x,py=top+y;
      if(px>=0&&px<info.width&&py>=0&&py<info.height) alpha[py*info.width+px]=Math.max(alpha[py*info.width+px],expanded[y*w+x]);
    }
  }
  for(let i=0;i<alpha.length;i++) data[i*4+3]=Math.round(data[i*4+3]*alpha[i]/255);
  return sharp(data,{raw:info}).png().toBuffer();
}
