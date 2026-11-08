/* Browser-local practice record. Fictional study milestones, not instructor sign-off. */
(function(root){
"use strict";
const KEY="agsa.aiInstructor.practice.v1";
const MAX=100;
function clean(raw,ids){
 const valid=new Set(ids);
 const records=Array.isArray(raw)?raw:[];
 return records.filter(r=>r&&valid.has(r.id)&&typeof r.correct==="boolean"&&Number.isFinite(r.at))
  .slice(-MAX).map(r=>({id:r.id,correct:r.correct,at:Math.max(0,Math.floor(r.at))}));
}
function load(storage,ids){
 try{return clean(JSON.parse(storage.getItem(KEY)),ids)}catch{return []}
}
function record(history,id,correct,ids,now=Date.now()){
 if(!ids.includes(id)||typeof correct!=="boolean")throw Error("Invalid quiz result");
 return clean([...history,{id,correct,at:now}],ids);
}
function overview(history,lessons){
 const ids=lessons.map(l=>l.id);
 const h=clean(history,ids),total=h.length,correct=h.filter(x=>x.correct).length;
 const topics=lessons.map(l=>{
  const answers=h.filter(x=>x.id===l.id);
  const right=answers.filter(x=>x.correct).length;
  const latest=answers.at(-1);
  return {id:l.id,name:l.name,attempts:answers.length,correct:right,
   percent:answers.length?Math.round(right/answers.length*100):null,
   needsReview:answers.length===0||!latest.correct||right/answers.length<.8};
 });
 // Prioritise recently missed topics, then never-attempted lessons, then weak historical scores.
 const candidates=topics.filter(t=>t.needsReview).sort((a,b)=>{
  const aRecent=h.filter(r=>r.id===a.id).at(-1),bRecent=h.filter(r=>r.id===b.id).at(-1);
  const rank=t=>t?(!t.correct?0:2):1;
  return rank(aRecent)-rank(bRecent)||((a.percent??-1)-(b.percent??-1));
 });
 const recommended=candidates[0]||topics.reduce((a,b)=>a.attempts<=b.attempts?a:b);
 return {total,correct,percent:total?Math.round(correct/total*100):null,
  topics,recommended:recommended?.id||null};
}
function save(storage,history,ids){
 try{storage.setItem(KEY,JSON.stringify(clean(history,ids)));return true}catch{return false}
}
const api={KEY,load,record,overview,save};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSAInstructorProgress=api;
})(typeof window!=="undefined"?window:null);
