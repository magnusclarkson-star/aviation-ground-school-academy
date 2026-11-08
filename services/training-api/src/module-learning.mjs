/* Privacy-minimised authenticated educational self-check claims.
 * An authenticated account identifies the submitter, not the truth of the score.
 * The question bank and answer key remain public, so scores are NOT verified.
 */
import {ClientError} from "./validation.mjs";

export const MODULE_ASSESSMENT_REVISION="2026-11-08.1";
export const MODULE_SOURCE_STATUS="UNVERIFIED_CLIENT_SELF_CHECK";
export const MODULE_CLAIM_DAILY_LIMIT=24;
const MODULES=new Set(["foundations","cockpit","operations","awareness"]);
const KEYS=new Set(["schema","moduleId","revision","correct","total"]);
const fail=message=>{throw new ClientError(400,"invalid_module_claim",message)};
export function validateModuleClaim(input){
 if(!input||typeof input!=="object"||Array.isArray(input))fail("Expected an educational module self-check claim");
 if(Object.keys(input).some(key=>!KEYS.has(key)))fail("Unsupported module claim fields, including identities or approval status");
 if(input.schema!=="agsa.private.module-practice-claim.v1")fail("Unsupported module claim schema");
 if(!MODULES.has(input.moduleId))fail("Unknown module");
 if(input.revision!==MODULE_ASSESSMENT_REVISION)fail("Outdated module question bank revision");
 if(input.total!==6||!Number.isInteger(input.correct)||input.correct<0||input.correct>6)
  fail("Invalid six-question self-reported result");
 return {
  moduleId:input.moduleId,
  revision:MODULE_ASSESSMENT_REVISION,
  correct:input.correct,
  total:6,
  sourceStatus:MODULE_SOURCE_STATUS,
  flightCredit:false,
  certificateEligible:false
 };
}
