// Client-only *self-study* milestone checks. Not a regulated examination,
// enrolment, fee entitlement, signed academic record or verifiable credential.
export const INTRO_KEY="agsa.coursebook.attempts.v1";
export function eligibleModule(Core,Deep,id,rawCore,rawAdvanced){
 if(!Core?.modules?.some(m=>m.id===id)||!Deep?.unit?.(id))return false;
 const first=Core.clean(rawCore).filter(x=>x.id===id).at(-1);
 const second=Deep.cleanHistory(rawAdvanced).filter(x=>x.id===id).at(-1);
 return !!first&&first.correct>=2&&!!second&&second.correct>=3&&second.caseCorrect===true;
}
export function eligibleModules(Core,Deep,rawCore,rawAdvanced){
 return Core.modules.filter(m=>eligibleModule(Core,Deep,m.id,rawCore,rawAdvanced));
}
export function eligibleProgramme(Core,Deep,rawCore,rawAdvanced,rawCapstone){
 return Deep.completion(rawCore,rawAdvanced,rawCapstone).selfStudyRouteComplete===true;
}
export function prepareSelfStudyAward({Core,Deep,id,programme=false,name="Academy Learner",
 rawCore,rawAdvanced,rawCapstone,now=new Date().toISOString()}){
 if(programme){
  if(!eligibleProgramme(Core,Deep,rawCore,rawAdvanced,rawCapstone))
   throw Error("All Academy module practice milestones and the final review must be completed");
  return {kind:"SELF_STUDY_PROGRAMME",name,courseTitle:"Aviation Ground School Foundations",
   revision:Deep.REVISION,issuedAt:now,detail:"72 lesson sections  -  12 subjects  -  24-question review"};
 }
 const module=Core.modules.find(m=>m.id===id);
 if(!module||!eligibleModule(Core,Deep,id,rawCore,rawAdvanced))
  throw Error("Both module practice targets must be met before a module certificate");
 return {kind:"SELF_STUDY_MODULE",name,courseTitle:module.title,revision:Deep.REVISION,
  issuedAt:now,detail:"Introductory knowledge check and advanced scenario completed"};
}
