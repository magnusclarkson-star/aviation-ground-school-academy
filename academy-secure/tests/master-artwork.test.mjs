import test from "node:test";
import assert from "node:assert/strict";
import {MASTER_ARTWORK,validateMasterArtwork,originalArtworkFor,bundledApprovedArtwork} from "../master-artwork.mjs";
import {renderOriginalCertificate} from "../original-certificate-pdf.mjs";
import {provisionCertificateMasters} from "../provision-master-artwork.mjs";
import {mkdtemp,writeFile,rm,symlink} from "node:fs/promises";
import {join} from "node:path";
import {tmpdir} from "node:os";
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

test("production requires an exact verified private original, never bundled public-source fallback",async t=>{
 const oldNode=process.env.NODE_ENV,oldDir=process.env.ACADEMY_CERTIFICATE_MASTER_DIR;
 t.after(()=>{
  if(oldNode===undefined)delete process.env.NODE_ENV;else process.env.NODE_ENV=oldNode;
  if(oldDir===undefined)delete process.env.ACADEMY_CERTIFICATE_MASTER_DIR;
  else process.env.ACADEMY_CERTIFICATE_MASTER_DIR=oldDir;
 });
 const db={async query(){return {rows:[]}}};
 const style="FORMAL_TRADITIONAL",filename=MASTER_ARTWORK[style].filename;
 const original=await bundledApprovedArtwork(style);
 process.env.NODE_ENV="production";
 delete process.env.ACADEMY_CERTIFICATE_MASTER_DIR;
 await assert.rejects(()=>originalArtworkFor(db,style),/not provisioned in the private store/);
 process.env.ACADEMY_CERTIFICATE_MASTER_DIR="relative/path";
 await assert.rejects(()=>originalArtworkFor(db,style),/absolute private filesystem path/);
 const dir=await mkdtemp(join(tmpdir(),"agsa-private-master-"));
 t.after(()=>rm(dir,{recursive:true,force:true}));
 process.env.ACADEMY_CERTIFICATE_MASTER_DIR=dir;
 const full=join(dir,filename);
 await writeFile(full,original,{mode:0o600});
 assert.deepEqual(await originalArtworkFor(db,style),original);
 const wrong=Buffer.from(original);
 wrong[wrong.length-50]^=0x01;
 await writeFile(full,wrong);
 await assert.rejects(()=>originalArtworkFor(db,style),/does not match/);
 await rm(full);
 await symlink(join(dir,"nonexistent.png"),full);
 await assert.rejects(()=>originalArtworkFor(db,style),/not a symlink/);
 await rm(full);
 const installedDb={
  async query(){return {rows:[{png:original,sha256:MASTER_ARTWORK[style].sha256}]}}
 };
 assert.deepEqual(await originalArtworkFor(installedDb,style),original,
  "Exact administrator-installed database masters can be used without a private filesystem mount");
});

test("private master provisioning is verified, restrictive, idempotent and never public",async t=>{
 const dir=await mkdtemp(join(tmpdir(),"agsa-owner-vault-"));
 t.after(()=>rm(dir,{recursive:true,force:true}));
 const first=await provisionCertificateMasters(dir);
 assert.equal(first.length,3);
 assert.ok(first.every(x=>x.preexisting===false));
 const second=await provisionCertificateMasters(dir);
 assert.equal(second.length,3);
 assert.ok(second.every(x=>x.preexisting===true));
 for(const [style,item] of Object.entries(MASTER_ARTWORK)){
  const original=await bundledApprovedArtwork(style);
  const saved=await import("node:fs/promises").then(fs=>fs.readFile(join(dir,item.filename)));
  assert.deepEqual(saved,original);
  assert.equal(validateMasterArtwork(saved,style).sha256,item.sha256);
 }
 await assert.rejects(()=>provisionCertificateMasters("relative/directory"),/absolute restricted private directory/);
});
