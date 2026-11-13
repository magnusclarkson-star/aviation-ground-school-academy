// Owner-controlled commercial access for the private Academy.
// These fee/scholarship rules NEVER grant SLCAA approval, examiner status,
// an official pass, a training credit, or a pilot qualification.
export const FEE_CURRENCIES=Object.freeze(["SLE","USD","GBP","EUR","CAD","AUD"]);
export const BILLING_PERIODS=Object.freeze(["ONE_TIME","MONTHLY","QUARTERLY","YEARLY"]);
export const GRANT_TYPES=Object.freeze(["PAID","SCHOLARSHIP","WAIVER","PROMOTION","FREE"]);
export const OWNER_ROLE="accountable_manager";
export function isOwner(role){return role===OWNER_ROLE}
export function validCountry(value){return typeof value==="string"&&(/^[A-Z]{2}$/).test(value)}
export function normalizeCurrency(value){
 if(typeof value!=="string"||!FEE_CURRENCIES.includes(value))throw Error("Unsupported fee currency");
 return value;
}
export function validMinorUnits(value){
 return Number.isSafeInteger(value)&&value>=0&&value<=1_000_000_000_00;
}
export function validatePrice({countryCode,currency,billingPeriod,amountMinor}){
 if(!validCountry(countryCode))throw Error("Invalid two-letter country code");
 normalizeCurrency(currency);
 if(!BILLING_PERIODS.includes(billingPeriod))throw Error("Unsupported billing period");
 if(!validMinorUnits(amountMinor))throw Error("Amount must be non-negative integer minor units");
 return {countryCode,currency,billingPeriod,amountMinor};
}
export function calculateAward({grossMinor,grantType,discountBps}){
 if(!validMinorUnits(grossMinor))throw Error("Invalid course price");
 if(!GRANT_TYPES.includes(grantType))throw Error("Invalid access grant type");
 if(!Number.isInteger(discountBps)||discountBps<0||discountBps>10000)throw Error("Discount out of range");
 if(grantType==="PAID"&&discountBps!==0)throw Error("Paid access cannot claim a scholarship discount");
 if(grantType==="PAID"&&grossMinor===0)throw Error("Use a FREE grant for zero-priced access");
 if(grantType==="FREE"&&(discountBps!==10000||grossMinor!==0))throw Error("FREE requires an administratively published zero-priced plan");
 if(grantType==="WAIVER"&&discountBps!==10000)throw Error("Fee waiver must waive 100%");
 if(["SCHOLARSHIP","PROMOTION"].includes(grantType)&&discountBps===0)throw Error("Scholarship or promotion requires a discount");
 const discountMinor=Number((BigInt(grossMinor)*BigInt(discountBps)+5000n)/10000n);
 const payableMinor=grossMinor-discountMinor;
 return {grossMinor,discountMinor,payableMinor,discountBps,grantType,
  status:payableMinor===0?"ACTIVE":"PENDING_PAYMENT"};
}
export function studentHasAccess(grants,courseId,now=new Date()){
 const timestamp=new Date(now).getTime();
 if(!Number.isFinite(timestamp)||typeof courseId!=="string")return false;
 return Array.isArray(grants)&&grants.some(g=>g.course_id===courseId&&g.status==="ACTIVE"&&
  Number.isFinite(new Date(g.starts_at).getTime())&&new Date(g.starts_at).getTime()<=timestamp&&
  (!g.expires_at||(Number.isFinite(new Date(g.expires_at).getTime())&&new Date(g.expires_at).getTime()>timestamp)));
}
export function financialAccessIsNotAccreditation(){
 return Object.freeze({paymentCanGrant:"COURSE_CONTENT_ACCESS_ONLY",
  grantsTrainingCredit:false,grantsExaminationAuthority:false,grantsPilotLicence:false,
  independentAuthorityReviewRequired:true});
}
