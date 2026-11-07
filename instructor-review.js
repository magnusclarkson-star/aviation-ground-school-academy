/* AGSA non-credentialed instructor review mockup. All imports are untrusted.
 * No uploads, browser persistence, authentication, or official sign-off.
 */
(function(){
"use strict";
const Model=window.AGSAReviewModel;
const $=id=>document.getElementById(id);
if(!Model){document.body.insertAdjacentText("afterbegin","Review model unavailable.");return;}
let records=[],kind="",demo=false;
function notify(id,message,type=""){
 const el=$(id);el.textContent=message;
 if(type)el.dataset.state=type;else el.removeAttribute("data-state");
}
function clearDraftForm(){
 for(const id of ["rubricScan","rubricControl","rubricRisk"])$(id).value="not-reviewed";
 $("reviewComment").value="";
 $("reviewNext").value="";
 notify("reviewStatus","No official assessment or sign-off has been created.");
}
function resetWorkspace(){
 records=[];kind="";demo=false;
 $("recordSelect").replaceChildren();
 $("reportPanel").classList.add("hidden");
 $("reviewPanel").classList.add("hidden");
 $("reportFile").value="";
 $("reportText").value="";
 clearDraftForm();
}
function current(){
 const index=Number($("recordSelect").value);
 return Number.isInteger(index)&&index>=0&&index<records.length?records[index]:null;
}
function showRecord(){
 const rec=current();
 if(!rec)return;
 $("sourceTask").textContent=rec.taskTitle;
 $("sourceOutcome").textContent=rec.outcome.replaceAll("_"," ");
 $("sourceTime").textContent=rec.createdAt;
 $("sourceScore").textContent=rec.score+"%";
 $("sourceNotice").textContent=(demo?"FICTIONAL EXAMPLE. ":"")+rec.sourceEvidence;
 $("sourceTarget").textContent=rec.sourceHint;
 const indication=rec.finalIllustrativeIndications;
 const values=indication?Object.entries(indication).filter(([,value])=>value!==null).map(([key,value])=>key+": "+value):[];
 $("sourceIndications").textContent=values.length?"Final reported simulated indications: "+values.join(" · "):"No verified instrument trace is available in this import.";
 $("sourceSuggestions").replaceChildren();
 const suggestions=rec.autoSuggestions||[];
 $("suggestionGroup").classList.toggle("hidden",!suggestions.length);
 for(const tip of suggestions){
  const li=document.createElement("li");li.textContent=tip;$("sourceSuggestions").appendChild(li);
 }
 clearDraftForm();
}
function loadInput(data,isDemo=false){
 const parsed=Model.parse(data);
 records=parsed.records;kind=parsed.kind;demo=isDemo;
 $("recordSelect").replaceChildren();
 records.forEach((rec,i)=>{
  const option=document.createElement("option");
  option.value=String(i);
  option.textContent=(i+1)+". "+rec.taskTitle+" · "+rec.score+"% · "+rec.createdAt;
  $("recordSelect").appendChild(option);
 });
 $("reportPanel").classList.toggle("hidden",records.length===0);
 $("reviewPanel").classList.toggle("hidden",records.length===0);
 if(records.length)showRecord();
 notify("importStatus",isDemo?"Fictional example loaded. It does not represent a learner or authentic flight activity.":records.length+" unverified "+(records.length===1?"entry":"entries")+" loaded from "+(kind==="local-journal-export"?"local practice journal":"practice report")+". Nothing was uploaded or authenticated.","success");
}
async function importFile(file){
 resetWorkspace();
 if(!file){notify("importStatus","Choose a JSON file or use the example.");return;}
 if(file.size>Model.maxBytes){
  notify("importStatus","File exceeds the 256 KB import limit.","error");return;
 }
 try{
  const raw=await file.text();
  Model.parseText(raw);
  loadInput(JSON.parse(raw));
 }catch(e){notify("importStatus","Could not open report: "+e.message,"error");}
}
function downloadDraft(value,filename){
 const bytes=new Blob([JSON.stringify(value,null,2)+"\n"],{type:"application/json"});
 const uri=URL.createObjectURL(bytes);
 const link=document.createElement("a");link.href=uri;link.download=filename;
 document.body.appendChild(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(uri),350);
}
$("demoLoad").onclick=()=>{
 resetWorkspace();
 try{loadInput(Model.demo(),true);}catch(e){notify("importStatus",e.message,"error");}
};
$("clearReview").onclick=()=>{
 resetWorkspace();notify("importStatus","Workspace cleared; imported data and draft notes were discarded.");
};
$("reportFile").addEventListener("change",async e=>{
 const file=e.target.files&&e.target.files[0];
 await importFile(file);
});
$("parseText").onclick=()=>{
 const raw=$("reportText").value;
 resetWorkspace();
 try{
  Model.parseText(raw);
  loadInput(JSON.parse(raw));
 }catch(e){notify("importStatus","Could not read pasted report: "+e.message,"error");}
};
$("recordSelect").onchange=showRecord;
$("draftReset").onclick=clearDraftForm;
$("draftDownload").onclick=()=>{
 const rec=current();
 if(!rec){notify("reviewStatus","Import a supported report before drafting a review.","error");return;}
 try{
  const model={
   instrumentScan:$("rubricScan").value,controlCoordination:$("rubricControl").value,
   riskAwareness:$("rubricRisk").value,
   commentary:$("reviewComment").value,nextAction:$("reviewNext").value
  };
  const draft=Model.reviewDraft(rec,model);
  downloadDraft(draft,"agsa-UNVERIFIED-"+rec.taskId+"-review-draft.json");
  notify("reviewStatus","Unverified review draft downloaded. No identity was checked, no instructor approved it and no school record was created.","success");
 }catch(e){notify("reviewStatus","Unable to create draft: "+e.message,"error");}
};
notify("importStatus","No report loaded. You can open a fictional example without needing an account.");
})();
