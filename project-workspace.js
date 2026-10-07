(() => {
'use strict';

const $=id=>document.getElementById(id);
const el={
 file:$('pwFile'),openProject:$('pwOpenProject'),openProjectEmpty:$('pwOpenProjectEmpty'),saveProject:$('pwSaveProject'),saveMenu:$('pwSaveMenu'),savePortable:$('pwSavePortable'),saveCopy:$('pwSaveCopy'),savePage:$('pwSavePage'),fileName:$('pwFileName'),state:$('pwState'),positionCount:$('pwPositionCount'),matchedCount:$('pwMatchedCount'),doneCount:$('pwDoneCount'),totalProgress:$('pwTotalProgress'),
 prev:$('pwPrev'),next:$('pwNext'),pageInfo:$('pwPageInfo'),zoomOut:$('pwZoomOut'),zoomIn:$('pwZoomIn'),zoomInfo:$('pwZoomInfo'),fit:$('pwFit'),toolText:$('pwToolText'),toolArrow:$('pwToolArrow'),toolUndo:$('pwToolUndo'),rescan:$('pwRescan'),
 viewer:$('pwViewer'),stage:$('pwStage'),canvas:$('pwCanvas'),drawingNotes:$('pwDrawingNotes'),markers:$('pwMarkers'),empty:$('pwEmpty'),side:$('pwSide'),showPositions:$('pwShowPositions'),hidePositions:$('pwHidePositions'),groups:$('pwGroups'),currentPageOnly:$('pwCurrentPageOnly'),
 protocol:$('pwProtocol'),back:$('pwBack'),protocolClose:$('pwProtocolClose'),protocolCode:$('pwProtocolCode'),protocolPosition:$('pwProtocolPosition'),protocolPercent:$('pwProtocolPercent'),protocolBar:$('pwProtocolBar'),
 protocolCanvas:$('pwProtocolCanvas'),protocolCanvasWrap:$('pwProtocolCanvasWrap'),protocolStage:$('pwProtocolStage'),protocolMissing:$('pwProtocolMissing'),protocolFit:$('pwProtocolFit'),protocolZoomOut:$('pwProtocolZoomOut'),protocolZoomIn:$('pwProtocolZoomIn'),protocolZoomInfo:$('pwProtocolZoomInfo'),protocolMax:$('pwProtocolMax'),
 checklist:$('pwChecklist'),checklistMeta:$('pwChecklistMeta'),addChecklistItem:$('pwAddChecklistItem'),
 itemEditor:$('pwItemEditor'),itemEditorTitle:$('pwItemEditorTitle'),itemEditorClose:$('pwItemEditorClose'),editLabel:$('pwEditLabel'),editValue:$('pwEditValue'),editNote:$('pwEditNote'),editCancel:$('pwEditCancel'),editSave:$('pwEditSave')
};

if(!window.pdfjsLib||!window.PDFLib){el.state.textContent='PDF-biblioteket kunde inte laddas.';return}
pdfjsLib.GlobalWorkerOptions.workerSrc='vendor/pdf.worker.min.js';

const ctx=el.canvas.getContext('2d');
const protocolCtx=el.protocolCanvas.getContext('2d');

let pdf=null,bytes=null,fileKey='',projectId='',currentFileName='Tillsyno-projekt.pdf',embeddedState={},page=1,scale=1.1,renderTask=null;
let drawingPan=null,drawingTouch=null,drawingWheelTimer=null,drawingWheelBaseScale=1,drawingWheelTargetScale=1,drawingWheelFocus=null;
let drawingTool='',drawingToolGesture=null,drawingNotes=[];
let stamps=[],instances=[],protocolMap={},pageTexts={},protocolDefs={};
let selectedId=null,protocolScale=1,protocolRenderTask=null,protocolGesture=null,currentOnly=false,restoreView=null,editingItem=null;

function setState(text){el.state.textContent=text}
function setPositionsHidden(hidden){
 const isHidden=!!hidden;
 el.side.hidden=isHidden;
 el.showPositions.hidden=!isHidden;
 document.querySelector('.pwMain')?.classList.toggle('sideCollapsed',isHidden);
 try{localStorage.setItem('tillsyno-project-positions-hidden',isHidden?'1':'0')}catch(_){}
}
function loadPositionsPreference(){
 let hidden=false;
 try{hidden=localStorage.getItem('tillsyno-project-positions-hidden')==='1'}catch(_){}
 setPositionsHidden(hidden);
}
function closeSaveMenu(){
 el.saveMenu.hidden=true;
 el.saveProject.setAttribute('aria-expanded','false');
}
function toggleSaveMenu(){
 if(el.saveProject.disabled)return;
 const open=el.saveMenu.hidden;
 el.saveMenu.hidden=!open;
 el.saveProject.setAttribute('aria-expanded',String(open));
}
function isNativeIos(){
 try{return !!window.Capacitor?.isNativePlatform?.()&&window.Capacitor?.getPlatform?.()==='ios'}catch(_){return false}
}
function nativeFilePickerAvailable(){
 try{return isNativeIos()&&!!window.Capacitor?.isPluginAvailable?.('FilePicker')}catch(_){return false}
}
function getNativeFilePicker(){
 if(!nativeFilePickerAvailable())return null;
 try{
  if(window.Capacitor?.registerPlugin)return window.Capacitor.registerPlugin('FilePicker');
  return window.Capacitor?.Plugins?.FilePicker||null;
 }catch(_){return null}
}
async function blobFromPickedFile(picked){
 if(picked?.blob)return picked.blob;
 const urls=[];
 if(picked?.webPath)urls.push(picked.webPath);
 if(picked?.path){
  try{urls.push(window.Capacitor?.convertFileSrc?.(picked.path)||picked.path)}catch(_){urls.push(picked.path)}
 }
 let lastError=null;
 for(const url of [...new Set(urls.filter(Boolean))]){
  try{
   const response=await fetch(url);
   if(response.ok)return await response.blob();
   lastError=new Error('Filåtkomst gav status '+response.status+'.');
  }catch(err){lastError=err}
 }
 throw lastError||new Error('Den valda PDF-filen kunde inte läsas av appen.');
}
async function openProjectPdf(){
 if(!isNativeIos()){
  el.file.value='';
  el.file.click();
  return;
 }
 if(!nativeFilePickerAvailable()){
  setState('Native filväljare saknas i den här appversionen. Öppnar vanlig filväljare…');
  el.file.value='';
  el.file.click();
  return;
 }
 const picker=getNativeFilePicker();
 setState('Öppnar Filer…');
 try{
  const result=await picker.pickFiles({types:['application/pdf'],limit:1,readData:false});
  const picked=result?.files?.[0];
  if(!picked){setState('Ingen fil vald.');return}
  setState('PDF vald: '+(picked.name||'Projekt.pdf')+' · läser filen…');
  const blob=await blobFromPickedFile(picked);
  const type=picked.mimeType||blob.type||'application/pdf';
  const file=new File([blob],picked.name||'Projekt.pdf',{type,lastModified:picked.modifiedAt||Date.now()});
  await analyze(file);
 }catch(err){
  const message=String(err?.message||err||'');
  if(/cancel|dismiss|avbr/i.test(message)){setState('Ingen fil vald.');return}
  console.error(err);
  setState('Kunde inte öppna PDF i iOS: '+message);
 }
}
function hashBytes(arr){let h=2166136261;const step=Math.max(1,Math.floor(arr.length/50000));for(let i=0;i<arr.length;i+=step){h^=arr[i];h=Math.imul(h,16777619)}return (h>>>0).toString(36)}
function storageKey(){return 'tillsyno-project-workspace-v2:'+(projectId||fileKey)}
function stateTime(s){const t=Date.parse(String(s?.updatedAt||''));return Number.isFinite(t)?t:0}
function makeProjectPayload(){
 const payload={schema:4,projectId:projectId||('pf-'+fileKey),updatedAt:new Date().toISOString(),sourceName:currentFileName,drawingNotes:drawingNotes.map(n=>({...n})),instances:{}};
 instances.forEach(o=>payload.instances[o.id]={
  checks:o.checks||{},progress:o.progress||0,overrides:o.overrides||{},customItems:o.customItems||[]
 });
 return payload;
}
function loadSaved(){
 let local={};try{local=JSON.parse(localStorage.getItem(storageKey())||'{}')}catch(_){}
 const embedded=embeddedState&&embeddedState.instances?embeddedState:{};
 if(!local.instances)return embedded;
 if(!embedded.instances)return local;
 return stateTime(embedded)>stateTime(local)?embedded:local;
}
function save(){
 if(!fileKey)return;
 const payload=makeProjectPayload();
 try{localStorage.setItem(storageKey(),JSON.stringify(payload))}catch(_){}
 return payload;
}
async function readEmbeddedProjectState(){
 try{
  const {PDFDocument,PDFName}=PDFLib;
  const doc=await PDFDocument.load(bytes.slice(),{ignoreEncryption:true,updateMetadata:false});
  const raw=doc.catalog.get(PDFName.of('TillsynoProjectData'));
  if(!raw)return {};
  const json=decodePdfText(raw);
  const parsed=JSON.parse(json);
  return parsed&&typeof parsed==='object'?parsed:{};
 }catch(err){
  console.warn('Kunde inte läsa inbäddad projektstatus',err);
  return {};
 }
}
async function buildPortableProjectPdf(){
 const {PDFDocument,PDFName,PDFHexString,PDFString}=PDFLib;
 const payload=makeProjectPayload();
 const doc=await PDFDocument.load(bytes.slice(),{ignoreEncryption:true,updateMetadata:false});
 doc.catalog.set(PDFName.of('TillsynoProjectData'),PDFHexString.fromText(JSON.stringify(payload)));
 doc.catalog.set(PDFName.of('TillsynoProjectSchema'),PDFString.of('4'));
 const saved=await doc.save({useObjectStreams:false});
 embeddedState=payload;
 bytes=new Uint8Array(saved);
 try{localStorage.setItem(storageKey(),JSON.stringify(payload))}catch(_){}
 return bytes;
}
function downloadProjectFile(file){
 const url=URL.createObjectURL(file),a=document.createElement('a');
 a.href=url;a.download=file.name;document.body.appendChild(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),2000);
}
function fileStem(name){
 return String(name||'Tillsyno-projekt.pdf').replace(/\.pdf$/i,'')||'Tillsyno-projekt';
}
async function deliverProjectFile(file,title,text){
 let shared=false;
 if(navigator.share&&(!navigator.canShare||navigator.canShare({files:[file]}))){
  try{
   await navigator.share({title,text,files:[file]});
   shared=true;
  }catch(err){
   if(err?.name==='AbortError')return false;
  }
 }
 if(!shared)downloadProjectFile(file);
 return true;
}
async function savePortableProject(){
 if(!bytes||!instances.length)return;
 closeSaveMenu();el.saveProject.disabled=true;setState('Sparar projektstatus i PDF-filen…');
 try{
  const savedBytes=await buildPortableProjectPdf();
  const file=new File([savedBytes],currentFileName||'Tillsyno-projekt.pdf',{type:'application/pdf'});
  const delivered=await deliverProjectFile(file,'Tillsyno Projektflöde','Projektfil med sparad arbetsstatus');
  if(!delivered){setState('Sparandet avbröts. Projektstatusen finns kvar på den här enheten.');return}
  setState('Projekt-PDF sparad med avbockningar, kommentarer och procent.');
 }catch(err){
  console.error(err);setState('Projektet kunde inte sparas i PDF-filen: '+(err?.message||err));
 }finally{el.saveProject.disabled=false}
}
async function savePdfCopy(){
 if(!bytes)return;
 closeSaveMenu();el.saveProject.disabled=true;setState('Förbereder PDF-kopia…');
 try{
  const name=fileStem(currentFileName)+'-kopia.pdf';
  const file=new File([bytes.slice()],name,{type:'application/pdf'});
  const delivered=await deliverProjectFile(file,'Tillsyno PDF-kopia','Kopia av hela PDF-filen');
  setState(delivered?'PDF-kopian är klar.':'Sparandet avbröts.');
 }catch(err){
  console.error(err);setState('PDF-kopian kunde inte sparas: '+(err?.message||err));
 }finally{el.saveProject.disabled=false}
}
async function saveCurrentDrawingPage(){
 if(!bytes||!pdf)return;
 closeSaveMenu();el.saveProject.disabled=true;setState('Förbereder aktuell ritningssida…');
 try{
  const {PDFDocument}=PDFLib;
  const source=await PDFDocument.load(bytes.slice(),{ignoreEncryption:true,updateMetadata:false});
  const output=await PDFDocument.create();
  const copied=await output.copyPages(source,[Math.max(0,page-1)]);
  output.addPage(copied[0]);
  const onePage=await output.save({useObjectStreams:false});
  const name=fileStem(currentFileName)+'-sida-'+page+'.pdf';
  const file=new File([onePage],name,{type:'application/pdf'});
  const delivered=await deliverProjectFile(file,'Tillsyno ritningssida','Aktuell ritningssida från Projektflödet');
  setState(delivered?'Aktuell ritningssida är klar.':'Sparandet avbröts.');
 }catch(err){
  console.error(err);setState('Den aktuella sidan kunde inte sparas: '+(err?.message||err));
 }finally{el.saveProject.disabled=false}
}
function decodePdfText(obj){
 try{
  if(obj&&typeof obj.decodeText==='function')return obj.decodeText();
  if(obj&&typeof obj.asString==='function')return obj.asString();
 }catch(_){}
 return String(obj||'');
}
function normalizeCode(value){
 const raw=String(value||'').toUpperCase().replace(/\s+/g,' ').trim();
 if(!raw)return '';
 // Projekt-ID kan vara t.ex. GS1, GSTD1, GSID, GSIDW eller GSIW.
 // Om hela stämpelfältet är själva ID:t tillåts även mellanrum/bindestreck mellan tecknen.
 const compactExact=raw.replace(/[\s_-]+/g,'');
 if(/^GS[A-ZÅÄÖ0-9]{1,12}$/.test(compactExact))return compactExact;
 // Om fältet innehåller mer text plockas ett sammanhängande GS-ID ut utan att äta upp efterföljande ord.
 const embedded=raw.match(/\b(GS[A-ZÅÄÖ0-9]{1,12})\b/);
 return embedded?embedded[1]:'';
}
function codeRegex(code){
 const compact=String(code||'').toUpperCase().replace(/[^A-ZÅÄÖ0-9]/g,'');
 if(!/^GS[A-ZÅÄÖ0-9]{1,12}$/.test(compact))return null;
 const gap='[^A-ZÅÄÖ0-9]*';
 const spread=compact.split('').join(gap);
 return new RegExp('(^|[^A-ZÅÄÖ0-9])'+spread+'($|[^A-ZÅÄÖ0-9])','i');
}
function stampCode(dict){
 const {PDFName}=PDFLib;
 for(const key of ['Subj','Contents','T','NM','Name']){
  const code=normalizeCode(decodePdfText(dict.get(PDFName.of(key))));
  if(code)return code;
 }
 return '';
}
async function extractStamps(){
 const {PDFDocument,PDFName,PDFDict,PDFArray,PDFNumber}=PDFLib;
 const doc=await PDFDocument.load(bytes.slice(),{ignoreEncryption:true,updateMetadata:false});
 const out=[];
 doc.getPages().forEach((pg,pi)=>{
  const annots=pg.node.Annots();if(!annots)return;
  for(let i=0;i<annots.size();i++){
   let dict;try{dict=annots.lookup(i,PDFDict)}catch(_){continue}
   if(!dict)continue;
   const subtype=decodePdfText(dict.get(PDFName.of('Subtype'))).replace('/','');
   if(subtype!=='Stamp')continue;
   const code=stampCode(dict);if(!code)continue;
   let rectArr;try{rectArr=dict.lookup(PDFName.of('Rect'),PDFArray)}catch(_){continue}
   if(!rectArr||rectArr.size()<4)continue;
   const rect=[];
   for(let n=0;n<4;n++){
    let num;try{num=rectArr.lookup(n,PDFNumber)}catch(_){}
    const v=num&&typeof num.asNumber==='function'?num.asNumber():Number(decodePdfText(rectArr.get(n)));
    rect.push(v);
   }
   if(rect.every(Number.isFinite))out.push({page:pi+1,code,rect,order:i});
  }
 });
 return out;
}
async function readPageText(pageNo){
 if(pageTexts[pageNo])return pageTexts[pageNo];
 const pg=await pdf.getPage(pageNo),content=await pg.getTextContent();
 const items=content.items.map(item=>({
  text:String(item.str||'').trim(),
  x:Number(item.transform?.[4]||0),
  y:Number(item.transform?.[5]||0),
  h:Math.max(Math.abs(Number(item.transform?.[3]||0)),Number(item.height||0),1),
  w:Number(item.width||0),
  font:String(item.fontName||'')
 })).filter(x=>x.text);
 const raw=items.map(x=>x.text).join(' ');
 pageTexts[pageNo]={raw,items};
 return pageTexts[pageNo];
}
function protocolScore(code,pageNo,text,drawingPages){
 const rx=codeRegex(code);if(!rx||!rx.test(text.raw))return -1;
 let score=10;
 const lower=text.raw.toLocaleLowerCase('sv');
 if(!drawingPages.has(pageNo))score+=5;
 ['protokoll','dörrautomatik','dörr','elbleck','lås','trycke','beskrivning','produkt','ingår','funktion'].forEach(w=>{if(lower.includes(w))score++});
 const compact=text.raw.toUpperCase().replace(/[^A-ZÅÄÖ0-9]/g,'');
 if(compact.startsWith(code))score+=5;
 return score;
}
async function buildProtocolMap(){
 protocolMap={};
 const drawingPages=new Set(stamps.map(s=>s.page));
 const codes=[...new Set(stamps.map(s=>s.code))];
 setState('Matchar projektstämplar mot protokoll i samma PDF…');
 for(let p=1;p<=pdf.numPages;p++)await readPageText(p);
 for(const code of codes){
  let best=null;
  for(let p=1;p<=pdf.numPages;p++){
   const score=protocolScore(code,p,pageTexts[p],drawingPages);
   if(score<0)continue;
   if(!best||score>best.score)best={page:p,score};
  }
  if(best)protocolMap[code]=best.page;
 }
}
function isAdministrativeWorkLine(text,label){
 const t=(String(label||'')+' '+String(text||'')).toLocaleLowerCase('sv');
 return /\b(datum|version|revision|rev\.?|leverer\w*|leverans\w*|leverantör|monteras?\s+av|ansluts?\s+av|avmonter\w*|avser|ansvar\w*)\b/.test(t);
}
function isGsWorkLine(text){
 return /(^|[\s:;,\-/])GS(?=$|[\s:;,\-/])/i.test(String(text||''));
}
function groupLines(items){
 const sorted=[...items].sort((a,b)=>b.y-a.y||a.x-b.x),groups=[];
 for(const item of sorted){
  let line=groups.find(g=>Math.abs(g.y-item.y)<=Math.max(2.4,Math.min(5,item.h*.45)));
  if(!line){line={y:item.y,items:[]};groups.push(line)}
  line.items.push(item);
 }
 groups.sort((a,b)=>b.y-a.y);
 return groups.map((g,index)=>{
  const row=[...g.items].sort((a,b)=>a.x-b.x);
  const text=row.map(x=>x.text).join(' ').replace(/\s+/g,' ').trim();
  let maxGap=0,gapIndex=-1;
  for(let i=1;i<row.length;i++){
   const prev=row[i-1],gap=row[i].x-(prev.x+Math.max(prev.w,prev.text.length*prev.h*.35));
   if(gap>maxGap){maxGap=gap;gapIndex=i}
  }
  const medianH=[...row].map(x=>x.h).sort((a,b)=>a-b)[Math.floor(row.length/2)]||8;
  const upperLetters=text.replace(/[^A-ZÅÄÖ]/g,'').length;
  const letters=text.replace(/[^A-Za-zÅÄÖåäö]/g,'').length;
  const upperRatio=letters?upperLetters/letters:0;
  const heading=(upperRatio>.78&&text.length>3)||Math.max(...row.map(x=>x.h))>medianH*1.35;
  let label='',value='';
  if(gapIndex>0&&maxGap>14){
   label=row.slice(0,gapIndex).map(x=>x.text).join(' ').trim();
   value=row.slice(gapIndex).map(x=>x.text).join(' ').trim();
  }else{
   const colon=text.indexOf(':');
   if(colon>0&&text.slice(colon+1).trim()){label=text.slice(0,colon).trim();value=text.slice(colon+1).trim()}
  }
  const hasPair=!!label&&!!value&&value!=='-'&&value!=='–'&&value!=='—';
  const administrative=isAdministrativeWorkLine(text,label);
  const actionable=!administrative&&!heading&&hasPair&&isGsWorkLine(text);
  return {key:'l'+index,text,actionable,administrative,label,value};
 });
}
async function protocolDef(code){
 const pageNo=protocolMap[code];if(!pageNo)return null;
 const key=code+'@'+pageNo;if(protocolDefs[key])return protocolDefs[key];
 const text=await readPageText(pageNo),lines=groupLines(text.items);
 const filtered=lines.filter(line=>line.actionable);
 const def={code,page:pageNo,lines:filtered,checks:filtered};
 protocolDefs[key]=def;return def;
}
function effectiveChecks(o,def){
 const base=(def?.checks||[]).map(line=>{
  const override=o.overrides?.[line.key]||{};
  if(override.hidden)return null;
  return {...line,label:override.label??line.label,value:override.value??line.value,note:override.note||'',source:'base'};
 }).filter(Boolean);
 const custom=(o.customItems||[]).map(item=>({
  key:item.id,label:item.label||'Egen punkt',value:item.value||'',note:item.note||'',source:'custom',actionable:true
 }));
 return [...base,...custom];
}
function buildInstances(){
 const saved=loadSaved(),counts={};
 drawingNotes=Array.isArray(saved.drawingNotes)?saved.drawingNotes.filter(n=>n&&Number.isFinite(Number(n.page))):[];
 stamps.sort((a,b)=>a.page-b.page||b.rect[1]-a.rect[1]||a.rect[0]-b.rect[0]);
 instances=stamps.map((s,index)=>{
  counts[s.code]=(counts[s.code]||0)+1;
  const id=s.code+'@'+s.page+':'+s.order+':'+index,old=saved.instances?.[id]||{};
  return {...s,id,position:counts[s.code],checks:old.checks||{},overrides:old.overrides||{},customItems:Array.isArray(old.customItems)?old.customItems:[],progress:Number(old.progress||0)};
 });
 const totals={};
 instances.forEach(o=>totals[o.code]=(totals[o.code]||0)+1);
 instances.forEach(o=>o.totalOfCode=totals[o.code]);
}
async function recalc(o){
 const def=await protocolDef(o.code);
 const checks=effectiveChecks(o,def);
 if(!checks.length){o.progress=0;return}
 const done=checks.filter(item=>!!o.checks[item.key]).length;
 o.progress=Math.round(done/checks.length*100);
}
async function recalcAll(){for(const o of instances)await recalc(o);save();updateStats();renderGroups();renderMarkers()}
function updateStats(){
 el.positionCount.textContent=instances.length;
 el.matchedCount.textContent=instances.filter(o=>protocolMap[o.code]).length;
 el.doneCount.textContent=instances.filter(o=>o.progress===100).length;
 const avg=instances.length?Math.round(instances.reduce((a,o)=>a+o.progress,0)/instances.length):0;
 el.totalProgress.textContent=avg+'%';
}
async function renderDrawing(){
 if(!pdf)return;
 if(renderTask)try{renderTask.cancel()}catch(_){}
 const pg=await pdf.getPage(page),vp=pg.getViewport({scale});
 el.canvas.width=Math.ceil(vp.width);el.canvas.height=Math.ceil(vp.height);
 el.canvas.style.width=vp.width+'px';el.canvas.style.height=vp.height+'px';
 el.stage.style.width=vp.width+'px';el.stage.style.height=vp.height+'px';
 renderTask=pg.render({canvasContext:ctx,viewport:vp});
 try{await renderTask.promise}catch(e){if(e?.name!=='RenderingCancelledException')throw e}
 el.pageInfo.textContent='Sida '+page+' / '+pdf.numPages;el.zoomInfo.textContent=Math.round(scale*100)+'%';
 renderDrawingNotes(vp);
 renderMarkers();
}
function svgNode(name){return document.createElementNS('http://www.w3.org/2000/svg',name)}
function ensureArrowMarker(svg){
 const defs=svgNode('defs'),marker=svgNode('marker'),path=svgNode('path');
 marker.setAttribute('id','pwArrowHead');marker.setAttribute('viewBox','0 0 10 10');marker.setAttribute('refX','9');marker.setAttribute('refY','5');marker.setAttribute('markerWidth','7');marker.setAttribute('markerHeight','7');marker.setAttribute('orient','auto-start-reverse');
 path.setAttribute('d','M 0 0 L 10 5 L 0 10 z');path.setAttribute('fill','#173746');
 marker.appendChild(path);defs.appendChild(marker);svg.appendChild(defs);
}
function renderDrawingNotes(viewport){
 const svg=el.drawingNotes;svg.replaceChildren();
 svg.setAttribute('viewBox','0 0 '+viewport.width+' '+viewport.height);
 svg.setAttribute('width',viewport.width);svg.setAttribute('height',viewport.height);
 svg.style.width=viewport.width+'px';svg.style.height=viewport.height+'px';
 ensureArrowMarker(svg);
 drawingNotes.filter(n=>Number(n.page)===page).forEach(n=>{
  if(n.type==='text'){
   const p=viewport.convertToViewportPoint(Number(n.x),Number(n.y)),t=svgNode('text');
   t.setAttribute('x',p[0]);t.setAttribute('y',p[1]);t.setAttribute('class','pwNoteText');t.textContent=String(n.text||'');
   svg.appendChild(t);
  }else if(n.type==='arrow'){
   const a=viewport.convertToViewportPoint(Number(n.x1),Number(n.y1)),b=viewport.convertToViewportPoint(Number(n.x2),Number(n.y2)),line=svgNode('line');
   line.setAttribute('x1',a[0]);line.setAttribute('y1',a[1]);line.setAttribute('x2',b[0]);line.setAttribute('y2',b[1]);line.setAttribute('class','pwNoteArrow');line.setAttribute('marker-end','url(#pwArrowHead)');
   svg.appendChild(line);
  }
 });
}
function setDrawingTool(tool){
 drawingTool=drawingTool===tool?'':tool;
 el.toolText.setAttribute('aria-pressed',String(drawingTool==='text'));
 el.toolArrow.setAttribute('aria-pressed',String(drawingTool==='arrow'));
 el.viewer.classList.toggle('noteMode',!!drawingTool);
}
function stagePoint(clientX,clientY){
 const r=el.stage.getBoundingClientRect();
 return {x:clientX-r.left,y:clientY-r.top};
}
async function addTextNote(point){
 if(!pdf)return;
 const value=window.prompt('Skriv text på ritningen:','');
 if(!value||!value.trim())return;
 const pg=await pdf.getPage(page),vp=pg.getViewport({scale}),pdfPoint=vp.convertToPdfPoint(point.x,point.y);
 drawingNotes.push({id:'n'+Date.now().toString(36),type:'text',page,x:pdfPoint[0],y:pdfPoint[1],text:value.trim()});
 save();renderDrawingNotes(vp);
}
async function finishArrowNote(start,end){
 if(!pdf||Math.hypot(end.x-start.x,end.y-start.y)<8)return;
 const pg=await pdf.getPage(page),vp=pg.getViewport({scale}),a=vp.convertToPdfPoint(start.x,start.y),b=vp.convertToPdfPoint(end.x,end.y);
 drawingNotes.push({id:'n'+Date.now().toString(36),type:'arrow',page,x1:a[0],y1:a[1],x2:b[0],y2:b[1]});
 save();renderDrawingNotes(vp);
}
function beginDrawingTool(e){
 if(!drawingTool||!pdf||e.pointerType==='mouse'&&e.button!==0)return false;
 if(e.target.closest?.('.pwToolbar,.pwSide,.pwShowPositions'))return false;
 e.preventDefault();e.stopPropagation();
 const point=stagePoint(e.clientX,e.clientY);
 if(drawingTool==='text'){
  drawingToolGesture={pointerId:e.pointerId,type:'text',start:point};
 }else{
  const line=svgNode('line');
  line.setAttribute('x1',point.x);line.setAttribute('y1',point.y);line.setAttribute('x2',point.x);line.setAttribute('y2',point.y);line.setAttribute('class','pwNotePreview');line.setAttribute('marker-end','url(#pwArrowHead)');
  el.drawingNotes.appendChild(line);
  drawingToolGesture={pointerId:e.pointerId,type:'arrow',start:point,preview:line};
 }
 try{el.viewer.setPointerCapture(e.pointerId)}catch(_){}
 return true;
}
function moveDrawingTool(e){
 if(!drawingToolGesture||drawingToolGesture.pointerId!==e.pointerId)return false;
 e.preventDefault();e.stopPropagation();
 if(drawingToolGesture.type==='arrow'){
  const point=stagePoint(e.clientX,e.clientY);
  drawingToolGesture.preview?.setAttribute('x2',point.x);drawingToolGesture.preview?.setAttribute('y2',point.y);
 }
 return true;
}
async function endDrawingTool(e){
 if(!drawingToolGesture||drawingToolGesture.pointerId!==e.pointerId)return false;
 e.preventDefault();e.stopPropagation();
 const g=drawingToolGesture;drawingToolGesture=null;
 try{el.viewer.releasePointerCapture(e.pointerId)}catch(_){}
 const end=stagePoint(e.clientX,e.clientY);
 if(g.type==='text')await addTextNote(end);
 else{g.preview?.remove();await finishArrowNote(g.start,end)}
 return true;
}
function undoDrawingNote(){
 for(let i=drawingNotes.length-1;i>=0;i--){
  if(Number(drawingNotes[i].page)===page){drawingNotes.splice(i,1);save();pdf.getPage(page).then(pg=>renderDrawingNotes(pg.getViewport({scale})));return}
 }
}
function viewportRect(viewport,rect){
 try{
  const mapped=viewport.convertToViewportRectangle(rect);
  const left=Math.min(mapped[0],mapped[2]),top=Math.min(mapped[1],mapped[3]);
  return {left,top,width:Math.abs(mapped[2]-mapped[0]),height:Math.abs(mapped[3]-mapped[1])};
 }catch(_){
  const [x1,y1,x2,y2]=rect;
  const p1=viewport.convertToViewportPoint(x1,y1),p2=viewport.convertToViewportPoint(x2,y2);
  return {left:Math.min(p1[0],p2[0]),top:Math.min(p1[1],p2[1]),width:Math.abs(p2[0]-p1[0]),height:Math.abs(p2[1]-p1[1])};
 }
}
function renderMarkers(){
 el.markers.replaceChildren();if(!pdf)return;
 const renderPage=page,pageItems=instances.filter(o=>o.page===renderPage);
 pdf.getPage(renderPage).then(pg=>{
  if(renderPage!==page)return;
  const vp=pg.getViewport({scale});
  pageItems.forEach(o=>{
   const r=viewportRect(vp,o.rect);
   if(!Number.isFinite(r.left+r.top+r.width+r.height)||r.width<=0||r.height<=0)return;
   const btn=document.createElement('button');btn.type='button';btn.className='pwStampHit';btn.dataset.progress=String(o.progress||0);if(o.id===selectedId)btn.classList.add('selected');
   btn.style.left=r.left+'px';btn.style.top=r.top+'px';btn.style.width=Math.max(10,r.width)+'px';btn.style.height=Math.max(10,r.height)+'px';
   btn.title=o.code+' · position '+o.position+' av '+o.totalOfCode+' · '+o.progress+'%';
   btn.setAttribute('aria-label',btn.title);
   if(o.progress>0){const badge=document.createElement('span');badge.className='pwProgressBadge';badge.textContent=o.progress+'%';btn.appendChild(badge)}
   btn.onclick=e=>{e.preventDefault();e.stopPropagation();openProtocol(o)};
   el.markers.appendChild(btn);
  });
 }).catch(console.error);
}
function renderGroups(){
 const groups={};
 instances.filter(o=>!currentOnly||o.page===page).forEach(o=>(groups[o.code]??=[]).push(o));
 el.groups.replaceChildren();
 const codes=Object.keys(groups).sort((a,b)=>a.localeCompare(b,'sv',{numeric:true}));
 if(!codes.length){const p=document.createElement('p');p.className='pwMuted';p.textContent=currentOnly?'Inga projektpositioner på den här sidan.':'Inga projektpositioner hittades.';el.groups.appendChild(p);return}
 codes.forEach(code=>{
  const wrap=document.createElement('section');wrap.className='pwGroup';
  const title=document.createElement('div');title.className='pwGroupTitle';
  const strong=document.createElement('strong');strong.textContent=code;
  const span=document.createElement('span');span.textContent=groups[code].length+' positioner'+(protocolMap[code]?' · protokoll ✓':' · protokoll ?');
  title.append(strong,span);wrap.appendChild(title);
  const list=document.createElement('div');list.className='pwGroupItems';
  groups[code].forEach(o=>{
   const b=document.createElement('button');b.type='button';b.className='pwPosition';
   const left=document.createElement('span'),s=document.createElement('strong'),small=document.createElement('small'),pct=document.createElement('b');
   s.textContent=code+' · position '+o.position+' av '+o.totalOfCode;small.textContent='Sida '+o.page+(protocolMap[code]?' · protokoll sida '+protocolMap[code]:' · protokoll ej matchat');pct.textContent=o.progress+'%';
   left.append(s,small);b.append(left,pct);b.onclick=()=>focusInstance(o);list.appendChild(b);
  });
  wrap.appendChild(list);el.groups.appendChild(wrap);
 });
}
async function focusInstance(o){
 if(page!==o.page){page=o.page;await renderDrawing()}
 selectedId=o.id;
 const pg=await pdf.getPage(page),vp=pg.getViewport({scale}),r=viewportRect(vp,o.rect);
 const cx=r.left+r.width/2,cy=r.top+r.height/2;
 renderMarkers();
 el.viewer.scrollTo({left:Math.max(0,cx-el.viewer.clientWidth/2),top:Math.max(0,cy-el.viewer.clientHeight/2),behavior:'smooth'});
}
function clampProtocolScale(value){return Math.max(.4,Math.min(3,Number(value)||1))}
function currentProtocolPage(){
 const o=instances.find(x=>x.id===selectedId);
 return o?protocolMap[o.code]:null;
}
function protocolFocusRatios(clientX,clientY){
 const stageRect=el.protocolStage.getBoundingClientRect();
 const x=Number.isFinite(clientX)?clientX:stageRect.left+stageRect.width/2;
 const y=Number.isFinite(clientY)?clientY:stageRect.top+stageRect.height/2;
 return {
  x:Math.max(0,Math.min(1,stageRect.width?(x-stageRect.left)/stageRect.width:.5)),
  y:Math.max(0,Math.min(1,stageRect.height?(y-stageRect.top)/stageRect.height:.5)),
  clientX:x,clientY:y
 };
}
function restoreProtocolFocus(focus){
 if(!focus)return;
 const stageRect=el.protocolStage.getBoundingClientRect();
 const pointX=stageRect.left+focus.x*stageRect.width;
 const pointY=stageRect.top+focus.y*stageRect.height;
 el.protocolCanvasWrap.scrollLeft+=pointX-focus.clientX;
 el.protocolCanvasWrap.scrollTop+=pointY-focus.clientY;
}
async function setProtocolScale(nextScale,clientX,clientY){
 const pageNo=currentProtocolPage();if(!pageNo)return;
 const focus=protocolFocusRatios(clientX,clientY);
 protocolScale=clampProtocolScale(nextScale);
 el.protocolCanvas.style.transform='';
 await renderProtocolPage(pageNo);
 requestAnimationFrame(()=>restoreProtocolFocus(focus));
}
async function fitProtocolPage(){
 const pageNo=currentProtocolPage();if(!pageNo)return;
 const pg=await pdf.getPage(pageNo),vp=pg.getViewport({scale:1});
 const pad=20;
 const target=Math.min(
  (el.protocolCanvasWrap.clientWidth-pad)/vp.width,
  (el.protocolCanvasWrap.clientHeight-pad)/vp.height
 );
 protocolScale=clampProtocolScale(target);
 el.protocolCanvas.style.transform='';
 await renderProtocolPage(pageNo);
 el.protocolCanvasWrap.scrollTo({left:0,top:0});
}
function protocolTouchCenter(touches){
 return {
  x:(touches[0].clientX+touches[1].clientX)/2,
  y:(touches[0].clientY+touches[1].clientY)/2
 };
}
function protocolTouchDistance(touches){
 const dx=touches[0].clientX-touches[1].clientX,dy=touches[0].clientY-touches[1].clientY;
 return Math.hypot(dx,dy);
}
function beginProtocolTouch(e){
 if(e.touches.length>=2){
  e.preventDefault();
  const center=protocolTouchCenter(e.touches),focus=protocolFocusRatios(center.x,center.y);
  protocolGesture={
   mode:'pinch',startDistance:Math.max(1,protocolTouchDistance(e.touches)),
   startScale:protocolScale,targetScale:protocolScale,focus,
   baseWidth:parseFloat(el.protocolStage.style.width)||el.protocolStage.getBoundingClientRect().width,
   baseHeight:parseFloat(el.protocolStage.style.height)||el.protocolStage.getBoundingClientRect().height,
   center
  };
  el.protocolCanvasWrap.classList.add('isPinching');
  return;
 }
 if(e.touches.length===1){
  const t=e.touches[0];
  protocolGesture={mode:'pan',x:t.clientX,y:t.clientY,left:el.protocolCanvasWrap.scrollLeft,top:el.protocolCanvasWrap.scrollTop};
 }
}
function moveProtocolTouch(e){
 if(!protocolGesture)return;
 if(protocolGesture.mode==='pan'&&e.touches.length===1){
  e.preventDefault();
  const t=e.touches[0];
  el.protocolCanvasWrap.scrollLeft=protocolGesture.left+(protocolGesture.x-t.clientX);
  el.protocolCanvasWrap.scrollTop=protocolGesture.top+(protocolGesture.y-t.clientY);
  return;
 }
 if(protocolGesture.mode==='pinch'&&e.touches.length>=2){
  e.preventDefault();
  const center=protocolTouchCenter(e.touches);
  const target=clampProtocolScale(protocolGesture.startScale*(protocolTouchDistance(e.touches)/protocolGesture.startDistance));
  protocolGesture.targetScale=target;protocolGesture.center=center;
  const factor=target/protocolGesture.startScale;
  el.protocolCanvas.style.transform='scale('+factor+')';
  el.protocolStage.style.width=(protocolGesture.baseWidth*factor)+'px';
  el.protocolStage.style.height=(protocolGesture.baseHeight*factor)+'px';
  el.protocolZoomInfo.textContent=Math.round(target*100)+'%';
  const stageRect=el.protocolStage.getBoundingClientRect();
  el.protocolCanvasWrap.scrollLeft+=stageRect.left+protocolGesture.focus.x*stageRect.width-center.x;
  el.protocolCanvasWrap.scrollTop+=stageRect.top+protocolGesture.focus.y*stageRect.height-center.y;
 }
}
async function endProtocolTouch(e){
 if(!protocolGesture)return;
 if(protocolGesture.mode==='pinch'&&e.touches.length<2){
  const g=protocolGesture;protocolGesture=null;
  el.protocolCanvasWrap.classList.remove('isPinching');
  el.protocolCanvas.style.transform='';
  protocolScale=clampProtocolScale(g.targetScale);
  const pageNo=currentProtocolPage();
  if(pageNo){
   await renderProtocolPage(pageNo);
   requestAnimationFrame(()=>restoreProtocolFocus({...g.focus,clientX:g.center.x,clientY:g.center.y}));
  }
  if(e.touches.length===1){
   const t=e.touches[0];
   protocolGesture={mode:'pan',x:t.clientX,y:t.clientY,left:el.protocolCanvasWrap.scrollLeft,top:el.protocolCanvasWrap.scrollTop};
  }
  return;
 }
 if(protocolGesture.mode==='pan'&&e.touches.length===0)protocolGesture=null;
}
async function renderProtocolPage(pageNo){
 if(protocolRenderTask)try{protocolRenderTask.cancel()}catch(_){}
 if(!pageNo){el.protocolCanvas.hidden=true;el.protocolMissing.hidden=false;return}
 el.protocolMissing.hidden=true;el.protocolCanvas.hidden=false;
 const pg=await pdf.getPage(pageNo),vp=pg.getViewport({scale:protocolScale});
 el.protocolCanvas.width=Math.ceil(vp.width);el.protocolCanvas.height=Math.ceil(vp.height);
 el.protocolCanvas.style.width=vp.width+'px';el.protocolCanvas.style.height=vp.height+'px';
 el.protocolStage.style.width=vp.width+'px';el.protocolStage.style.height=vp.height+'px';
 protocolRenderTask=pg.render({canvasContext:protocolCtx,viewport:vp});
 try{await protocolRenderTask.promise}catch(e){if(e?.name!=='RenderingCancelledException')throw e}
 el.protocolZoomInfo.textContent=Math.round(protocolScale*100)+'%';
}
function selectedInstance(){return instances.find(x=>x.id===selectedId)||null}
function openItemEditor(o,item=null){
 if(!o)return;
 editingItem=item?{source:item.source,key:item.key}:{source:'custom',key:null};
 el.itemEditorTitle.textContent=item?'Ändra punkt':'Lägg till punkt';
 el.editLabel.value=item?.label||'';
 el.editValue.value=item?.value||'';
 el.editNote.value=item?.note||'';
 el.itemEditor.showModal();
 requestAnimationFrame(()=>el.editLabel.focus());
}
function closeItemEditor(){if(el.itemEditor.open)el.itemEditor.close();editingItem=null}
async function saveItemEditor(){
 const o=selectedInstance();if(!o||!editingItem)return;
 const label=el.editLabel.value.trim(),value=el.editValue.value.trim(),note=el.editNote.value.trim();
 if(!label){el.editLabel.focus();return}
 if(!editingItem.key){
  const id='c'+Date.now().toString(36)+(o.customItems.length+1).toString(36);
  o.customItems.push({id,label,value,note});
 }else if(editingItem.source==='custom'){
  const item=o.customItems.find(x=>x.id===editingItem.key);
  if(item)Object.assign(item,{label,value,note});
 }else{
  o.overrides[editingItem.key]={...(o.overrides[editingItem.key]||{}),label,value,note,hidden:false};
 }
 await recalc(o);save();syncProtocolProgress(o);updateStats();renderGroups();renderMarkers();closeItemEditor();await renderChecklist(o);
}
async function removeChecklistItem(o,item){
 if(!o||!item)return;
 if(!window.confirm('Ta bort den här kontrollpunkten för just den här positionen?'))return;
 if(item.source==='custom')o.customItems=o.customItems.filter(x=>x.id!==item.key);
 else o.overrides[item.key]={...(o.overrides[item.key]||{}),hidden:true};
 delete o.checks[item.key];
 await recalc(o);save();syncProtocolProgress(o);updateStats();renderGroups();renderMarkers();await renderChecklist(o);
}
function appendEditableCheck(o,item){
 const row=document.createElement('div');row.className='pwCheckRow'+(o.checks[item.key]?' done':'');
 const input=document.createElement('input');input.type='checkbox';input.checked=!!o.checks[item.key];input.setAttribute('aria-label','Klarmarkera '+item.label);
 const content=document.createElement('div');content.className='pwCheckContent';
 const strong=document.createElement('strong');strong.textContent=item.label;
 content.appendChild(strong);
 if(item.value){const small=document.createElement('small');small.textContent=item.value;content.appendChild(small)}
 if(item.note){const note=document.createElement('em');note.className='pwCheckComment';note.textContent=item.note;content.appendChild(note)}
 const actions=document.createElement('div');actions.className='pwCheckActions';
 const edit=document.createElement('button');edit.type='button';edit.textContent='Ändra';edit.onclick=()=>openItemEditor(o,item);
 const remove=document.createElement('button');remove.type='button';remove.className='pwRemoveItem';remove.textContent='Ta bort';remove.onclick=()=>removeChecklistItem(o,item);
 actions.append(edit,remove);row.append(input,content,actions);
 input.onchange=async()=>{o.checks[item.key]=input.checked;row.classList.toggle('done',input.checked);await recalc(o);save();syncProtocolProgress(o);updateStats();renderGroups();renderMarkers()};
 el.checklist.appendChild(row);
}
async function renderChecklist(o){
 el.checklist.replaceChildren();
 const def=await protocolDef(o.code);
 if(!def){el.checklistMeta.textContent='0 punkter';const p=document.createElement('p');p.className='pwMuted';p.textContent='Ingen protokollsida kunde matchas automatiskt.';el.checklist.appendChild(p);return}
 const checks=effectiveChecks(o,def);
 el.checklistMeta.textContent=checks.length+' kontrollpunkter';
 if(!def.lines.length&&!o.customItems.length){const p=document.createElement('p');p.className='pwMuted';p.textContent='Protokollsidan är matchad, men textstrukturen kunde inte tolkas säkert ännu.';el.checklist.appendChild(p);return}
 def.lines.forEach(line=>{
  const item=effectiveChecks(o,def).find(x=>x.source==='base'&&x.key===line.key);
  if(item)appendEditableCheck(o,item);
 });
 const custom=effectiveChecks(o,def).filter(x=>x.source==='custom');
 if(custom.length){
  const h=document.createElement('div');h.className='pwChecklistHeading';h.textContent='Tillagda punkter';el.checklist.appendChild(h);
  custom.forEach(item=>appendEditableCheck(o,item));
 }
}
function syncProtocolProgress(o){el.protocolPercent.textContent=o.progress+'%';el.protocolBar.style.width=o.progress+'%'}
async function openProtocol(o){
 selectedId=o.id;restoreView={page,scale,left:el.viewer.scrollLeft,top:el.viewer.scrollTop};
 el.protocolCode.textContent=o.code;el.protocolPosition.textContent='Position '+o.position+' av '+o.totalOfCode+' · ritningssida '+o.page+(protocolMap[o.code]?' · protokollsida '+protocolMap[o.code]:'');
 await recalc(o);syncProtocolProgress(o);protocolScale=1;el.protocol.showModal();
 await Promise.all([renderProtocolPage(protocolMap[o.code]),renderChecklist(o)]);
}
function closeProtocol(){
 if(el.protocol.open)el.protocol.close();
 if(restoreView){page=restoreView.page;scale=restoreView.scale;renderDrawing().then(()=>requestAnimationFrame(()=>el.viewer.scrollTo({left:restoreView.left,top:restoreView.top})))}
}
function clampDrawingScale(value){return Math.max(.25,Math.min(3.5,Number(value)||1))}
function drawingFocusRatios(clientX,clientY){
 const r=el.stage.getBoundingClientRect();
 const x=Number.isFinite(clientX)?clientX:r.left+r.width/2;
 const y=Number.isFinite(clientY)?clientY:r.top+r.height/2;
 return {
  x:Math.max(0,Math.min(1,r.width?(x-r.left)/r.width:.5)),
  y:Math.max(0,Math.min(1,r.height?(y-r.top)/r.height:.5)),
  clientX:x,clientY:y
 };
}
function restoreDrawingFocus(focus){
 if(!focus)return;
 const r=el.stage.getBoundingClientRect();
 const px=r.left+focus.x*r.width,py=r.top+focus.y*r.height;
 el.viewer.scrollLeft+=px-focus.clientX;
 el.viewer.scrollTop+=py-focus.clientY;
}
async function setDrawingScale(nextScale,clientX,clientY){
 if(!pdf)return;
 const focus=drawingFocusRatios(clientX,clientY);
 scale=clampDrawingScale(nextScale);
 el.stage.style.transform='';el.stage.style.transformOrigin='';
 await renderDrawing();
 requestAnimationFrame(()=>restoreDrawingFocus(focus));
}
function beginDrawingPan(e){
 if(!pdf||drawingTool||e.pointerType!=='mouse')return;
 if(e.button!==0&&e.button!==1)return;
 if(e.button===0&&e.target.closest?.('.pwStampHit'))return;
 e.preventDefault();
 drawingPan={pointerId:e.pointerId,x:e.clientX,y:e.clientY,left:el.viewer.scrollLeft,top:el.viewer.scrollTop};
 el.viewer.classList.add('isPanning');
 try{el.viewer.setPointerCapture(e.pointerId)}catch(_){}
}
function moveDrawingPan(e){
 if(!drawingPan||drawingPan.pointerId!==e.pointerId)return;
 e.preventDefault();
 el.viewer.scrollLeft=drawingPan.left+(drawingPan.x-e.clientX);
 el.viewer.scrollTop=drawingPan.top+(drawingPan.y-e.clientY);
}
function endDrawingPan(e){
 if(!drawingPan||drawingPan.pointerId!==e.pointerId)return;
 drawingPan=null;el.viewer.classList.remove('isPanning');
 try{el.viewer.releasePointerCapture(e.pointerId)}catch(_){}
}
function previewDrawingWheelZoom(nextScale,focus){
 if(!pdf)return;
 drawingWheelTargetScale=clampDrawingScale(nextScale);
 drawingWheelFocus=focus;
 const factor=drawingWheelTargetScale/drawingWheelBaseScale;
 el.stage.style.transformOrigin=(focus.x*100)+'% '+(focus.y*100)+'%';
 el.stage.style.transform='scale('+factor+')';
 el.zoomInfo.textContent=Math.round(drawingWheelTargetScale*100)+'%';
 clearTimeout(drawingWheelTimer);
 drawingWheelTimer=setTimeout(async()=>{
  const finalScale=drawingWheelTargetScale,finalFocus=drawingWheelFocus;
  drawingWheelTimer=null;scale=finalScale;
  el.stage.style.transform='';el.stage.style.transformOrigin='';
  await renderDrawing();
  requestAnimationFrame(()=>restoreDrawingFocus(finalFocus));
 },80);
}
function drawingTouchCenter(touches){return{x:(touches[0].clientX+touches[1].clientX)/2,y:(touches[0].clientY+touches[1].clientY)/2}}
function drawingTouchDistance(touches){return Math.hypot(touches[0].clientX-touches[1].clientX,touches[0].clientY-touches[1].clientY)}
function beginDrawingTouch(e){
 if(!pdf)return;
 if(e.touches.length>=2){
  e.preventDefault();
  const center=drawingTouchCenter(e.touches),focus=drawingFocusRatios(center.x,center.y);
  drawingTouch={mode:'pinch',startDistance:Math.max(1,drawingTouchDistance(e.touches)),startScale:scale,targetScale:scale,focus,center};
  el.stage.style.transformOrigin=(focus.x*100)+'% '+(focus.y*100)+'%';
  return;
 }
 if(drawingTool||e.touches.length!==1)return;
 const t=e.touches[0];
 drawingTouch={mode:'single',startX:t.clientX,startY:t.clientY,lastX:t.clientX,lastY:t.clientY,left:el.viewer.scrollLeft,top:el.viewer.scrollTop,horizontalScrollable:el.viewer.scrollWidth>el.viewer.clientWidth+6};
}
function moveDrawingTouch(e){
 if(!drawingTouch)return;
 if(drawingTouch.mode==='pinch'&&e.touches.length>=2){
  e.preventDefault();
  const center=drawingTouchCenter(e.touches),target=clampDrawingScale(drawingTouch.startScale*(drawingTouchDistance(e.touches)/drawingTouch.startDistance));
  drawingTouch.targetScale=target;drawingTouch.center=center;
  el.stage.style.transform='scale('+(target/drawingTouch.startScale)+')';
  el.zoomInfo.textContent=Math.round(target*100)+'%';
  return;
 }
 if(drawingTouch.mode==='single'&&e.touches.length===1){
  e.preventDefault();
  const t=e.touches[0],dx=t.clientX-drawingTouch.startX,dy=t.clientY-drawingTouch.startY;
  drawingTouch.lastX=t.clientX;drawingTouch.lastY=t.clientY;
  const horizontalSwipe=!drawingTouch.horizontalScrollable&&Math.abs(dx)>Math.abs(dy)*1.15;
  if(!horizontalSwipe){
   el.viewer.scrollLeft=drawingTouch.left-dx;
   el.viewer.scrollTop=drawingTouch.top-dy;
  }
 }
}
async function changeDrawingPage(delta){
 if(!pdf)return;
 const next=page+delta;if(next<1||next>pdf.numPages)return;
 page=next;selectedId=null;await renderDrawing();renderGroups();
}
async function endDrawingTouch(e){
 if(!drawingTouch)return;
 if(drawingTouch.mode==='pinch'&&e.touches.length<2){
  const g=drawingTouch;drawingTouch=null;
  scale=clampDrawingScale(g.targetScale);el.stage.style.transform='';el.stage.style.transformOrigin='';
  await renderDrawing();requestAnimationFrame(()=>restoreDrawingFocus({...g.focus,clientX:g.center.x,clientY:g.center.y}));
  if(e.touches.length===1){
   const t=e.touches[0];drawingTouch={mode:'single',startX:t.clientX,startY:t.clientY,lastX:t.clientX,lastY:t.clientY,left:el.viewer.scrollLeft,top:el.viewer.scrollTop,horizontalScrollable:el.viewer.scrollWidth>el.viewer.clientWidth+6};
  }
  return;
 }
 if(drawingTouch.mode==='single'&&e.touches.length===0){
  const g=drawingTouch;drawingTouch=null;
  const dx=g.lastX-g.startX,dy=g.lastY-g.startY;
  if(!g.horizontalScrollable&&Math.abs(dx)>70&&Math.abs(dx)>Math.abs(dy)*1.25){
   // According to the requested workflow: swipe right = next, swipe left = previous.
   await changeDrawingPage(dx>0?1:-1);
  }
 }
}
async function fitDrawing(){
 if(!pdf)return;const pg=await pdf.getPage(page),vp=pg.getViewport({scale:1});
 scale=Math.max(.25,Math.min(2.5,(el.viewer.clientWidth-12)/vp.width,(el.viewer.clientHeight-12)/vp.height));await renderDrawing();
}
async function analyze(file){
 setState('Läser projekt-PDF…');const ab=await file.arrayBuffer();bytes=new Uint8Array(ab);fileKey=hashBytes(bytes);currentFileName=file.name||'Tillsyno-projekt.pdf';
 embeddedState=await readEmbeddedProjectState();projectId=String(embeddedState.projectId||('pf-'+fileKey));
 pdf=await pdfjsLib.getDocument({data:bytes.slice()}).promise;page=1;scale=1.1;pageTexts={};protocolDefs={};drawingNotes=[];setDrawingTool('');
 el.fileName.textContent=currentFileName;el.empty.hidden=true;el.rescan.hidden=false;el.saveProject.disabled=false;
 const restoredCount=embeddedState?.instances?Object.keys(embeddedState.instances).length:0;
 setState(restoredCount?'Sparad projektstatus hittad. Läser positioner och protokoll…':'Läser gula PDF-stämplar och deras positioner…');
 stamps=await extractStamps();buildInstances();
 if(!stamps.length){setState('Inga läsbara PDF-stämplar hittades. Projektflödet använder riktiga Stamp-annoteringar, inte vanlig ritningstext.');protocolMap={};updateStats();renderGroups();await renderDrawing();return}
 await buildProtocolMap();
 await recalcAll();
 const codes=[...new Set(stamps.map(s=>s.code))],matched=codes.filter(c=>protocolMap[c]).length;
 const restored=restoredCount?' · sparad arbetsstatus inläst':'';
 setState(stamps.length+' positioner hittade · '+codes.length+' märkningar · '+matched+' av '+codes.length+' protokolltyper matchade'+restored+'.');
 await renderDrawing();renderGroups();updateStats();requestAnimationFrame(fitDrawing);
}
el.file.onchange=e=>{const file=e.target.files?.[0];if(file)analyze(file).catch(err=>{console.error(err);setState('Projektfilen kunde inte analyseras: '+(err?.message||err))})};
el.openProject.onclick=openProjectPdf;
el.openProjectEmpty.onclick=openProjectPdf;
el.saveProject.onclick=toggleSaveMenu;
el.savePortable.onclick=savePortableProject;
el.saveCopy.onclick=savePdfCopy;
el.savePage.onclick=saveCurrentDrawingPage;
el.hidePositions.onclick=()=>setPositionsHidden(true);
el.showPositions.onclick=()=>setPositionsHidden(false);
document.addEventListener('pointerdown',e=>{
 if(!el.saveMenu.hidden&&!e.target.closest('.pwSaveWrap'))closeSaveMenu();
});
loadPositionsPreference();
el.prev.onclick=()=>changeDrawingPage(-1);
el.next.onclick=()=>changeDrawingPage(1);
el.zoomOut.onclick=()=>setDrawingScale(scale-.2);
el.zoomIn.onclick=()=>setDrawingScale(scale+.2);
el.fit.onclick=fitDrawing;
el.toolText.onclick=()=>setDrawingTool('text');
el.toolArrow.onclick=()=>setDrawingTool('arrow');
el.toolUndo.onclick=undoDrawingNote;
el.viewer.addEventListener('pointerdown',e=>{if(!beginDrawingTool(e))beginDrawingPan(e)});
el.viewer.addEventListener('pointermove',e=>{if(!moveDrawingTool(e))moveDrawingPan(e)});
el.viewer.addEventListener('pointerup',e=>{if(drawingToolGesture)endDrawingTool(e);else endDrawingPan(e)});
el.viewer.addEventListener('pointercancel',e=>{if(drawingToolGesture){drawingToolGesture.preview?.remove();drawingToolGesture=null}endDrawingPan(e)});
el.viewer.addEventListener('touchstart',beginDrawingTouch,{passive:false});
el.viewer.addEventListener('touchmove',moveDrawingTouch,{passive:false});
el.viewer.addEventListener('touchend',endDrawingTouch,{passive:false});
el.viewer.addEventListener('touchcancel',endDrawingTouch,{passive:false});
el.viewer.addEventListener('wheel',e=>{
 if(!pdf)return;
 e.preventDefault();
 const focus=drawingWheelTimer?drawingWheelFocus:drawingFocusRatios(e.clientX,e.clientY);
 if(!drawingWheelTimer){drawingWheelBaseScale=scale;drawingWheelTargetScale=scale;drawingWheelFocus=focus}
 const delta=Math.max(-120,Math.min(120,Number(e.deltaY)||0));
 const factor=Math.exp(-delta*.0017);
 previewDrawingWheelZoom(drawingWheelTargetScale*factor,focus);
},{passive:false});
el.rescan.onclick=()=>{if(el.file.files?.[0])analyze(el.file.files[0]).catch(console.error)};
el.currentPageOnly.onclick=()=>{currentOnly=!currentOnly;el.currentPageOnly.setAttribute('aria-pressed',String(currentOnly));el.currentPageOnly.classList.toggle('active',currentOnly);renderGroups()};
el.back.onclick=closeProtocol;el.protocolClose.onclick=closeProtocol;
el.protocol.addEventListener('cancel',e=>{e.preventDefault();closeProtocol()});
el.protocolFit.onclick=fitProtocolPage;
el.protocolZoomOut.onclick=()=>setProtocolScale(protocolScale-.2);
el.protocolZoomIn.onclick=()=>setProtocolScale(protocolScale+.2);
el.protocolMax.onclick=()=>setProtocolScale(3);
el.protocolCanvasWrap.addEventListener('touchstart',beginProtocolTouch,{passive:false});
el.protocolCanvasWrap.addEventListener('touchmove',moveProtocolTouch,{passive:false});
el.protocolCanvasWrap.addEventListener('touchend',endProtocolTouch,{passive:false});
el.protocolCanvasWrap.addEventListener('touchcancel',endProtocolTouch,{passive:false});
el.protocolCanvasWrap.addEventListener('wheel',e=>{
 if(!(e.ctrlKey||e.metaKey))return;
 e.preventDefault();
 const factor=e.deltaY<0?1.18:.85;
 setProtocolScale(protocolScale*factor,e.clientX,e.clientY);
},{passive:false});
el.addChecklistItem.onclick=()=>openItemEditor(selectedInstance());
el.itemEditorClose.onclick=closeItemEditor;el.editCancel.onclick=closeItemEditor;el.editSave.onclick=saveItemEditor;
el.itemEditor.addEventListener('cancel',e=>{e.preventDefault();closeItemEditor()});
window.addEventListener('resize',()=>{if(pdf)requestAnimationFrame(()=>renderDrawing())});
})();