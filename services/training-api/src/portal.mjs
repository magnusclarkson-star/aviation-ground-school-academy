import {readFile} from "node:fs/promises";

// Only explicit, bundled staging portal assets may be served.
// This portal is NOT copied to GitHub Pages and contains no secrets.
const ASSETS=new Map([
 ["/portal/",{file:new URL("../portal/index.html",import.meta.url),type:"text/html; charset=utf-8"}],
 ["/portal/styles.css",{file:new URL("../portal/styles.css",import.meta.url),type:"text/css; charset=utf-8"}],
 ["/portal/app.js",{file:new URL("../portal/app.js",import.meta.url),type:"text/javascript; charset=utf-8"}]
]);
export function isPortalPath(path){return path==="/portal"||ASSETS.has(path);}
export async function servePortal(path,res,{secure=false}={}){
 const asset=ASSETS.get(path==="/portal"?"/portal/":path);
 if(!asset)return false;
 const data=await readFile(asset.file);
 res.writeHead(200,{
  "Content-Type":asset.type,
  "Content-Length":data.length,
  "Cache-Control":"no-store, private",
  "X-Content-Type-Options":"nosniff",
  "X-Frame-Options":"DENY",
  "Referrer-Policy":"no-referrer",
  "Permissions-Policy":"camera=(), microphone=(), geolocation=()",
  "Content-Security-Policy":"default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; media-src 'self' blob:; form-action 'self'; base-uri 'none'; frame-ancestors 'none'; object-src 'none'",
  ...(secure?{"Strict-Transport-Security":"max-age=31536000; includeSubDomains"}:{})
 });
 res.end(data);
 return true;
}
