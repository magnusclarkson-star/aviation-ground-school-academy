/* Invite-only email ownership verification; provider delivery is disabled unless
 * an operator explicitly configures a verified sender and external email API.
 * Neither invitation URLs nor bearer credentials may be logged.
 */
import {normalizeEmail} from "./crypto.mjs";

export const INVITE_LIFETIME_MS=30*60*1000;
export function verifyTokenFormat(token){
 return typeof token==="string"&&/^[A-Za-z0-9_-]{43}$/.test(token);
}
export function makeVerificationUrl(publicOrigin,token){
 if(!verifyTokenFormat(token))throw Error("Invalid invitation token");
 const origin=new URL(publicOrigin);
 if(!["https:","http:"].includes(origin.protocol)||origin.username||origin.password||
  origin.search||origin.hash||origin.pathname!=="/")throw Error("Invalid portal origin");
 if(origin.protocol!=="https:"&&!(origin.hostname==="127.0.0.1"&&origin.protocol==="http:"))
  throw Error("A verified HTTPS origin is required");
 const url=new URL("/portal/",origin);
 // Fragment is not sent in HTTP requests/referrers. The portal removes it
 // immediately and requires a deliberate confirmation click.
 url.hash="verify-email="+token;
 return url.toString();
}
export function checkDeliveryConfig(env){
 if(env.AGSA_MAIL_PROVIDER!=="resend")throw Error("No configured email delivery provider; verification invitations are disabled");
 if(typeof env.AGSA_RESEND_API_KEY!=="string"||!/^re_[A-Za-z0-9_-]{12,}$/.test(env.AGSA_RESEND_API_KEY))
  throw Error("No valid email delivery API key configured");
 const from=normalizeEmail(env.AGSA_MAIL_FROM);
 if(!/^https:\/\//.test(env.AGSA_PUBLIC_ORIGIN||""))throw Error("Email verification links must use HTTPS");
 const origin=new URL(env.AGSA_PUBLIC_ORIGIN);
 if(origin.origin!==env.AGSA_PUBLIC_ORIGIN||origin.pathname!=="/")throw Error("Invalid configured HTTPS origin");
 return {from,origin:env.AGSA_PUBLIC_ORIGIN,apiKey:env.AGSA_RESEND_API_KEY};
}
export async function sendVerificationInvite({to,token,env=process.env,request=fetch}){
 const {from,origin,apiKey}=checkDeliveryConfig(env);
 const recipient=normalizeEmail(to);
 const link=makeVerificationUrl(origin,token);
 const text=[
  "Aviation Ground School Academy — fictional staging account email verification.",
  "",
  "An operator has prepared a training-staging account with this email address.",
  "If you requested access to the private test environment, open this link and select Confirm email:",
  link,
  "",
  "This invitation expires in 30 minutes and can be used once.",
  "If you did not request this access, ignore this message.",
  "The Academy is an unaccredited software prototype. No real student records or credentials may be submitted."
 ].join("\n");
 let result;
 try{
  result=await request("https://api.resend.com/emails",{
   method:"POST",
   headers:{"Authorization":"Bearer "+apiKey,"Content-Type":"application/json"},
   body:JSON.stringify({
    from,to:[recipient],subject:"Verify your Academy staging email",text
   }),
   signal:AbortSignal.timeout(12000)
  });
 }catch{
  throw Error("Invitation email could not be delivered; verify the provider connection");
 }
 if(!result||!result.ok)throw Error("Invitation email provider rejected the request; check configuration and provider account");
 // A successful API response only confirms acceptance for delivery.
 // It does not prove the recipient actually received the email.
 return {accepted:true};
}
