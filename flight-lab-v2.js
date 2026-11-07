(function flightLabModule() {
  'use strict';
  const $ = id => document.getElementById(id);
  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const bankMarks = [-60,-45,-30,-20,-10,0,10,20,30,45,60].map(d => {
    const t = d * Math.PI/180;
    const x1 = 200 + Math.sin(t)*137, y1 = 200-Math.cos(t)*137;
    const x2 = 200 + Math.sin(t)*(Math.abs(d)%30===0?154:147);
    const y2 = 200 - Math.cos(t)*(Math.abs(d)%30===0?154:147);
    return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#f0f6fc" stroke-width="${d===0?5:3}" stroke-linecap="round"/>`;
  }).join('');
  const pitchMarks = [-20,-15,-10,-5,5,10,15,20].map(deg => {
    const y=-deg*6.6;
    const len=Math.abs(deg)%10===0?55:Math.abs(deg)%5===0?29:16;
    const n=Math.abs(deg)%10===0?`<text x="${-len/2-14}" y="${y+5}" text-anchor="end" fill="#fff" font-size="15" font-weight="700">${Math.abs(deg)}</text><text x="${len/2+14}" y="${y+5}" text-anchor="start" fill="#fff" font-size="15" font-weight="700">${Math.abs(deg)}</text>`:'';
    return `<line x1="${-len/2}" y1="${y}" x2="${len/2}" y2="${y}" stroke="#fff" stroke-width="3" stroke-linecap="round"/>${n}`;
  }).join('');
  const css=`
  .fl2-wrap{max-width:1250px;margin:auto;color:#eaf3ff}
  .fl2-intro{border:1px solid #315c81;border-radius:20px;background:linear-gradient(120deg,#123855,#101e34);padding:23px;margin-bottom:18px}
  .fl2-kicker{font-size:12px;letter-spacing:.12em;color:#68d8f3;font-weight:800}
  .fl2-intro h2{font-size:clamp(22px,3vw,32px);margin:6px 0}
  .fl2-intro p{margin:6px 0;color:#c1d8ed;line-height:1.55}
  .fl2-layout{display:grid;grid-template-columns:minmax(300px,1.2fr) minmax(285px,1fr);gap:18px;align-items:start}
  .fl2-panel{background:#0f243d;border:1px solid #385775;padding:18px;border-radius:18px;min-width:0}
  .fl2-panel h3{font-size:20px;margin:0 0 12px}
  .fl2-figure{width:min(100%,430px);margin:0 auto}
  .fl2-attitude{display:block;width:100%;height:auto;filter:drop-shadow(0 10px 14px #0007);pointer-events:none;user-select:none}
  .fl2-reading{text-align:center;display:flex;justify-content:center;gap:12px;flex-wrap:wrap;font-variant-numeric:tabular-nums;margin:6px 0 10px}
  .fl2-reading strong{background:#081728;border:1px solid #436480;padding:9px 16px;border-radius:10px;font-size:15px}
  .fl2-tip{background:#112e47;border-left:3px solid #f9ca57;color:#cde2f4;padding:10px 13px;border-radius:5px;line-height:1.5;font-size:14px}
  .fl2-control{padding:12px 0;border-bottom:1px solid #33516b}
  .fl2-control label{display:flex;align-items:center;justify-content:space-between;gap:8px;color:#e1f2fc;font-weight:700}
  .fl2-control output{color:#ffdc81;min-width:74px;text-align:right;font-variant-numeric:tabular-nums}
  .fl2-control input[type=range]{width:100%;height:32px;accent-color:#48c9f0;cursor:pointer;margin:8px 0 0}
  .fl2-small{font-size:12px;color:#b5cada}
  .fl2-pad{height:170px;max-width:330px;margin:14px auto 8px;position:relative;border-radius:20px;border:1px solid #58738b;background:repeating-linear-gradient(0deg,transparent,transparent 41px,#6b859527 42px),repeating-linear-gradient(90deg,transparent,transparent 41px,#6b859527 42px),radial-gradient(ellipse,#264765,#0b192b);display:grid;place-items:center}
  .fl2-cross{position:absolute;inset:16px;border:1px dashed #7b96a970;border-radius:14px;pointer-events:none}
  .fl2-stick{position:relative;width:92px;height:77px;border-radius:50%;border:12px solid #10161e;background:radial-gradient(circle at 35% 25%,#869cab,#1e2d3d 75%);box-shadow:0 7px 17px #000b,inset 0 0 0 3px #7e9bab;touch-action:none;cursor:grab;user-select:none;color:#fff;font-weight:800;z-index:1}
  .fl2-stick:active{cursor:grabbing}.fl2-stick:focus-visible,.fl2-wrap button:focus-visible,.fl2-wrap input:focus-visible{outline:3px solid #ffdc81;outline-offset:3px}
  .fl2-stepper{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
  .fl2-wrap button:not(.fl2-stick){border:1px solid #6e91a8;border-radius:10px;padding:9px 13px;min-height:42px;background:#1e4a67;color:white;cursor:pointer;font-weight:650}
  .fl2-wrap button.fl2-main{background:#43bddd;color:#031c2e}
  .fl2-wrap button:active{filter:brightness(1.18)}
  .fl2-other{margin-top:18px;border:1px solid #345673;border-radius:17px;background:#10243b;padding:16px}
  .fl2-other summary{cursor:pointer;font-size:17px;font-weight:750;color:#f5fbff;padding:8px 0}
  .fl2-othergrid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;margin:15px 0}
  .fl2-tile{border:1px solid #355874;border-radius:12px;padding:14px;background:#081b30;text-align:center}
  .fl2-tile strong{font-size:clamp(19px,2vw,29px);display:block;font-variant-numeric:tabular-nums}
  .fl2-tile span{font-size:12px;color:#a5c8df}
  .fl2-secondary{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
  @media(max-width:800px){.fl2-layout{grid-template-columns:1fr}.fl2-secondary{grid-template-columns:1fr}.fl2-othergrid{grid-template-columns:1fr 1fr}}
  @media(max-width:430px){.fl2-layout{display:block}.fl2-panel{margin-bottom:16px;padding:12px}.fl2-intro{padding:15px}.fl2-othergrid{grid-template-columns:1fr}}
  `;
  const style=document.createElement('style');style.textContent=css;document.head.appendChild(style);
  const gauge=`<svg id="fl2-attitude" class="fl2-attitude" viewBox="0 0 400 400" role="img" aria-label="Conventional blue sky and brown ground attitude indicator with fixed yellow aircraft, bank scale, and pitch ladder">
  <defs>
    <radialGradient id="fl2-bezel"><stop offset="0" stop-color="#596879"/><stop offset=".83" stop-color="#202b36"/><stop offset="1" stop-color="#080d15"/></radialGradient>
    <linearGradient id="fl2-sky" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#1c5f98"/><stop offset="1" stop-color="#6dbde5"/></linearGradient>
    <linearGradient id="fl2-ground" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#9b6f47"/><stop offset="1" stop-color="#45291b"/></linearGradient>
    <clipPath id="fl2-crop"><circle cx="200" cy="200" r="152"/></clipPath>
  </defs>
  <rect x="9" y="9" width="382" height="382" rx="37" fill="#151d27" stroke="#627489" stroke-width="8"/>
  <circle cx="200" cy="200" r="183" fill="url(#fl2-bezel)" stroke="#060b12" stroke-width="5"/>
  <circle cx="200" cy="200" r="156" fill="#0c111b" stroke="#a9b7c4" stroke-width="6"/>
  <g clip-path="url(#fl2-crop)">
    <g id="fl2-card" transform="translate(200 200) rotate(0) translate(0 0)">
      <rect x="-430" y="-450" width="860" height="450" fill="url(#fl2-sky)"/>
      <rect x="-430" y="0" width="860" height="450" fill="url(#fl2-ground)"/>
      <line x1="-430" y1="0" x2="430" y2="0" stroke="#f5f0de" stroke-width="5"/>
      ${pitchMarks}
    </g>
  </g>
  <circle cx="200" cy="200" r="152" fill="none" stroke="#0b1724" stroke-width="5"/>
  ${bankMarks}
  <path d="M 200 30 L 191 44 L 209 44 Z" fill="#f4f7fa" stroke="#0c1925" stroke-width="2"/>
  <g id="fl2-bank-pointer" transform="rotate(0 200 200)">
    <path d="M 200 53 L 190 72 L 210 72 Z" fill="#ffcb63" stroke="#75421d" stroke-width="2"/>
  </g>
  <path d="M 103 200 H 156 L 172 213 L 191 213 L 200 204 L 209 213 L 228 213 L 244 200 H 297"
    fill="none" stroke="#18212b" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M 103 200 H 156 L 172 213 L 191 213 L 200 204 L 209 213 L 228 213 L 244 200 H 297"
    fill="none" stroke="#f9cf61" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>
  <circle cx="200" cy="202" r="7" fill="#ffdd80" stroke="#1a2636" stroke-width="2"/>
  <path d="M 146 335 L 254 335 L 268 369 L 132 369 Z" fill="#212935" stroke="#768493" stroke-width="3"/>
  <circle cx="200" cy="350" r="10" fill="#536273" stroke="#a6b9c8" stroke-width="2"/>
  <text x="200" y="392" font-size="10" fill="#b4c4d2" text-anchor="middle" font-weight="800" letter-spacing="1.5">ATTITUDE</text>
  <circle cx="39" cy="39" r="6" fill="#070d15" stroke="#8a96a4" stroke-width="2"/><circle cx="361" cy="39" r="6" fill="#070d15" stroke="#8a96a4" stroke-width="2"/>
  <circle cx="39" cy="361" r="6" fill="#070d15" stroke="#8a96a4" stroke-width="2"/><circle cx="361" cy="361" r="6" fill="#070d15" stroke="#8a96a4" stroke-width="2"/>
  </svg>`;
  function row(key,label,min,max,step,unit,value){
    return `<div class="fl2-control"><label for="fl2-${key}"><span>${label}</span><output id="fl2-out-${key}" for="fl2-${key}">${value}${unit}</output></label><input type="range" id="fl2-${key}" data-fl2-key="${key}" min="${min}" max="${max}" step="${step}" value="${value}"></div>`;
  }
  function template(s){
    return `<div class="fl2-wrap" id="fl2-root">
      <div class="fl2-intro"><div class="fl2-kicker">FLIGHT LAB · FOCUSED INSTRUMENT TRAINING</div><h2>Attitude Indicator — Pitch &amp; Bank</h2>
      <p>Operate the controls beside the instrument. Watch the <b>fixed yellow miniature aircraft</b> against the moving artificial horizon. This is a simplified teaching model, not a certified simulator.</p></div>
      <div class="fl2-layout">
        <section class="fl2-panel" aria-labelledby="fl2-instrument-title">
          <h3 id="fl2-instrument-title">Conventional attitude indicator</h3>
          <div class="fl2-figure">${gauge}</div>
          <div class="fl2-reading"><strong id="fl2-pitch-reading">PITCH 0°</strong><strong id="fl2-bank-reading">BANK 0°</strong></div>
          <div class="fl2-tip" id="fl2-explanation" role="status" aria-live="polite">Wings level, nose on the horizon.</div>
          <p class="fl2-small">The instrument face is read-only. Touching it does not change the aircraft attitude.</p>
        </section>
        <section class="fl2-panel" aria-labelledby="fl2-control-title">
          <h3 id="fl2-control-title">Aircraft control inputs</h3>
          <p class="fl2-small">Change <b>pitch</b> (nose up/down) and <b>bank</b> (left/right). Controls are beside the gauge on larger screens, and below it on narrow phones.</p>
          ${row('pitch','Elevator · pitch',-20,20,1,'°',s.pitch)}
          <div class="fl2-stepper"><button type="button" data-fl2-set="pitch" data-fl2-delta="5">Nose up +5°</button><button type="button" data-fl2-set="pitch" data-fl2-delta="-5">Nose down −5°</button></div>
          ${row('roll','Ailerons · bank',-60,60,1,'°',s.roll)}
          <div class="fl2-stepper"><button type="button" data-fl2-set="roll" data-fl2-delta="-10">Bank left 10°</button><button type="button" data-fl2-set="roll" data-fl2-delta="10">Bank right 10°</button></div>
          <p class="fl2-small" style="margin-top:18px">Alternatively, drag this control grip. Drag sideways for bank, vertically for pitch.</p>
          <div class="fl2-pad"><div class="fl2-cross"></div><button type="button" class="fl2-stick" id="fl2-stick" aria-label="Drag aircraft control grip to change pitch and bank. Use arrow keys for small corrections.">GRIP</button></div>
          <div class="fl2-stepper"><button type="button" class="fl2-main" id="fl2-level">Level wings and nose</button><button type="button" id="fl2-rightbank">Show right bank</button><button type="button" id="fl2-climb">Show climb attitude</button></div>
        </section>
      </div>
      <details class="fl2-other"><summary>Explore the other flight instruments and their controls</summary>
        <p class="fl2-small">These are simplified readouts, not flight-dynamics calculations. Airspeed, altitude and heading can be adjusted individually.</p>
        <div class="fl2-othergrid">
          <div class="fl2-tile"><strong id="fl2-speed-reading">${s.speed} kt</strong><span>Airspeed</span></div>
          <div class="fl2-tile"><strong id="fl2-alt-reading">${s.alt.toLocaleString()} ft</strong><span>Altitude</span></div>
          <div class="fl2-tile"><strong id="fl2-heading-reading">${String(s.heading).padStart(3,'0')}°</strong><span>Heading</span></div>
        </div>
        <div class="fl2-secondary">
          ${row('speed','Airspeed',40,220,5,' kt',s.speed)}
          ${row('alt','Altitude',0,18000,100,' ft',s.alt)}
          ${row('heading','Heading',0,359,1,'°',s.heading)}
        </div>
        <p class="fl2-small">The turn coordinator and vertical-speed indications require a separate dynamic flight model. They are not represented as live results here.</p>
      </details>
      <p class="fl2-small" style="margin-top:18px">Training tip: In a climb (positive pitch), the horizon moves downward relative to the fixed miniature aircraft. In a right bank, the horizon tilts counterclockwise. The bank pointer shows the bank magnitude and direction.</p>
    </div>`;
  }
  let bound=false;
  let drag=null;
  function update(s){
    if(!$('fl2-root'))return;
    $('fl2-card').setAttribute('transform',`translate(200 200) rotate(${-s.roll}) translate(0 ${s.pitch*6.6})`);
    $('fl2-bank-pointer').setAttribute('transform',`rotate(${s.roll} 200 200)`);
    const ptxt=s.pitch>0?'NOSE UP':s.pitch<0?'NOSE DOWN':'PITCH LEVEL';
    const btxt=s.roll>0?'RIGHT BANK':s.roll<0?'LEFT BANK':'WINGS LEVEL';
    $('fl2-pitch-reading').textContent=`${ptxt} ${Math.abs(s.pitch)}°`;
    $('fl2-bank-reading').textContent=`${btxt} ${Math.abs(s.roll)}°`;
    $('fl2-explanation').textContent=(s.pitch===0?'Nose level.':s.pitch>0?`Nose up ${s.pitch}°: the horizon moves DOWN.`:`Nose down ${Math.abs(s.pitch)}°: the horizon moves UP.`)+' '+(s.roll===0?'Wings level.':s.roll>0?`Right bank ${s.roll}°: the horizon tilts counterclockwise.`:`Left bank ${Math.abs(s.roll)}°: the horizon tilts clockwise.`);
    $('fl2-stick').style.transform=`translate(${s.roll*1.0}px,${-s.pitch*2.0}px)`;
    $('fl2-speed-reading').textContent=`${s.speed} kt`;
    $('fl2-alt-reading').textContent=`${s.alt.toLocaleString()} ft`;
    $('fl2-heading-reading').textContent=`${String(s.heading).padStart(3,'0')}°`;
    for (const k of ['pitch','roll','speed','alt','heading']) {
      const input=$('fl2-'+k),out=$('fl2-out-'+k);
      if(input)input.value=String(s[k]);
      if(out)out.textContent=s[k]+({pitch:'°',roll:'°',speed:' kt',alt:' ft',heading:'°'})[k];
    }
  }
  function bind(s,setInstrument){
    const root=$('fl2-root');if(!root)return;
    root.querySelectorAll('input[data-fl2-key]').forEach(input=>{
      input.addEventListener('input',()=>setInstrument(input.dataset.fl2Key,input.value));
    });
    root.querySelectorAll('button[data-fl2-set]').forEach(btn=>{
      btn.addEventListener('click',()=>{
        const k=btn.dataset.fl2Set;
        const lo=k==='pitch'?-20:-60,hi=k==='pitch'?20:60;
        setInstrument(k,clamp(s[k]+Number(btn.dataset.fl2Delta),lo,hi));
      });
    });
    $('fl2-level').addEventListener('click',()=>{setInstrument('pitch',0);setInstrument('roll',0);});
    $('fl2-rightbank').addEventListener('click',()=>{setInstrument('pitch',0);setInstrument('roll',20);});
    $('fl2-climb').addEventListener('click',()=>{setInstrument('roll',0);setInstrument('pitch',10);});
    const stick=$('fl2-stick');
    stick.addEventListener('pointerdown',e=>{
      if(e.button!==0&&e.pointerType==='mouse')return;
      drag={id:e.pointerId,x:e.clientX,y:e.clientY,p:s.pitch,b:s.roll};
      stick.setPointerCapture(e.pointerId);
      e.preventDefault();
    });
    stick.addEventListener('pointermove',e=>{
      if(!drag||drag.id!==e.pointerId)return;
      setInstrument('roll',Math.round(clamp(drag.b+(e.clientX-drag.x)*.45,-60,60)));
      setInstrument('pitch',Math.round(clamp(drag.p-(e.clientY-drag.y)*.28,-20,20)));
    });
    for(const type of ['pointerup','pointercancel','lostpointercapture'])stick.addEventListener(type,e=>{if(drag&&drag.id===e.pointerId)drag=null;});
    stick.addEventListener('keydown',e=>{
      const change={ArrowUp:['pitch',1],ArrowDown:['pitch',-1],ArrowLeft:['roll',-2],ArrowRight:['roll',2]};
      if(change[e.key]){e.preventDefault();const[k,delta]=change[e.key];setInstrument(k,clamp(s[k]+delta,k==='pitch'?-20:-60,k==='pitch'?20:60));}
      if(e.key==='Home'){e.preventDefault();setInstrument('roll',0);setInstrument('pitch',0);}
    });
    update(s);
  }
  window.flightLabV2={template,bind,update};
})();