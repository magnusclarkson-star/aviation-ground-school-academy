const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const N=require('../flight-sim-native-haptics.js');
const root=path.resolve(__dirname,'..');
test('normal website uses existing navigator Vibration API without native access',()=>{
 const calls=[],nav={vibrate(value){calls.push(value);return true}};
 const result=N.adapt(nav,null);
 assert.equal(result.native,false);
 assert.equal(result.navigatorLike,nav);
 assert.equal(result.navigatorLike.vibrate(50),true);
 assert.deepEqual(calls,[50]);
});
test('Android-only bridge accepts short bounded haptics and cancellation',()=>{
 const messages=[],bridge={postMessage(value){messages.push(JSON.parse(value))}};
 const adapted=N.adapt({},bridge);
 assert.equal(adapted.native,true);
 assert.equal(adapted.navigatorLike.vibrate([45,30,45]),true);
 assert.deepEqual(messages[0],{type:'vibrate',pattern:[45,30,45]});
 assert.equal(adapted.navigatorLike.vibrate([180,100,180]),true);
 assert.deepEqual(messages[1],{type:'vibrate',pattern:[180,100,180]});
 assert.equal(adapted.navigatorLike.vibrate(0),true);
 assert.deepEqual(messages[2],{type:'cancel'});
});
test('native bridge refuses indefinite, too many, invalid or oversized requests',()=>{
 const messages=[],bridge={postMessage(message){messages.push(message)}},n=N.adapt({},bridge).navigatorLike;
 for(const invalid of [[1,1,1,1,1,1],[180,180,180],[0,15],[900],-1,Infinity,NaN,2.5,['30'],[-2]])
  assert.equal(n.vibrate(invalid),false,JSON.stringify(invalid));
 assert.deepEqual(messages,[]);
 const failed=N.adapt({}, {postMessage(){throw Error('native unavailable')}});
 assert.equal(failed.navigatorLike.vibrate([55]),false);
});
test('native Android source limits the bridge to the Academy simulator and VIBRATE permission',()=>{
 const java=fs.readFileSync(path.join(root,'android/native-haptics/app/src/main/java/org/agsa/simulator/MainActivity.java'),'utf8');
 const manifest=fs.readFileSync(path.join(root,'android/native-haptics/app/src/main/AndroidManifest.xml'),'utf8');
 const js=fs.readFileSync(path.join(root,'flight-sim.js'),'utf8');
 const html=fs.readFileSync(path.join(root,'flight-sim.html'),'utf8');
 assert.match(java,/Collections\.singleton\(ORIGIN\)/);
 assert.match(java,/!isMainFrame/);
 assert.match(java,/isSimulatorPage/);
 assert.match(java,/sum > 500/);
 assert.match(java,/now - lastEffectMs < 250/);
 assert.match(java,/VibrationEffect\.createWaveform\(timings, -1\)/);
 assert.doesNotMatch(java,/addJavascriptInterface/);
 assert.match(manifest,/android\.permission\.VIBRATE/);
 assert.doesNotMatch(manifest,/android\.permission\.(RECORD_AUDIO|ACCESS_FINE_LOCATION)/);
 assert.match(js,/NH\.adapt\(navigator,window\.AGSAHapticsNative\)/);
 assert.match(html,/src="flight-sim-native-haptics\.js"/);
 const source=fs.readFileSync(path.join(root,'flight-sim-native-haptics.js'),'utf8');
 for(const forbidden of ['fetch(', 'localStorage','sessionStorage','getUserMedia','XMLHttpRequest'])
  assert.ok(!source.includes(forbidden));
});
