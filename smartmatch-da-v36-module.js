/* SmartMatch TEST v36 – door-automation label recognition in the drawing view.
   Only activated when the operator opens Verktyg > Koppla dörrautomatik.
   The original GS/door-card scanner remains the source of truth for door positions. */
window.SmartMatchDALink=(()=>{
 'use strict';
 let context=null,exampleFamily='',manualPending='',selectedId='',busy=false,controlsReady=false,pendingGSItemId='';
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
  svg.replaceChildren();svg.setAttribute('width',viewport.width);svg.setAttribute('height',viewport.height);
  svg.setAttribute('viewBox','0 0 '+viewport.width+' '+viewport.height);
  if(renderPage!==ctx().getPage())return;
  const ns='http://www.w3.org/2000/svg',defs=document.createElementNS(ns,'defs'),marker=document.createElementNS(ns,'marker');
  marker.id='pwDALinkArrowhead';[['markerWidth','8'],['markerHeight','8'],['refX','7'],['refY','3'],['orient','auto']].forEach(([k,v])=>marker.setAttribute(k,v));
  const tri=document.createElementNS(ns,'path');tri.setAttribute('d','M0 0 L7 3 L0 6 z');tri.setAttribute('fill','#116a97');
  marker.appendChild(tri);defs.appendChild(marker);svg.appendChild(defs);
  items.forEach(item=>{
   const target=ctx().getPositions().find(g=>g.id===item.linkedGsId&&g.page===item.page);if(!target)return;
   const a=ctx().viewportRect(viewport,item.rect),b=ctx().viewportRect(viewport,target.rect);
   const arrow=document.createElementNS(ns,'path');
   arrow.setAttribute('d','M'+(a.left+a.width/2)+','+(a.top+a.height/2)+' L'+(b.left+b.width/2)+','+(b.top+b.height/2));
   arrow.setAttribute('stroke','#116a97');arrow.setAttribute('stroke-width','2');arrow.setAttribute('fill','none');
   arrow.setAttribute('marker-end','url(#pwDALinkArrowhead)');svg.appendChild(arrow);
  });
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
 }
 init(null);
 return {init,openDoor,drawArrows,onGSClick,onProjectOpened(){manualPending='';selectedId='';pendingGSItemId='';exampleFamily=''}};
})();