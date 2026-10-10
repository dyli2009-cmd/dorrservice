/* SmartMatch TEST v36 – door-automation label recognition in the drawing view.
   Only activated when the operator opens Verktyg > Koppla dörrautomatik.
   The original GS/door-card scanner remains the source of truth for door positions. */
window.SmartMatchDALink=(()=>{
 'use strict';
 let context=null,exampleFamily='',manualPending='',selectedId='',busy=false;
 const $=id=>document.getElementById(id);
 const normalize=s=>String(s||'').toUpperCase().replace(/[–—]/g,'-').replace(/\s*-\s*/g,'-').replace(/\s+/g,'').trim();
 const family=s=>{const t=normalize(s),i=t.lastIndexOf('-');return i>0?t.slice(0,i):''};
 const valid=s=>/^\d+(?:-\d+){2,}$/.test(normalize(s));
 const getSelected=()=>context?.getItems().find(o=>o.id===selectedId)||null;
 const gsOnPage=p=>context.getPositions().filter(o=>o.page===p&&/^GS\d+/i.test(o.code||''));
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
  if(!context?.getPdf()){context?.setStatus('Öppna en ritning först, sedan Verktyg → Koppla dörrautomatik.');return}
  $('pwDALinkDialog').showModal();$('pwDAExample').focus();
  status('Skriv en märkning som finns på ritningen. Analysera hittar samma grundnummer även om sista löpnumret ändras.');
 }
 function closeTool(){if($('pwDALinkDialog').open)$('pwDALinkDialog').close()}
 function manual(){
  const text=normalize($('pwDAExample').value);
  if(!valid(text)){status('Skriv en fullständig märkning, till exempel 70154-78-24-11.');return}
  exampleFamily=family(text);manualPending=text;closeTool();
  context.setStatus('Tryck på märkningen på ritningen för att placera knappen '+text+'.');
 }
 async function placeManual(e){
  if(!manualPending||!context?.getPdf()||!$('pwStage').contains(e.target)||e.target.closest?.('button'))return;
  if(e.pointerType==='mouse'&&e.button!==0)return;
  e.preventDefault();e.stopImmediatePropagation();
  const text=manualPending;manualPending='';
  const page=context.getPage(),pg=await context.getPdf().getPage(page),vp=pg.getViewport({scale:context.getScale()});
  const stage=$('pwStage').getBoundingClientRect(),xy=vp.convertToPdfPoint(e.clientX-stage.left,e.clientY-stage.top);
  const rect=[xy[0],xy[1],xy[0]+Math.max(70,Math.min(180,text.length*5)),xy[1]+16];
  const parts=text.split('-'),serialNumber=parts.pop(),modelCode=parts.pop(),objectNo=parts.join('-');
  const model=context.getModels().find(x=>x[0]===modelCode)?.[1]||modelCode;
  const id='manual-da@'+page+':'+text+':'+Math.round(xy[0])+':'+Math.round(xy[1]);
  const existing=context.getItems().find(o=>o.id===id);
  const item=existing||{id,page,rect,objectNo,modelCode,model,serialNumber,sourceText:text,
    sourceKind:'manual-da',linkedGsId:nearestGS(page,rect),slrDocuments:{},checks:{},notes:'',progress:0};
  if(!existing)context.addItem(item);
  openDoor(item);
 }
 async function analyze(){
  if(busy||!context?.getPdf())return;
  const example=normalize($('pwDAExample').value);
  if(!valid(example)){status('Ange hela märkningen med löpnummer, exempelvis 70154-78-24-11.');return}
  exampleFamily=family(example);busy=true;$('pwDAAnalyze').disabled=true;
  status('Analyserar märkningar i ritningens PDF-text…');
  let found=0,created=0,needsReview=0;
  try{
   const pdf=context.getPdf(),upper=Math.min(pdf.numPages,context.getDrawingLimit());
   for(let p=1;p<=upper;p++){
    const data=await context.readPageText(p);
    if(context.looksLikeProtocol(data.raw))continue;
    for(const row of context.groupRows(data.items)){
     const matches=row.text.match(/\d+(?:\s*[-–—]\s*\d+){2,}/g)||[];
     for(const raw of matches){
      const text=normalize(raw);
      if(family(text)!==exampleFamily)continue;
      const touched=context.itemsForText(row.items,raw),rect=touched.length?context.rectForItems(touched,3):null;
      if(!rect)continue;
      const key=p+':'+text+':'+Math.round(rect[0])+':'+Math.round(rect[1]);
      let old=context.getItems().find(o=>o.id==='family-da@'+key);
      if(!old)old=context.getItems().find(o=>o.page===p&&normalize(o.sourceText||o.objectNo+'-'+o.modelCode+'-'+o.serialNumber)===text&&Math.hypot(o.rect[0]-rect[0],o.rect[1]-rect[1])<20);
      found++;
      if(!old){
       const parts=text.split('-'),serialNumber=parts.pop(),modelCode=parts.pop(),objectNo=parts.join('-');
       const model=context.getModels().find(x=>x[0]===modelCode)?.[1]||modelCode;
       old={id:'family-da@'+key,page:p,rect,objectNo,modelCode,model,serialNumber,
        sourceText:text,sourceKind:'family-da',linkedGsId:nearestGS(p,rect),slrDocuments:{},checks:{},notes:'',progress:0};
       context.addItem(old,false);created++;
      }
      if(!old.linkedGsId)needsReview++;
     }
    }
   }
   context.save();context.redraw();
   status(found?'Hittade '+found+' märkningar i familjen '+exampleFamily+'. '+created+' nya knappar. '+needsReview+' behöver GS-koppling kontrollerad.':'Ingen märkning i samma familj hittades som läsbar PDF-text. Välj Placera manuellt, eller använd OCR senare.');
  }catch(e){console.error(e);status('Kunde inte analysera: '+(e.message||e))}
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
  $('pwDADoorDialog').showModal();
 }
 function closeDoor(){if($('pwDADoorDialog').open)$('pwDADoorDialog').close()}
 function saveLink(){
  const o=getSelected();if(!o)return;
  o.linkedGsId=$('pwDAGsSelect').value||'';
  context.save();closeDoor();context.redraw();
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
  if(renderPage!==context.getPage())return;
  const ns='http://www.w3.org/2000/svg',defs=document.createElementNS(ns,'defs'),marker=document.createElementNS(ns,'marker');
  marker.id='pwDALinkArrowhead';[['markerWidth','8'],['markerHeight','8'],['refX','7'],['refY','3'],['orient','auto']].forEach(([k,v])=>marker.setAttribute(k,v));
  const tri=document.createElementNS(ns,'path');tri.setAttribute('d','M0 0 L7 3 L0 6 z');tri.setAttribute('fill','#116a97');
  marker.appendChild(tri);defs.appendChild(marker);svg.appendChild(defs);
  items.forEach(item=>{
   const target=context.getPositions().find(g=>g.id===item.linkedGsId&&g.page===item.page);if(!target)return;
   const a=context.viewportRect(viewport,item.rect),b=context.viewportRect(viewport,target.rect);
   const arrow=document.createElementNS(ns,'path');
   arrow.setAttribute('d','M'+(a.left+a.width/2)+','+(a.top+a.height/2)+' L'+(b.left+b.width/2)+','+(b.top+b.height/2));
   arrow.setAttribute('stroke','#116a97');arrow.setAttribute('stroke-width','2');arrow.setAttribute('fill','none');
   arrow.setAttribute('marker-end','url(#pwDALinkArrowhead)');svg.appendChild(arrow);
  });
 }
 function init(c){
  context=c;
  $('pwDALinkTool').onclick=openTool;
  $('pwDAAnalyze').onclick=()=>void analyze();
  $('pwDAManual').onclick=manual;
  $('pwDAExample').addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();void analyze()}});
  $('pwDALinkClose').onclick=closeTool;
  $('pwDADoorClose').onclick=closeDoor;
  $('pwDASaveLink').onclick=saveLink;
  $('pwDARevision').onclick=()=>{const o=getSelected();closeDoor();if(o)context.openRevision(o)};
  $('pwDASLR').onclick=()=>{const o=getSelected();closeDoor();if(o)openSLR(o)};
  $('pwSLRClose').onclick=()=>{if($('pwSLRDialog').open)$('pwSLRDialog').close()};
  $('pwDARevisionSave').onclick=()=>{context.save();context.closeRevision()};
  $('pwDAExportRevision').onclick=()=>{const o=context.selectedRevision();if(o)context.exportRevision(o)};
  $('pwDALinkDialog').addEventListener('cancel',e=>{e.preventDefault();closeTool()});
  $('pwDADoorDialog').addEventListener('cancel',e=>{e.preventDefault();closeDoor()});
  $('pwStage').addEventListener('pointerdown',e=>{if(manualPending)void placeManual(e)},true);
 }
 return {init,openDoor,drawArrows,onProjectOpened(){manualPending='';selectedId='';exampleFamily=''}};
})();