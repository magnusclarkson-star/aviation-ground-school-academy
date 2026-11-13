import assert from "node:assert/strict";import fs from "node:fs";import {createRequire} from "node:module";
const require=createRequire(import.meta.url),C=require("../academy-specialist-courses-data.js");
const result=C.validate();assert.equal(result.courses,16);assert.equal(result.plannedLessons,100);assert.equal(C.status,"PROPOSED_SYLLABI_NOT_APPROVED");
const ids=new Set(C.courses.map(c=>c.id));for(const id of ["avionics-engineering","aircraft-accident-investigation","aviation-safety-management","flight-data-analysis","uas-drone","aircraft-maintenance","aviation-cybersecurity"])assert.ok(ids.has(id),id);
const flagship=C.courses.filter(c=>c.priority===1);assert.equal(flagship.length,2);
assert.deepEqual(new Set(flagship.map(c=>c.id)),new Set(["avionics-engineering","aircraft-accident-investigation"]));
for(const c of C.courses){assert.ok(c.modules.length>=6);assert.ok(c.note.length>=40);assert.ok(c.outcome.length>=50);assert.ok(c.references.length>=1);assert.ok(["Technical","Safety & Investigation","Operations"].includes(c.category));}
const html=fs.readFileSync(new URL("../academy-specialist-courses.html",import.meta.url),"utf8");
for(const path of ["academy-specialist-courses.js","academy-specialist-courses-data.js","academy-specialist-courses.css"])assert.ok(html.includes(path));
assert.match(html,/proposed syllabi/i);assert.match(html,/not courses currently available for enrolment/i);
const home=fs.readFileSync(new URL("../index.html",import.meta.url),"utf8");
assert.match(home,/href="academy-specialist-courses.html"/);
const script=fs.readFileSync(new URL("../academy-specialist-courses.js",import.meta.url),"utf8");
assert.match(script,/textContent/);assert.ok(!script.includes(".innerHTML"),"Use textContent, not injected HTML");
console.log("Academy specialist course roadmap validated: 16 planned courses, 100 proposed topic units, no accreditation claims.");
