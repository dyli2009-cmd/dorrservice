/* SmartMatch TEST v36 – door-automation label recognition in the drawing view.
   Only activated when the operator opens Verktyg > Koppla dörrautomatik.
   The original GS/door-card scanner remains the source of truth for door positions. */
window.SmartMatchDALink=(()=>{
 'use strict';
 let context=null,exampleFamily='',manualPending='',selectedId='',busy=false,controlsReady=false,pendingGSItemId='',editMarkerId='',editingArrowId='',moveGesture=null,movePreview=null;
 const ctx=()=>window.SmartMatchAppBridge||context;
 const loaded=()=>{try{return !!ctx()?.getPdf?.()}catch(err){console.warn('DA PDF readiness',err);return false}};
 const $=id=>document.getElementById(id);
 const normalize=s=>String(s||'').toUpperCase().replace(/[–—]/g,'-').replace(/\s*-\s*/g,'-').replace(/\s+/g,'').trim();
 const family=s=>{const t=normalize(s),i=t.lastIndexOf('-');return i>0?t.slice(0,i):''};
 const valid=s=>/^\d+(?:-\d+){2,}$/.test(normalize(s));
 const getSelected=()=>ctx()?.getItems()?.find(o=>o.id===selectedId)||null;
 const gsOnPage=p=>ctx().getPositions().filter(o=>o.page===p&&/^GS\d+/i.test(o.code||''));
 const point=r=>[(r[0]+r[2])/2,(r[1]+r[3])/2];
 const status=s=>{$('pwDAFeedback').textContent=s};
 function nearestGS(page,rect){
  const [x,y]=point(rect);
  const values=gsOnPage(page).map(g=>{const [gx,gy]=point(g.rect);return {g,d:Math.hypot(x-gx,y-gy)}}).sort((a,b)=>a.d-b.d);
  if(!values.length)return '';
  const a=values[0],b=values[1];
  return a.d<200&&(!b||b.d>a.d*1.55)?a.g.id:'';
 }
 function openTool(){
  // The entry point is wired as soon as this script loads, independently
  // of the possibly long GS scanner and the app's remaining setup.
  const menu=$('pwToolMenu'),menuBtn=$('pwToolMenuButton');
  if(menu)menu.hidden=true;
  if(menuBtn)menuBtn.setAttribute('aria-expanded','false');
  const dialog=$('pwDALinkDialog');
  if(!dialog){window.alert('Dörrautomatikverktyget saknas i denna programversion. Uppdatera sidan.');return}
  if(!dialog.open)dialog.showModal();
  if(!loaded()){
   status('SmartMatch har inte läst in någon PDF ännu. Öppna en ritning, så kan du analysera den här.');
   return;
  }
  status('Öppnad PDF är ansluten! Ange en märkning och tryck Analysera. Resultatet kan kopplas till GS med en pil.');
  $('pwDAExample')?.focus();
 }
 function closeTool(){if($('pwDALinkDialog').open)$('pwDALinkDialog').close()}
 function manual(){
  if(!loaded()){status('Ingen PDF är öppen. Öppna ritningen först.');return}
  const text=normalize($('pwDAExample').value);
  if(!valid(text)){status('Skriv en fullständig märkning, till exempel 70154-78-24-11.');return}
  exampleFamily=family(text);manualPending=text;closeTool();
  ctx().setStatus('Tryck på märkningen på ritningen för att placera knappen '+text+'.');
 }
 async function placeManual(e){
  if(!manualPending||!ctx()?.getPdf()||!$('pwStage').contains(e.target)||e.target.closest?.('button'))return;
  if(e.pointerType==='mouse'&&e.button!==0)return;
  e.preventDefault();e.stopImmediatePropagation();
  const text=manualPending;manualPending='';
  const page=ctx().getPage(),pg=await ctx().getPdf().getPage(page),vp=pg.getViewport({scale:ctx().getScale()});
  const stage=$('pwStage').getBoundingClientRect(),xy=vp.convertToPdfPoint(e.clientX-stage.left,e.clientY-stage.top);
  const rect=[xy[0],xy[1],xy[0]+Math.max(70,Math.min(180,text.length*5)),xy[1]+16];
  const parts=text.split('-'),serialNumber=parts.pop(),modelCode=parts.pop(),objectNo=parts.join('-');
  const model=ctx().getModels().find(x=>x[0]===modelCode)?.[1]||modelCode;
  const id='manual-da@'+page+':'+text+':'+Math.round(xy[0])+':'+Math.round(xy[1]);
  const existing=ctx().getItems().find(o=>o.id===id);
  const item=existing||{id,page,rect,objectNo,modelCode,model,serialNumber,sourceText:text,
    sourceKind:'manual-da',linkedGsId:nearestGS(page,rect),slrDocuments:{},checks:{},notes:'',progress:0};
  if(!existing)ctx().addItem(item);
  openDoor(item);
 }
 // PDF.js splits characters and numbers into arbitrary text fragments.
 // Locate the exact number on the row instead of requiring a whole text item
 // to equal the searched number.
 function locateRowMatches(row,page,fam){
  const items=[...row.items].filter(v=>v.text).sort((a,b)=>a.x-b.x);
  const spans=[],words=[];let combined='';
  for(const it of items){
   if(combined)combined+=' ';
   const from=combined.length;combined+=it.text;
   spans.push({from,to:combined.length,it});
  }
  const hits=[];const pattern=/\d{1,10}(?:\s*[-–—]\s*\d{1,10}){2,}/g;
  for(const match of combined.matchAll(pattern)){
   const name=normalize(match[0]);
   if(family(name)!==fam)continue;
   const start=match.index,end=start+match[0].length;
   const parts=spans.filter(s=>s.to>start&&s.from<end);
   if(!parts.length)continue;
   const bounds=parts.map(s=>{
    const length=Math.max(1,s.to-s.from),a=Math.max(0,start-s.from)/length,b=Math.min(length,end-s.from)/length;
    return {left:s.it.x+s.it.w*a,right:s.it.x+s.it.w*b,
      low:s.it.y-Math.max(1,s.it.h)*.35,high:s.it.y+Math.max(1,s.it.h)*.95};
   });
   const rect=[Math.min(...bounds.map(b=>b.left))-3,Math.min(...bounds.map(b=>b.low))-3,
     Math.max(...bounds.map(b=>b.right))+3,Math.max(...bounds.map(b=>b.high))+3];
   if(rect.every(Number.isFinite)&&rect[2]>rect[0]&&rect[3]>rect[1])hits.push({text:name,page,rect});
  }
  return hits;
 }
 function renderResults(items){
  const box=$('pwDAResults');
  if(!box)return;
  box.replaceChildren();
  const unique=[...new Map(items.map(o=>[o.id,o])).values()];
  if(!unique.length)return;
  const summary=document.createElement('strong');summary.textContent='Hittade märkningar ('+unique.length+')';
  box.appendChild(summary);
  unique.sort((a,b)=>a.page-b.page||a.sourceText.localeCompare(b.sourceText,'sv',{numeric:true}));
  for(const o of unique){
   const line=document.createElement('div');line.className='pwDAResult';
   const button=document.createElement('button');button.type='button';button.className='pwDAResultOpen';
   button.textContent=o.sourceText+' · sida '+o.page;
   const caption=document.createElement('small');caption.textContent=o.linkedGsId?'GS föreslagen – granska':'Välj rätt GS-position';
   const look=document.createElement('button');look.type='button';look.textContent='Visa';
   look.onclick=()=>{closeTool();void ctx()?.locate?.(o)};
   button.onclick=()=>{closeTool();openDoor(o)};
   line.append(button,caption,look);box.appendChild(line);
  }
 }
 async function analyze(){
  if(busy)return;
  if(!loaded()){status('Ingen PDF är inläst ännu. Öppna ritningen och försök igen.');return}
  const example=normalize($('pwDAExample').value);
  if(!valid(example)){status('Skriv hela märkningen, exempelvis 70154-78-24-11.');return}
  exampleFamily=family(example);busy=true;$('pwDAAnalyze').disabled=true;
  status('Söker efter märkningar i samma familj: '+exampleFamily+'…');
  let found=0,created=0,suggested=0,unlinked=0,results=[];
  try{
   const api=ctx(),pdf=api.getPdf(),upper=Math.min(pdf.numPages,api.getDrawingLimit());
   const seen=new Set();
   for(let p=1;p<=upper;p++){
    const data=await api.readPageText(p);
    if(api.looksLikeProtocol(data.raw))continue;
    for(const row of api.groupRows(data.items)){
     for(const {text,rect} of locateRowMatches(row,p,exampleFamily)){
      const near=api.getItems().find(o=>o.page===p&&normalize(o.sourceText||[o.objectNo,o.modelCode,o.serialNumber].filter(Boolean).join('-'))===text&&Math.hypot(o.rect[0]-rect[0],o.rect[1]-rect[1])<15);
      const id='family-da@'+p+':'+text+':'+Math.round(rect[0])+':'+Math.round(rect[1]);
      if(seen.has(id))continue;
      seen.add(id);found++;
      let item=near||api.getItems().find(o=>o.id===id);
      if(!item){
       const pieces=text.split('-'),serialNumber=pieces.pop(),modelCode=pieces.pop(),objectNo=pieces.join('-');
       const model=api.getModels().find(x=>x[0]===modelCode)?.[1]||modelCode;
       item={id,page:p,rect,objectNo,modelCode,model,serialNumber,
         sourceText:text,sourceKind:'family-da',linkedGsId:nearestGS(p,rect),
         slrDocuments:{},checks:{},notes:'',progress:0};
       api.addItem(item,false);created++;
       if(item.linkedGsId)suggested++;
      }
      if(!item.linkedGsId)unlinked++;
      results.push(item);
     }
    }
    if(p%5===0)status('Analyserar ritningens PDF-text: '+p+' av '+upper+' sidor…');
   }
   api.save();api.redraw();renderResults(results);
   status(found?'Hittade '+found+' märkningar av '+exampleFamily+'. '+created+' nya knappar. '+suggested+' tydliga GS-förslag med pil. '+unlinked+' behöver kopplas manuellt. Tryck på en träff för att granska eller välja GS.':
    'Inga läsbara märkningar i denna familj. Prova Placera manuellt; om texten är en inskannad bild behövs OCR.');
  }catch(err){console.error('[SmartMatch DA analyze]',err);status('Analysfel: '+(err.message||err))}
  finally{busy=false;$('pwDAAnalyze').disabled=false}
 }

 // Automations get the same transparent rectangle style for every family
 // member, but retain their own independent PDF coordinates and GS link.
 function selectedItem(id){return ctx()?.getItems?.().find(o=>o.id===id)||null}
 function markerLabel(o){return o?.sourceText||[o?.objectNo,o?.modelCode,o?.serialNumber].filter(Boolean).join('-')}
 function hideMovePreview(){if(movePreview){movePreview.remove();movePreview=null}}
 function stopMove(){editMarkerId='';moveGesture=null;hideMovePreview();$('pwStage').classList.remove('pwDAMoving')}
 async function beginMove(o){
  if(!loaded()||!o)return;
  editMarkerId=o.id;editingArrowId='';
  await ctx().locate(o);
  $('pwStage').classList.add('pwDAMoving');
  ctx().setStatus('Flytta / storlek: tryck för att flytta '+markerLabel(o)+', eller dra ut en rektangel kring märkningen. Samma storlek används för märkningar i samma familj.');
 }
 function rename(o){
  if(!o)return;
  const raw=window.prompt('Ändra märkning för denna automatik:',markerLabel(o));
  if(raw===null)return;
  const name=normalize(raw);
  if(!valid(name)){window.alert('Skriv ett fullständigt objektnummer, till exempel 70154-78-24-11.');return}
  const parts=name.split('-'),serialNumber=parts.pop(),modelCode=parts.pop(),objectNo=parts.join('-');
  o.objectNo=objectNo;o.modelCode=modelCode;o.serialNumber=serialNumber;o.sourceText=name;
  o.model=ctx().getModels().find(x=>x[0]===modelCode)?.[1]||o.model||modelCode;
  ctx().save();ctx().redraw();ctx().setStatus('Märkningen ändrad till '+name+' för denna egenkontroll.');
 }
 function remove(o){
  if(!o||!window.confirm('Ta bort egenkontrollen '+markerLabel(o)+' och dess GS-koppling?'))return;
  const items=ctx().getItems(),idx=items.findIndex(x=>x.id===o.id);
  if(idx>=0)items.splice(idx,1);
  if(editMarkerId===o.id)stopMove();
  if(editingArrowId===o.id)editingArrowId='';
  ctx().save();ctx().redraw();ctx().setStatus('Egenkontrollen är borttagen från projektet.');
 }
 function beginArrowAdjust(o){
  if(!o)return;
  if(!o.linkedGsId){openDoor(o);ctx().setStatus('Koppla först rätt GS-position, sedan kan du justera pilen.');return}
  editingArrowId=o.id;stopMove();
  void ctx().locate(o).then(()=>ctx().redraw());
  ctx().setStatus('Justera pil: dra den blå runda punkten på ritningen till önskad kant på GS-stämpeln. Zooma gärna in för precision.');
 }
 function previewForMove(start,end){
  if(!movePreview){movePreview=document.createElement('div');movePreview.className='pmDragPreview';movePreview.setAttribute('aria-hidden','true');$('pwStage').appendChild(movePreview)}
  const left=Math.min(start.x,end.x),top=Math.min(start.y,end.y);
  Object.assign(movePreview.style,{left:left+'px',top:top+'px',
    width:Math.max(20,Math.abs(end.x-start.x))+'px',
    height:Math.max(18,Math.abs(end.y-start.y))+'px'});
  movePreview.textContent='';
 }
 function stageXY(e){const r=$('pwStage').getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top}}
 async function commitMove(start,end,dragged){
  const item=selectedItem(editMarkerId);if(!item||!loaded())return;
  try{
   const pg=await ctx().getPdf().getPage(ctx().getPage()),vp=pg.getViewport({scale:ctx().getScale()});
   const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),old=ctx().viewportRect(vp,item.rect);
   let x,y,w,h;
   if(dragged){
    x=clamp(Math.min(start.x,end.x),0,vp.width);y=clamp(Math.min(start.y,end.y),0,vp.height);
    w=Math.min(Math.max(28,Math.abs(end.x-start.x)),vp.width-x);
    h=Math.min(Math.max(20,Math.abs(end.y-start.y)),vp.height-y);
   }else{
    w=Math.max(42,old.width);h=Math.max(23,old.height);
    x=clamp(end.x-w/2,0,vp.width-w);y=clamp(end.y-h/2,0,vp.height-h);
   }
   const corner=vp.convertToPdfPoint(x,y),other=vp.convertToPdfPoint(x+w,y+h);
   const next=[Math.min(corner[0],other[0]),Math.min(corner[1],other[1]),Math.max(corner[0],other[0]),Math.max(corner[1],other[1])];
   const prior=item.rect;
   item.rect=next;item.page=ctx().getPage();
   if(dragged){
    // Reuse the exact chosen rectangle size for other already-detected
    // members of this family, centered on their own original coordinates.
    // Their locations are never copied from this door.
    const dw=next[2]-next[0],dh=next[3]-next[1];
    for(const peer of ctx().getItems()){
     if(peer.id===item.id||family(markerLabel(peer))!==family(markerLabel(item)))continue;
     const [cx,cy]=point(peer.rect);
     peer.rect=[cx-dw/2,cy-dh/2,cx+dw/2,cy+dh/2];
    }
   }
   ctx().save();ctx().redraw();
   ctx().setStatus('Position och storlek sparad för '+markerLabel(item)+'. '+(dragged?'Samma markeringsstorlek används för övriga märkningar i familjen.':'Placeringen ändrades utan att rutan krympte.'));
  }catch(err){console.error(err);ctx().setStatus('Kunde inte ändra storleken: '+(err.message||err))}
  finally{stopMove()}
 }
 function bindMoveGestures(){
  const stage=$('pwStage');
  stage.addEventListener('pointerdown',e=>{
   if(!editMarkerId)return;
   if(e.pointerType==='mouse'&&e.button!==0)return;
   e.preventDefault();e.stopImmediatePropagation();
   moveGesture={id:e.pointerId,start:stageXY(e)};
   try{stage.setPointerCapture(e.pointerId)}catch(_){}
  },true);
  stage.addEventListener('pointermove',e=>{
   if(!moveGesture||e.pointerId!==moveGesture.id)return;
   e.preventDefault();e.stopImmediatePropagation();
   const pt=stageXY(e);
   if(Math.hypot(pt.x-moveGesture.start.x,pt.y-moveGesture.start.y)>6)previewForMove(moveGesture.start,pt);
  },true);
  stage.addEventListener('pointerup',e=>{
   if(!moveGesture||e.pointerId!==moveGesture.id)return;
   e.preventDefault();e.stopImmediatePropagation();
   const start=moveGesture.start,end=stageXY(e);
   moveGesture=null;hideMovePreview();
   void commitMove(start,end,Math.hypot(end.x-start.x,end.y-start.y)>=12);
  },true);
  stage.addEventListener('pointercancel',()=>{if(editMarkerId)stopMove()},true);
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&editMarkerId)stopMove()});
 }

 function openDoor(o){
  if(!o)return;selectedId=o.id;
  $('pwDADoorTitle').textContent=[o.objectNo,o.modelCode,o.serialNumber].filter(Boolean).join('-');
  $('pwDADoorSub').textContent='Grundmärkning: '+family(o.sourceText||$('pwDADoorTitle').textContent)+' · löpnummer '+o.serialNumber;
  const select=$('pwDAGsSelect');select.replaceChildren();
  const blank=document.createElement('option');blank.value='';blank.textContent='Ingen koppling – välj GS-position';select.appendChild(blank);
  gsOnPage(o.page).forEach(g=>{
   const option=document.createElement('option');option.value=g.id;option.textContent=g.code+' · position '+(g.position||'?')+' · sida '+g.page;
   select.appendChild(option);
  });
  select.value=o.linkedGsId||'';
  if(!$('pwDADoorDialog').open)$('pwDADoorDialog').showModal();
 }
 function closeDoor(){if($('pwDADoorDialog').open)$('pwDADoorDialog').close()}
 function chooseOnDrawing(){
  const item=getSelected();if(!item)return;
  if(!loaded()){ctx()?.setStatus?.('Ingen ritning är öppen.');return}
  pendingGSItemId=item.id;closeDoor();
  ctx().setStatus('Välj rätt GS-position på ritningen för '+(item.sourceText||item.id)+'. Bekräfta kopplingen när du tryckt på GS.');
  void ctx()?.locate?.(item);
 }
 function saveLink(){
  const o=getSelected();if(!o)return;
  o.linkedGsId=$('pwDAGsSelect').value||'';
  ctx().save();closeDoor();ctx().redraw();
 }
 function openSLR(o){
  $('pwSLRTitle').textContent='SLR · '+[o.objectNo,o.modelCode,o.serialNumber].join('-');
  const titles=['Riskanalys','Beskrivning av maskin','Loggbok','Tillverkarens försäkran','Försäkringscertifikat','Godkännande','Produktlista','Egenkontroll','Egenkontroll – brukaransvarig','CE-skylt'];
  const list=$('pwSLRList');list.replaceChildren();
  titles.forEach(label=>{
   const b=document.createElement('button'),strong=document.createElement('strong'),small=document.createElement('small');
   strong.textContent=label;small.textContent='Mall skapas senare';b.type='button';b.className='pwSLRSection';
   b.append(strong,small);b.onclick=()=>{
    list.querySelectorAll('button').forEach(x=>x.classList.remove('active'));b.classList.add('active');
    $('pwSLRHint').textContent=label+': här lägger vi senare in dokumentets egen mall och kontrollpunkter.';
   };list.appendChild(b);
  });
  $('pwSLRHint').textContent='SLR-dokumentmappen är klar som struktur. Själva protokollmallarna byggs senare.';
  $('pwSLRDialog').showModal();
 }
 function drawArrows(viewport,items,renderPage){
  const svg=$('pwDAArrows');if(!svg)return;
  svg.classList.toggle('pwDAArrowEdit',!!editingArrowId);
  svg.replaceChildren();svg.setAttribute('width',viewport.width);svg.setAttribute('height',viewport.height);
  svg.setAttribute('viewBox','0 0 '+viewport.width+' '+viewport.height);
  if(renderPage!==ctx().getPage())return;
  const ns='http://www.w3.org/2000/svg',make=(tag)=>document.createElementNS(ns,tag);
  const defs=make('defs'),marker=make('marker');
  marker.id='pwDALinkArrowhead';
  [['markerWidth','7'],['markerHeight','7'],['refX','6'],['refY','3'],['orient','auto']].forEach(([k,v])=>marker.setAttribute(k,v));
  const tri=make('path');tri.setAttribute('d','M0 0 L6 3 L0 6 Z');tri.setAttribute('fill','#176f9b');
  marker.appendChild(tri);defs.appendChild(marker);svg.appendChild(defs);
  const middle=r=>({x:r.left+r.width/2,y:r.top+r.height/2});
  function edge(r,toward){
   const center=middle(r),dx=toward.x-center.x,dy=toward.y-center.y;
   const halfW=Math.max(1,r.width/2),halfH=Math.max(1,r.height/2);
   const ratio=Math.min(dx?halfW/Math.abs(dx):Infinity,dy?halfH/Math.abs(dy):Infinity);
   return {x:center.x+dx*ratio,y:center.y+dy*ratio};
  }
  function tipFromRect(rect,from,stored){
   if(!stored||!Number.isFinite(stored.u)||!Number.isFinite(stored.v))return edge(rect,from);
   const u=Math.max(0,Math.min(1,stored.u)),v=Math.max(0,Math.min(1,stored.v));
   return {x:rect.left+rect.width*u,y:rect.top+rect.height*v};
  }
  function snapTip(rect,x,y){
   let u=Math.max(0,Math.min(1,(x-rect.left)/Math.max(1,rect.width)));
   let v=Math.max(0,Math.min(1,(y-rect.top)/Math.max(1,rect.height)));
   const nearest=Math.min(u,1-u,v,1-v);
   if(nearest===u)u=0;else if(nearest===1-u)u=1;else if(nearest===v)v=0;else v=1;
   return {u,v};
  }
  for(const item of items){
   const gs=ctx().getPositions().find(g=>g.id===item.linkedGsId&&g.page===item.page);
   if(!gs)continue;
   const a=ctx().viewportRect(viewport,item.rect),b=ctx().viewportRect(viewport,gs.rect);
   let tip=tipFromRect(b,middle(a),item.arrowTip),start=edge(a,tip);
   const line=make('path');
   const setLine=()=>{
    start=edge(a,tip);
    line.setAttribute('d','M'+start.x+','+start.y+' L'+tip.x+','+tip.y);
   };
   setLine();
   line.setAttribute('stroke','#176f9b');line.setAttribute('stroke-width','1.7');
   line.setAttribute('fill','none');line.setAttribute('marker-end','url(#pwDALinkArrowhead)');
   line.setAttribute('stroke-linecap','round');
   svg.appendChild(line);
   if(item.id!==editingArrowId)continue;
   // The only visible edit affordance is at the arrow tip. It can be
   // repositioned on touch screens without covering the GS text.
   const handle=make('circle');
   handle.setAttribute('cx',tip.x);handle.setAttribute('cy',tip.y);
   handle.setAttribute('r','9');handle.setAttribute('fill','#fff7d8');
   handle.setAttribute('stroke','#176f9b');handle.setAttribute('stroke-width','2');
   handle.setAttribute('class','pwDAArrowHandle');
   handle.setAttribute('aria-label','Dra pilspets på kanten av '+gs.code);
   handle.style.pointerEvents='auto';handle.style.touchAction='none';
   const locatePointer=e=>{
    const bounds=svg.getBoundingClientRect();
    return {x:(e.clientX-bounds.left)*viewport.width/Math.max(1,bounds.width),
      y:(e.clientY-bounds.top)*viewport.height/Math.max(1,bounds.height)};
   };
   let dragging=false;
   handle.addEventListener('pointerdown',e=>{
    if(e.pointerType==='mouse'&&e.button!==0)return;
    e.preventDefault();e.stopPropagation();dragging=true;
    try{handle.setPointerCapture(e.pointerId)}catch(_){}
   });
   handle.addEventListener('pointermove',e=>{
    if(!dragging)return;
    e.preventDefault();e.stopPropagation();
    const p=locatePointer(e),uv=snapTip(b,p.x,p.y);
    tip=tipFromRect(b,middle(a),uv);setLine();
    handle.setAttribute('cx',tip.x);handle.setAttribute('cy',tip.y);
   });
   handle.addEventListener('pointerup',e=>{
    if(!dragging)return;dragging=false;
    e.preventDefault();e.stopPropagation();
    const p=locatePointer(e),uv=snapTip(b,p.x,p.y);
    item.arrowTip=uv;editingArrowId='';
    ctx().save();ctx().redraw();
    ctx().setStatus('Pilens spets sparad på kanten av '+gs.code+'. Du kan justera igen via ⋯.');
   });
   handle.addEventListener('pointercancel',()=>{dragging=false;editingArrowId='';ctx().redraw()});
   svg.appendChild(handle);
  }
 }
 // Always wire the entry button during script evaluation. This fixes the
 // v36.5 dead-button issue when the scan never reached the late init call.
 const entry=$('pwDALinkTool');
 if(entry)entry.addEventListener('click',openTool);

 function onGSClick(g){
  if(!pendingGSItemId)return false;
  const item=ctx()?.getItems().find(x=>x.id===pendingGSItemId);
  pendingGSItemId='';
  if(!item)return true;
  if(g.page!==item.page){
   ctx()?.setStatus('GS-positionen måste ligga på samma ritningssida som märkningen.');
   return true;
  }
  if(!window.confirm('Koppla '+item.sourceText+' till '+g.code+' · position '+(g.position||'?')+'?'))return true;
  item.linkedGsId=g.id;ctx().save();ctx().redraw();
  ctx().setStatus(item.sourceText+' är nu kopplad till '+g.code+' position '+(g.position||'?')+'. Pilen visas på ritningen.');
  return true;
 }

 function init(c){
  if(c)context=c;
  if(controlsReady)return;
  controlsReady=true;
  $('pwDAAnalyze').onclick=()=>void analyze();
  $('pwDAManual').onclick=manual;
  $('pwDAExample').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();void analyze()}});
  $('pwDALinkClose').onclick=closeTool;
  $('pwDADoorClose').onclick=closeDoor;
  $('pwDASaveLink').onclick=saveLink;
  $('pwDAChooseOnDrawing').onclick=chooseOnDrawing;
  $('pwDARevision').onclick=()=>{const o=getSelected();closeDoor();if(o)ctx().openRevision(o)};
  $('pwDASLR').onclick=()=>{const o=getSelected();closeDoor();if(o)openSLR(o)};
  $('pwSLRClose').onclick=()=>{if($('pwSLRDialog').open)$('pwSLRDialog').close()};
  $('pwDARevisionSave').onclick=()=>{ctx().save();ctx().closeRevision()};
  $('pwDAExportRevision').onclick=()=>{const o=ctx().selectedRevision();if(o)ctx().exportRevision(o)};
  $('pwDALinkDialog').addEventListener('cancel',e=>{e.preventDefault();closeTool()});
  $('pwDADoorDialog').addEventListener('cancel',e=>{e.preventDefault();closeDoor()});
  $('pwStage').addEventListener('pointerdown',e=>{if(manualPending)void placeManual(e)},true);
  bindMoveGestures();
 }
 init(null);
 return {init,openDoor,drawArrows,onGSClick,beginMove,rename,remove,beginArrowAdjust,onProjectOpened(){stopMove();editingArrowId='';manualPending='';selectedId='';pendingGSItemId='';exampleFamily=''}};
})();