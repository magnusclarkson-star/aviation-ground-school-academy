/* Voluntary on-device practice journal. No student name, account, cloud sync,
   approval, instructor signature, flight credit or guaranteed data durability. */
(function(root){
"use strict";
const key="agsa.unofficial-practice-journal.v1";
const schema="agsa.local-journal.v1";
const maxEntries=20;
function isValid(r){
 return !!r&&typeof r==="object"&&typeof r.id==="string"&&r.id.length<=90&&
 typeof r.storedAt==="string"&&r.storedAt.length<=40&&
 ["level","climb","turn","descent","flap"].includes(r.taskId)&&
 typeof r.score==="number"&&Number.isFinite(r.score)&&r.score>=0&&r.score<=100&&
 ["PRACTICE_TARGET_MET","INCOMPLETE","PRACTICE_AGAIN"].includes(r.outcome)&&
 typeof r.taskTitle==="string"&&r.taskTitle.length<=80&&
 typeof r.coachHeadline==="string"&&r.coachHeadline.length<=400;
}
function read(storage){
 const raw=storage.getItem(key);
 if(raw==null)return [];
 const parsed=JSON.parse(raw);
 if(!parsed||parsed.schema!==schema||!Array.isArray(parsed.records))throw Error("Existing journal has an unsupported format; no changes were made.");
 if(parsed.records.length>maxEntries)throw Error("Stored journal exceeds its allowed size; no changes were made.");
 if(!parsed.records.every(isValid))throw Error("Stored journal includes invalid entries; no changes were made.");
 return parsed.records.slice();
}
function write(storage,records){
 if(records.length>maxEntries||!records.every(isValid))throw Error("Journal data is invalid.");
 storage.setItem(key,JSON.stringify({schema,notice:"UNOFFICIAL SELF-PRACTICE ONLY — NOT AN APPROVED TRAINING RECORD.",records}));
 return records;
}
function makeRecord(session,review,storedAt,identity){
 if(!session||session.status!=="finished")throw Error("Finish an attempt before saving");
 if(!review||typeof review.headline!=="string")throw Error("Review required");
 const timestamp=typeof storedAt==="string"?storedAt:new Date().toISOString();
 const suffix=typeof identity==="string"?identity:Math.random().toString(36).slice(2,12);
 const outcome=session.passed?"PRACTICE_TARGET_MET":session.stopReason==="ended"?"INCOMPLETE":"PRACTICE_AGAIN";
 const record={
  id:"local-"+timestamp.replace(/[^0-9]/g,"")+"-"+suffix.slice(0,12),
  storedAt:timestamp,
  taskId:session.id,
  taskTitle:{level:"Straight and level",climb:"Climb and power",turn:"Controlled bank and turn",descent:"Controlled descent",flap:"Flap configuration observation"}[session.id],
  outcome,score:Math.max(0,Math.min(100,Math.round(session.percent))),
  observedSeconds:Math.round(session.elapsed*10)/10,
  coachHeadline:review.headline.slice(0,400),
  focusAreas:Array.isArray(review.improvements)?review.improvements.slice(0,3).map(x=>String(x).slice(0,200)):[],
  suggestedNextSteps:Array.isArray(review.nextSteps)?review.nextSteps.slice(0,2).map(x=>String(x).slice(0,300)):[]
 };
 if(!isValid(record))throw Error("Unable to create a valid journal entry");
 return record;
}
function save(storage,record){
 if(!isValid(record))throw Error("Invalid journal entry");
 const entries=read(storage).filter(r=>r.id!==record.id);
 entries.unshift(record);
 return write(storage,entries.slice(0,maxEntries));
}
function remove(storage,id){
 const entries=read(storage);
 if(!entries.some(x=>x.id===id))throw Error("Entry was not found");
 return write(storage,entries.filter(x=>x.id!==id));
}
function clear(storage){storage.removeItem(key);return []}
function exportJournal(storage,exportedAt){
 const records=read(storage);
 return {schema,disclaimer:"LOCAL, UNOFFICIAL, UNVERIFIED PRACTICE JOURNAL — NOT A CERTIFICATE, APPROVED RECORD, FSTD LOG OR FLIGHT-TIME CREDIT.",
  exportedAt:typeof exportedAt==="string"?exportedAt:new Date().toISOString(),
  storageNotice:"This information came from browser storage. It has no verified identity, audit trail, school approval or signature.",
  records};
}
const api={key,schema,maxEntries,isValid,read,makeRecord,save,remove,clear,exportJournal};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.CockpitV3Journal=api;
})(typeof window!=="undefined"?window:null);
