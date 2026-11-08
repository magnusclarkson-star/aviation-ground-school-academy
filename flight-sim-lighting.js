/* Device-only illustrative outside-lighting presets for fictional Academy scenery.
 * A visual choice, not actual time, cloud cover, visibility, weather, or flight rules.
 * The same preset is used by 2D Canvas and WebGL2, and never changes physics.
 */
(function(root){"use strict";
const palettes=Object.freeze({
 day:Object.freeze({
  label:"Daylight",sky2d:Object.freeze(["#175784","#78c4e0","#dceaf0"]),
  clouds:"#e0f4f4a1",hills:"#587e85",grass:Object.freeze(["#729576","#507c5c","#355f4b"]),
  skyLow:Object.freeze([.68,.82,.87]),skyHigh:Object.freeze([.055,.25,.43]),
  fog:Object.freeze([.60,.76,.82]),light:Object.freeze([1,1,1])
 }),
 golden:Object.freeze({
  label:"Warm evening",sky2d:Object.freeze(["#4a477b","#ee9b72","#f6c9a2"]),
  clouds:"#ffe4c2b8",hills:"#8b6675",grass:Object.freeze(["#a58d69","#746c55","#555c4c"]),
  skyLow:Object.freeze([.96,.75,.58]),skyHigh:Object.freeze([.28,.25,.47]),
  fog:Object.freeze([.87,.63,.52]),light:Object.freeze([1.12,.94,.80])
 }),
 dusk:Object.freeze({
  label:"Illustrated dusk",sky2d:Object.freeze(["#19284b","#6b668b","#b8a0a1"]),
  clouds:"#bac4df99",hills:"#505572",grass:Object.freeze(["#65737a","#3f5762","#293f4f"]),
  skyLow:Object.freeze([.56,.48,.59]),skyHigh:Object.freeze([.09,.15,.32]),
  fog:Object.freeze([.40,.42,.53]),light:Object.freeze([.59,.68,.84])
 })
});
function choose(id){return Object.prototype.hasOwnProperty.call(palettes,id)?palettes[id]:palettes.day;}
const api={choose,ids:Object.freeze(Object.keys(palettes))};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSAFlightLighting=api;
})(typeof window!=="undefined"?window:null);
