(()=>{"use strict";
const previews=["formal","scout","enthusiast"];
const $=id=>document.getElementById(id);
const toggles=[
 ["sampleSeal","showSeal"],
 ["sampleSignature","showSignature"],
 ["sampleInstructor","showInstructor"],
 ["sampleNumber","showNumber"],
 ["sampleDate","showDate"]
];
function updateSamples(){
 for(const name of previews){
  const cert=$(name);
  if(!cert)continue;
  for(const [checkbox,attribute] of toggles)
   cert.dataset[attribute]=$(!checkbox?null:checkbox)?.checked?"true":"false";
 }
}
function printSample(style){
 if(!previews.includes(style))return;
 document.body.dataset.printStyle=style;
 // Print is only initiated after the user's explicit button press.
 window.print();
}
for(const [checkbox] of toggles)$(checkbox).addEventListener("change",updateSamples);
document.querySelectorAll("[data-print]").forEach(button=>
 button.addEventListener("click",()=>printSample(button.dataset.print))
);
window.addEventListener("afterprint",()=>{document.body.removeAttribute("data-print-style")});
updateSamples();
})();
