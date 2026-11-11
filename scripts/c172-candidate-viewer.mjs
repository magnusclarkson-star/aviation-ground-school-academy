import * as THREE from "three";
import {OrbitControls} from "three/addons/controls/OrbitControls.js";
import {GLTFLoader} from "three/addons/loaders/GLTFLoader.js";
const canvas=document.querySelector("#view");
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:"low-power"});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.3;
const scene=new THREE.Scene();scene.background=new THREE.Color(0xa8d1e2);
scene.add(new THREE.HemisphereLight(0xffffff,0x8b9b9d,2.3));
const sun=new THREE.DirectionalLight(0xfff8de,3.3);sun.position.set(-6,12,8);scene.add(sun);
const camera=new THREE.PerspectiveCamera(52,1,.035,180);
const controls=new OrbitControls(camera,canvas);
controls.enableDamping=true;controls.dampingFactor=.08;
let craft, parts=[],bounds, seats=[];
const info={ready:false,errors:[]};
window.__C172_REVIEW=info;
(async()=>{try{
 const gltf=await new GLTFLoader().loadAsync("/artifacts/c172-mit-candidate.glb");
 craft=gltf.scene;
 craft.updateMatrixWorld(true);
 const original=new THREE.Box3().setFromObject(craft);
 const originalSize=original.getSize(new THREE.Vector3());
 // Determine source dimension; the largest horizontal dimension is wingspan.
 const desiredSpan=11;
 const norm=desiredSpan/Math.max(originalSize.x,originalSize.z);
 craft.scale.multiplyScalar(norm);
 craft.updateMatrixWorld(true);
 // Heuristic source orientation: preserve original raw model and let camera
 // inspect it from each axis until real nose and cockpit anchors are verified.
 bounds=new THREE.Box3().setFromObject(craft);
 craft.position.sub(bounds.getCenter(new THREE.Vector3()));
 craft.updateMatrixWorld(true);
 bounds.setFromObject(craft);
 scene.add(craft);
 craft.traverse(obj=>{
  if(obj.isMesh){
   parts.push(obj);
   if(/seat|pilot|cockpit|instrument|panel/i.test(obj.name||""))
    seats.push({name:obj.name,center:new THREE.Box3().setFromObject(obj).getCenter(new THREE.Vector3()).toArray()});
  }
 });
 info.bounds=bounds.getSize(new THREE.Vector3()).toArray();
 info.meshCount=parts.length;
 info.materialCount=parts.reduce((n,m)=>n+(Array.isArray(m.material)?m.material.length:1),0);
 info.namedSeats=seats.slice(0,60);
 info.originalSize=originalSize.toArray();
 info.names=parts.slice(0,180).map(x=>x.name||"(unnamed)");
 const maxRadius=Math.max(...info.bounds);
 camera.position.set(maxRadius*.85,maxRadius*.3,maxRadius*.7);
 controls.target.set(0,0,0);controls.update();
 info.ready=true;
}catch(e){info.errors.push(String(e?.stack||e));}})();
function setView(view){
 if(!info.ready)throw Error("Model not ready");
 const ext=info.bounds,span=Math.max(...ext);
 if(view==="front"){camera.position.set(-span*.70,span*.06,0);controls.target.set(0,0,0);}
 if(view==="side"){camera.position.set(0,span*.19,span*.87);controls.target.set(0,0,0);}
 if(view==="overhead"){camera.position.set(0,span*1.1,.01);controls.target.set(0,0,0);}
 if(view==="cabin"){
  // Raw source cockpit geometry preview; this is NOT a pilot view acceptance
  // until nose axis and named seat anchors are inspected in rendered screenshots.
  camera.position.set(-span*.1,.22,.0);
  controls.target.set(-span*.4,.1,0);
 }
 camera.updateProjectionMatrix();controls.update();
 info.view=view;
}
info.setView=setView;
function frame(){
 const w=canvas.clientWidth,h=canvas.clientHeight;
 renderer.setSize(w,h,false);camera.aspect=w/Math.max(1,h);camera.updateProjectionMatrix();
 controls.update();renderer.render(scene,camera);requestAnimationFrame(frame);
}
frame();
