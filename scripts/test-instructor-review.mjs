import assert from "node:assert/strict";
import {createRequire} from "node:module";
const require=createRequire(import.meta.url);
const M=require("../instructor-review-model.js");
const example=M.demo();
const payload=JSON.stringify(example);
const loaded=M.parseText(payload);
assert.equal(loaded.kind,"individual-report");
assert.equal(loaded.records.length,1);
assert.equal(loaded.records[0].taskId,"turn");
assert.equal(loaded.records[0].score,76);
assert.equal(loaded.records[0].sampleCount,120);
assert.equal(loaded.records[0].autoSuggestions.length,2);
const answer={instrumentScan:"needs-discussion",controlCoordination:"practice-recommended",riskAwareness:"not-reviewed",
 commentary:"Review simulated turn coordination with a competent instructor.",nextAction:"Repeat the turn exercise."};
const draft=M.reviewDraft(loaded.records[0],answer,"2026-11-07T19:00:00.000Z");
assert.equal(draft.schema,"agsa.unverified-review-draft.v1");
assert.equal(draft.recordStatus,"UNVERIFIED_DRAFT_ONLY");
assert.equal(draft.source.claimedScorePercent,76);
assert.match(draft.notice,/NOT AN INSTRUCTOR SIGN-OFF/);
assert.ok(!("student" in draft)&&!("instructor" in draft));
assert.equal(draft.reviewQuestions.rubric.instrumentScan,"needs-discussion");
assert.equal(draft.reviewQuestions.comments,answer.commentary);
assert.throws(()=>M.reviewDraft(loaded.records[0],{...answer,commentary:"",nextAction:""}),/Enter at least one/);
assert.throws(()=>M.reviewDraft(loaded.records[0],{...answer,instrumentScan:"approved"}),/Invalid rubric/);
assert.throws(()=>M.reviewDraft({taskId:"notReal",outcome:"INCOMPLETE"},answer),/supported report/);
const huge="a".repeat(262145);
assert.throws(()=>M.parseText(huge),/256 KB/);
assert.throws(()=>M.parseText("not-json"),/Invalid JSON/);
assert.throws(()=>M.parse({schema:"bad"}),/Unsupported report/);
assert.throws(()=>M.parse({schema:"agsa.local-journal.v1",records:Array.from({length:21},()=>({}))}),/20 entries/);
assert.throws(()=>M.parse({...example,observation:{...example.observation,matchedPercent:100}}),/Percentage/);
assert.throws(()=>M.parse({...example,observation:{...example.observation,matchedSamples:145}}),/invalid/);
assert.throws(()=>M.parse({...example,createdAt:"nonsense"}),/timestamp/);
const journal={schema:"agsa.local-journal.v1",records:[
 {id:"local-one",taskId:"flap",taskTitle:"Flap configuration observation",storedAt:"2026-11-07T19:00:00Z",
  outcome:"INCOMPLETE",score:30,observedSeconds:4.1,suggestedNextSteps:["Wait for flap travel"]},
 {id:"local-two",taskId:"level",taskTitle:"Straight and level",storedAt:"2026-11-07T19:01:00Z",
  outcome:"PRACTICE_TARGET_MET",score:84,observedSeconds:12,suggestedNextSteps:[]}
]};
const list=M.parse(journal);
assert.equal(list.kind,"local-journal-export");
assert.equal(list.records.length,2);
assert.equal(list.records[0].sampleCount,null);
assert.match(list.records[0].sourceEvidence,/No original observation/);
const journalReview=M.reviewDraft(list.records[0],answer,"2026-11-07T19:02:00Z");
assert.equal(journalReview.source.type,"local-journal-export");
assert.equal(journalReview.source.claimedOutcome,"INCOMPLETE");
assert.throws(()=>M.parse({schema:"agsa.local-journal.v1",records:[{...journal.records[0],taskId:"invalid"}]}),/invalid/);
const hostile={...example,task:{...example.task,title:"<img src=x onerror=alert(1)>"}};
assert.ok(M.parse(hostile).records[0].taskTitle.includes("<img"),"imports stay inert data; DOM must render text only");
const longNote=M.reviewDraft(loaded.records[0],{...answer,commentary:"x".repeat(1800)});
assert.equal(longNote.reviewQuestions.comments.length,1200);
console.log("Review workbench model passed: report and journal intake, size/schema/score validation, unsigned draft rubric and hostile input handling.");
