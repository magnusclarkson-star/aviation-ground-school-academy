import assert from "node:assert/strict";
import fs from "node:fs";
const page=fs.readFileSync(new URL("../academy-coursebook.html",import.meta.url),"utf8");
const css=fs.readFileSync(new URL("../academy-coursebook-layout-v2.css",import.meta.url),"utf8");
const js=fs.readFileSync(new URL("../academy-coursebook-layout-v2.js",import.meta.url),"utf8");
const focus=fs.readFileSync(new URL("../academy-coursebook-focus-v3.css",import.meta.url),"utf8");
const classic=fs.readFileSync(new URL("../academy-coursebook-classic-v4.css",import.meta.url),"utf8");
const classicJs=fs.readFileSync(new URL("../academy-coursebook-classic-v4.js",import.meta.url),"utf8");
const academyHome=fs.readFileSync(new URL("../index.html",import.meta.url),"utf8");
const preservedDashboard=fs.readFileSync(new URL("../academy-dashboard.html",import.meta.url),"utf8");
assert.match(page,/academy-coursebook-classic-v4\.css\?v=20261114-original/);
assert.match(page,/academy-coursebook-classic-v4\.js\?v=20261114-original/);
assert.match(page,/class="site-menu"/);
assert.match(academyHome,/location\.replace\(coursebook\.href\)/);
assert.match(preservedDashboard,/Flight Training Starts Here/);
assert.match(classic,/illustrated-cessna-structures-lecture\.webp/);
assert.match(classic,/\.original-plate-viewport/);
assert.match(classic,/\.scenic-hero \{display:none!important\}/);
assert.match(classicJs,/original-coursebook-plate/);
assert.match(classicJs,/id==="aircraft"/);
assert.match(classicJs,/tools\.appendChild\(controls\)/);
assert.match(classicJs,/tools\.appendChild\(notice\)/);

assert.match(page,/academy-coursebook-focus-v3\.css\?v=20261114-focus-v3/);
assert.match(page,/FOCUS LAYOUT V3/);

assert.match(page,/<link rel="stylesheet" href="academy-coursebook-layout-v2\.css\?v=20261114-compact">/);
assert.match(page,/<script src="academy-coursebook-layout-v2\.js\?v=20261114-compact" defer>/);
for(const str of ['id="mobileModuleJump"','class="quick-controls"','class="notice notice-compact"','class="objectives-panel"','class="hero scenic-hero"','class="study-tools"','id="moduleList"','id="route"','id="search"','id="nextLesson"','id="courseProgress"','id="quizForm"','id="deepModuleSection"']){
 assert.ok(page.includes(str),"Page must keep functional controls and compact layout: "+str);
}
assert.ok(!page.includes("First explore the complete original picture. Then study each numbered explanation"),"Intro should not dominate the initial viewport");
for(const selector of [".grid{grid-template-columns:minmax(208px,242px)",".scenic-hero{min-height:124px",
 ".textbook-prose p{font:400 16px/1.68",".visual-manual-cover{display:grid",".quick-primary",
 ".mobile-jump-label","#mobileModuleJump",".textbook-course-intro",".deep-lesson p{color:#1b384a!important",
 ".visual-manual-hero .approved-full-picture{display:block;max-height:245px", "@media(max-width:900px)"]){
 assert.ok(css.includes(selector),"Reader must override the legacy oversized/faint layout: "+selector);
}
assert.ok(css.includes("max-width:1760px"),"Reading pane must use available desktop width");
assert.ok(css.includes(".notice-compact>summary"),"Accreditation disclosure must remain visible");
assert.match(js,/jump\.addEventListener\("change"/);
assert.match(js,/aria-pressed/);
assert.match(js,/agsa:coursebook-module/);
assert.ok(!/\.innerHTML|fetch\(|localStorage/.test(js),"Layout must not inject markup or touch academic data");
function lum(hex){
 const rgb=hex.match(/[a-f0-9]{2}/ig).map(x=>parseInt(x,16)/255);
 return rgb.map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4)
  .reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0);
}
function contrast(a,b){const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)}
for(const [fg,bg,subject] of [
 ["#152d3d","#ffffff","textbook"],
 ["#fff9ec","#173b52","toolbar labels"],
 ["#f6fbff","#112e42","lesson shell"],
 ["#ffe6af","#18374a","accreditation disclosure"],
 ["#1b384a","#fbfcf8","advanced explanatory text"],
 ["#fff1d1","#0b263b","Academy brand"],
 ["#122d3f","#f6d991","gold chapter ribbon"]
]){
 assert.ok(contrast(fg,bg)>=4.5,"AA-level contrast in "+subject+": "+contrast(fg,bg));
}
for(const marker of [
 ".scenic-hero{min-height:56px!important",
 ".grid{grid-template-columns:minmax(178px,210px)",
 ".visual-lesson-nav{display:flex;flex-wrap:nowrap;overflow-x:auto",
 ".visual-manual-cover>p:not(.visual-manual-meta){display:none}",
 ".quick-primary{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr)",
 ".panel[aria-label=\"Lesson reading and self-check\"]>h2#moduleTitle",
 ".supplementary-links>summary",
 ".textbook-prose p{font-size:16px"
]){
 assert.ok(focus.includes(marker),"Focus Reader V3 must reclaim space while preserving text: "+marker);
}
assert.match(page,/class="supplementary-links"/,"Gallery link should remain but not clutter reading start");
assert.match(focus,/\.site-head nav a\{font-size:13px;color:#fff7e8/);
console.log("Academy compact reader: cache-busted assets, efficient layout, mobile picker, preserved controls and 7 contrast thresholds passed.");
