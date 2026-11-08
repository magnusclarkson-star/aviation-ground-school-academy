/* Public curriculum review worksheet model.
 * Produces editable, UNSIGNED discussion drafts only. Not authentication,
 * source verification, teaching approval, or an accredited record.
 */
(function(root){
"use strict";
const L=root?.AGSAAIInstructorLessons||(typeof module!=="undefined"?require("./ai-instructor-lessons.js"):null);
const C=root?.AGSACurriculum||(typeof module!=="undefined"?require("./ai-instructor-curriculum.js"):null);
const dimensions=Object.freeze([
 {id:"factualAccuracy",label:"Technical accuracy"},
 {id:"objectiveAlignment",label:"Learning objectives and quiz alignment"},
 {id:"sourceTraceability",label:"Source relevance and edition checking"},
 {id:"safetyBoundary",label:"Non-operational safety boundaries"},
 {id:"youthAccessibility",label:"Accessibility and age appropriateness"},
 {id:"localRegulatoryScope",label:"Local jurisdiction and syllabus scope"}
]);
const responses=new Set(["not-reviewed","needs-edits","discuss-with-instructor"]);
function detail(id){
 const lesson=L.lessons.find(entry=>entry.id===id),curriculum=C.get(id);
 if(!lesson||!curriculum)throw Error("Select a supported curriculum lesson");
 return {lesson,curriculum};
}
function normalizeReview(input){
 if(!input||typeof input!=="object"||Array.isArray(input))throw Error("Review selections required");
 if(Object.keys(input).some(k=>!["judgements","comments","nextAction"].includes(k)))throw Error("Unknown review field");
 if(!input.judgements||typeof input.judgements!=="object"||Array.isArray(input.judgements))throw Error("Review checklist required");
 if(Object.keys(input.judgements).some(k=>!dimensions.some(d=>d.id===k)))throw Error("Unknown review dimension");
 const judgements={};
 for(const d of dimensions){
  const value=input.judgements[d.id]||"not-reviewed";
  if(!responses.has(value))throw Error("Invalid review judgement");
  judgements[d.id]=value;
 }
 const comments=typeof input.comments==="string"?input.comments.trim().slice(0,1400):"";
 const nextAction=typeof input.nextAction==="string"?input.nextAction.trim().slice(0,650):"";
 if(!comments&&!nextAction&&Object.values(judgements).every(v=>v==="not-reviewed"))
  throw Error("Add a discussion note, an action or a checklist observation");
 return {judgements,comments,nextAction};
}
function draft(id,input,createdAt=new Date().toISOString()){
 const {lesson,curriculum}=detail(id);
 const review=normalizeReview(input);
 if(typeof createdAt!=="string"||!Number.isFinite(Date.parse(createdAt)))throw Error("Invalid draft timestamp");
 return {
  schema:"agsa.unsigned-curriculum-review.v1",
  recordStatus:"UNVERIFIED_DRAFT_ONLY",
  createsCourseApproval:false,
  authenticatesReviewer:false,
  grantsTrainingCredit:false,
  createdAt:new Date(createdAt).toISOString(),
  snapshot:{
   lessonId:lesson.id,lessonName:lesson.name,
   publishedAs:"PUBLIC_EDUCATIONAL_DEMONSTRATION",
   metadataVersion:curriculum.version,
   currentReviewStatus:curriculum.reviewStatus,
   intro:lesson.intro,body:lesson.body,
   objectives:[...curriculum.objectives],
   quiz:{question:lesson.question,options:[...lesson.options],correctIndex:lesson.correct,
    explanation:lesson.explanation},
   referencePointers:curriculum.references.map(ref=>({id:ref.id,title:ref.title,url:ref.url,topic:ref.topic})),
   safetyScope:curriculum.scope
  },
  observations:review,
  warning:"UNSIGNED educational curriculum discussion only. No verified instructor identity, regulator authorisation, source-to-claim validation, or approval is implied."
 };
}
const api={dimensions,responses:[...responses],detail,normalizeReview,draft};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSACurriculumReview=api;
})(typeof window!=="undefined"?window:null);
