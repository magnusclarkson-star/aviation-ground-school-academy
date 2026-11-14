/* Gallery displays pre-watermarked public PNGs only.
   Never download or reconstruct the owner's clean original masters here. */
(()=>{
 "use strict";
 for(const card of document.querySelectorAll("[data-original]")){
  const img=card.querySelector(".original-artwork");
  const status=card.querySelector(".load-status");
  if(!img||!status)continue;
  const loaded=()=>{status.textContent="Protected sample displayed — watermark is part of the image. View only."};
  const failed=()=>{status.textContent="Protected certificate sample could not be loaded."};
  img.addEventListener("load",loaded,{once:true});
  img.addEventListener("error",failed,{once:true});
  if(img.complete){
   if(img.naturalWidth>0)loaded();
   else failed();
  }
 }
})();
