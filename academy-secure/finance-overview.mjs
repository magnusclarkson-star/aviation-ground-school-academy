// Read-only owner finance dashboard data model. It never processes money or
// interprets staff-attested off-platform receipts as bank-verified revenue.
const CURRENCIES=new Set(["SLE","USD","GBP","EUR","CAD","AUD"]);
function whole(value,label){
 const n=Number(value);
 if(!Number.isSafeInteger(n)||n<0)throw Error("Invalid finance summary "+label);
 return n;
}
function minor(value,label){
 if(!/^(?:0|[1-9][0-9]*)$/.test(String(value)))throw Error("Invalid finance summary "+label);
 return BigInt(value).toString();
}
export function buildFinanceOverview(grants,attestations,asOf=new Date()){
 if(!Array.isArray(grants)||!Array.isArray(attestations)||!Number.isFinite(asOf.getTime()))
  throw Error("Invalid finance overview inputs");
 const counters={active:0,pending:0,expiring14Days:0,discountedActive:0,dateEnded:0};
 const byCountryCurrency=grants.map(row=>{
  const countryCode=String(row.country_code||"").trim().toUpperCase();
  const currency=String(row.currency||"").trim().toUpperCase();
  if(!/^[A-Z]{2}$/.test(countryCode)||!CURRENCIES.has(currency))
   throw Error("Unsupported country or currency in private finance overview");
  const counts={
   active:whole(row.active_count,"active"),
   pending:whole(row.pending_count,"pending"),
   expiring14Days:whole(row.expiring_count,"expiring"),
   discountedActive:whole(row.discounted_count,"discounted"),
   dateEnded:whole(row.ended_count,"ended")
  };
  for(const [key,value] of Object.entries(counts))counters[key]+=value;
  return Object.freeze({countryCode,currency,...counts,
   pendingMinor:minor(row.pending_minor,"pending amount"),
   activeDiscountMinor:minor(row.active_discount_minor,"discount amount")});
 });
 const manualAttestations=attestations.map(row=>{
  const currency=String(row.currency||"").trim().toUpperCase();
  if(!CURRENCIES.has(currency))throw Error("Unsupported attestation currency");
  return Object.freeze({currency,
   count:whole(row.attestation_count,"attestations"),
   amountMinor:minor(row.attested_minor,"attested amount")});
 });
 return Object.freeze({
  asOf:asOf.toISOString(),counts:Object.freeze(counters),
  byCountryCurrency:Object.freeze(byCountryCurrency),
  manualAttestations:Object.freeze(manualAttestations),
  paymentProviderConnected:false,bankVerifiedRevenue:false,
  note:"Amounts awaiting payment are not revenue. Settlement records are owner-attested, not independently verified by a payment gateway. Currencies are never added together."
 });
}
