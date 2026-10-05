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
.serviceToolsMenu{position:absolute;left:0;top:calc(100% + 5px);z-index:120;width:min(310px,92vw);padding:8px;background:#fff;border:1px solid #cbd9e1;border-radius:10px;box-shadow:0 8px 24px #0b253544;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px}
.serviceToolsMenu[hidden]{display:none!important}
.serviceToolsMenu button{min-height:38px!important;height:auto!important;padding:6px 8px!important;font-size:11px!important;white-space:normal!important}
.serviceToolsMenu .toolTitle{grid-column:1/-1;font-size:10px;font-weight:750;color:#60717d;padding:2px 2px 0}
.serviceToolsMenu .toolSelected{grid-column:1/-1;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:5px;padding-top:6px;border-top:1px solid #e0e7eb}
.serviceToolsMenu .toolSelected[hidden]{display:none!important}
.serviceToolsMenu .dangerTool{color:#a6292e;background:#fff5f4;border-color:#efceca}
.serviceToolActive{background:#173f55!important;color:#fff!important;border-color:#173f55!important}
@media(max-width:520px){.serviceToolsMenu{position:fixed;left:8px;right:8px;top:auto;bottom:calc(62px + env(safe-area-inset-bottom));width:auto;max-height:58vh;overflow:auto}.serviceToolsMenu button{font-size:10.5px!important}}
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
 function setMode(next){
  mode=mode===next?null:next;draft=null;selected=null;svg.classList.toggle('placing',!!mode);
  if(toolBtn)toolBtn.classList.toggle('serviceToolActive',!!mode);
  updateMenu();
  if(mode){cfg.activateDrawing?.();notify(({line:'Dra ett streck där väggen/linjen ska vara.',arrow:'Dra från start till den punkt pilen ska peka på.','door-single':'Tryck där enkeldörren ska placeras.','door-double':'Tryck där dubbeldörren ska placeras.',text:'Tryck där texten ska ligga.','text-arrow':'Tryck där pilen ska peka; texten placeras bredvid.'})[mode]);
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
  if(mode==='text'||mode==='text-arrow'){const value=prompt('Skriv texten:','');if(value?.trim()){const item={uid:uid(),type:mode,page,x:mode==='text-arrow'?clamp(x+(x>.72?-.14:.10),.02,.92):x,y:mode==='text-arrow'?clamp(y-.05,.04,.96):y,text:value.trim()};if(mode==='text-arrow'){item.targetX=x;item.targetY=y}items().push(item);selected=item.uid;setMode(null);changed('Texten är tillagd. Dra den för att flytta.')}else setMode(null)}
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
 function action(label,fn,cls=''){const b=document.createElement('button');b.type='button';b.textContent=label;if(cls)b.className=cls;b.onclick=e=>{e.stopPropagation();fn()};return b}
 function attachToolbar(){
  const bar=document.querySelector('.sessionHistoryBar');if(!bar||toolBtn)return;
  const wrap=document.createElement('span');wrap.className='serviceToolsWrap';toolBtn=action('＋ Verktyg',()=>{menu.hidden=!menu.hidden;updateMenu()});
  menu=document.createElement('div');menu.className='serviceToolsMenu';menu.hidden=true;
  const title=document.createElement('div');title.className='toolTitle';title.textContent='Lägg på ritningen';menu.appendChild(title);
  [['door-single','Enkeldörr'],['door-double','Dubbeldörr'],['line','Linje / vägg'],['arrow','Pil'],['text','Text'],['text-arrow','Text + pil']].forEach(([key,label])=>menu.appendChild(action(label,()=>{menu.hidden=true;setMode(key)})));
  selectedBox=document.createElement('div');selectedBox.className='toolSelected';selectedBox.hidden=true;
  selectedBox.append(
   action('↻ 90°',()=>editSelected(s=>{if(s.type.startsWith('door-'))s.angle=(Number(s.angle||0)+90)%360})),
   action('↔ Spegla',()=>editSelected(s=>{if(s.type.startsWith('door-'))s.flip=!s.flip})),
   action('− Mindre',()=>editSelected(s=>{if(s.type.startsWith('door-'))s.size=clamp((s.size||.08)*.88,.02,.3)})),
   action('＋ Större',()=>editSelected(s=>{if(s.type.startsWith('door-'))s.size=clamp((s.size||.08)*1.12,.02,.3)})),
   action('Ändra text',()=>{const s=current();if(!s||!s.type.startsWith('text'))return;const v=prompt('Ändra text:',s.text||'');if(v!==null&&v.trim()){s.text=v.trim();changed()}}),
   action('Ta bort',()=>{const s=current();if(!s)return;cfg.setItems?.(items().filter(x=>x.uid!==s.uid));selected=null;changed('Ritobjektet är borttaget.')},'dangerTool')
  );
  menu.appendChild(selectedBox);wrap.append(toolBtn,menu);
  const status=bar.querySelector('span[role="status"]');status?bar.insertBefore(wrap,status):bar.appendChild(wrap);
  document.addEventListener('pointerdown',e=>{if(menu&&!menu.hidden&&!wrap.contains(e.target))menu.hidden=true});
 }
 function editSelected(fn){const s=current();if(!s)return;fn(s);changed()}
 function updateMenu(){
  if(selectedBox){const s=current();selectedBox.hidden=!s;const buttons=[...selectedBox.querySelectorAll('button')];if(s){buttons[0].disabled=buttons[1].disabled=buttons[2].disabled=buttons[3].disabled=!s.type.startsWith('door-');buttons[4].disabled=!s.type.startsWith('text')}}
  if(toolBtn)toolBtn.textContent=mode?'Avsluta verktyg':'＋ Verktyg';
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