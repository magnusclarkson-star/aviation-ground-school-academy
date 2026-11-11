// Offline-first fallback for static simulator files only. No payments,
// credentials, personal data or remote services are cached.
const CACHE="agsa-flight-sim-v1-20261111-2x2-switches-yoke1";
const ROOT=new URL("./",self.location.href);
const SHELL=[
 new URL("flight-sim.html",ROOT).href,
 new URL("flight-sim-icon-192.png",ROOT).href,
 new URL("flight-sim-icon-512.png",ROOT).href
];
self.addEventListener("install",event=>{
 event.waitUntil(caches.open(CACHE)
  .then(cache=>cache.addAll(SHELL))
  .then(()=>self.skipWaiting()));
});
self.addEventListener("activate",event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(
  keys.filter(k=>k.startsWith("agsa-flight-sim-")&&k!==CACHE)
   .map(k=>caches.delete(k))))
  .then(()=>self.clients.claim()));
});
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
self.addEventListener("fetch",event=>{
 if(!shouldCache(event.request))return;
 event.respondWith((async()=>{
  const cache=await caches.open(CACHE);
  try{
   const response=await fetch(event.request);
   if(response.ok&&response.type==="basic"){
    // Extend the response promise until the cache write finishes. Calling
    // event.waitUntil only after a network await can violate event lifetime.
    try{await cache.put(event.request,response.clone());}catch{}
   }
   return response;
  }catch{
   const saved=await cache.match(event.request);
   if(saved)return saved;
   if(event.request.mode==="navigate")
    return new Response("Open the simulator online once to cache its flight assets.",{
     status:503,headers:{"Content-Type":"text/plain; charset=utf-8"}});
   return Response.error();
  }
 })());
});
