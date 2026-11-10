/* Aircraft V3 isolated visual prototype. Do not import this module into V2.
 * Scene graph is the single source of truth for seats, panels, wings and
 * moving surfaces. Dimensions are approximate educational geometry, NOT
 * manufacturer drawings or validated C172 flight controls.
 */
import * as THREE from "three";
import {OrbitControls} from "three/addons/controls/OrbitControls.js";
import {GLTFLoader} from "three/addons/loaders/GLTFLoader.js";

const byId=id=>document.getElementById(id);
const clamp=(v,a,b)=>Math.min(b,Math.max(a,Number.isFinite(v)?v:a));
const material=(color,roughness=.58,metalness=.03)=>new THREE.MeshStandardMaterial({
 color,roughness,metalness,side:THREE.DoubleSide
});
const paints={
 white:material(0xf0f3ed,.43), lower:material(0xd7dee1,.66),
 blue:material(0x155279,.4), navy:material(0x173449,.6),
 edge:material(0xb6c6ca,.37,.2),dark:material(0x303c46,.63),
 wheel:material(0x202527,.9),tan:material(0xb5a083,.87),
 tanLight:material(0xdfc9a5,.85),glass:new THREE.MeshPhysicalMaterial({
  color:0x88cee9,transparent:true,opacity:.23,roughness:.12,
  metalness:0,depthWrite:false,side:THREE.DoubleSide
 }),silver:material(0xc0c9c9,.35,.4),screen:material(0x173e53,.45)
};
function mesh(group,name,geometry,mat,x=0,y=0,z=0){
 const obj=new THREE.Mesh(geometry,mat);
 obj.name=name;obj.position.set(x,y,z);group.add(obj);
 obj.castShadow=true;obj.receiveShadow=true;return obj;
}
function box(group,name,size,mat,x=0,y=0,z=0){
 return mesh(group,name,new THREE.BoxGeometry(...size),mat,x,y,z);
}
function cylinderBetween(group,name,a,b,r,mat){
 const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b);
 const diff=end.clone().sub(start);
 const obj=mesh(group,name,new THREE.CylinderGeometry(r,r,diff.length(),10),mat);
 obj.position.copy(start.add(end).multiplyScalar(.5));
 obj.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),diff.normalize());
 return obj;
}
// Lofted hull with *actual missing window polygons*, not a black texture
// hidden with a fragment-shader mask and not a second shell over a GLB.
function makeFuselage(root){
 const fuselage=new THREE.Group();fuselage.name="fuselage";root.add(fuselage);
 const sections=[
  [-4.70,.025,-.08,.045],[-4.12,.22,-.09,.21],[-3.50,.30,-.08,.28],
  [-2.50,.36,-.09,.37],[-1.24,.43,-.07,.46],[-.34,.52,-.07,.60],
  [ .12,.59,-.05,.75],[ .72,.62,-.03,.80],
  [1.44,.62,-.03,.80],[1.95,.60,-.04,.76],
  [2.40,.49,-.12,.48],[3.20,.40,-.17,.34],
  [4.06,.31,-.17,.26],[4.25,.11,-.17,.12]
 ];
 const opaque=[],transparent=[];
 const segments=40,twopi=2*Math.PI;
 for(let s=0;s<sections.length-1;s++){
  const [z0,r0,y0,h0]=sections[s],[z1,r1,y1,h1]=sections[s+1];
  const mid=(z0+z1)*.5;
  for(let i=0;i<segments;i++){
   const angle0=i/segments*twopi,angle1=(i+1)/segments*twopi;
   const center=(angle0+angle1)*.5;
   const frontWindow=mid>1.95&&mid<2.4&&center>.20&&center<Math.PI-.20;
   const sides=mid>.12&&mid<1.95&&
    ((center>.23&&center<1.20)||(center>Math.PI-1.20&&center<Math.PI-.23));
   const array=(frontWindow||sides)?transparent:opaque;
   const p=(theta,z,r,y,h)=>[r*Math.cos(theta),y+h*Math.sin(theta),z];
   const p00=p(angle0,z0,r0,y0,h0),p10=p(angle1,z0,r0,y0,h0),
    p01=p(angle0,z1,r1,y1,h1),p11=p(angle1,z1,r1,y1,h1);
   array.push(...p00,...p10,...p11,...p00,...p11,...p01);
  }
 }
 function fromTriangles(name,pts,mat){
  const g=new THREE.BufferGeometry();
  g.setAttribute("position",new THREE.Float32BufferAttribute(pts,3));
  g.computeVertexNormals();return mesh(fuselage,name,g,mat);
 }
 fromTriangles("single-skin-outer-fuselage",opaque,paints.white);
 fromTriangles("transparent-windshield-and-side-windows",transparent,paints.glass);
 for(const z of [.12,.72,1.95]){
  // Real geometry joining roof to lower fuselage; no floating dark bars.
  for(const sign of [-1,1])
   box(fuselage,"window-frame", [.038,.70,.042],paints.white,
    sign*.58,.30,z);
 }
 box(fuselage,"blue-lower-stripe",[.022,.085,2.1],paints.blue,.60,-.30,.82);
 box(fuselage,"blue-lower-stripe",[.022,.085,2.1],paints.blue,-.60,-.30,.82);
 return fuselage;
}
function surfaceGeometry(inner,outer,lead0,lead1,trail0,trail1,thickness=.12,y=0){
 const corners=[
  [inner,y,lead0],[outer,y,lead1],[outer,y,trail1],[inner,y,trail0],
  [inner,y-thickness,lead0],[outer,y-thickness,lead1],
  [outer,y-thickness,trail1],[inner,y-thickness,trail0]
 ];
 const faces=[[0,1,2],[0,2,3],[7,6,5],[7,5,4],
  [0,4,5],[0,5,1],[1,5,6],[1,6,2],
  [2,6,7],[2,7,3],[3,7,4],[3,4,0]];
 const data=[];
 for(const ids of faces)for(const i of ids)data.push(...corners[i]);
 const geo=new THREE.BufferGeometry();
 geo.setAttribute("position",new THREE.Float32BufferAttribute(data,3));
 geo.computeVertexNormals();return geo;
}
function makeWing(root,side){
 const sign=side==="left"?-1:1;
 const wing=new THREE.Group();wing.name=side+"-wing";root.add(wing);
 const inner=sign*.56,outer=sign*5.20;
 mesh(wing,side+"-fixed-wing",surfaceGeometry(inner,outer,
  1.20,.73,-.12,-.07,.14,.76),paints.white);
 const flap=new THREE.Group();flap.name=side+"-flap";wing.add(flap);
 flap.userData.hingeZ=-.12;
 flap.position.z=-.12;
 mesh(flap,side+"-flap-surface",surfaceGeometry(sign*.80,sign*2.55,
  0,.015,-.48,-.39,.10,.75),paints.white);
 const aileron=new THREE.Group();aileron.name=side+"-aileron";wing.add(aileron);
 aileron.position.z=-.12;
 mesh(aileron,side+"-aileron-surface",surfaceGeometry(sign*2.68,sign*5.08,
  .02,.05,-.35,-.24,.10,.76),paints.white);
 cylinderBetween(wing,side+"-strut",
  [sign*.48,-.65,.37],[sign*3.16,.64,.15],.038,paints.silver);
 return {flap,aileron};
}
function makeTail(root){
 const stabilizer=new THREE.Group();stabilizer.name="empennage";root.add(stabilizer);
 const elevators=[];
 for(const side of ["left","right"]){
  const sign=side==="left"?-1:1;
  mesh(stabilizer,side+"-horizontal-stabilizer",
   surfaceGeometry(sign*.20,sign*2.05,-3.34,-3.58,-4.00,-4.02,.07,.12),
   paints.white);
  const group=new THREE.Group();group.name=side+"-elevator";group.position.z=-4.01;
  stabilizer.add(group);
  mesh(group,side+"-elevator-surface",
   surfaceGeometry(sign*.20,sign*1.97,.01,0,-.27,-.22,.05,.11),paints.white);
  elevators.push(group);
 }
 // One swept vertical stabilizer and rudder, not duplicate tailplanes.
 const fin=new THREE.Shape();
 fin.moveTo(-3.64,.07);fin.lineTo(-4.08,1.60);fin.lineTo(-4.44,1.47);
 fin.lineTo(-4.25,.08);fin.closePath();
 const geometry=new THREE.ExtrudeGeometry(fin,{depth:.07,bevelEnabled:false});
 // Shape coordinate (z,y) -> world (x,y,z).
 geometry.rotateY(-Math.PI/2);
 geometry.translate(.035,0,0);
 mesh(stabilizer,"vertical-fin",geometry,paints.white);
 const rudder=new THREE.Group();rudder.name="rudder";rudder.position.set(0,.73,-4.22);
 stabilizer.add(rudder);
 box(rudder,"rudder-moving-surface",[.076,1.27,.22],paints.white,0,0,-.13);
 return {elevators,rudder};
}
function makeWheels(root){
 const gear=new THREE.Group();gear.name="tricycle-gear";root.add(gear);
 for(const [name,x,z,y] of [["nose",0,3.05,-1.00],["main-left",-1.05,.22,-1.19],
  ["main-right",1.05,.22,-1.19]]){
  const wheel=mesh(gear,name+"-tyre",new THREE.TorusGeometry(.22,.08,10,22),
   paints.wheel,x,y,z);
  wheel.rotation.y=Math.PI/2;
  cylinderBetween(gear,name+"-strut",[x*.85,-.78,z+.08],[x,y+.10,z],.046,paints.silver);
  box(gear,name+"-hub",[.09,.12,.12],paints.edge,x,y,z);
 }
 return gear;
}
function makeCabin(root){
 const cabin=new THREE.Group();cabin.name="four-seat-cabin";root.add(cabin);
 box(cabin,"cabin-floor",[1.06,.055,2.38],paints.dark,0,-.87,.96);
 const seats=[];
 for(const [row,z] of [["front",1.53],["rear",.43]])
  for(const [side,x] of [["left",-.31],["right",.31]]){
   const seat=new THREE.Group();seat.name=row+"-"+side+"-seat";seat.position.set(x,-.56,z);
   cabin.add(seat);
   box(seat,"seat-cushion",[.45,.15,.53],paints.tanLight,0,-.12,0);
   const back=box(seat,"seat-back",[.45,.59,.13],paints.tan,0,.19,-.19);
   back.rotation.x=-.12;
   box(seat,"headrest",[.35,.17,.15],paints.tanLight,0,.53,-.21);
   box(seat,"belt",[.045,.49,.035],paints.dark,-.14,.16,-.11);
   box(seat,"belt",[.045,.49,.035],paints.dark,.14,.16,-.11);
   seats.push(seat);
  }
 const panel=box(cabin,"forward-instrument-panel",[1.07,.45,.12],paints.navy,0,-.22,2.24);
 for(let n=0;n<6;n++){
  const x=(n%3-1)*.29,y=-.15+Math.floor(n/3)*.19;
  const gauge=mesh(cabin,"round-gauge-"+(n+1),
   new THREE.CircleGeometry(.091,24),paints.dark,x,y,2.17);
  gauge.rotation.y=Math.PI; // Faces the seated pilot looking toward +Z.
  const core=mesh(cabin,"gauge-inner-"+(n+1),
   new THREE.CircleGeometry(.059,24),paints.screen,x,y,2.163);
  core.rotation.y=Math.PI;
 }
 for(const x of [-.31,.31]){
  cylinderBetween(cabin,"yoke-shaft",[x,-.42,2.05],[x,-.42,1.84],.024,paints.silver);
  box(cabin,"control-yoke",[.30,.045,.055],paints.dark,x,-.42,1.84);
 }
 return {cabin,seats,panel};
}
function makeProp(root){
 const group=new THREE.Group();group.name="propeller";group.position.set(0,-.15,4.31);
 root.add(group);
 const blade=box(group,"single-pair-of-propeller-blades",[.13,2.40,.085],
  paints.dark,0,0,.04);blade.rotation.z=.11;
 mesh(group,"spinner",new THREE.ConeGeometry(.17,.46,16),paints.silver,0,0,.29)
  .rotation.x=Math.PI/2;
 return group;
}
function makeC172(){
 const root=new THREE.Group();root.name="C172-V3-named-assemblies";
 const hull=makeFuselage(root);
 const left=makeWing(root,"left"),right=makeWing(root,"right");
 const tail=makeTail(root),gear=makeWheels(root),interior=makeCabin(root),
  prop=makeProp(root);
 root.traverse(obj=>{
  if(obj.isMesh&&obj.material!==paints.glass){
   obj.castShadow=true;obj.receiveShadow=true;
  }
 });
 return {root,hull,left,right,tail,gear,interior,prop,
  applyControls({flaps=0,bank=0,pitch=0,rudder=0,power=0}={}){
   const f=clamp(flaps,0,30)*Math.PI/180;
   left.flap.rotation.x=right.flap.rotation.x=-f;
   left.aileron.rotation.x=clamp(bank,-1,1)*.35;
   right.aileron.rotation.x=-clamp(bank,-1,1)*.35;
   tail.elevators.forEach(e=>e.rotation.x=clamp(pitch,-1,1)*.26);
   tail.rudder.rotation.y=clamp(rudder,-1,1)*.32;
   prop.userData.power=clamp(power,0,1);
  }};
}
const canvas=byId("preview3d"),message=byId("previewStatus");
function status(text){if(message)message.textContent=text;}
const renderer=new THREE.WebGLRenderer({
 canvas,antialias:true,alpha:false,powerPreference:"low-power"
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.14;
renderer.setClearColor(0xbad5e4);
const scene=new THREE.Scene();scene.background=new THREE.Color(0xbad5e4);
scene.fog=new THREE.Fog(0xbad5e4,35,90);
const camera=new THREE.PerspectiveCamera(49,1,.08,130);
camera.position.set(10,5.1,9.7);
const controls=new OrbitControls(camera,canvas);
controls.target.set(0,-.15,.1);controls.enableDamping=true;controls.dampingFactor=.065;
controls.minDistance=5.8;controls.maxDistance=25;
controls.maxPolarAngle=Math.PI*.88;
scene.add(new THREE.HemisphereLight(0xd8efff,0x72745e,2.0));
const sun=new THREE.DirectionalLight(0xfff8e7,3.4);sun.position.set(-5,12,8);
scene.add(sun);
const ground=mesh(scene,"ground-plane",
 new THREE.PlaneGeometry(180,180),material(0x719568,.93),0,-1.65,0);
ground.rotation.x=-Math.PI/2;
const grid=new THREE.GridHelper(80,80,0xb0c0b1,0x809d83);
grid.position.y=-1.647;scene.add(grid);
const model=makeC172();scene.add(model.root);
const referenceHolder=new THREE.Group();referenceHolder.name="reference-GLB-only";
scene.add(referenceHolder);referenceHolder.visible=false;
let referenceLoaded=false;
async function loadReference(){
 if(referenceLoaded)return true;
 const loader=new GLTFLoader();
 status("Loading original licensed C172 reference GLB…");
 try{
  const gltf=await loader.loadAsync("assets/aircraft/c172-e737-optimized.glb");
  gltf.scene.rotation.y=Math.PI/2;gltf.scene.name="source-C172-GLB";
  referenceHolder.add(gltf.scene);referenceLoaded=true;return true;
 }catch(err){
  status("Original reference GLB unavailable: "+String(err.message||err));
  return false;
 }
}
// A detailed FlightGear-derived candidate is evaluated in CI only. The
// public option stays disabled until the GPL source obligations and visual
// evidence are reviewed. It is NEVER overlaid on the procedural V3 model.
const detailedHolder=new THREE.Group();
detailedHolder.name="detailed-FlightGear-C172-only";
scene.add(detailedHolder);detailedHolder.visible=false;
let detailedLoaded=false,detailedParts=null,detailedPropAngle=0;
const EXPECTED_DETAILED_NAMES=[
 "fuselage","pilotseat_left","pilotseat_right","backseat_left",
 "panel_1_gauges","Propeller","flaps","leftaileron","rightaileron",
 "elevatorleft","elevatorright","rudder_1","leftwindow","rightwindow"
];
async function loadDetailedCandidate(){
 if(detailedLoaded)return true;
 status("Examining source FlightGear C172 geometry…");
 try{
  const model=new GLTFLoader();
  const gltf=await model.loadAsync("assets/aircraft/c172-detailed-evaluation.glb");
  const airframe=gltf.scene;
  // Source FlightGear nose faces -X. Academy uses +Z forward.
  airframe.rotation.y=Math.PI/2;
  airframe.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(airframe),size=bounds.getSize(new THREE.Vector3());
  if(size.x<7||size.x>16||size.z<7||size.z>15||size.y<2||size.y>7)
   throw Error("Unexpected detailed aircraft dimensions: "+size.toArray());
  const found=new Map();
  for(const name of EXPECTED_DETAILED_NAMES){
   const obj=airframe.getObjectByName(name);
   if(!obj)throw Error("Missing real C172 mesh/node: "+name);
   found.set(name,obj);
  }
  // Center the entire assembled source plane once. Seats, panel, propeller,
  // wing and tail retain their original local transforms and attachments.
  const center=bounds.getCenter(new THREE.Vector3());
  airframe.position.sub(center);
  airframe.updateMatrixWorld(true);
  airframe.name="FlightGear-C172P-detailed-source-GLB";
  detailedHolder.add(airframe);
  const rotations=new Map();
  for(const name of ["flaps","leftaileron","rightaileron",
    "elevatorleft","elevatorright","rudder_1","Propeller"]){
   rotations.set(name,found.get(name).quaternion.clone());
  }
  let meshes=0,materials=0;
  airframe.traverse(obj=>{if(obj.isMesh){meshes++;materials+=Array.isArray(obj.material)?
   obj.material.length:1;}});
  // Real cabin coordinates are derived from the detailed source nodes,
  // never estimated as unrelated constants near the aircraft tail.
  const pilot=found.get("pilotseat_left").getWorldPosition(new THREE.Vector3());
  const rightPilot=found.get("pilotseat_right").getWorldPosition(new THREE.Vector3());
  const panel=found.get("panel_1_gauges").getWorldPosition(new THREE.Vector3());
  const back=found.get("backseat_left").getWorldPosition(new THREE.Vector3());
  detailedParts={airframe,found,rotations,meshes,materials,size:size.toArray(),
   cameraStations:{pilot,panel,back,rightPilot}};
  detailedLoaded=true;
  const pilotButton=byId("pilotCamera");if(pilotButton)pilotButton.hidden=false;
  applyDetailedControls(getInputs());
  status("FlightGear C172P inspection model loaded. Seats and panel belong to source mesh.");
  return true;
 }catch(error){
  console.error("Detailed C172 evaluation model:",error);
  status("Detailed C172 unavailable (still under model/source review): "+String(error.message||error));
  return false;
 }
}
function applyDetailedControls({flaps=0,bank=0,pitch=0,rudder=0,power=0}={}){
 if(!detailedParts)return;
 const {found,rotations}=detailedParts;
 const turn=(name,axis,radians)=>{
  const object=found.get(name);if(!object)return;
  object.quaternion.copy(rotations.get(name));
  object.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(axis,radians));
 };
 const z=new THREE.Vector3(0,0,1),y=new THREE.Vector3(0,1,0);
 turn("flaps",z,clamp(flaps,0,30)*Math.PI/180);
 turn("leftaileron",z,clamp(bank,-1,1)*.30);
 turn("rightaileron",z,-clamp(bank,-1,1)*.30);
 turn("elevatorleft",z,clamp(pitch,-1,1)*.25);
 turn("elevatorright",z,clamp(pitch,-1,1)*.25);
 turn("rudder_1",y,clamp(rudder,-1,1)*.26);
 found.get("Propeller").userData.power=clamp(power,0,1);
}
const modeSelect=byId("modelVersion"),inputs={
 flaps:byId("flapControl"),bank:byId("aileronControl"),
 pitch:byId("elevatorControl"),rudder:byId("rudderControl"),power:byId("powerControl")
};
function getInputs(){return Object.fromEntries(Object.entries(inputs).map(([k,v])=>[k,Number(v.value)]));}
function setValueUI(){
 const state=getInputs();
 model.applyControls(state);
 applyDetailedControls(state);
 for(const [k,v] of Object.entries(state)){
  const el=byId(k+"Value");if(el)el.textContent=k==="flaps"?v+"°":Math.round(v*100)+"%";
 }
}
for(const input of Object.values(inputs))input?.addEventListener("input",setValueUI);
setValueUI();
modeSelect?.addEventListener("change",async()=>{
 if(modeSelect.value==="detailed"){
  if(!(await loadDetailedCandidate())){modeSelect.value="v3";return;}
  model.root.visible=false;
  referenceHolder.visible=false;
  detailedHolder.visible=true;
 }else if(modeSelect.value==="source"){
  if(!(await loadReference())){modeSelect.value="v3";return;}
  model.root.visible=false;referenceHolder.visible=true;
  detailedHolder.visible=false;
  status("Original lightweight C172 GLB shown unchanged. Surfaces do not articulate.");
 }else{
  model.root.visible=true;referenceHolder.visible=false;
  detailedHolder.visible=false;
  status("V3 named-airframe preview: inspect cabin, surfaces and nose alignment.");
 }
});
byId("resetCamera")?.addEventListener("click",()=>{
 controls.minDistance=5.8;camera.fov=49;camera.updateProjectionMatrix();
 camera.position.set(10,5.1,9.7);controls.target.set(0,-.15,.1);controls.update();
});
byId("cabinCamera")?.addEventListener("click",()=>{
 controls.minDistance=.3;camera.fov=49;camera.updateProjectionMatrix();
 camera.position.set(2.5,.75,4.2);controls.target.set(0,-.15,1.14);controls.update();
});
byId("pilotCamera")?.addEventListener("click",()=>{
 if(!detailedParts||!detailedHolder.visible){
  status("Pilot camera needs the detailed FlightGear C172 evaluation model.");
  return;
 }
 const {pilot,panel}=detailedParts.cameraStations;
 // OrbitControls accepts very short camera-target distances for an in-cabin
 // view, unlike the exterior 5.8m minimum. Perspective tracks source nodes.
 controls.minDistance=.15;
 camera.position.copy(pilot).add(new THREE.Vector3(0,.56,-.12));
 controls.target.copy(panel).add(new THREE.Vector3(0,.18,0));
 camera.fov=58;camera.updateProjectionMatrix();controls.update();
 status("C172 pilot-seat view. Panel and cockpit are the original source mesh.");
});
byId("topCamera")?.addEventListener("click",()=>{
 camera.position.set(0,12,.01);controls.target.set(0,-.15,.01);controls.update();
});
byId("resetSurfaces")?.addEventListener("click",()=>{
 for(const [k,el] of Object.entries(inputs))el.value=k==="power"?"0.6":"0";
 setValueUI();
});
let stopped=false,last=performance.now(),frames=0,start=last;
function animate(t){
 if(stopped)return;
 const dt=Math.min((t-last)/1000,.06);last=t;
 const size=canvas.getBoundingClientRect();
 const w=Math.max(1,size.width),h=Math.max(1,size.height);
 if(canvas.width!==Math.round(w*renderer.getPixelRatio())||
    canvas.height!==Math.round(h*renderer.getPixelRatio())){
  renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();
 }
 if(model.root.visible)model.prop.rotation.z+=dt*(.3+model.prop.userData.power*33);
 if(detailedHolder.visible&&detailedParts){
  const p=detailedParts.found.get("Propeller");
  detailedPropAngle+=dt*(.3+(p.userData.power??.6)*33);
  p.quaternion.copy(detailedParts.rotations.get("Propeller"));
  p.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(
   new THREE.Vector3(1,0,0),detailedPropAngle));
 }
 controls.update();renderer.render(scene,camera);
 if(++frames===36){
  const fps=Math.round(frames*1000/Math.max(1,t-start));
  const display=byId("fpsCounter");if(display)display.textContent="Browser ≈"+fps+" fps (not actual phone proof)";
  frames=0;start=t;
 }
 requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
window.addEventListener("pagehide",()=>{stopped=true;renderer.dispose();controls.dispose();});
status("V3 C172 rig loaded. Drag to rotate; pinch to zoom. Experimental visual preview only.");
// Read-only test metadata. No tests can change the live V2 app.
window.__AGSA_V3={
 ready:true,engine:"three.js",rig:model.root,
 objectNames:model.root.children.map(o=>o.name),
 seatNames:model.interior.seats.map(o=>o.name),
 getControls:()=>({
  leftFlap:model.left.flap.rotation.x,
  rightFlap:model.right.flap.rotation.x,
  leftAileron:model.left.aileron.rotation.x,
  rightAileron:model.right.aileron.rotation.x,
  leftElevator:model.tail.elevators[0].rotation.x,
  rudder:model.tail.rudder.rotation.y
 }),
 getMode:()=>detailedHolder.visible?"detailed":referenceHolder.visible?"reference":"v3",
 getReferenceLoaded:()=>referenceLoaded,
 getDetailedLoaded:()=>detailedLoaded,
 getDetailedMeta:()=>detailedParts?({
  names:[...detailedParts.found.keys()],
  meshes:detailedParts.meshes,materials:detailedParts.materials,
  size:detailedParts.size,
  cockpit:{
   pilot:detailedParts.cameraStations.pilot.toArray(),
   panel:detailedParts.cameraStations.panel.toArray(),
   rear:detailedParts.cameraStations.back.toArray()
  },
  seating:EXPECTED_DETAILED_NAMES.filter(x=>x.includes("seat")),
  mode:detailedHolder.visible?"detailed":"other"
 }):null,
 getDetailedTransforms:()=>detailedParts?Object.fromEntries(
  ["flaps","leftaileron","rightaileron","elevatorleft","rudder_1"].map(name=>
   [name,detailedParts.found.get(name).quaternion.toArray()])):null
};
