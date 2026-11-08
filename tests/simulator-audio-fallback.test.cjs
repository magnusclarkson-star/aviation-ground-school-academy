const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const F=require('../flight-sim-audio-fallback.js');
const root=path.resolve(__dirname,'..');
test('local backup WAV is bounded mono PCM with a one-second audible band',()=>{
 const wave=F.makeWave();
 assert.equal(String.fromCharCode(...wave.slice(0,4)),'RIFF');
 assert.equal(String.fromCharCode(...wave.slice(8,12)),'WAVE');
 assert.equal(String.fromCharCode(...wave.slice(36,40)),'data');
 const v=new DataView(wave.buffer);
 assert.equal(v.getUint32(24,true),22050);
 assert.equal(v.getUint16(22,true),1);
 assert.equal(v.getUint16(34,true),16);
 assert.ok(wave.length>44000&&wave.length<51000);
 assert.equal(v.getUint32(40,true),wave.length-44);
 const samples=[];
 for(let i=44;i<wave.length;i+=2)samples.push(Math.abs(v.getInt16(i,true)));
 assert.ok(Math.max(...samples)<10000);
 assert.ok(samples.some(x=>x>2000));
});
function mock({reject=false}={}){
 const instances=[],events={},urls=[];
 class Audio{
  constructor(){instances.push(this);this.src='';this.volume=1;this.paused=false;}
  play(){this.played=true;return reject?Promise.reject(Object.assign(Error('blocked'),{name:'NotAllowedError'})):Promise.resolve();}
  pause(){this.paused=true;}
  removeAttribute(){}
  load(){}
 }
 const doc={hidden:false,addEventListener(name,cb){events[name]=cb;}};
 const win={
  Audio,Blob,
  URL:{createObjectURL(blob){urls.push(blob);return 'blob:synthetic';},revokeObjectURL(url){urls.push('revoked:'+url);}},
  addEventListener(){}
 };
 return {instances,events,urls,win,doc};
}
test('HTML audio fallback only plays after a direct learner request and cleans up',async()=>{
 const env=mock(),backup=F.createFallback({windowLike:env.win,documentLike:env.doc});
 assert.equal(backup.supported,true);
 assert.equal(env.instances.length,0);
 assert.equal(backup.status().active,false);
 const played=await backup.play();
 assert.equal(played.started,true);
 assert.equal(env.instances.length,1);
 assert.equal(env.instances[0].played,true);
 assert.equal(env.instances[0].src,'blob:synthetic');
 assert.equal(env.urls[0].type,'audio/wav');
 backup.stop();
 assert.equal(backup.status().active,false);
 assert.equal(env.instances[0].paused,true);
 assert.ok(env.urls.includes('revoked:blob:synthetic'));
});
test('blocked audio and hidden pages produce a truthful diagnostic',async()=>{
 const env=mock({reject:true}),backup=F.createFallback({windowLike:env.win,documentLike:env.doc});
 const result=await backup.play();
 assert.equal(result.started,false);
 assert.match(result.reason,/NotAllowedError/);
 assert.equal(backup.status().active,false);
 env.doc.hidden=true;
 assert.match((await backup.play()).reason,/hidden/);
 const unsupported=F.createFallback({windowLike:{addEventListener(){}},documentLike:env.doc});
 assert.equal(unsupported.supported,false);
});
test('public simulator has visible backup and diagnostics without user identifying data',()=>{
 const html=fs.readFileSync(path.join(root,'flight-sim.html'),'utf8');
 const sim=fs.readFileSync(path.join(root,'flight-sim.js'),'utf8');
 for(const id of ['phoneAudioBackup','phoneDiagnostics','phoneDiagnosticsText','phoneRefreshDiagnostics','phoneCopyDiagnostics'])
  assert.ok(html.includes('id="'+id+'"'));
 assert.ok(html.includes('src="flight-sim-audio-fallback.js"'));
 assert.ok(sim.includes('audioFallback.play()'));
 assert.ok(sim.includes('refreshPhoneDiagnostics()'));
 assert.ok(sim.includes('Media volume: not readable by websites'));
 const source=fs.readFileSync(path.join(root,'flight-sim-audio-fallback.js'),'utf8');
 for(const forbidden of ['fetch(', 'XMLHttpRequest', 'getUserMedia', 'sendBeacon', 'localStorage', 'sessionStorage'])
  assert.ok(!source.includes(forbidden));
});
