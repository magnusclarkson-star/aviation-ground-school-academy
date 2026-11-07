import assert from "node:assert/strict";
import fs from "node:fs";
const register=JSON.parse(fs.readFileSync("accreditation/readiness-register.json","utf8"));
assert.equal(register.accreditation_held,false,"Do not claim accreditation unless independently verified");
assert.equal(register.simulator_qualified,false,"No FSTD or BATD qualification exists");
assert.equal(register.flight_credit_permitted,false,"No licensing flight-hour credit is authorised");
assert.equal(register.public_status,"educational_prototype_unapproved");
assert.ok(register.pathways.length>=5);
const ids=new Set();
for(const pathway of register.pathways){
 assert.ok(!ids.has(pathway.id),"Unique authority programme identifier");
 ids.add(pathway.id);
 assert.ok(["not_applied","not_qualified","planning","in_review","approved_verified"].includes(pathway.status));
 if(pathway.status==="approved_verified"){
  assert.ok(pathway.authority_verification&&pathway.approved_course_scopes.length>0,"Any future approval requires official source and explicit scope");
 }
 assert.ok(pathway.reference_url.startsWith("https://"));
 assert.ok(pathway.evidence_required.length>=3);
}
const page=fs.readFileSync("standards-readiness.html","utf8");
assert.ok(page.includes("unapproved educational prototype"),"Public accreditation disclaimer is prominent");
assert.ok(page.includes("accreditation/readiness-register.json"),"Public register is discoverable");
assert.ok(page.includes("docs/ACCREDITATION-READINESS.md"),"Research source is discoverable");
assert.ok(fs.readFileSync("cockpit-v3.html","utf8").includes("standards-readiness.html"),"Cockpit navigation links standards");
console.log("Accreditation evidence checks passed: no approval or simulator credit claims, valid public status and source links.");
