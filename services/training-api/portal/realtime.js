/* Private same-origin two-way aviation tutor via WebRTC.
 * Browser gets microphone access only after a deliberate user click; it
 * never receives long-lived provider credentials or an API token.
 */
(()=>{"use strict";
const $=id=>document.getElementById(id);
if(!$("realtimeStart"))return;
let enabled=false,connection=null,channel=null,microphone=null,handle=null;
let timer=null,expires=0,generation=0,muted=false,starting=false;
const transcript=$("realtimeTranscript"),audio=$("realtimePlayback");
const startButton=$("realtimeStart"),stopButton=$("realtimeStop"),muteButton=$("realtimeMute");
function setStatus(message,tone=""){
 const node=$("realtimeStatus");node.textContent=message;
 if(tone)node.dataset.tone=tone;else node.removeAttribute("data-tone");
}
function csrf(){
 for(const cookie of document.cookie.split(";")){
  const [name,...parts]=cookie.trim().split("=");
  if(name==="__Host-AGSA-CSRF"||name==="agsa_local_csrf")return parts.join("=");
 }
 return "";
}
function setButtons(){
 startButton.disabled=!enabled||starting||!!connection||!$("realtimeConsent").checked;
 stopButton.disabled=!starting&&!connection;
 muteButton.disabled=!microphone||!connection;
 muteButton.textContent=muted?"Unmute microphone":"Mute microphone";
}
async function post(path,payload,{keepalive=false}={}){
 const csrfToken=csrf();
 if(!csrfToken)throw Error("Your secure account session has expired. Sign in again.");
 const response=await fetch(path,{
  method:"POST",credentials:"same-origin",cache:"no-store",keepalive,
  headers:{"Content-Type":"application/json","X-AGSA-CSRF":csrfToken},
  body:JSON.stringify(payload)
 });
 if(!response.ok){
  let message="Voice request could not be completed.";
  try{const body=await response.json();message=body.message||message}catch{}
  throw Error(message);
 }
 return response.json();
}
function stopLocal(){
 if(timer){clearInterval(timer);timer=null}
 if(microphone){for(const t of microphone.getTracks())t.stop();microphone=null}
 if(channel){try{channel.close()}catch{}channel=null}
 if(connection){try{connection.close()}catch{}connection=null}
 audio.pause();audio.srcObject=null;
 muted=false;starting=false;expires=0;
 setButtons();
}
async function endConversation(reason="Session ended.",{silent=false,keepalive=false}={}){
 generation++;
 const oldHandle=handle;
 handle=null;
 stopLocal();
 $("realtimeConsent").checked=false;
 setButtons();
 if(!silent)setStatus(reason);
 if(oldHandle){
  try{await post("/api/v1/ai/realtime-end",{handle:oldHandle},{keepalive})}
  catch{if(!silent)setStatus(reason+" Server confirmation was unavailable; its automatic hang-up safeguard remains in place.","error")}
 }
 setButtons();
}
function formatRemaining(seconds){
 const n=Math.max(0,Math.ceil(seconds));
 return Math.floor(n/60)+":"+String(n%60).padStart(2,"0");
}
function handleEvent(event){
 let obj;try{obj=JSON.parse(event.data)}catch{return}
 switch(obj.type){
  case "input_audio_buffer.speech_started":
   setStatus("Listening to your question… microphone active.");break;
  case "input_audio_buffer.speech_stopped":
   setStatus("Question received. The AI instructor is preparing an answer…");break;
  case "response.created":
   transcript.textContent="";break;
  case "response.output_audio_transcript.delta":
   if(typeof obj.delta==="string")transcript.textContent=(transcript.textContent+obj.delta).slice(-2600);
   break;
  case "response.output_audio_transcript.done":
   if(typeof obj.transcript==="string"&&obj.transcript.trim())
    transcript.textContent=obj.transcript.slice(0,2600);
   break;
  case "response.done":
   setStatus("AI instructor response complete. You can ask another short question while connected.");break;
  case "error":
   setStatus("AI voice service reported a problem. You may stop and try again.","error");break;
 }
}
async function startConversation(){
 if(starting||connection||!enabled)return;
 if(!$("realtimeConsent").checked){
  setStatus("Please confirm microphone and provider consent before starting.","error");
  return;
 }
 if(!navigator.mediaDevices?.getUserMedia||!window.RTCPeerConnection){
  setStatus("This phone or browser does not support the necessary secure WebRTC microphone connection.","error");
  return;
 }
 const run=++generation;starting=true;
 setButtons();
 setStatus("Requesting your device's microphone permission…");
 try{
  microphone=await navigator.mediaDevices.getUserMedia({
   audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},
   video:false
  });
  if(run!==generation){for(const track of microphone.getTracks())track.stop();microphone=null;return;}
  connection=new RTCPeerConnection();
  connection.ontrack=event=>{
   if(run!==generation)return;
   if(event.streams?.[0]){
    audio.srcObject=event.streams[0];
    audio.play().catch(()=>{
     setStatus("AI voice connected. Tap Play on the audio control to hear the instructor.");
    });
   }
  };
  connection.onconnectionstatechange=()=>{
   if(run!==generation)return;
   const state=connection?.connectionState;
   if(state==="failed"||state==="closed")void endConversation("Voice connection closed.");
  };
  for(const track of microphone.getAudioTracks())connection.addTrack(track,microphone);
  channel=connection.createDataChannel("oai-events");
  channel.addEventListener("message",handleEvent);
  channel.addEventListener("close",()=>{if(run===generation&&connection)void endConversation("Voice channel closed.");});
  const offer=await connection.createOffer();
  await connection.setLocalDescription(offer);
  if(run!==generation)return;
  setStatus("Connecting to the AI voice service. Your main Academy API key stays on the server…");
  const answer=await post("/api/v1/ai/realtime-connect",{
   sdp:connection.localDescription?.sdp||offer.sdp,
   topic:$("aiTopic").value,
   style:$("aiStyle").value,
   voice:$("realtimeVoice").value,
   consent:true
  });
  if(run!==generation){
   if(answer?.handle)void post("/api/v1/ai/realtime-end",{handle:answer.handle}).catch(()=>{});
   return;
  }
  if(answer.mode!=="REALTIME_AI_VOICE"||typeof answer.sdp!=="string"||typeof answer.handle!=="string")
   throw Error("The protected voice service returned an invalid connection response.");
  handle=answer.handle;
  await connection.setRemoteDescription({type:"answer",sdp:answer.sdp});
  if(run!==generation)return;
  starting=false;
  expires=Date.now()+Math.min(Number(answer.maxSeconds)||120,120)*1000;
  setStatus("Connected. Speak an aviation theory question. Microphone is active and the instructor voice is synthetic.","success");
  $("realtimeDuration").textContent="Time remaining: "+formatRemaining((expires-Date.now())/1000)+" · You can mute or end the conversation at any time.";
  timer=setInterval(()=>{
   const seconds=(expires-Date.now())/1000;
   $("realtimeDuration").textContent="Time remaining: "+formatRemaining(seconds)+" · This is an unaccredited teaching demonstration.";
   if(seconds<=0)void endConversation("Two-minute practice limit reached. Your microphone is off.");
  },600);
  setButtons();
 }catch(error){
  await endConversation("Connection unsuccessful: "+(error?.message||"Please try again."),{silent:true});
  setStatus("Voice session could not start: "+(error?.message||"Unknown error"),"error");
 }
}
function configure(data){
 enabled=data?.realtimeEnabled===true;
 setStatus(enabled?
  "Two-way AI voice is available for this fictional staging account. Select your instructor voice and confirm consent before starting.":
  "Two-way AI voice is not enabled here. Public guided lessons and device narration remain available.",
  enabled?"success":"");
 setButtons();
}
window.addEventListener("agsa:ai-status",event=>configure(event.detail));
window.addEventListener("agsa:logout",()=>{void endConversation("Signed out.",{silent:true})});
window.addEventListener("pagehide",()=>{void endConversation("Page closed.",{silent:true,keepalive:true})});
$("realtimeConsent").addEventListener("change",setButtons);
startButton.addEventListener("click",startConversation);
stopButton.addEventListener("click",()=>{void endConversation("Conversation ended. Microphone and audio are off.")});
muteButton.addEventListener("click",()=>{
 if(!microphone)return;
 muted=!muted;
 for(const track of microphone.getAudioTracks())track.enabled=!muted;
 setStatus(muted?"Microphone muted. Your speech is not being sent.":"Microphone on. You can ask your next question.");
 setButtons();
});
setButtons();
})();