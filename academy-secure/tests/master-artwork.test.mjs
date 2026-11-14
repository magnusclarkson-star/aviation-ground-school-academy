import test from "node:test";
import assert from "node:assert/strict";
import {MASTER_ARTWORK,validateMasterArtwork,originalArtworkFor,bundledApprovedArtwork} from "../master-artwork.mjs";
import {renderOriginalCertificate} from "../original-certificate-pdf.mjs";
const names=Object.keys(MASTER_ARTWORK);
test("exact three visual designs mapped to correct Academy audiences",()=>{
 assert.deepEqual(names,["FORMAL_TRADITIONAL","SCOUT_MODERN","ENTHUSIAST_NAVY_GOLD"]);
 assert.equal(MASTER_ARTWORK.FORMAL_TRADITIONAL.filename,"formal-traditional-burgundy.png");
 assert.equal(MASTER_ARTWORK.SCOUT_MODERN.filename,"scouts-modern-aviation.png");
 assert.equal(MASTER_ARTWORK.ENTHUSIAST_NAVY_GOLD.filename,"enthusiast-navy-gold.png");
 for(const item of Object.values(MASTER_ARTWORK))assert.match(item.sha256,/^[a-f0-9]{64}$/);
});
test("incorrect and synthetic PNGs are refused instead of silently redrawing",()=>{
 const fake=Buffer.alloc(70000);
 Buffer.from([137,80,78,71,13,10,26,10]).copy(fake);
 fake.write("IHDR",12,"ascii");
 fake.writeUInt32BE(1491,16);fake.writeUInt32BE(1055,20);
 assert.throws(()=>validateMasterArtwork(fake,"FORMAL_TRADITIONAL"),/does not match/);
 assert.throws(()=>validateMasterArtwork(fake.subarray(0,1200),"FORMAL_TRADITIONAL"),/size outside/);
 assert.throws(()=>validateMasterArtwork(fake,"UNKNOWN"),/Unknown/);
 const wrongSize=Buffer.from(fake);wrongSize.writeUInt32BE(1024,16);
 assert.throws(()=>validateMasterArtwork(wrongSize,"SCOUT_MODERN"),/1491 x 1055/);
});
test("permanently bundled exact originals work without browser or administrator uploads",async()=>{
 for(const style of names){
  const bundled=await bundledApprovedArtwork(style);
  const normal=await originalArtworkFor({async query(){return {rows:[]}}},style);
  assert.deepEqual(normal,bundled);
  assert.equal(validateMasterArtwork(bundled,style).sha256,MASTER_ARTWORK[style].sha256);
 }
 await assert.rejects(()=>renderOriginalCertificate({
  name:"Test Learner",courseTitle:"Aviation Foundations",
  serial:"AGSA-COURSE-"+"A".repeat(24),verifiedAcademicRecord:true
 },{style:"FORMAL_TRADITIONAL",masterPng:Buffer.alloc(0)}),/size outside/);
});
