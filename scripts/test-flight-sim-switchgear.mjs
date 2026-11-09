import assert from "node:assert/strict";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const SW=require("../flight-sim-switchgear.js");
assert.deepEqual(SW.SWITCHES.map(s=>s.id),["view","graphics","light","frame"]);
for(const s of SW.SWITCHES){
 assert.ok(s.target.length>0);
 assert.ok(s.choices.length>=2);
 assert.equal(SW.nextValue(s,s.choices[s.choices.length-1]),s.choices[0]);
 for(let i=0;i<s.choices.length-1;i++)
  assert.equal(SW.nextValue(s,s.choices[i]),s.choices[i+1]);
 assert.equal(SW.nextValue(s,"nonexistent"),s.choices[0]);
 assert.ok(s.choices.every(v=>Boolean(s.displays[v])));
}
console.log("Cockpit switch mappings passed: view, graphics, lighting and frame selectors.");
