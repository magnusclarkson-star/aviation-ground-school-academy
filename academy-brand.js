(function(){
  'use strict';
  const chosenLogo='data:image/webp;base64,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';
  function applyBranding(){
    const style=document.createElement('style');
    style.textContent='.academy-logo-home{display:block;width:112px;max-width:90%;height:auto;margin:0 auto 12px;border-radius:12px;background:#fff}.academy-brand-name{display:block;text-align:center;font-size:13px;line-height:1.45;font-weight:850;letter-spacing:.02em;color:#f1f7ff}.academy-brand-name small{display:block;color:#f2c774;letter-spacing:.2em;font-size:10px}.academy-logo-header{display:inline-flex;align-items:center;justify-content:center;flex:0 0 auto;text-decoration:none!important;border:1px solid #55718e;border-radius:12px;padding:3px;background:white}.academy-logo-header img{display:block;width:42px;height:42px;object-fit:cover;border-radius:8px}@media(max-width:540px){.academy-logo-header img{width:32px;height:32px}}';
    document.head.appendChild(style);
    const favicon=document.createElement('link');
    favicon.rel='icon';favicon.type='image/webp';favicon.href=chosenLogo;
    document.head.appendChild(favicon);
    const sidebar=document.querySelector('aside .brand');
    if(sidebar){
      const img=document.createElement('img');img.src=chosenLogo;img.alt='Aviation Ground School Academy logo';img.className='academy-logo-home';
      const title=document.createElement('span');title.className='academy-brand-name';title.textContent='AVIATION GROUND SCHOOL';
      const subtitle=document.createElement('small');subtitle.textContent='ACADEMY';title.appendChild(subtitle);
      sidebar.replaceChildren(img,title);
      document.title='Aviation Ground School Academy';
    }else{
      const header=document.querySelector('body > header');
      if(header){
        const link=document.createElement('a');link.href='index.html';link.className='academy-logo-header';link.setAttribute('aria-label','Aviation Ground School Academy home');
        const img=document.createElement('img');img.src=chosenLogo;img.alt='Aviation Ground School Academy';
        link.appendChild(img);header.prepend(link);
      }
    }
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',applyBranding,{once:true});else applyBranding();
})();
