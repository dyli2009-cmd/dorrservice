/* Shared drawing annotations for Door Automation and Security Service. */
window.ServiceDrawingTools=(()=>{
'use strict';
const NS='http://www.w3.org/2000/svg',clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
function uid(){return 'draw-'+(crypto.randomUUID?.()||Date.now()+'-'+Math.random().toString(36).slice(2))}
function pt(x,y,w,h){return{x:x*w,y:y*h}}
function rotPoint(cx,cy,x,y,a){const r=a*Math.PI/180,c=Math.cos(r),s=Math.sin(r);return{x:cx+x*c-y*s,y:cy+x*s+y*c}}
function doorGeometry(item,w,h){
 const size=clamp(Number(item.size)||.08,.02,.3)*Math.min(w,h),a=Number(item.angle)||0,flip=item.flip?-1:1,cx=item.x*w,cy=item.y*h;
 const line=(p1,p2)=>[rotPoint(cx,cy,p1.x,p1.y,a),rotPoint(cx,cy,p2.x,p2.y,a)];
 const arc=(center,r,start,end,steps=12)=>{
  const arr=[];for(let i=0;i<=steps;i++){const t=start+(end-start)*i/steps;arr.push(rotPoint(cx,cy,center.x+Math.cos(t)*r,center.y+Math.sin(t)*r,a))}return arr
 };
 if(item.type==='door-double'){
  const half=size*.52,left={x:-half,y:0},right={x:half,y:0},meet={x:0,y:0};
  const leftOpen={x:-half,y:-size*.52*flip},rightOpen={x:half,y:-size*.52*flip};
  return {segments:[line(left,leftOpen),line(right,rightOpen)],arcs:[
   arc(left,half,0,-Math.PI/2*flip),arc(right,half,Math.PI,Math.PI+Math.PI/2*flip)
  ],handle:rotPoint(cx,cy,0,-size*.82*flip,a),center:{x:cx,y:cy},radius:size*.75};
 }
 const hinge={x:0,y:0},open={x:0,y:-size*flip};
 return {segments:[line(hinge,open)],arcs:[arc(hinge,size,0,-Math.PI/2*flip)],handle:rotPoint(cx,cy,0,-size*flip,a),center:{x:cx,y:cy},radius:size};
}
function injectStyle(){
 if(document.getElementById('serviceDrawingToolsStyle'))return;
 const style=document.createElement('style');style.id='serviceDrawingToolsStyle';style.textContent=`
.serviceDrawingOverlay{position:absolute;inset:0;width:100%;height:100%;z-index:6;overflow:visible;pointer-events:none;touch-action:none}
.serviceDrawingOverlay.placing{pointer-events:auto;cursor:crosshair}
.serviceDrawingOverlay .drawHit,.serviceDrawingOverlay .drawDoorHit,.serviceDrawingOverlay .drawHandle,.serviceDrawingOverlay .drawTextHit{pointer-events:all}
.serviceDrawingOverlay .drawHit{stroke:transparent;stroke-width:18;fill:none}\n.serviceDrawingOverlay .drawDoorHit{fill:transparent;stroke:none}
.serviceDrawingOverlay .drawVisible{stroke:#173f55;stroke-width:2;fill:none;vector-effect:non-scaling-stroke}
.serviceDrawingOverlay .drawSelected{stroke:#1480ad;stroke-dasharray:5 3;stroke-width:1.5;fill:none;vector-effect:non-scaling-stroke;pointer-events:none}
.serviceDrawingOverlay .drawHandle{fill:#1480ad;stroke:#fff;stroke-width:2;vector-effect:non-scaling-stroke}
.serviceDrawingOverlay .drawText{font:600 13px system-ui,-apple-system,sans-serif;fill:#172b35;paint-order:stroke;stroke:#fff;stroke-width:4;stroke-linejoin:round;pointer-events:none}
.serviceDrawingOverlay .drawTextHit{fill:transparent;stroke:transparent}
.serviceToolsWrap{position:relative;display:inline-flex;flex:none}
.serviceToolLauncher,.serviceIconButton{display:inline-grid!important;place-items:center!important;padding:0!important}
.serviceToolLauncher{width:38px!important;min-width:38px!important;height:36px!important;min-height:36px!important}
.serviceToolLauncher svg,.serviceIconButton svg{width:21px;height:21px;display:block;pointer-events:none}
.serviceToolsMenu{position:absolute;right:0;left:auto;top:calc(100% + 5px);z-index:120;width:max-content;max-width:calc(100vw - 12px);padding:5px;background:#fff;border:1px solid #cbd9e1;border-radius:9px;box-shadow:0 8px 24px #0b253544;display:flex;flex-direction:column;gap:5px}
.serviceToolsMenu[hidden]{display:none!important}
.serviceToolChoices,.serviceToolsMenu .toolSelected{display:flex;align-items:center;gap:4px}
.serviceToolsMenu .toolSelected{padding-top:5px;border-top:1px solid #e0e7eb}
.serviceToolsMenu .toolSelected[hidden]{display:none!important}
.serviceIconButton{width:38px!important;min-width:38px!important;height:38px!important;min-height:38px!important;border-radius:7px!important;background:#f8fafb!important;color:#173f55!important;border:1px solid #d5e0e6!important}
.serviceIconButton:hover,.serviceIconButton:focus-visible{background:#eaf2f6!important;border-color:#aac3d0!important}
.serviceIconButton:active{transform:translateY(1px)}
.serviceIconButton.dangerTool{color:#a6292e!important;background:#fff6f5!important;border-color:#efceca!important}
.serviceToolActive{background:#173f55!important;color:#fff!important;border-color:#173f55!important}
.serviceToolActive svg{stroke:#fff!important}
.serviceInlineTextEditor{position:absolute;z-index:9;min-width:90px;width:min(220px,42%);height:40px;box-sizing:border-box;padding:6px 8px;border:2px solid #1480ad;border-radius:6px;background:#fff;color:#172b35;font:600 16px system-ui,-apple-system,sans-serif;box-shadow:0 4px 14px #0b253533;outline:none;transform:translate(-4px,-55%);touch-action:manipulation;-webkit-text-size-adjust:100%}
.serviceInlineTextEditor:focus{border-color:#0f719c;box-shadow:0 0 0 3px #1480ad22,0 4px 14px #0b253533}
@media(max-width:520px){
 .serviceToolLauncher{width:36px!important;min-width:36px!important;height:36px!important}
 .serviceToolsMenu{position:absolute;right:0;left:auto;top:calc(100% + 4px);bottom:auto;width:max-content;max-width:calc(100vw - 10px);padding:4px;overflow:visible}
 .serviceIconButton{width:36px!important;min-width:36px!important;height:36px!important;min-height:36px!important}
 .serviceToolLauncher svg,.serviceIconButton svg{width:20px;height:20px}
}
`;document.head.appendChild(style);
}
function create(cfg){
 injectStyle();
 const stage=document.getElementById(cfg.stageId);if(!stage)return null;
 let selected=null,mode=null,drag=null,draft=null,page=1,w=1,h=1;
 const svg=document.createElementNS(NS,'svg');svg.classList.add('serviceDrawingOverlay');svg.setAttribute('aria-label','Ritverktyg');stage.appendChild(svg);
 const el=(name,attrs={})=>{const e=document.createElementNS(NS,name);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,String(v)));return e};
 const items=()=>{const v=cfg.getItems?.();return Array.isArray(v)?v:[]};
 const current=()=>items().find(x=>x.uid===selected);
 function notify(text){if(text)cfg.message?.(text)}
 function changed(text){cfg.onChange?.();render(page,w,h);if(text)notify(text)}
 let activeTextEditor=null;
 function closeInlineEditor(commit=true){
  if(!activeTextEditor)return;
  const {input,item,isNew}=activeTextEditor;activeTextEditor=null;
  const value=String(input.value||'').trim();input.remove();
  if(commit&&value){item.text=value;selected=item.uid;cfg.onChange?.();render(page,w,h);updateMenu();notify(isNew?'Texten är tillagd. Dra den om du vill flytta den.':'Texten är uppdaterad.')}
  else if(isNew||!value){cfg.setItems?.(items().filter(x=>x.uid!==item.uid));selected=null;render(page,w,h);updateMenu()}
 }
 function editTextInline(item,isNew=false){
  if(!item)return;closeInlineEditor(true);
  cfg.activateDrawing?.();selected=item.uid;render(page,w,h);updateMenu();
  const input=document.createElement('input');input.type='text';input.className='serviceInlineTextEditor';input.value=item.text||'';input.placeholder='Skriv text…';input.autocomplete='off';input.spellcheck=true;
  input.style.left=(clamp(Number(item.x)||.05,.01,.96)*100)+'%';input.style.top=(clamp(Number(item.y)||.05,.02,.98)*100)+'%';
  input.addEventListener('pointerdown',e=>e.stopPropagation());input.addEventListener('click',e=>e.stopPropagation());input.addEventListener('touchstart',e=>e.stopPropagation(),{passive:true});
  input.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();closeInlineEditor(true)}else if(e.key==='Escape'){e.preventDefault();closeInlineEditor(false)}});
  input.addEventListener('blur',()=>setTimeout(()=>{if(activeTextEditor?.input===input)closeInlineEditor(true)},0));
  stage.appendChild(input);activeTextEditor={input,item,isNew};
  requestAnimationFrame(()=>{input.focus({preventScroll:true});input.setSelectionRange(input.value.length,input.value.length)});
 }
 function setMode(next){
  if(activeTextEditor)closeInlineEditor(true);
  mode=mode===next?null:next;draft=null;selected=null;svg.classList.toggle('placing',!!mode);
  if(toolBtn)toolBtn.classList.toggle('serviceToolActive',!!mode);
  updateMenu();
  if(mode){cfg.activateDrawing?.();notify(({line:'Dra ett streck där väggen/linjen ska vara.',arrow:'Dra från start till den punkt pilen ska peka på.','door-single':'Tryck där enkeldörren ska placeras.','door-double':'Tryck där dubbeldörren ska placeras.',text:'Tryck där texten ska ligga.','text-arrow':'Tryck där pilen ska peka; texten placeras bredvid.'})[mode]);}
 }
 function addArrowMarker(defs,id){
  const m=el('marker',{id,viewBox:'0 0 8 8',refX:7,refY:4,markerWidth:7,markerHeight:7,orient:'auto'});
  m.appendChild(el('path',{d:'M0,0 L8,4 L0,8 z',fill:'#173f55'}));defs.appendChild(m);
 }
 function itemPoint(item,key){return pt(item[key+'X'],item[key+'Y'],w,h)}
 function bindMove(node,item,kind){
  node.addEventListener('pointerdown',e=>{
   if(mode||e.button!==0)return;e.preventDefault();e.stopPropagation();selected=item.uid;
   const r=svg.getBoundingClientRect(),p={x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height};
   drag={id:e.pointerId,item,kind,start:p,original:structuredClone(item)};
   try{svg.setPointerCapture(e.pointerId)}catch(_){}
   render(page,w,h);updateMenu();
  });
 }
 function render(p=page,width=w,height=h){
  page=p;w=Math.max(1,width);h=Math.max(1,height);svg.setAttribute('viewBox',`0 0 ${w} ${h}`);svg.replaceChildren();
  const defs=el('defs');addArrowMarker(defs,'drawToolArrow');svg.appendChild(defs);
  const list=items().filter(x=>x&&x.page===page);
  for(const item of list){
   if(item.type==='line'||item.type==='arrow'){
    const a=pt(item.x1,item.y1,w,h),b=pt(item.x2,item.y2,w,h);
    const vis=el('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,class:'drawVisible'});if(item.type==='arrow')vis.setAttribute('marker-end','url(#drawToolArrow)');svg.appendChild(vis);
    const hit=el('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,class:'drawHit'});bindMove(hit,item,'whole-line');svg.appendChild(hit);
    if(item.uid===selected){
     svg.appendChild(el('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,class:'drawSelected'}));
     for(const [kind,pnt] of [['a',a],['b',b]]){const c=el('circle',{cx:pnt.x,cy:pnt.y,r:8,class:'drawHandle'});bindMove(c,item,kind);svg.appendChild(c)}
    }
   }else if(item.type==='door-single'||item.type==='door-double'){
    const g=doorGeometry(item,w,h),pathParts=[];
    g.segments.forEach(([a,b])=>pathParts.push(`M ${a.x} ${a.y} L ${b.x} ${b.y}`));
    g.arcs.forEach(ar=>{if(ar.length){pathParts.push('M '+ar[0].x+' '+ar[0].y);for(let i=1;i<ar.length;i++)pathParts.push('L '+ar[i].x+' '+ar[i].y)}});
    svg.appendChild(el('path',{d:pathParts.join(' '),class:'drawVisible'}));
    const hit=el('circle',{cx:g.center.x,cy:g.center.y,r:Math.max(22,g.radius*.75),fill:'transparent',stroke:'transparent','stroke-width':2,class:'drawDoorHit'});bindMove(hit,item,'door-move');svg.appendChild(hit);
    if(item.uid===selected){
      svg.appendChild(el('circle',{cx:g.center.x,cy:g.center.y,r:Math.max(18,g.radius*.9),class:'drawSelected'}));
      const handle=el('circle',{cx:g.handle.x,cy:g.handle.y,r:9,class:'drawHandle'});bindMove(handle,item,'door-size-angle');svg.appendChild(handle);
    }
   }else if(item.type==='text'||item.type==='text-arrow'){
    const label=pt(item.x,item.y,w,h);
    if(item.type==='text-arrow'){
      const target=pt(item.targetX,item.targetY,w,h),ln=el('line',{x1:label.x,y1:label.y,x2:target.x,y2:target.y,class:'drawVisible','marker-end':'url(#drawToolArrow)'});svg.appendChild(ln);
      if(item.uid===selected){const hnd=el('circle',{cx:target.x,cy:target.y,r:8,class:'drawHandle'});bindMove(hnd,item,'text-target');svg.appendChild(hnd)}
    }
    const text=el('text',{x:label.x,y:label.y,class:'drawText'});text.textContent=String(item.text||'');svg.appendChild(text);
    const ww=Math.max(45,String(item.text||'').length*8),hit=el('rect',{x:label.x-5,y:label.y-18,width:ww,height:25,class:'drawTextHit'});bindMove(hit,item,'text-move');svg.appendChild(hit);
    if(item.uid===selected)svg.appendChild(el('rect',{x:label.x-6,y:label.y-20,width:ww+2,height:28,class:'drawSelected'}));
   }
  }
  if(draft){
   if(draft.type==='line'||draft.type==='arrow'){
    const a=pt(draft.x1,draft.y1,w,h),b=pt(draft.x2,draft.y2,w,h),ln=el('line',{x1:a.x,y1:a.y,x2:b.x,y2:b.y,class:'drawVisible'});if(draft.type==='arrow')ln.setAttribute('marker-end','url(#drawToolArrow)');svg.appendChild(ln);
   }
  }
  updateMenu();
 }
 svg.addEventListener('pointerdown',e=>{
  if(!mode||e.button!==0)return;e.preventDefault();e.stopPropagation();
  const r=svg.getBoundingClientRect(),x=clamp((e.clientX-r.left)/r.width,0,1),y=clamp((e.clientY-r.top)/r.height,0,1);
  if(mode==='line'||mode==='arrow'){draft={uid:uid(),type:mode,page,x1:x,y1:y,x2:x,y2:y};drag={id:e.pointerId,item:draft,kind:'placing'};try{svg.setPointerCapture(e.pointerId)}catch(_){};render(page,w,h);return}
  if(mode==='door-single'||mode==='door-double'){const item={uid:uid(),type:mode,page,x,y,size:.075,angle:0,flip:false};items().push(item);selected=item.uid;setMode(null);changed('Dörrsymbol tillagd. Dra symbolen för att flytta. Dra den blå punkten för att rotera och ändra storlek.');return}
  if(mode==='text'||mode==='text-arrow'){
   const item={uid:uid(),type:mode,page,x:mode==='text-arrow'?clamp(x+(x>.72?-.14:.10),.02,.92):x,y:mode==='text-arrow'?clamp(y-.05,.04,.96):y,text:''};
   if(mode==='text-arrow'){item.targetX=x;item.targetY=y}
   items().push(item);setMode(null);selected=item.uid;render(page,w,h);editTextInline(item,true);return
  }
 });
 svg.addEventListener('pointermove',e=>{
  if(!drag||drag.id!==e.pointerId)return;e.preventDefault();
  const r=svg.getBoundingClientRect(),x=clamp((e.clientX-r.left)/r.width,0,1),y=clamp((e.clientY-r.top)/r.height,0,1),it=drag.item,o=drag.original;
  if(drag.kind==='placing'){it.x2=x;it.y2=y;draft=it;render(page,w,h);return}
  if(drag.kind==='whole-line'){const dx=x-drag.start.x,dy=y-drag.start.y;it.x1=clamp(o.x1+dx,0,1);it.y1=clamp(o.y1+dy,0,1);it.x2=clamp(o.x2+dx,0,1);it.y2=clamp(o.y2+dy,0,1)}
  else if(drag.kind==='a'){it.x1=x;it.y1=y}else if(drag.kind==='b'){it.x2=x;it.y2=y}
  else if(drag.kind==='door-move'){it.x=clamp(o.x+x-drag.start.x,.01,.99);it.y=clamp(o.y+y-drag.start.y,.01,.99)}
  else if(drag.kind==='door-size-angle'){const cx=it.x*w,cy=it.y*h,px=x*w,py=y*h,dx=px-cx,dy=py-cy;it.size=clamp(Math.hypot(dx,dy)/Math.min(w,h),.02,.3);it.angle=Math.round((Math.atan2(dy,dx)*180/Math.PI+90)/2)*2}
  else if(drag.kind==='text-move'){it.x=clamp(o.x+x-drag.start.x,.01,.98);it.y=clamp(o.y+y-drag.start.y,.02,.98)}
  else if(drag.kind==='text-target'){it.targetX=x;it.targetY=y}
  render(page,w,h);
 });
 svg.addEventListener('pointerup',e=>{
  if(!drag||drag.id!==e.pointerId)return;e.preventDefault();
  if(drag.kind==='placing'){
    const it=draft;draft=null;drag=null;
    if(it&&Math.hypot(it.x2-it.x1,it.y2-it.y1)>.008){items().push(it);selected=it.uid;setMode(null);changed(it.type==='arrow'?'Pil tillagd. Dra ändpunkterna om du vill justera den.':'Linje tillagd. Dra ändpunkterna om du vill justera den.')}else{setMode(null);render(page,w,h)}
    return;
  }
  drag=null;cfg.onChange?.();render(page,w,h);
 });
 svg.addEventListener('pointercancel',()=>{if(drag?.original)Object.assign(drag.item,drag.original);draft=null;drag=null;render(page,w,h)});
 let toolBtn=null,menu=null,selectedBox=null;
 const iconSvg=name=>{
  const common='viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"';
  const icons={
   tools:`<svg ${common}><path d="M4 20l6.2-6.2"/><path d="M13.5 5.5l5 5"/><path d="M15 3l6 6-2.5 2.5-6-6z"/><path d="M3.5 16.5l4 4L3 21z"/></svg>`,
   'door-single':`<svg ${common}><path d="M5 19V5h7"/><path d="M5 5l10 10"/><path d="M5 15a10 10 0 0 1 10-10"/></svg>`,
   'door-double':`<svg ${common}><path d="M4 19V6h6"/><path d="M20 19V6h-6"/><path d="M4 6l7 9"/><path d="M20 6l-7 9"/><path d="M4 14a8 8 0 0 1 7-8"/><path d="M20 14a8 8 0 0 0-7-8"/></svg>`,
   line:`<svg ${common}><path d="M4 18L20 6"/></svg>`,
   arrow:`<svg ${common}><path d="M4 18L19 7"/><path d="M13 7h6v6"/></svg>`,
   text:`<svg ${common}><path d="M5 6h14"/><path d="M12 6v12"/><path d="M8 18h8"/></svg>`,
   'text-arrow':`<svg ${common}><path d="M4 5h9"/><path d="M8.5 5v8"/><path d="M6 13h5"/><path d="M13 17h7"/><path d="M17 14l3 3-3 3"/></svg>`,
   rotate:`<svg ${common}><path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/></svg>`,
   flip:`<svg ${common}><path d="M4 12h16"/><path d="M7 9l-3 3 3 3"/><path d="M17 9l3 3-3 3"/></svg>`,
   smaller:`<svg ${common}><circle cx="10" cy="10" r="6"/><path d="M6.5 10h7"/><path d="M14.5 14.5L20 20"/></svg>`,
   larger:`<svg ${common}><circle cx="10" cy="10" r="6"/><path d="M6.5 10h7"/><path d="M10 6.5v7"/><path d="M14.5 14.5L20 20"/></svg>`,
   edit:`<svg ${common}><path d="M5 6h8"/><path d="M9 6v12"/><path d="M6 18h6"/><path d="M15 15l5-5 2 2-5 5-3 1z"/></svg>`,
   delete:`<svg ${common}><path d="M4 7h16"/><path d="M9 3h6l1 4H8z"/><path d="M7 7l1 14h8l1-14"/><path d="M10 11v6M14 11v6"/></svg>`
  };
  return icons[name]||icons.tools;
 };
 function iconAction(icon,label,fn,cls=''){
  const b=document.createElement('button');b.type='button';b.className=('serviceIconButton '+cls).trim();b.innerHTML=iconSvg(icon);b.title=label;b.setAttribute('aria-label',label);
  b.onclick=e=>{e.stopPropagation();fn()};return b
 }
 function attachToolbar(){
  const bar=document.querySelector('.sessionHistoryBar');if(!bar||toolBtn)return;
  const wrap=document.createElement('span');wrap.className='serviceToolsWrap';
  toolBtn=document.createElement('button');toolBtn.type='button';toolBtn.className='serviceToolLauncher';toolBtn.innerHTML=iconSvg('tools');toolBtn.title='Ritverktyg';toolBtn.setAttribute('aria-label','Ritverktyg');
  toolBtn.onclick=e=>{e.stopPropagation();if(mode){setMode(null);menu.hidden=true}else{menu.hidden=!menu.hidden;updateMenu()}};
  menu=document.createElement('div');menu.className='serviceToolsMenu';menu.hidden=true;menu.setAttribute('role','toolbar');menu.setAttribute('aria-label','Ritverktyg');
  const choices=document.createElement('div');choices.className='serviceToolChoices';
  [['door-single','Enkeldörr'],['door-double','Dubbeldörr'],['line','Linje / vägg'],['arrow','Pil'],['text','Text'],['text-arrow','Text med pil']].forEach(([key,label])=>choices.appendChild(iconAction(key,label,()=>{menu.hidden=true;setMode(key)})));
  menu.appendChild(choices);
  selectedBox=document.createElement('div');selectedBox.className='toolSelected';selectedBox.hidden=true;selectedBox.setAttribute('aria-label','Redigera markerat ritobjekt');
  selectedBox.append(
   iconAction('rotate','Rotera 90°',()=>editSelected(s=>{if(s.type.startsWith('door-'))s.angle=(Number(s.angle||0)+90)%360})),
   iconAction('flip','Spegelvänd',()=>editSelected(s=>{if(s.type.startsWith('door-'))s.flip=!s.flip})),
   iconAction('smaller','Mindre',()=>editSelected(s=>{if(s.type.startsWith('door-'))s.size=clamp((s.size||.08)*.88,.02,.3)})),
   iconAction('larger','Större',()=>editSelected(s=>{if(s.type.startsWith('door-'))s.size=clamp((s.size||.08)*1.12,.02,.3)})),
   iconAction('edit','Ändra text',()=>{const s=current();if(!s||!s.type.startsWith('text'))return;menu.hidden=true;editTextInline(s,false)}),
   iconAction('delete','Ta bort',()=>{const s=current();if(!s)return;cfg.setItems?.(items().filter(x=>x.uid!==s.uid));selected=null;changed('Ritobjektet är borttaget.')},'dangerTool')
  );
  menu.appendChild(selectedBox);wrap.append(toolBtn,menu);
  const status=bar.querySelector('span[role="status"]');status?bar.insertBefore(wrap,status):bar.appendChild(wrap);
  document.addEventListener('pointerdown',e=>{if(menu&&!menu.hidden&&!wrap.contains(e.target))menu.hidden=true});
 }
 function editSelected(fn){const s=current();if(!s)return;fn(s);changed()}
 function updateMenu(){
  if(selectedBox){const s=current();selectedBox.hidden=!s;const buttons=[...selectedBox.querySelectorAll('button')];if(s){buttons[0].disabled=buttons[1].disabled=buttons[2].disabled=buttons[3].disabled=!s.type.startsWith('door-');buttons[4].disabled=!s.type.startsWith('text')}}
  if(toolBtn){toolBtn.classList.toggle('serviceToolActive',!!mode);toolBtn.setAttribute('aria-pressed',String(!!mode));toolBtn.title=mode?'Avsluta ritverktyg':'Ritverktyg'}
 }
 attachToolbar();
 return {render,stop(){setMode(null)},deselect(){selected=null;render(page,w,h)},attachToolbar};
}
function pdfPoint(x,y,w,h){return{x:x*w,y:h-y*h}}
function drawArrow(pdfPage,a,b,color,thickness=1.15){
 pdfPage.drawLine({start:a,end:b,thickness,color});
 const dx=b.x-a.x,dy=b.y-a.y,d=Math.max(.001,Math.hypot(dx,dy)),ux=dx/d,uy=dy/d,px=-uy,py=ux,head=6,wing=3;
 pdfPage.drawLine({start:b,end:{x:b.x-ux*head+px*wing,y:b.y-uy*head+py*wing},thickness,color});
 pdfPage.drawLine({start:b,end:{x:b.x-ux*head-px*wing,y:b.y-uy*head-py*wing},thickness,color});
}
function drawToPdf(pdfPage,pageNo,w,h,items,font){
 if(!window.PDFLib)return;const color=PDFLib.rgb(.09,.25,.33),list=(items||[]).filter(x=>x?.page===pageNo);
 for(const item of list){
  if(item.type==='line'||item.type==='arrow'){const a=pdfPoint(item.x1,item.y1,w,h),b=pdfPoint(item.x2,item.y2,w,h);item.type==='arrow'?drawArrow(pdfPage,a,b,color):pdfPage.drawLine({start:a,end:b,thickness:1.1,color});continue}
  if(item.type==='door-single'||item.type==='door-double'){
   const g=doorGeometry(item,w,h);
   const conv=p=>({x:p.x,y:h-p.y});
   g.segments.forEach(([a,b])=>pdfPage.drawLine({start:conv(a),end:conv(b),thickness:1.1,color}));
   g.arcs.forEach(ar=>{for(let i=1;i<ar.length;i++)pdfPage.drawLine({start:conv(ar[i-1]),end:conv(ar[i]),thickness:.9,color})});continue
  }
  if((item.type==='text'||item.type==='text-arrow')&&font){
   const p=pdfPoint(item.x,item.y,w,h);
   if(item.type==='text-arrow')drawArrow(pdfPage,p,pdfPoint(item.targetX,item.targetY,w,h),color,.9);
   const safe=String(item.text||'').replace(/[^\x20-\x7e\u00a0-\u00ff]/g,'?').slice(0,140);if(safe)pdfPage.drawText(safe,{x:p.x+2,y:p.y+2,size:8,font,color});
  }
 }
}
return {create,drawToPdf};
})();