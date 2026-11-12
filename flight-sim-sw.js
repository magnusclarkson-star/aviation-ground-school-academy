// Static simulator shell and its local flight assets only. No credentials,
// payment data, location, or remote services are cached.
const CACHE="agsa-flight-sim-v2-20261112-fighter-load1";
const ROOT=new URL("./",self.location.href);
const SHELL=[
 new URL("flight-sim.html",ROOT).href,
 new URL("flight-sim-icon-192.png",ROOT).href,
 new URL("flight-sim-icon-512.png",ROOT).href
];
// Imported aircraft are fetched asynchronously after the page starts and
// might not otherwise be cached on the very first (uncontrolled) visit.
const IMPORTED_AIRCRAFT=[
 "assets/aircraft/c172-molen-skyhawk.glb",
 "assets/aircraft/r44-molen-raven-ii.glb",
 "assets/aircraft/c172-e737-optimized.glb",
 "assets/aircraft/f22-fguk-exterior.json",
 "assets/aircraft/f35b-fg-exterior.json",
 "assets/aircraft/r44-flightgear.ac",
 "assets/aircraft/r44-flightgear-texture.png"
];
const GALLERY_PHOTOS=[
 "aircraft-c172.webp","aircraft-r44.webp","aircraft-fa18.webp",
 "aircraft-f22.webp","aircraft-f35.webp","aircraft-typhoon.webp",
 "aircraft-su37.webp"
];
function shouldCache(request){
 if(request.method!=="GET")return false;
 const url=new URL(request.url);
 if(url.origin!==ROOT.origin||!url.pathname.startsWith(ROOT.pathname))return false;
 const relative=url.pathname.slice(ROOT.pathname.length);
 if(relative.includes("..")||relative.startsWith("services/")||
    relative.startsWith("api/"))return false;
 return relative==="flight-sim.html"||relative==="flight-sim-manifest.json"||
  relative==="academy-brand.js"||relative.startsWith("flight-sim")||
  relative.startsWith("aircraft-")||relative.startsWith("assets/aircraft/");
}
async function precacheFlightAssets(cache){
 const page=await cache.match(SHELL[0]);
 if(!page)throw Error("Cannot cache flight simulator entry page");
 const markup=await page.text();
 // Parse only fixed, local HTML src/href references. Never crawl arbitrary
 // links or fetch third-party sites during service worker installation.
 const linked=[...markup.matchAll(/\b(?:src|href)\s*=\s*["']([^"']+)["']/gi)]
  .map(match=>match[1]);
 const urls=new Set();
 for(const entry of [...linked,...IMPORTED_AIRCRAFT,...GALLERY_PHOTOS]){
  try{
   const url=new URL(entry,ROOT).href;
   if(shouldCache(new Request(url))&&!SHELL.includes(url))urls.add(url);
  }catch{}
 }
 // Limit parallel downloads on a modest Android connection rather than
 // requesting every script, stylesheet and model at the same instant.
 const all=[...urls];
 for(let i=0;i<all.length;i+=8){
  await Promise.all(all.slice(i,i+8).map(async url=>{
   const response=await fetch(url,{cache:"no-cache"});
   if(!response.ok||response.type==="opaque")
    throw Error("Offline asset unavailable: "+new URL(url).pathname);
   await cache.put(url,response);
  }));
 }
}
self.addEventListener("install",event=>{
 event.waitUntil((async()=>{
  const cache=await caches.open(CACHE);
  await cache.addAll(SHELL);
  // Do not activate a new worker claiming complete first-visit offline
  // support if even one referenced asset failed to download. The existing
  // online site/previous active worker remains usable.
  await precacheFlightAssets(cache);
  await self.skipWaiting();
 })());
});
self.addEventListener("activate",event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(
  keys.filter(k=>k.startsWith("agsa-flight-sim-")&&k!==CACHE)
   .map(k=>caches.delete(k))))
  .then(()=>self.clients.claim()));
});
self.addEventListener("fetch",event=>{
 if(!shouldCache(event.request))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  try{
   const response=await fetch(event.request);
   if(response.ok&&response.type==="basic"){
    try{await cache.put(event.request,response.clone());}catch{}
   }
   return response;
  }catch{
   const saved=await cache.match(event.request);
   if(saved)return saved;
   if(event.request.mode==="navigate")
    return new Response("Open the simulator online to refresh its flight assets.",{
     status:503,headers:{"Content-Type":"text/plain; charset=utf-8"}});
   return Response.error();
  }
 })());
});