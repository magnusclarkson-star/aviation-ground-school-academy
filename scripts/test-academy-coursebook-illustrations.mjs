import assert from "node:assert/strict";
import fs from "node:fs";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const course=require("../academy-coursebook-data.js");
const drawings=require("../academy-coursebook-illustrations.js");
assert.deepEqual(drawings.validate(),{
 modules:12,figures:12,format:"SVG",notes:"Conceptual pictorials; subject-matter review required"
});
assert.deepEqual(new Set(drawings.modules),new Set(course.modules.map(x=>x.id)));
const svgs=new Set();
for(const m of course.modules){
 const d=drawings.get(m.id);
 assert.ok(d,"Diagram missing for "+m.id);
 assert.equal(d.id,m.id);
 assert.ok(d.section>=0&&d.section<m.sections.length);
 assert.ok(d.title.length>=18);
 assert.ok(d.alt.length>=75,"Alt text should explain the diagram");
 assert.ok(d.caption.length>=90,"Provide a conceptual explanation, not a decorative label");
 assert.match(d.svg,/^<svg [^>]*viewBox="0 0 840 440"/);
 assert.match(d.svg,/<title>[^<]+<\/title><desc>[^<]+<\/desc>/);
 assert.match(d.svg,/<text /);
 assert.ok((d.svg.match(/<text /g)||[]).length>=5,"Diagram needs useful visible labels: "+m.id);
 assert.ok(d.svg.length>1200,"Diagram is too sparse: "+m.id);
 assert.ok(!svgs.has(d.svg),"Duplicate drawing is not a unique subject diagram");
 assert.ok(!/<(?:script|foreignObject|image|iframe)\b/i.test(d.svg),"Only inline safe vector primitives: "+m.id);
 assert.ok(!/https?:\/\//.test(d.svg.replace("http://www.w3.org/2000/svg","")),"Diagrams have no external requests");
 svgs.add(d.svg);
}
assert.equal(drawings.get("missing"),null);
const html=fs.readFileSync(new URL("../academy-coursebook.html",import.meta.url),"utf8");
for(const name of ["academy-coursebook-illustrations.js","academy-coursebook-pictorial-ui.js"])
 assert.ok(html.includes('src="'+name+'"'),"Missing static script "+name);
const model=fs.readFileSync(new URL("../academy-coursebook-pictorial-ui.js",import.meta.url),"utf8");
assert.match(model,/showModal/);
assert.match(model,/diagram-lightbox/);
assert.match(model,/setAttribute\("aria-label"/);
assert.match(model,/DOMContentLoaded/);
assert.ok(!/\.innerHTML|fetch\(|XMLHttpRequest|localStorage|sessionStorage/.test(model),
 "Diagram renderer cannot fetch, transmit, inject markup or store private user data");
console.log("12 original illustrated lecture notes verified: unique, labelled, self-contained SVGs with accessible captions and enlargement.");
