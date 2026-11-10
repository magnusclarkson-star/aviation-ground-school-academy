import {build} from "esbuild";
import {stat} from "node:fs/promises";
import {fileURLToPath} from "node:url";
import path from "node:path";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const outfile=path.join(root,"flight-sim-v3.bundle.js");
await build({
 entryPoints:[path.join(root,"v3/c172-preview.js")],
 bundle:true,platform:"browser",format:"iife",target:["chrome110","safari16"],
 outfile,minify:true,sourcemap:false,legalComments:"eof",logLevel:"info",
 define:{"process.env.NODE_ENV":'"production"'}
});
const info=await stat(outfile);
if(info.size<100000||info.size>2200000)
 throw Error("V3 bundled Three.js must be a bounded, real self-contained browser script: "+info.size);
console.log("V3 standalone C172 Three.js bundle built:",info.size,"bytes");
