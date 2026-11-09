/* One shared fictional helipad set for WebGL and mobile 2D fallback.
 * Every object is fixed in world X/Z coordinates, so moving/turning the
 * helicopter changes real projected parallax rather than a scrolling decal.
 */
(function(root){"use strict";
const rings=Object.freeze([9,21]);
const hardstands=Object.freeze([
 Object.freeze({x:37,z:19,w:94,d:18,color:"#737e82"}),
 Object.freeze({x:93,z:35,w:46,d:105,color:"#64767b"}),
 Object.freeze({x:-148,z:88,w:52,d:54,color:"#64757c"})
]);
const referenceLines=Object.freeze([
 ...[-2,-1,0,1,2].flatMap(i=>[
  Object.freeze({ax:-75,az:60+i*22,bx:-38, bz:60+i*22,color:"#dce6d0"}),
  Object.freeze({ax:38,az:60+i*22,bx:75,bz:60+i*22,color:"#dce6d0"})
 ]),
 Object.freeze({ax:-74,az:40,bx:-74,bz:122,color:"#efd291"}),
 Object.freeze({ax:74,az:40,bx:74,bz:122,color:"#efd291"})
]);
const pylons=Object.freeze([
 {x:-53,z:55,height:5,color:"#edb958"},
 {x:53,z:55,height:5,color:"#77c7ea"},
 {x:-53,z:-55,height:5,color:"#edb958"},
 {x:53,z:-55,height:5,color:"#77c7ea"},
 {x:-85,z:137,height:7,color:"#edb958"},
 {x:85,z:137,height:7,color:"#77c7ea"}
].map(Object.freeze));
const buildings=Object.freeze([
 Object.freeze({x:-140,z:96,w:37,d:42,h:12,color:"#8298a5",roof:"#c8d6cf"}),
 Object.freeze({x:106,z:152,w:55,d:50,h:15,color:"#8b9da4",roof:"#dbd3b9"})
]);
const fence=Object.freeze(Array.from({length:13},(_,i)=>Object.freeze({
 x:-150+i*25,z:205,height:3.3
})));
function ringSegments(radius,segments=40){
 if(!(radius>0)||!Number.isInteger(segments)||segments<8||segments>128)
  throw Error("Invalid fixed heliport reference ring");
 return Array.from({length:segments},(_,i)=>{
  const a=i*2*Math.PI/segments,b=(i+1)*2*Math.PI/segments;
  return Object.freeze({ax:radius*Math.cos(a),az:radius*Math.sin(a),
   bx:radius*Math.cos(b),bz:radius*Math.sin(b)});
 });
}
const api=Object.freeze({rings,hardstands,referenceLines,pylons,buildings,fence,ringSegments});
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSAHelipadDetail=api;
})(typeof window!=="undefined"?window:null);
