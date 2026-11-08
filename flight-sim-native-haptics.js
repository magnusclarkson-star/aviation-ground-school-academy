/* Optional, tightly scoped bridge to a separately installed Android companion.
 * The ordinary website retains navigator.vibrate(). The native app injects a
 * restricted-origin AGSAHapticsNative message object before page load.
 */
(function(root){"use strict";
function adapt(browserNavigator,nativeBridge){
 const browser=browserNavigator||{};
 if(!nativeBridge||typeof nativeBridge.postMessage!=="function")
  return {navigatorLike:browser,native:false};
 const proxy={
  vibrate(pattern){
   let payload;
   if(pattern===0||(Array.isArray(pattern)&&pattern.length===0))
    payload={type:"cancel"};
   else{
    const list=Array.isArray(pattern)?pattern:[pattern];
    if(list.length<1||list.length>5||
      !list.every(n=>Number.isInteger(n)&&n>0&&n<=180)||
      list.reduce((sum,n)=>sum+n,0)>500)return false;
    payload={type:"vibrate",pattern:list};
   }
   try{nativeBridge.postMessage(JSON.stringify(payload));return true;}
   catch{return false;}
  }
 };
 return {navigatorLike:proxy,native:true};
}
const api={adapt};
if(typeof module!=="undefined"&&module.exports)module.exports=api;
if(root)root.AGSAFlightNativeHaptics=api;
})(typeof window!=="undefined"?window:null);
