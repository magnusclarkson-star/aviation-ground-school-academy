// Dependency-free, deterministic opaque PNG icons for Android PWA install.
// Generated into dist-pages, not copied from any third-party aircraft artwork.
import {writeFile} from "node:fs/promises";
import {join} from "node:path";
import {deflateSync} from "node:zlib";

const PLANE=[
 [253,118],[269,118],[282,257],[396,310],[395,347],[280,305],
 [280,378],[312,397],[312,421],[260,407],[210,421],[210,397],
 [241,378],[241,305],[125,347],[124,310],[241,257]
];
function contains(px,py,points){
 let inside=false;
 for(let i=0,j=points.length-1;i<points.length;j=i++){
  const [xi,yi]=points[i],[xj,yj]=points[j];
  if(((yi>py)!==(yj>py))&&
    px<(xj-xi)*(py-yi)/(yj-yi)+xi)inside=!inside;
 }
 return inside;
}
function crc32(data){
 let crc=0xffffffff;
 for(const byte of data){
  crc^=byte;
  for(let b=0;b<8;b++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);
 }
 return (crc^0xffffffff)>>>0;
}
function chunk(type,body){
 const typeBytes=Buffer.from(type,"ascii"),size=Buffer.alloc(4),checksum=Buffer.alloc(4);
 size.writeUInt32BE(body.length,0);
 checksum.writeUInt32BE(crc32(Buffer.concat([typeBytes,body])),0);
 return Buffer.concat([size,typeBytes,body,checksum]);
}
function icon(size){
 const row=1+size*3,raw=Buffer.alloc(row*size);
 for(let y=0;y<size;y++){
  raw[y*row]=0;
  for(let x=0;x<size;x++){
   const px=(x+.5)*512/size,py=(y+.5)*512/size;
   const r=Math.hypot(px-260,py-260);
   const ring=r>=160&&r<=172;
   const plane=contains(px,py,PLANE);
   const col=plane?[229,242,247]:ring?[232,187,87]:[12,35,58];
   const at=y*row+1+x*3;
   raw[at]=col[0];raw[at+1]=col[1];raw[at+2]=col[2];
  }
 }
 const ihdr=Buffer.alloc(13);
 ihdr.writeUInt32BE(size,0);ihdr.writeUInt32BE(size,4);
 ihdr[8]=8;ihdr[9]=2; // Eight-bit truecolour, no alpha.
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),
  chunk("IHDR",ihdr),chunk("IDAT",deflateSync(raw,{level:9})),
  chunk("IEND",Buffer.alloc(0))]);
}
export async function createFlightSimIcons(directory){
 for(const n of [192,512])
  await writeFile(join(directory,"flight-sim-icon-"+n+".png"),icon(n));
}
