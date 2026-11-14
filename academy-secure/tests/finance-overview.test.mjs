import test from "node:test";
import assert from "node:assert/strict";
import {buildFinanceOverview} from "../finance-overview.mjs";

const asOf=new Date("2026-11-14T14:00:00Z");
test("owner finance overview is empty and makes no provider/revenue claims",()=>{
 const result=buildFinanceOverview([],[],asOf);
 assert.deepEqual(result.counts,{active:0,pending:0,expiring14Days:0,discountedActive:0,dateEnded:0});
 assert.deepEqual(result.byCountryCurrency,[]);
 assert.deepEqual(result.manualAttestations,[]);
 assert.equal(result.paymentProviderConnected,false);
 assert.equal(result.bankVerifiedRevenue,false);
 assert.match(result.note,/not revenue/i);
 assert.match(result.note,/not independently verified/i);
 assert.equal(result.asOf,asOf.toISOString());
});
test("owner overview shows all groups without adding different currencies",()=>{
 const rows=[
  {country_code:"SL",currency:"SLE",active_count:2,pending_count:1,expiring_count:1,
   discounted_count:1,ended_count:0,pending_minor:"75000",active_discount_minor:"150000"},
  {country_code:"GB",currency:"GBP",active_count:1,pending_count:2,expiring_count:0,
   discounted_count:0,ended_count:3,pending_minor:"90000",active_discount_minor:"0"}
 ];
 const attestations=[
  {currency:"GBP",attestation_count:1,attested_minor:"8000"},
  {currency:"SLE",attestation_count:5,attested_minor:"130000"}
 ];
 const result=buildFinanceOverview(rows,attestations,asOf);
 assert.deepEqual(result.counts,{active:3,pending:3,expiring14Days:1,discountedActive:1,dateEnded:3});
 assert.deepEqual(result.byCountryCurrency.map(x=>[x.countryCode,x.currency,x.pendingMinor,x.activeDiscountMinor]),
  [["SL","SLE","75000","150000"],["GB","GBP","90000","0"]]);
 assert.deepEqual(result.manualAttestations.map(x=>[x.currency,x.count,x.amountMinor]),
  [["GBP",1,"8000"],["SLE",5,"130000"]]);
 assert.equal(result.pendingMinor,undefined,"Never create a cross-currency financial total");
});
test("large but valid integer amounts remain text without JS rounding",()=>{
 const amount="900719925474099399";
 const result=buildFinanceOverview([{
  country_code:"SL",currency:"SLE",active_count:0,pending_count:1,
  expiring_count:0,discounted_count:0,ended_count:0,
  pending_minor:amount,active_discount_minor:"0"
 }],[],asOf);
 assert.equal(result.byCountryCurrency[0].pendingMinor,amount);
});
test("invalid aggregate values or malformed country/currency are rejected",()=>{
 const baseline={country_code:"SL",currency:"SLE",active_count:1,pending_count:0,
  expiring_count:0,discounted_count:0,ended_count:0,pending_minor:"0",active_discount_minor:"0"};
 for(const invalid of [{...baseline,active_count:-1},{...baseline,currency:"EUR;DROP"},
  {...baseline,country_code:"S"}, {...baseline,pending_minor:"-100"},
  {...baseline,ended_count:"1.5"}])
  assert.throws(()=>buildFinanceOverview([invalid],[],asOf),/Invalid|Unsupported/);
 assert.throws(()=>buildFinanceOverview([], [{currency:"XYZ",attestation_count:1,attested_minor:"2"}],asOf),/Unsupported/);
 assert.throws(()=>buildFinanceOverview(null,[],asOf),/Invalid/);
 assert.throws(()=>buildFinanceOverview([],[],new Date("invalid")),/Invalid/);
});
