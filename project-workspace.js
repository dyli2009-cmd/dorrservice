(() => {
'use strict';

const $=id=>document.getElementById(id);
const el={
 file:$('pwFile'),openProjectEmpty:$('pwOpenProjectEmpty'),saveProject:$('pwSaveProject'),saveMenu:$('pwSaveMenu'),savePortable:$('pwSavePortable'),saveAs:$('pwSaveAs'),saveCopy:$('pwSaveCopy'),fileName:$('pwFileName'),state:$('pwState'),positionCount:$('pwPositionCount'),matchedCount:$('pwMatchedCount'),doneCount:$('pwDoneCount'),totalProgress:$('pwTotalProgress'),
 prev:$('pwPrev'),next:$('pwNext'),pageInfo:$('pwPageInfo'),zoomOut:$('pwZoomOut'),zoomIn:$('pwZoomIn'),zoomInfo:$('pwZoomInfo'),fit:$('pwFit'),bulkSelect:$('pwBulkSelect'),timeReport:$('pwTimeReport'),toolMenuButton:$('pwToolMenuButton'),toolMenu:$('pwToolMenu'),toolText:$('pwToolText'),toolCallout:$('pwToolCallout'),toolArrow:$('pwToolArrow'),toolImage:$('pwToolImage'),toolDelete:$('pwToolDelete'),toolUndo:$('pwToolUndo'),toolRedo:$('pwToolRedo'),imageFile:$('pwImageFile'),rescan:$('pwRescan'),
 viewer:$('pwViewer'),stage:$('pwStage'),canvas:$('pwCanvas'),drawingNotes:$('pwDrawingNotes'),selectionRect:$('pwSelectionRect'),markers:$('pwMarkers'),empty:$('pwEmpty'),side:$('pwSide'),showPositions:$('pwShowPositions'),hidePositions:$('pwHidePositions'),groups:$('pwGroups'),currentPageOnly:$('pwCurrentPageOnly'),
 protocol:$('pwProtocol'),back:$('pwBack'),protocolClose:$('pwProtocolClose'),protocolCode:$('pwProtocolCode'),protocolPosition:$('pwProtocolPosition'),protocolPercent:$('pwProtocolPercent'),protocolBar:$('pwProtocolBar'),
 protocolCanvas:$('pwProtocolCanvas'),protocolCanvasWrap:$('pwProtocolCanvasWrap'),protocolStage:$('pwProtocolStage'),protocolMissing:$('pwProtocolMissing'),protocolFit:$('pwProtocolFit'),protocolZoomOut:$('pwProtocolZoomOut'),protocolZoomIn:$('pwProtocolZoomIn'),protocolZoomInfo:$('pwProtocolZoomInfo'),protocolMax:$('pwProtocolMax'),
 checklist:$('pwChecklist'),checklistMeta:$('pwChecklistMeta'),addChecklistItem:$('pwAddChecklistItem'),
 bulkBar:$('pwBulkBar'),bulkCount:$('pwBulkCount'),bulkPage:$('pwBulkPage'),bulkDone:$('pwBulkDone'),bulkClear:$('pwBulkClear'),
 timeDialog:$('pwTimeDialog'),timeClose:$('pwTimeClose'),timeTotal:$('pwTimeTotal'),timeDone:$('pwTimeDone'),timeLeft:$('pwTimeLeft'),timeProgress:$('pwTimeProgress'),timeUnknown:$('pwTimeUnknown'),timeRows:$('pwTimeRows'),timeAddType:$('pwTimeAddType'),timeSummaryText:$('pwTimeSummaryText'),timeTypeEditor:$('pwTimeTypeEditor'),timeTypeTitle:$('pwTimeTypeTitle'),timeTypeClose:$('pwTimeTypeClose'),timeTypeName:$('pwTimeTypeName'),timeTypeMinutes:$('pwTimeTypeMinutes'),timeTypeTerms:$('pwTimeTypeTerms'),timeTypeCancel:$('pwTimeTypeCancel'),timeTypeSave:$('pwTimeTypeSave'),
 selfcheckExport:$('pwSelfcheckExport'),automationDialog:$('pwAutomationDialog'),automationClose:$('pwAutomationClose'),automationIdentity:$('pwAutomationIdentity'),automationModel:$('pwAutomationModel'),automationSerial:$('pwAutomationSerial'),automationId:$('pwAutomationId'),automationLocation:$('pwAutomationLocation'),automationProgress:$('pwAutomationProgress'),automationApproveAll:$('pwAutomationApproveAll'),automationChecks:$('pwAutomationChecks'),automationNotes:$('pwAutomationNotes'),
 projectName:$('pwProjectName'),projectFacility:$('pwProjectFacility'),projectOrder:$('pwProjectOrder'),projectDate:$('pwProjectDate'),projectContact:$('pwProjectContact'),projectCompany:$('pwProjectCompany'),projectTechnician:$('pwProjectTechnician'),projectSignature:$('pwProjectSignature'),projectLogo:$('pwProjectLogo'),projectLogoRemove:$('pwProjectLogoRemove'),projectLogoStatus:$('pwProjectLogoStatus'),projectLogoPreview:$('pwProjectLogoPreview'),
 selfcheckExportDialog:$('pwSelfcheckExportDialog'),selfcheckExportClose:$('pwSelfcheckExportClose'),selfcheckSelectAll:$('pwSelfcheckSelectAll'),selfcheckSelectDone:$('pwSelfcheckSelectDone'),selfcheckExportList:$('pwSelfcheckExportList'),selfcheckExportCount:$('pwSelfcheckExportCount'),selfcheckExportCreate:$('pwSelfcheckExportCreate'),
 itemEditor:$('pwItemEditor'),itemEditorTitle:$('pwItemEditorTitle'),itemEditorClose:$('pwItemEditorClose'),editLabel:$('pwEditLabel'),editValue:$('pwEditValue'),editMinutes:$('pwEditMinutes'),editNote:$('pwEditNote'),editCancel:$('pwEditCancel'),editSave:$('pwEditSave')
};

if(!window.pdfjsLib||!window.PDFLib){el.state.textContent='PDF-biblioteket kunde inte laddas.';return}
pdfjsLib.GlobalWorkerOptions.workerSrc='vendor/pdf.worker.min.js';

const ctx=el.canvas.getContext('2d');
const protocolCtx=el.protocolCanvas.getContext('2d');

let pdf=null,bytes=null,fileKey='',projectId='',currentFileName='Tillsyno-projekt.pdf',currentFileHandle=null,embeddedState={},page=1,scale=1.1,renderTask=null;
let drawingPan=null,drawingTouch=null,drawingWheelTimer=null,drawingWheelBaseScale=1,drawingWheelTargetScale=1,drawingWheelFocus=null;
let drawingTool='',drawingToolGesture=null,drawingNotes=[],drawingViewport=null,drawingNoteDrag=null,selectedDrawingNoteId='',drawingUndoStack=[],drawingRedoStack=[],pendingImage=null;
let bulkSelectMode=false,bulkSelected=new Set(),bulkDrag=null;
let stamps=[],instances=[],protocolMap={},pageTexts={},protocolDefs={},automationItems=[],selectedAutomationId='',projectMeta={},projectLogoData='';
let selectedId=null,protocolScale=1,protocolRenderTask=null,protocolGesture=null,currentOnly=false,restoreView=null,editingItem=null,editingTimeTypeKey=null;

const PROJECT_AUTOMATION_CHECKS=[
 ['1.1','Okulär kontroll av dörrautomatik och dörrmiljö.'],
 ['1.2','Kontroll av infästning och mekaniska delar.'],
 ['1.3','Funktionsprov öppning och stängning.'],
 ['1.4','Kontroll av impulsgivare och säkerhetssensorer.'],
 ['1.5','Kontroll av låsning och dörrfunktion.'],
 ['1.6','Dokumentera avvikelse eller utförd justering.']
];
const PROJECT_AUTOMATION_FAULTS={
 '1.1':['Skada eller slitage upptäckt','Dörrmiljö behöver justeras'],
 '1.2':['Infästning lös','Mekanisk del behöver justeras'],
 '1.3':['Öppning/stängning avviker','Dörr går inte hela vägen'],
 '1.4':['Impulsgivare fungerar inte','Säkerhetssensor behöver justeras'],
 '1.5':['Låsning fungerar inte korrekt','Dörrfunktion behöver justeras'],
 '1.6':['Åtgärd krävs','Fortsatt kontroll krävs']
};
const PROJECT_AUTOMATION_MODELS=[
 ['11','Geze EMD standardarm'],['12','Geze EMD glidarm'],['13','Faac standard'],['14','Faac glidarm'],
 ['15','Besam Powerswing'],['16','Besam SW100'],['17','Dorma ED 200'],['18','Tormax'],['19','Record standardarm'],
 ['20','Powerswing pardörr'],['21','Geze TSA 160'],['22','Record glidarm'],['23','Gilgen FDC'],['24','Dorma ED 100'],
 ['25','Besam SDE'],['26','Ditec hissmonterad'],['27','SR 2000'],['28','OVE'],['29','Dorma CD 80'],
 ['30','Cibes hissöppnare'],['31','Geze TSA 160 dubbeldörr'],['32','Dorma ED 180'],['33','Geze EC Turn'],
 ['34','Besam DHE'],['35','Entramatic PLS 100'],['36','Entramatic PLS 150'],['37','Dorma ED 250'],
 ['38','Geze Powerdrive skjutdörr'],['39','Geze EC Drive skjutdörr'],['40','Geze SL skjutdörr'],
 ['41','Faac 930 skjutdörr'],['42','Faac A140 skjutdörr'],['43','Dorma TS 93 + brandstängning'],
 ['44','Dorma TS 93'],['45','Entramatic SW 300'],['46','Unislide dubbel flyglig'],['47','Unislide enkel flyglig'],
 ['48','Entramatic SL500']
];

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
function desktopOpenPickerAvailable(){
 return !isNativeIos()&&typeof window.showOpenFilePicker==='function';
}
function desktopSavePickerAvailable(){
 return !isNativeIos()&&typeof window.showSaveFilePicker==='function';
}
const PDF_FILE_PICKER_TYPES=[{description:'PDF-filer',accept:{'application/pdf':['.pdf']}}];
async function openProjectPdf(){
 if(!isNativeIos()){
  if(desktopOpenPickerAvailable()){
   setState('Öppnar filväljare…');
   try{
    const handles=await window.showOpenFilePicker({multiple:false,types:PDF_FILE_PICKER_TYPES});
    const handle=handles?.[0];if(!handle){setState('Ingen fil vald.');return}
    const file=await handle.getFile();
    currentFileHandle=handle;
    await analyze(file);
    return;
   }catch(err){
    if(err?.name==='AbortError'){setState('Ingen fil vald.');return}
    console.error(err);
    currentFileHandle=null;
    setState('Datorns filväljare kunde inte användas. Öppnar vanlig filväljare…');
   }
  }
  currentFileHandle=null;
  el.file.value='';
  el.file.click();
  return;
 }
 currentFileHandle=null;
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
async function chooseDesktopSaveHandle(suggestedName){
 if(!desktopSavePickerAvailable())return null;
 return window.showSaveFilePicker({
  suggestedName:suggestedName||'Tillsyno-projekt.pdf',
  types:PDF_FILE_PICKER_TYPES,
  excludeAcceptAllOption:false
 });
}
async function ensureHandleWritePermission(handle){
 if(!handle)return false;
 const options={mode:'readwrite'};
 try{
  if(typeof handle.queryPermission==='function'&&await handle.queryPermission(options)==='granted')return true;
  if(typeof handle.requestPermission==='function')return await handle.requestPermission(options)==='granted';
 }catch(err){console.warn('Kunde inte kontrollera skrivbehörighet',err)}
 return typeof handle.createWritable==='function';
}
async function writePdfToHandle(handle,data){
 if(!handle||typeof handle.createWritable!=='function')throw new Error('Filen kan inte skrivas direkt i den här webbläsaren.');
 const writable=await handle.createWritable();
 try{
  await writable.write(new Blob([data],{type:'application/pdf'}));
 }finally{
  await writable.close();
 }
}
async function savePortableProject(){
 if(!bytes||!instances.length)return;
 closeSaveMenu();
 let targetHandle=currentFileHandle;
 if(!targetHandle&&desktopSavePickerAvailable()){
  try{
   targetHandle=await chooseDesktopSaveHandle(currentFileName||'Tillsyno-projekt.pdf');
  }catch(err){
   if(err?.name==='AbortError'){setState('Sparandet avbröts.');return}
   console.error(err);
  }
 }
 if(targetHandle===currentFileHandle&&targetHandle){
  const allowed=await ensureHandleWritePermission(targetHandle);
  if(!allowed){setState('Skrivbehörighet nekades. Använd Spara som… och välj filen eller Skrivbord.');return}
 }
 el.saveProject.disabled=true;setState(targetHandle?'Sparar projektet i PDF-filen…':'Förbereder projekt-PDF…');
 try{
  const savedBytes=await buildPortableProjectPdf();
  if(targetHandle){
   await writePdfToHandle(targetHandle,savedBytes);
   currentFileHandle=targetHandle;
   currentFileName=targetHandle.name||currentFileName;
   el.fileName.textContent=currentFileName;
   setState('Projektet är sparat i samma PDF-fil.');
   return;
  }
  const file=new File([savedBytes],currentFileName||'Tillsyno-projekt.pdf',{type:'application/pdf'});
  const delivered=await deliverProjectFile(file,'Tillsyno Projektflöde','Projektfil med sparad arbetsstatus');
  setState(delivered?'Projekt-PDF sparad med arbetsstatus.':'Sparandet avbröts. Projektstatusen finns kvar på den här enheten.');
 }catch(err){
  console.error(err);setState('Projektet kunde inte sparas i PDF-filen: '+(err?.message||err));
 }finally{el.saveProject.disabled=false}
}
async function saveProjectAs(){
 if(!bytes||!instances.length)return;
 closeSaveMenu();
 let targetHandle=null;
 if(desktopSavePickerAvailable()){
  try{
   targetHandle=await chooseDesktopSaveHandle(currentFileName||'Tillsyno-projekt.pdf');
  }catch(err){
   if(err?.name==='AbortError'){setState('Spara som avbröts.');return}
   console.error(err);
  }
 }
 el.saveProject.disabled=true;setState(targetHandle?'Sparar projektet på vald plats…':'Förbereder projekt-PDF…');
 try{
  const savedBytes=await buildPortableProjectPdf();
  if(targetHandle){
   await writePdfToHandle(targetHandle,savedBytes);
   currentFileHandle=targetHandle;
   currentFileName=targetHandle.name||currentFileName;
   el.fileName.textContent=currentFileName;
   setState('Projektet sparades på vald plats. Nästa Spara skriver till samma fil.');
   return;
  }
  const file=new File([savedBytes],currentFileName||'Tillsyno-projekt.pdf',{type:'application/pdf'});
  const delivered=await deliverProjectFile(file,'Tillsyno Projektflöde','Projektfil med sparad arbetsstatus');
  setState(delivered?'Projekt-PDF sparad.':'Spara som avbröts.');
 }catch(err){
  console.error(err);setState('Projektet kunde inte sparas: '+(err?.message||err));
 }finally{el.saveProject.disabled=false}
}
async function savePdfCopy(){
 if(!bytes)return;
 closeSaveMenu();
 const name=fileStem(currentFileName)+'-kopia.pdf';
 let targetHandle=null;
 if(desktopSavePickerAvailable()){
  try{
   targetHandle=await chooseDesktopSaveHandle(name);
  }catch(err){
   if(err?.name==='AbortError'){setState('Sparandet avbröts.');return}
   console.error(err);
  }
 }
 el.saveProject.disabled=true;setState('Förbereder PDF-kopia…');
 try{
  if(targetHandle){
   await writePdfToHandle(targetHandle,bytes.slice());
   setState('PDF-kopian sparades på vald plats.');
   return;
  }
  const file=new File([bytes.slice()],name,{type:'application/pdf'});
  const delivered=await deliverProjectFile(file,'Tillsyno PDF-kopia','Kopia av hela PDF-filen');
  setState(delivered?'PDF-kopian är klar.':'Sparandet avbröts.');
 }catch(err){
  console.error(err);setState('PDF-kopian kunde inte sparas: '+(err?.message||err));
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
 const compactExact=raw.replace(/[\s_-]+/g,'');
 // Behåll befintliga GS-ID:n, t.ex. GS1, GSTD1, GSIDW.
 if(/^GS[A-ZÅÄÖ0-9]{1,12}$/.test(compactExact))return compactExact;
 const embeddedGs=raw.match(/\b(GS[A-ZÅÄÖ0-9]{1,12})\b/);
 if(embeddedGs)return embeddedGs[1];

 // Generella dörr-/kort-ID:n: 140, 815 C, 815A, 310-B och även utspridda tecken som 8 1 5 C.
 const exactGeneric=compactExact.match(/^(\d{1,6})([A-ZÅÄÖ]{0,3})$/);
 if(exactGeneric)return exactGeneric[1]+(exactGeneric[2]?' '+exactGeneric[2]:'');
 const labelled=raw.match(/\b(?:DÖRR|DORR|DOOR|ID|LITTERA|KORT|DÖRRKORT|DORRKORT)\s*[:#-]?\s*(\d{1,6})(?:[\s_-]*([A-ZÅÄÖ]{1,3}))?\b/);
 if(labelled)return labelled[1]+(labelled[2]?' '+labelled[2]:'');
 const embeddedGeneric=raw.match(/\b(\d{2,6})[\s_-]+([A-ZÅÄÖ]{1,3})\b/);
 if(embeddedGeneric)return embeddedGeneric[1]+' '+embeddedGeneric[2];
 return '';
}
function codeRegex(code){
 const normalized=String(code||'').toUpperCase().trim();
 const compact=normalized.replace(/[^A-ZÅÄÖ0-9]/g,'');
 if(/^GS[A-ZÅÄÖ0-9]{1,12}$/.test(compact)){
  const gap='[^A-ZÅÄÖ0-9]*';
  const spread=compact.split('').join(gap);
  return new RegExp('(^|[^A-ZÅÄÖ0-9])'+spread+'($|[^A-ZÅÄÖ0-9])','i');
 }
 const generic=normalized.match(/^(\d{1,6})(?:\s+([A-ZÅÄÖ]{1,3}))?$/);
 if(!generic)return null;
 const number=generic[1],suffix=generic[2]||'';
 return new RegExp('(^|[^A-ZÅÄÖ0-9])'+number+(suffix?'[\\s_-]*'+suffix:'')+'($|[^A-ZÅÄÖ0-9])','i');
}
function stampCode(dict){
 const {PDFName}=PDFLib;
 for(const key of ['Subj','Contents','T','NM','Name']){
  const code=normalizeCode(decodePdfText(dict.get(PDFName.of(key))));
  if(code)return code;
 }
 return '';
}
function rectFromAnnotation(dict){
 const {PDFName,PDFArray,PDFNumber}=PDFLib;
 let rectArr;try{rectArr=dict.lookup(PDFName.of('Rect'),PDFArray)}catch(_){return null}
 if(!rectArr||rectArr.size()<4)return null;
 const rect=[];
 for(let n=0;n<4;n++){
  let num;try{num=rectArr.lookup(n,PDFNumber)}catch(_){}
  const v=num&&typeof num.asNumber==='function'?num.asNumber():Number(decodePdfText(rectArr.get(n)));
  rect.push(v);
 }
 return rect.every(Number.isFinite)?rect:null;
}
async function codeFromMarkedPageText(pageNo,rect){
 const text=await readPageText(pageNo);
 const minX=Math.min(rect[0],rect[2])-4,maxX=Math.max(rect[0],rect[2])+4,minY=Math.min(rect[1],rect[3])-7,maxY=Math.max(rect[1],rect[3])+7;
 const inside=text.items.filter(item=>{
  const cx=item.x+Math.max(item.w,1)/2,cy=item.y+Math.max(item.h,1)/2;
  return cx>=minX&&cx<=maxX&&cy>=minY&&cy<=maxY;
 }).sort((a,b)=>Math.abs(a.y-b.y)>4?b.y-a.y:a.x-b.x);
 if(!inside.length)return '';
 const joined=inside.map(x=>x.text).join(' ').replace(/\s+/g,' ').trim();
 let code=normalizeCode(joined);if(code)return code;
 for(const item of inside){code=normalizeCode(item.text);if(code)return code}
 return '';
}
async function extractStamps(){
 const {PDFDocument,PDFName,PDFDict}=PDFLib;
 const doc=await PDFDocument.load(bytes.slice(),{ignoreEncryption:true,updateMetadata:false});
 const candidates=[];
 const allowed=new Set(['Stamp','Highlight','Square','Circle','FreeText','Ink','Underline','Squiggly']);
 doc.getPages().forEach((pg,pi)=>{
  const annots=pg.node.Annots();if(!annots)return;
  for(let i=0;i<annots.size();i++){
   let dict;try{dict=annots.lookup(i,PDFDict)}catch(_){continue}
   if(!dict)continue;
   const subtype=decodePdfText(dict.get(PDFName.of('Subtype'))).replace('/','');
   if(!allowed.has(subtype))continue;
   const rect=rectFromAnnotation(dict);if(!rect)continue;
   candidates.push({page:pi+1,code:stampCode(dict),rect,order:i,subtype});
  }
 });
 const out=[];
 for(const mark of candidates){
  const code=mark.code||await codeFromMarkedPageText(mark.page,mark.rect);
  if(code)out.push({...mark,code});
 }
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
 ['dörrkort','dorrkort','protokoll','dörrautomatik','dörr','littera','beslag','cylinder','elbleck','lås','låshus','trycke','dörrstängare','beskrivning','produkt','ingår','funktion'].forEach(w=>{if(lower.includes(w))score++});
 const compact=text.raw.toUpperCase().replace(/[^A-ZÅÄÖ0-9]/g,'');
 const compactCode=String(code||'').toUpperCase().replace(/[^A-ZÅÄÖ0-9]/g,'');
 if(compact.startsWith(compactCode))score+=5;
 if(/^\d{1,6}(?:\s+[A-ZÅÄÖ]{1,3})?$/.test(code)&&/(dörrkort|dorrkort|littera|beslag|cylinder|låshus|trycke)/.test(lower))score+=4;
 return score;
}
async function buildProtocolMap(){
 protocolMap={};
 const drawingPages=new Set(stamps.map(s=>s.page));
 const codes=[...new Set(stamps.map(s=>s.code))];
 setState('Matchar projektmarkeringar och ID mot dörrkort/protokoll i samma PDF…');
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
  return {...line,label:override.label??line.label,value:override.value??line.value,note:override.note||'',minutes:override.minutes!==null&&override.minutes!==''&&Number.isFinite(Number(override.minutes))?Math.max(0,Number(override.minutes)):null,source:'base'};
 }).filter(Boolean);
 const custom=(o.customItems||[]).map(item=>({
  key:item.id,label:item.label||'Egen punkt',value:item.value||'',note:item.note||'',minutes:item.minutes!==null&&item.minutes!==''&&Number.isFinite(Number(item.minutes))?Math.max(0,Number(item.minutes)):null,source:'custom',actionable:true
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
 if(!checks.length){o.progress=0;o.workItemCount=0;o.estimatedMinutes=0;o.doneMinutes=0;o.unknownTimeCount=0;return}
 let totalMinutes=0,doneMinutes=0,unknownTimeCount=0;
 checks.forEach(item=>{
  const resolved=resolveItemMinutes(item);
  if(resolved.minutes===null){unknownTimeCount++;return}
  totalMinutes+=resolved.minutes;
  if(o.checks[item.key])doneMinutes+=resolved.minutes;
 });
 const doneCount=checks.filter(item=>!!o.checks[item.key]).length;
 const allDone=doneCount===checks.length;
 o.workItemCount=checks.length;o.estimatedMinutes=totalMinutes;o.doneMinutes=doneMinutes;o.unknownTimeCount=unknownTimeCount;
 if(allDone){o.progress=100;return}
 if(totalMinutes>0){o.progress=Math.min(99,Math.max(0,Math.round(doneMinutes/totalMinutes*100)));return}
 o.progress=Math.round(doneCount/checks.length*100);
}
async function recalcAll(){for(const o of instances)await recalc(o);save();updateStats();renderGroups();renderMarkers()}
function updateStats(){
 el.positionCount.textContent=instances.length;
 el.matchedCount.textContent=instances.filter(o=>protocolMap[o.code]).length;
 el.doneCount.textContent=instances.filter(o=>o.progress===100).length;
 const trackable=instances.filter(o=>(Number(o.workItemCount)||0)>0);
 const totalMinutes=trackable.reduce((a,o)=>a+Math.max(0,Number(o.estimatedMinutes)||0),0);
 const doneMinutes=trackable.reduce((a,o)=>a+Math.max(0,Number(o.doneMinutes)||0),0);
 const allDone=trackable.length>0&&trackable.every(o=>o.progress===100);
 let progress;
 if(totalMinutes>0)progress=allDone?100:Math.min(99,Math.max(0,Math.round(doneMinutes/totalMinutes*100)));
 else progress=trackable.length?Math.round(trackable.reduce((a,o)=>a+o.progress,0)/trackable.length):0;
 el.totalProgress.textContent=progress+'%';
}
async function renderDrawing(){
 if(!pdf)return;
 if(renderTask)try{renderTask.cancel()}catch(_){}
 const pg=await pdf.getPage(page),vp=pg.getViewport({scale});drawingViewport=vp;
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
function cloneDrawingNotes(list=drawingNotes){return list.map(n=>({...n,rect:Array.isArray(n.rect)?[...n.rect]:n.rect}))}
function rememberDrawingState(snapshot=cloneDrawingNotes()){
 drawingUndoStack.push(snapshot);
 if(drawingUndoStack.length>60)drawingUndoStack.shift();
 drawingRedoStack=[];
 updateDrawingHistoryButtons();
}
function updateDrawingHistoryButtons(){
 if(el.toolUndo)el.toolUndo.disabled=!drawingUndoStack.length&&!drawingNotes.some(n=>Number(n.page)===page);
 if(el.toolRedo)el.toolRedo.disabled=!drawingRedoStack.length;
 if(el.toolDelete)el.toolDelete.disabled=!selectedDrawingNoteId||!noteById(selectedDrawingNoteId);
}
function noteById(id){return drawingNotes.find(n=>n.id===id)||null}
function addNoteHitAttributes(node,noteId,part){
 node.dataset.noteId=noteId;node.dataset.notePart=part||'whole';node.setAttribute('aria-hidden','true');
}
function appendNoteHandle(svg,x,y,noteId,part){
 const c=svgNode('circle');c.setAttribute('cx',x);c.setAttribute('cy',y);c.setAttribute('r','7');c.setAttribute('class','pwNoteHandle');addNoteHitAttributes(c,noteId,part);svg.appendChild(c);
}
function appendTextNote(svg,viewport,n){
 const p=viewport.convertToViewportPoint(Number(n.x),Number(n.y));
 const t=svgNode('text');t.setAttribute('x',p[0]);t.setAttribute('y',p[1]);t.setAttribute('class','pwNoteText'+(n.id===selectedDrawingNoteId?' selected':''));t.textContent=String(n.text||'');svg.appendChild(t);
 const hit=svgNode('text');hit.setAttribute('x',p[0]);hit.setAttribute('y',p[1]);hit.setAttribute('class','pwNoteTextHit');hit.textContent=String(n.text||'');addNoteHitAttributes(hit,n.id,'label');svg.appendChild(hit);
 if(n.id===selectedDrawingNoteId)appendNoteHandle(svg,p[0],p[1],n.id,'label');
}
function appendArrowNote(svg,viewport,n){
 const a=viewport.convertToViewportPoint(Number(n.x1),Number(n.y1)),b=viewport.convertToViewportPoint(Number(n.x2),Number(n.y2));
 const line=svgNode('line');line.setAttribute('x1',a[0]);line.setAttribute('y1',a[1]);line.setAttribute('x2',b[0]);line.setAttribute('y2',b[1]);line.setAttribute('class','pwNoteArrow'+(n.id===selectedDrawingNoteId?' selected':''));line.setAttribute('marker-end','url(#pwArrowHead)');svg.appendChild(line);
 const hit=svgNode('line');hit.setAttribute('x1',a[0]);hit.setAttribute('y1',a[1]);hit.setAttribute('x2',b[0]);hit.setAttribute('y2',b[1]);hit.setAttribute('class','pwNoteLineHit');addNoteHitAttributes(hit,n.id,'whole');svg.appendChild(hit);
 if(n.id===selectedDrawingNoteId){appendNoteHandle(svg,a[0],a[1],n.id,'start');appendNoteHandle(svg,b[0],b[1],n.id,'end')}
}
function appendCalloutNote(svg,viewport,n){
 const target=viewport.convertToViewportPoint(Number(n.x1),Number(n.y1)),label=viewport.convertToViewportPoint(Number(n.x2),Number(n.y2));
 const line=svgNode('line');line.setAttribute('x1',label[0]);line.setAttribute('y1',label[1]);line.setAttribute('x2',target[0]);line.setAttribute('y2',target[1]);line.setAttribute('class','pwNoteArrow pwNoteCalloutLine'+(n.id===selectedDrawingNoteId?' selected':''));line.setAttribute('marker-end','url(#pwArrowHead)');svg.appendChild(line);
 const lineHit=svgNode('line');lineHit.setAttribute('x1',label[0]);lineHit.setAttribute('y1',label[1]);lineHit.setAttribute('x2',target[0]);lineHit.setAttribute('y2',target[1]);lineHit.setAttribute('class','pwNoteLineHit');addNoteHitAttributes(lineHit,n.id,'whole');svg.appendChild(lineHit);
 const t=svgNode('text');t.setAttribute('x',label[0]+9);t.setAttribute('y',label[1]-9);t.setAttribute('class','pwNoteText pwNoteCalloutText'+(n.id===selectedDrawingNoteId?' selected':''));t.textContent=String(n.text||'');svg.appendChild(t);
 const textHit=svgNode('text');textHit.setAttribute('x',label[0]+9);textHit.setAttribute('y',label[1]-9);textHit.setAttribute('class','pwNoteTextHit');textHit.textContent=String(n.text||'');addNoteHitAttributes(textHit,n.id,'label');svg.appendChild(textHit);
 if(n.id===selectedDrawingNoteId){appendNoteHandle(svg,target[0],target[1],n.id,'target');appendNoteHandle(svg,label[0],label[1],n.id,'label')}
}
function appendImageNote(svg,viewport,n){
 if(!Array.isArray(n.rect)||n.rect.length<4||!n.dataUrl)return;
 const r=viewportRect(viewport,n.rect);
 const image=svgNode('image');image.setAttribute('x',r.left);image.setAttribute('y',r.top);image.setAttribute('width',Math.max(10,r.width));image.setAttribute('height',Math.max(10,r.height));image.setAttribute('href',n.dataUrl);image.setAttribute('preserveAspectRatio','xMidYMid meet');image.setAttribute('class','pwNoteImage'+(n.id===selectedDrawingNoteId?' selected':''));addNoteHitAttributes(image,n.id,'whole');svg.appendChild(image);
 if(n.id===selectedDrawingNoteId){
  const frame=svgNode('rect');frame.setAttribute('x',r.left);frame.setAttribute('y',r.top);frame.setAttribute('width',Math.max(10,r.width));frame.setAttribute('height',Math.max(10,r.height));frame.setAttribute('class','pwNoteImageFrame');svg.appendChild(frame);
  appendNoteHandle(svg,r.left+r.width,r.top+r.height,n.id,'resize');
 }
}
function renderDrawingNotes(viewport){
 drawingViewport=viewport;
 const svg=el.drawingNotes;svg.replaceChildren();
 svg.setAttribute('viewBox','0 0 '+viewport.width+' '+viewport.height);
 svg.setAttribute('width',viewport.width);svg.setAttribute('height',viewport.height);
 svg.style.width=viewport.width+'px';svg.style.height=viewport.height+'px';
 ensureArrowMarker(svg);
 drawingNotes.filter(n=>Number(n.page)===page).forEach(n=>{
  if(n.type==='text')appendTextNote(svg,viewport,n);
  else if(n.type==='arrow')appendArrowNote(svg,viewport,n);
  else if(n.type==='callout')appendCalloutNote(svg,viewport,n);
  else if(n.type==='image')appendImageNote(svg,viewport,n);
 });
 updateDrawingHistoryButtons();
}
function closeToolMenu(){el.toolMenu.hidden=true;el.toolMenuButton.setAttribute('aria-expanded','false')}
function toggleToolMenu(){
 const open=el.toolMenu.hidden;el.toolMenu.hidden=!open;el.toolMenuButton.setAttribute('aria-expanded',String(open));
}
function setDrawingTool(tool){
 if(tool&&bulkSelectMode)setBulkSelectMode(false);
 drawingTool=drawingTool===tool?'':tool;
 el.toolText.setAttribute('aria-pressed',String(drawingTool==='text'));
 el.toolCallout.setAttribute('aria-pressed',String(drawingTool==='callout'));
 el.toolArrow.setAttribute('aria-pressed',String(drawingTool==='arrow'));
 el.toolMenuButton.classList.toggle('active',!!drawingTool);
 el.viewer.classList.toggle('noteMode',!!drawingTool);
 closeToolMenu();
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
 rememberDrawingState();
 const note={id:'n'+Date.now().toString(36),type:'text',page,x:pdfPoint[0],y:pdfPoint[1],text:value.trim()};
 drawingNotes.push(note);selectedDrawingNoteId=note.id;save();renderDrawingNotes(vp);
}
async function finishArrowNote(start,end){
 if(!pdf||Math.hypot(end.x-start.x,end.y-start.y)<8)return;
 const pg=await pdf.getPage(page),vp=pg.getViewport({scale}),a=vp.convertToPdfPoint(start.x,start.y),b=vp.convertToPdfPoint(end.x,end.y);
 rememberDrawingState();
 const note={id:'n'+Date.now().toString(36),type:'arrow',page,x1:a[0],y1:a[1],x2:b[0],y2:b[1]};
 drawingNotes.push(note);selectedDrawingNoteId=note.id;save();renderDrawingNotes(vp);
}
async function finishCalloutNote(target,label){
 if(!pdf)return;
 let labelPoint=label;
 if(Math.hypot(label.x-target.x,label.y-target.y)<18)labelPoint={x:target.x+90,y:Math.max(18,target.y-42)};
 const value=window.prompt('Skriv text till pilen:','');
 if(!value||!value.trim())return;
 const pg=await pdf.getPage(page),vp=pg.getViewport({scale}),a=vp.convertToPdfPoint(target.x,target.y),b=vp.convertToPdfPoint(labelPoint.x,labelPoint.y);
 rememberDrawingState();
 const note={id:'n'+Date.now().toString(36),type:'callout',page,x1:a[0],y1:a[1],x2:b[0],y2:b[1],text:value.trim()};
 drawingNotes.push(note);selectedDrawingNoteId=note.id;save();renderDrawingNotes(vp);
}
function readImageFileCompressed(file){
 return new Promise((resolve,reject)=>{
  const reader=new FileReader();
  reader.onerror=()=>reject(reader.error||new Error('Fotot kunde inte läsas.'));
  reader.onload=()=>{
   const img=new Image();
   img.onerror=()=>reject(new Error('Fotot kunde inte öppnas.'));
   img.onload=()=>{
    const max=1200,ratio=Math.min(1,max/Math.max(img.naturalWidth||1,img.naturalHeight||1)),w=Math.max(1,Math.round(img.naturalWidth*ratio)),h=Math.max(1,Math.round(img.naturalHeight*ratio));
    const canvas=document.createElement('canvas');canvas.width=w;canvas.height=h;
    const c=canvas.getContext('2d');c.drawImage(img,0,0,w,h);
    let dataUrl;try{dataUrl=canvas.toDataURL('image/jpeg',.8)}catch(_){dataUrl=String(reader.result||'')}
    resolve({dataUrl,width:w,height:h,name:file.name||'Foto'});
   };
   img.src=String(reader.result||'');
  };
  reader.readAsDataURL(file);
 });
}
async function addImageNote(point){
 if(!pdf||!pendingImage)return;
 const pg=await pdf.getPage(page),vp=pg.getViewport({scale});
 const ratio=Math.max(.25,Math.min(4,pendingImage.width/Math.max(1,pendingImage.height)));
 let w=Math.min(220,Math.max(110,vp.width*.22)),h=w/ratio;
 if(h>180){h=180;w=h*ratio}
 const left=Math.max(0,Math.min(vp.width-w,point.x-w/2)),top=Math.max(0,Math.min(vp.height-h,point.y-h/2));
 const a=vp.convertToPdfPoint(left,top),b=vp.convertToPdfPoint(left+w,top+h);
 rememberDrawingState();
 const note={id:'n'+Date.now().toString(36),type:'image',page,rect:[a[0],a[1],b[0],b[1]],dataUrl:pendingImage.dataUrl,name:pendingImage.name||'Foto'};
 drawingNotes.push(note);selectedDrawingNoteId=note.id;pendingImage=null;drawingTool='';save();renderDrawingNotes(vp);setDrawingTool('');
 setState('Foto tillagt. Markera fotot för att flytta, ändra storlek eller ta bort det.');
}
async function chooseDrawingImage(file){
 if(!file)return;
 try{
  setState('Förbereder foto…');pendingImage=await readImageFileCompressed(file);drawingTool='image';el.toolMenuButton.classList.add('active');el.viewer.classList.add('noteMode');closeToolMenu();
  setState('Fotot är klart. Tryck på ritningen där du vill placera det.');
 }catch(err){console.error(err);pendingImage=null;setDrawingTool('');setState('Fotot kunde inte läggas till: '+(err?.message||err))}
}
function deleteSelectedDrawingNote(){
 if(!selectedDrawingNoteId)return;
 const index=drawingNotes.findIndex(n=>n.id===selectedDrawingNoteId);if(index<0)return;
 rememberDrawingState();drawingNotes.splice(index,1);selectedDrawingNoteId='';save();closeToolMenu();
 if(drawingViewport)renderDrawingNotes(drawingViewport);
}
function beginDrawingTool(e){
 if(!drawingTool||!pdf||e.pointerType==='mouse'&&e.button!==0)return false;
 if(!el.stage.contains(e.target)||e.target.closest?.('.pwToolbar,.pwSide,.pwShowPositions'))return false;
 e.preventDefault();e.stopPropagation();
 const point=stagePoint(e.clientX,e.clientY);
 if(drawingTool==='image'){
  addImageNote(point);return true;
 }
 if(drawingTool==='text'){
  drawingToolGesture={pointerId:e.pointerId,type:'text',start:point};
 }else{
  const line=svgNode('line');
  if(drawingTool==='callout'){
   line.setAttribute('x1',point.x);line.setAttribute('y1',point.y);line.setAttribute('x2',point.x);line.setAttribute('y2',point.y);
  }else{
   line.setAttribute('x1',point.x);line.setAttribute('y1',point.y);line.setAttribute('x2',point.x);line.setAttribute('y2',point.y);
  }
  line.setAttribute('class','pwNotePreview');line.setAttribute('marker-end','url(#pwArrowHead)');
  el.drawingNotes.appendChild(line);
  drawingToolGesture={pointerId:e.pointerId,type:drawingTool,start:point,preview:line};
 }
 try{el.viewer.setPointerCapture(e.pointerId)}catch(_){}
 return true;
}
function moveDrawingTool(e){
 if(!drawingToolGesture||drawingToolGesture.pointerId!==e.pointerId)return false;
 e.preventDefault();e.stopPropagation();
 const point=stagePoint(e.clientX,e.clientY);
 if(drawingToolGesture.type==='arrow'){
  drawingToolGesture.preview?.setAttribute('x2',point.x);drawingToolGesture.preview?.setAttribute('y2',point.y);
 }else if(drawingToolGesture.type==='callout'){
  drawingToolGesture.preview?.setAttribute('x1',point.x);drawingToolGesture.preview?.setAttribute('y1',point.y);
  drawingToolGesture.preview?.setAttribute('x2',drawingToolGesture.start.x);drawingToolGesture.preview?.setAttribute('y2',drawingToolGesture.start.y);
 }
 return true;
}
async function endDrawingTool(e){
 if(!drawingToolGesture||drawingToolGesture.pointerId!==e.pointerId)return false;
 e.preventDefault();e.stopPropagation();
 const g=drawingToolGesture;drawingToolGesture=null;
 try{el.viewer.releasePointerCapture(e.pointerId)}catch(_){}
 const end=stagePoint(e.clientX,e.clientY);g.preview?.remove();
 if(g.type==='text')await addTextNote(end);
 else if(g.type==='callout')await finishCalloutNote(g.start,end);
 else await finishArrowNote(g.start,end);
 return true;
}
function beginNoteDrag(e){
 const hit=e.target.closest?.('[data-note-id]');if(!hit||!pdf||bulkSelectMode||!drawingViewport)return false;
 if(e.pointerType==='mouse'&&e.button!==0)return false;
 const note=noteById(hit.dataset.noteId);if(!note||Number(note.page)!==page)return false;
 e.preventDefault();e.stopPropagation();
 selectedDrawingNoteId=note.id;
 const point=stagePoint(e.clientX,e.clientY),pdfPoint=drawingViewport.convertToPdfPoint(point.x,point.y);
 drawingNoteDrag={pointerId:e.pointerId,id:note.id,part:hit.dataset.notePart||'whole',startPoint:point,startPdf:pdfPoint,beforeNote:{...note,rect:Array.isArray(note.rect)?[...note.rect]:note.rect},beforeNotes:cloneDrawingNotes(),moved:false};
 renderDrawingNotes(drawingViewport);
 try{el.viewer.setPointerCapture(e.pointerId)}catch(_){}
 return true;
}
function moveNoteFromDrag(g,currentPoint){
 const note=noteById(g.id);if(!note||!drawingViewport)return;
 const pdfPoint=drawingViewport.convertToPdfPoint(currentPoint.x,currentPoint.y),dx=pdfPoint[0]-g.startPdf[0],dy=pdfPoint[1]-g.startPdf[1],b=g.beforeNote;
 if(note.type==='text'){note.x=Number(b.x)+dx;note.y=Number(b.y)+dy;return}
 const moveBoth=g.part==='whole';
 if(note.type==='arrow'){
  if(moveBoth||g.part==='start'){note.x1=Number(b.x1)+dx;note.y1=Number(b.y1)+dy}
  if(moveBoth||g.part==='end'){note.x2=Number(b.x2)+dx;note.y2=Number(b.y2)+dy}
 }else if(note.type==='callout'){
  if(moveBoth||g.part==='target'){note.x1=Number(b.x1)+dx;note.y1=Number(b.y1)+dy}
  if(moveBoth||g.part==='label'){note.x2=Number(b.x2)+dx;note.y2=Number(b.y2)+dy}
 }else if(note.type==='image'&&Array.isArray(b.rect)){
  if(g.part==='resize'){
   note.rect=[b.rect[0],b.rect[1],pdfPoint[0],pdfPoint[1]];
  }else{
   note.rect=[Number(b.rect[0])+dx,Number(b.rect[1])+dy,Number(b.rect[2])+dx,Number(b.rect[3])+dy];
  }
 }
}
function moveNoteDrag(e){
 if(!drawingNoteDrag||drawingNoteDrag.pointerId!==e.pointerId)return false;
 e.preventDefault();e.stopPropagation();
 const point=stagePoint(e.clientX,e.clientY);
 drawingNoteDrag.moved=drawingNoteDrag.moved||Math.hypot(point.x-drawingNoteDrag.startPoint.x,point.y-drawingNoteDrag.startPoint.y)>2;
 moveNoteFromDrag(drawingNoteDrag,point);renderDrawingNotes(drawingViewport);return true;
}
function endNoteDrag(e){
 if(!drawingNoteDrag||drawingNoteDrag.pointerId!==e.pointerId)return false;
 e.preventDefault();e.stopPropagation();
 const g=drawingNoteDrag;drawingNoteDrag=null;
 try{el.viewer.releasePointerCapture(e.pointerId)}catch(_){}
 if(g.moved){
  drawingUndoStack.push(g.beforeNotes);if(drawingUndoStack.length>60)drawingUndoStack.shift();drawingRedoStack=[];save();
 }
 renderDrawingNotes(drawingViewport);return true;
}
function cancelNoteDrag(e){
 if(!drawingNoteDrag)return false;
 const g=drawingNoteDrag;drawingNoteDrag=null;drawingNotes=g.beforeNotes;selectedDrawingNoteId=g.id;
 try{if(e)el.viewer.releasePointerCapture(e.pointerId)}catch(_){}
 if(drawingViewport)renderDrawingNotes(drawingViewport);return true;
}
function applyDrawingSnapshot(snapshot){
 drawingNotes=cloneDrawingNotes(snapshot);selectedDrawingNoteId='';save();
 if(drawingViewport)renderDrawingNotes(drawingViewport);
}
function undoDrawingNote(){
 if(drawingUndoStack.length){
  drawingRedoStack.push(cloneDrawingNotes());applyDrawingSnapshot(drawingUndoStack.pop());updateDrawingHistoryButtons();return;
 }
 const index=drawingNotes.map((n,i)=>({n,i})).filter(x=>Number(x.n.page)===page).pop()?.i;
 if(Number.isInteger(index)){
  drawingRedoStack.push(cloneDrawingNotes());const next=cloneDrawingNotes();next.splice(index,1);applyDrawingSnapshot(next);updateDrawingHistoryButtons();
 }
}
function redoDrawingNote(){
 if(!drawingRedoStack.length)return;
 drawingUndoStack.push(cloneDrawingNotes());applyDrawingSnapshot(drawingRedoStack.pop());updateDrawingHistoryButtons();
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
function updateBulkBar(){
 el.bulkBar.hidden=!bulkSelectMode;
 el.bulkCount.textContent=bulkSelected.size+' valda';
 el.bulkDone.disabled=bulkSelected.size===0;
 el.bulkClear.disabled=bulkSelected.size===0;
}
function clearBulkSelection(){
 bulkSelected.clear();updateBulkBar();renderMarkers();
}
function setBulkSelectMode(enabled){
 bulkSelectMode=!!enabled;
 if(bulkSelectMode)setDrawingTool('');
 else bulkSelected.clear();
 el.bulkSelect.setAttribute('aria-pressed',String(bulkSelectMode));
 el.selectionRect.hidden=true;bulkDrag=null;
 updateBulkBar();renderMarkers();
}
function toggleBulkInstance(o){
 if(bulkSelected.has(o.id))bulkSelected.delete(o.id);else bulkSelected.add(o.id);
 updateBulkBar();renderMarkers();
}
function selectAllOnPage(){
 instances.filter(o=>o.page===page).forEach(o=>bulkSelected.add(o.id));
 updateBulkBar();renderMarkers();
}
function beginBulkDrag(e){
 if(!bulkSelectMode||!pdf||e.pointerType!=='mouse'||e.button!==0||e.target.closest?.('.pwStampHit'))return false;
 if(!el.stage.contains(e.target))return false;
 e.preventDefault();e.stopPropagation();
 const p=stagePoint(e.clientX,e.clientY);
 bulkDrag={pointerId:e.pointerId,start:p,last:p};
 el.selectionRect.hidden=false;
 el.selectionRect.style.left=p.x+'px';el.selectionRect.style.top=p.y+'px';el.selectionRect.style.width='0px';el.selectionRect.style.height='0px';
 try{el.viewer.setPointerCapture(e.pointerId)}catch(_){}
 return true;
}
function moveBulkDrag(e){
 if(!bulkDrag||bulkDrag.pointerId!==e.pointerId)return false;
 e.preventDefault();e.stopPropagation();
 const p=stagePoint(e.clientX,e.clientY);bulkDrag.last=p;
 const l=Math.min(bulkDrag.start.x,p.x),t=Math.min(bulkDrag.start.y,p.y),w=Math.abs(p.x-bulkDrag.start.x),h=Math.abs(p.y-bulkDrag.start.y);
 el.selectionRect.style.left=l+'px';el.selectionRect.style.top=t+'px';el.selectionRect.style.width=w+'px';el.selectionRect.style.height=h+'px';
 return true;
}
async function endBulkDrag(e){
 if(!bulkDrag||bulkDrag.pointerId!==e.pointerId)return false;
 e.preventDefault();e.stopPropagation();
 const g=bulkDrag;bulkDrag=null;el.selectionRect.hidden=true;
 try{el.viewer.releasePointerCapture(e.pointerId)}catch(_){}
 const x1=Math.min(g.start.x,g.last.x),x2=Math.max(g.start.x,g.last.x),y1=Math.min(g.start.y,g.last.y),y2=Math.max(g.start.y,g.last.y);
 if(x2-x1<6&&y2-y1<6)return true;
 const pg=await pdf.getPage(page),vp=pg.getViewport({scale});
 instances.filter(o=>o.page===page).forEach(o=>{
  const r=viewportRect(vp,o.rect),rx2=r.left+r.width,ry2=r.top+r.height;
  if(r.left<=x2&&rx2>=x1&&r.top<=y2&&ry2>=y1)bulkSelected.add(o.id);
 });
 updateBulkBar();renderMarkers();return true;
}
async function markBulkDone(){
 if(!bulkSelected.size)return;
 el.bulkDone.disabled=true;setState('Klarmarkerar '+bulkSelected.size+' valda positioner…');
 let changed=0,withoutChecks=0;
 for(const id of [...bulkSelected]){
  const o=instances.find(x=>x.id===id);if(!o)continue;
  const def=await protocolDef(o.code),checks=effectiveChecks(o,def);
  if(!checks.length){withoutChecks++;continue}
  checks.forEach(item=>o.checks[item.key]=true);
  await recalc(o);changed++;
 }
 bulkSelected.clear();updateBulkBar();save();updateStats();renderGroups();renderMarkers();
 setState(changed+' positioner klarmarkerade'+(withoutChecks?' · '+withoutChecks+' saknade kontrollpunkter':'')+'.');
 if(el.timeDialog.open)await renderTimeReport();
}
const TIME_CATEGORY_DEFS=[
 {key:'wc',label:'WC-/toalettbehör',minutes:10,rx:/(wc[\s-]*behör|toalettbehör|toalett)/i},
 {key:'cylinder',label:'Cylinder / cylinder-sida',minutes:15,rx:/(cylinder|gångjärnssida|gangjarnssida|anslagssida)/i},
 {key:'strike',label:'Slutbleck / elslutbleck',minutes:10,rx:/(slutbleck|elslutbleck|elbleck|step[\s-]*(40|92))/i},
 {key:'handle',label:'Trycke / handtag',minutes:10,rx:/(trycke|handtag)/i},
 {key:'lockcase',label:'Låshus',minutes:30,rx:/(låshus|lashus|låskista|laskista)/i},
 {key:'closer',label:'Dörrstängare',minutes:30,rx:/(dörrstäng|dorrstang)/i},
 {key:'automation',label:'Dörrautomatik',minutes:480,rx:/(dörrautom|dorautom|automatik|sw100|sw200|sw300|ed100|ed250|emsw)/i},
 {key:'elbow',label:'Armbågskontakt',minutes:150,rx:/(armbåg|armbag|\bak\b)/i},
 {key:'magnet',label:'Magnet',minutes:480,rx:/(magnet|maglås|maglas)/i}
];
function loadCustomTimeCategories(){
 let saved=[];try{saved=JSON.parse(localStorage.getItem('tillsyno-project-time-custom-v1')||'[]')}catch(_){}
 if(!Array.isArray(saved))return [];
 return saved.map(x=>({
  key:String(x?.key||''),
  label:String(x?.label||'').trim(),
  minutes:Math.max(0,Number(x?.minutes)||0),
  terms:Array.isArray(x?.terms)?x.terms.map(v=>String(v||'').trim().toLocaleLowerCase('sv')).filter(Boolean):[]
 })).filter(x=>x.key&&x.label);
}
function saveCustomTimeCategories(list){
 try{localStorage.setItem('tillsyno-project-time-custom-v1',JSON.stringify(list))}catch(_){}
}
function allTimeCategoryDefs(){
 return [
  ...loadCustomTimeCategories().map(x=>({...x,custom:true})),
  ...TIME_CATEGORY_DEFS.map(x=>({...x,custom:false}))
 ];
}
function loadTimeSettings(){
 let saved={};try{saved=JSON.parse(localStorage.getItem('tillsyno-project-time-estimates-v1')||'{}')}catch(_){}
 const out={};TIME_CATEGORY_DEFS.forEach(d=>out[d.key]=Number.isFinite(Number(saved[d.key]))?Math.max(0,Number(saved[d.key])):d.minutes);
 return out;
}
function saveTimeSettings(settings){
 try{localStorage.setItem('tillsyno-project-time-estimates-v1',JSON.stringify(settings))}catch(_){}
}
function loadDisabledTimeCategories(){
 let saved=[];try{saved=JSON.parse(localStorage.getItem('tillsyno-project-time-disabled-v1')||'[]')}catch(_){}
 return new Set(Array.isArray(saved)?saved:[]);
}
function saveDisabledTimeCategories(set){
 try{localStorage.setItem('tillsyno-project-time-disabled-v1',JSON.stringify([...set]))}catch(_){}
}
function timeCategoryMinutes(category,settings=loadTimeSettings()){
 if(!category)return null;
 if(category.custom)return Math.max(0,Number(category.minutes)||0);
 return Math.max(0,Number(settings[category.key])||0);
}
function classifyTimeItem(item){
 const text=(String(item?.label||'')+' '+String(item?.value||'')+' '+String(item?.note||'')).toLocaleLowerCase('sv');
 const defs=allTimeCategoryDefs();
 const custom=defs.find(d=>d.custom&&d.terms?.some(term=>term&&text.includes(term)));
 if(custom)return custom;
 return defs.find(d=>!d.custom&&d.rx?.test(text))||null;
}
function resolveItemMinutes(item){
 if(item?.minutes!==null&&item?.minutes!==''&&Number.isFinite(Number(item?.minutes)))return {minutes:Math.max(0,Number(item.minutes)),source:'item',category:classifyTimeItem(item)};
 const category=classifyTimeItem(item);
 if(!category)return {minutes:null,source:'none',category:null};
 if(loadDisabledTimeCategories().has(category.key))return {minutes:null,source:'disabled',category};
 return {minutes:timeCategoryMinutes(category),source:'category',category};
}
function parseDurationInput(value){
 const raw=String(value??'').trim().replace(/\s+/g,'');
 if(!raw)return null;
 const match=raw.match(/^(\d+)(?:[,:.](\d{1,2}))?$/);
 if(!match)return NaN;
 const hours=Number(match[1]),minutes=match[2]===undefined?0:Number(match[2]);
 if(!Number.isFinite(hours)||!Number.isFinite(minutes))return NaN;
 return Math.max(0,Math.round(hours*60+minutes));
}
function formatDurationInput(minutes){
 const total=Math.max(0,Math.round(Number(minutes)||0)),hours=Math.floor(total/60),rest=total%60;
 if(!rest)return String(hours);
 return hours+','+String(rest).padStart(2,'0');
}
function readDurationField(input,allowBlank=false){
 const raw=String(input?.value||'').trim();
 if(input)input.setCustomValidity('');
 if(allowBlank&&!raw)return null;
 const minutes=parseDurationInput(raw);
 if(minutes===null&&!allowBlank)return 0;
 if(!Number.isFinite(minutes)){
  if(input){
   input.setCustomValidity('Skriv tiden som timmar,minuter. Exempel: 8 eller 0,15 eller 3,10.');
   input.reportValidity();input.focus();
  }
  return undefined;
 }
 return minutes;
}
function formatWorkMinutes(minutes){
 const m=Math.max(0,Math.round(Number(minutes)||0)),h=Math.floor(m/60),rest=m%60;
 if(!h)return m+' min';
 if(!rest)return h+' h';
 return h+' h '+rest+' min';
}
async function calculateTimeReport(){
 const settings=loadTimeSettings(),disabled=loadDisabledTimeCategories(),defs=allTimeCategoryDefs(),rows={};
 defs.forEach(d=>rows[d.key]={def:d,count:0,doneCount:0,manualCount:0,totalMinutes:0,doneMinutes:0,disabled:disabled.has(d.key)});
 const manualOther={key:'manual',label:'Egna tider',count:0,doneCount:0,totalMinutes:0,doneMinutes:0};
 let unknown=0,itemCount=0,doneItemCount=0;
 for(const o of instances){
  const def=await protocolDef(o.code),checks=effectiveChecks(o,def);
  for(const item of checks){
   itemCount++;if(o.checks[item.key])doneItemCount++;
   const resolved=resolveItemMinutes(item),category=resolved.category;
   if(resolved.minutes===null){
    unknown++;
    if(category&&rows[category.key]){
     const r=rows[category.key];r.count++;
     if(o.checks[item.key])r.doneCount++;
    }
    continue;
   }
   if(category&&rows[category.key]){
    const r=rows[category.key];r.count++;r.totalMinutes+=resolved.minutes;
    if(resolved.source==='item')r.manualCount++;
    if(o.checks[item.key]){r.doneCount++;r.doneMinutes+=resolved.minutes}
   }else{
    manualOther.count++;manualOther.totalMinutes+=resolved.minutes;
    if(o.checks[item.key]){manualOther.doneCount++;manualOther.doneMinutes+=resolved.minutes}
   }
  }
 }
 const list=defs.map(d=>rows[d.key]);
 if(manualOther.count)list.push({def:{key:'manual',label:'Egna tider'},...manualOther,manualCount:manualOther.count,disabled:false,isManual:true});
 const total=list.reduce((a,r)=>a+r.totalMinutes,0),done=list.reduce((a,r)=>a+r.doneMinutes,0);
 const trackable=instances.filter(o=>(Number(o.workItemCount)||0)>0),allChecksDone=trackable.length>0&&trackable.every(o=>o.progress===100);
 const progress=total>0?(allChecksDone?100:Math.min(99,Math.max(0,Math.round(done/total*100)))):0;
 return {settings,disabled,rows:list,unknown,total,done,progress,itemCount,doneItemCount,categoryCount:defs.filter(d=>!disabled.has(d.key)).length};
}
async function refreshTimeDrivenProgress(){
 await recalcAll();
 if(el.timeDialog.open)await renderTimeReport();
}
function openTimeTypeEditor(def=null){
 editingTimeTypeKey=def?.custom?def.key:null;
 el.timeTypeTitle.textContent=editingTimeTypeKey?'Ändra tidstyp':'Lägg till tidstyp';
 el.timeTypeName.value=def?.label||'';
 el.timeTypeMinutes.value=def?formatDurationInput(Math.max(0,Number(def.minutes)||0)):'';
 el.timeTypeTerms.value=def?.terms?.join(', ')||'';
 el.timeTypeEditor.showModal();
 requestAnimationFrame(()=>el.timeTypeName.focus());
}
function closeTimeTypeEditor(){if(el.timeTypeEditor.open)el.timeTypeEditor.close();editingTimeTypeKey=null}
async function saveTimeTypeEditor(){
 const label=el.timeTypeName.value.trim();
 if(!label){el.timeTypeName.focus();return}
 const minutes=readDurationField(el.timeTypeMinutes,false);if(minutes===undefined)return;
 let terms=el.timeTypeTerms.value.split(',').map(x=>x.trim().toLocaleLowerCase('sv')).filter(Boolean);
 if(!terms.length)terms=[label.toLocaleLowerCase('sv')];
 const list=loadCustomTimeCategories();
 if(editingTimeTypeKey){
  const item=list.find(x=>x.key===editingTimeTypeKey);
  if(item)Object.assign(item,{label,minutes,terms});
 }else{
  list.unshift({key:'custom-'+Date.now().toString(36),label,minutes,terms});
 }
 saveCustomTimeCategories(list);closeTimeTypeEditor();await refreshTimeDrivenProgress();
}
async function deleteCustomTimeCategory(key){
 const def=loadCustomTimeCategories().find(x=>x.key===key);if(!def)return;
 if(!window.confirm('Ta bort tidstypen "'+def.label+'"? Kontrollpunkterna tas inte bort.'))return;
 saveCustomTimeCategories(loadCustomTimeCategories().filter(x=>x.key!==key));
 const disabled=loadDisabledTimeCategories();disabled.delete(key);saveDisabledTimeCategories(disabled);
 await refreshTimeDrivenProgress();
}
async function renderTimeReport(){
 if(!pdf)return;
 el.timeRows.innerHTML='<p class="pwMuted">Räknar projektets kontrollpunkter…</p>';
 const report=await calculateTimeReport(),left=Math.max(0,report.total-report.done);
 el.timeTotal.textContent=formatWorkMinutes(report.total);
 el.timeDone.textContent=formatWorkMinutes(report.done);
 el.timeLeft.textContent=formatWorkMinutes(left);
 el.timeProgress.textContent=report.progress+'%';
 el.timeUnknown.textContent=String(report.unknown);
 el.timeSummaryText.textContent=report.itemCount+' arbetsmoment · '+report.doneItemCount+' klara · '+Math.max(0,report.itemCount-report.doneItemCount)+' kvar · '+report.categoryCount+' aktiva tidstyper';
 el.timeRows.replaceChildren();
 report.rows.forEach(r=>{
  const row=document.createElement('div');row.className='pwTimeRow'+(r.disabled?' disabled':'');
  const name=document.createElement('div'),strong=document.createElement('strong'),small=document.createElement('small');
  strong.textContent=r.def.label;
  const details=[r.count+' punkter',formatWorkMinutes(r.totalMinutes)+' totalt'];
  if(r.manualCount)details.push(r.manualCount+' egna tider');
  if(r.disabled)details.push('borttagen från beräkning');
  small.textContent=details.join(' · ');name.append(strong,small);

  const input=document.createElement('input');input.type='text';input.inputMode='decimal';
  if(r.isManual){input.value='';input.placeholder='Per punkt';input.disabled=true}
  else{
   const original=timeCategoryMinutes(r.def,report.settings);
   input.value=formatDurationInput(original);input.placeholder='0,15';input.setAttribute('aria-label','Tid per '+r.def.label);
   input.disabled=r.disabled;
   input.onchange=async()=>{
    input.setCustomValidity('');
    const next=parseDurationInput(input.value);
    if(!Number.isFinite(next)){
     input.setCustomValidity('Skriv tiden som timmar,minuter. Exempel: 8 eller 0,15 eller 3,10.');
     input.reportValidity();input.value=formatDurationInput(original);return;
    }
    if(r.def.custom){
     const list=loadCustomTimeCategories(),item=list.find(x=>x.key===r.def.key);if(item)item.minutes=next;saveCustomTimeCategories(list);
    }else{
     const settings=loadTimeSettings();settings[r.def.key]=next;saveTimeSettings(settings);
    }
    await refreshTimeDrivenProgress();
   };
  }

  const done=document.createElement('div');done.className='pwTimeStat';done.innerHTML='<small>Klart</small><br>'+r.doneCount+'/'+r.count;
  const remain=document.createElement('div');remain.className='pwTimeStat';remain.innerHTML='<small>Kvar</small><br>'+Math.max(0,r.count-r.doneCount);

  const actions=document.createElement('div');actions.className='pwTimeActions';
  if(!r.isManual&&r.def.custom){
   const edit=document.createElement('button');edit.type='button';edit.textContent='Ändra';edit.onclick=()=>openTimeTypeEditor(r.def);
   const remove=document.createElement('button');remove.type='button';remove.className='danger';remove.textContent='Ta bort';remove.onclick=()=>deleteCustomTimeCategory(r.def.key);
   actions.append(edit,remove);
  }else if(!r.isManual){
   const toggle=document.createElement('button');toggle.type='button';toggle.textContent=r.disabled?'Återställ':'Ta bort';
   toggle.title=r.disabled?'Ta tillbaka tidsmallen i beräkningen':'Ta bort tidsmallen från beräkningen. Kontrollpunkterna finns kvar.';
   toggle.onclick=async()=>{
    const disabled=loadDisabledTimeCategories();
    if(r.disabled)disabled.delete(r.def.key);else disabled.add(r.def.key);
    saveDisabledTimeCategories(disabled);await refreshTimeDrivenProgress();
   };
   actions.appendChild(toggle);
  }
  row.append(name,input,done,remain,actions);el.timeRows.appendChild(row);
 });
}
async function openTimeReport(){
 if(!pdf)return;
 el.timeDialog.showModal();await renderTimeReport();
}
function closeTimeReport(){if(el.timeDialog.open)el.timeDialog.close()}
function renderMarkers(){
 el.markers.replaceChildren();if(!pdf)return;
 const renderPage=page,pageItems=instances.filter(o=>o.page===renderPage);
 pdf.getPage(renderPage).then(pg=>{
  if(renderPage!==page)return;
  const vp=pg.getViewport({scale});
  pageItems.forEach(o=>{
   const r=viewportRect(vp,o.rect);
   if(!Number.isFinite(r.left+r.top+r.width+r.height)||r.width<=0||r.height<=0)return;
   const btn=document.createElement('button');btn.type='button';btn.className='pwStampHit';btn.dataset.progress=String(o.progress||0);if(o.id===selectedId)btn.classList.add('selected');if(bulkSelected.has(o.id))btn.classList.add('bulkSelected');
   btn.style.left=r.left+'px';btn.style.top=r.top+'px';btn.style.width=Math.max(10,r.width)+'px';btn.style.height=Math.max(10,r.height)+'px';
   btn.title=o.code+' · position '+o.position+' av '+o.totalOfCode+' · '+o.progress+'%';
   btn.setAttribute('aria-label',btn.title);
   if(o.progress>0){const badge=document.createElement('span');badge.className='pwProgressBadge';badge.textContent=o.progress+'%';btn.appendChild(badge)}
   btn.onclick=e=>{e.preventDefault();e.stopPropagation();if(bulkSelectMode)toggleBulkInstance(o);else openProtocol(o)};
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
 if(bulkSelectMode){toggleBulkInstance(o);return}
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
 el.editMinutes.value=item?.minutes!==null&&item?.minutes!==''&&Number.isFinite(Number(item?.minutes))?formatDurationInput(Math.max(0,Number(item.minutes))):'';
 el.editNote.value=item?.note||'';
 el.itemEditor.showModal();
 requestAnimationFrame(()=>el.editLabel.focus());
}
function closeItemEditor(){if(el.itemEditor.open)el.itemEditor.close();editingItem=null}
async function saveItemEditor(){
 const o=selectedInstance();if(!o||!editingItem)return;
 const label=el.editLabel.value.trim(),value=el.editValue.value.trim(),note=el.editNote.value.trim();
 const minutes=readDurationField(el.editMinutes,true);if(minutes===undefined)return;
 if(!label){el.editLabel.focus();return}
 if(!editingItem.key){
  const id='c'+Date.now().toString(36)+(o.customItems.length+1).toString(36);
  o.customItems.push({id,label,value,note,minutes});
 }else if(editingItem.source==='custom'){
  const item=o.customItems.find(x=>x.id===editingItem.key);
  if(item)Object.assign(item,{label,value,note,minutes});
 }else{
  o.overrides[editingItem.key]={...(o.overrides[editingItem.key]||{}),label,value,note,minutes,hidden:false};
 }
 await recalc(o);save();syncProtocolProgress(o);updateStats();renderGroups();renderMarkers();closeItemEditor();await renderChecklist(o);
 if(el.timeDialog.open)await renderTimeReport();
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
 const time=resolveItemMinutes(item),timeTag=document.createElement('span');timeTag.className='pwCheckTime'+(time.minutes===null?' missing':'');
 timeTag.textContent=time.minutes===null?'⏱ Ingen tid':'⏱ '+formatWorkMinutes(time.minutes)+(time.source==='item'?' · egen':'');
 content.appendChild(timeTag);
 if(item.note){const note=document.createElement('em');note.className='pwCheckComment';note.textContent=item.note;content.appendChild(note)}
 const actions=document.createElement('div');actions.className='pwCheckActions';
 const edit=document.createElement('button');edit.type='button';edit.textContent='Ändra';edit.onclick=()=>openItemEditor(o,item);
 const remove=document.createElement('button');remove.type='button';remove.className='pwRemoveItem';remove.textContent='Ta bort';remove.onclick=()=>removeChecklistItem(o,item);
 actions.append(edit,remove);row.append(input,content,actions);
 input.onchange=async()=>{o.checks[item.key]=input.checked;row.classList.toggle('done',input.checked);await recalc(o);save();syncProtocolProgress(o);updateStats();renderGroups();renderMarkers();if(el.timeDialog.open)await renderTimeReport()};
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
 if(!pdf||drawingTool||bulkSelectMode||e.pointerType!=='mouse')return;
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
 if(!pdf||drawingNoteDrag)return;
 if(e.touches.length>=2){
  e.preventDefault();
  if(drawingToolGesture){drawingToolGesture.preview?.remove();drawingToolGesture=null}
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
 setState('Läser projekt-PDF…');document.body.classList.remove('pwStartMode');const ab=await file.arrayBuffer();bytes=new Uint8Array(ab);fileKey=hashBytes(bytes);currentFileName=file.name||'Tillsyno-projekt.pdf';
 embeddedState=await readEmbeddedProjectState();projectId=String(embeddedState.projectId||('pf-'+fileKey));
 pdf=await pdfjsLib.getDocument({data:bytes.slice()}).promise;page=1;scale=1.1;pageTexts={};protocolDefs={};drawingNotes=[];drawingViewport=null;drawingNoteDrag=null;selectedDrawingNoteId='';drawingUndoStack=[];drawingRedoStack=[];pendingImage=null;bulkSelected.clear();bulkSelectMode=false;el.bulkSelect.setAttribute('aria-pressed','false');updateBulkBar();setDrawingTool('');
 el.fileName.textContent=currentFileName;el.empty.hidden=true;el.rescan.hidden=false;el.saveProject.disabled=false;
 const restoredCount=embeddedState?.instances?Object.keys(embeddedState.instances).length:0;
 setState(restoredCount?'Sparad projektstatus hittad. Läser positioner och protokoll…':'Läser projektmarkeringar och dörr-ID:n…');
 stamps=await extractStamps();buildInstances();
 if(!stamps.length){setState('Inga läsbara projektmarkeringar med dörr-ID hittades. Markera ID:t med en PDF-markering eller stämpel så kan Projektflödet matcha det mot dörrkortet.');protocolMap={};updateStats();renderGroups();await renderDrawing();return}
 await buildProtocolMap();
 await recalcAll();
 const codes=[...new Set(stamps.map(s=>s.code))],matched=codes.filter(c=>protocolMap[c]).length;
 const restored=restoredCount?' · sparad arbetsstatus inläst':'';
 setState(stamps.length+' positioner hittade · '+codes.length+' märkningar · '+matched+' av '+codes.length+' protokolltyper matchade'+restored+'.');
 await renderDrawing();renderGroups();updateStats();requestAnimationFrame(fitDrawing);
}
el.file.onchange=e=>{const file=e.target.files?.[0];if(file){currentFileHandle=null;analyze(file).catch(err=>{console.error(err);setState('Projektfilen kunde inte analyseras: '+(err?.message||err))})}};
el.openProjectEmpty.onclick=openProjectPdf;
el.saveProject.onclick=toggleSaveMenu;
el.savePortable.onclick=savePortableProject;
el.saveAs.onclick=saveProjectAs;
el.saveCopy.onclick=savePdfCopy;
el.hidePositions.onclick=()=>setPositionsHidden(true);
el.showPositions.onclick=()=>setPositionsHidden(false);
document.addEventListener('pointerdown',e=>{
 if(!el.saveMenu.hidden&&!e.target.closest('.pwSaveWrap'))closeSaveMenu();
 if(!el.toolMenu.hidden&&!e.target.closest('.pwToolWrap'))closeToolMenu();
});
loadPositionsPreference();
el.prev.onclick=()=>changeDrawingPage(-1);
el.next.onclick=()=>changeDrawingPage(1);
el.zoomOut.onclick=()=>setDrawingScale(scale-.2);
el.zoomIn.onclick=()=>setDrawingScale(scale+.2);
el.fit.onclick=fitDrawing;
el.bulkSelect.onclick=()=>setBulkSelectMode(!bulkSelectMode);
el.bulkPage.onclick=selectAllOnPage;
el.bulkDone.onclick=markBulkDone;
el.bulkClear.onclick=clearBulkSelection;
el.timeReport.onclick=openTimeReport;
el.timeClose.onclick=closeTimeReport;
el.timeAddType.onclick=()=>openTimeTypeEditor();
el.timeDialog.addEventListener('cancel',e=>{e.preventDefault();closeTimeReport()});
el.timeTypeClose.onclick=closeTimeTypeEditor;
el.timeTypeCancel.onclick=closeTimeTypeEditor;
el.timeTypeSave.onclick=saveTimeTypeEditor;
el.timeTypeEditor.addEventListener('cancel',e=>{e.preventDefault();closeTimeTypeEditor()});
el.toolMenuButton.onclick=toggleToolMenu;
el.toolText.onclick=()=>setDrawingTool('text');
el.toolCallout.onclick=()=>setDrawingTool('callout');
el.toolArrow.onclick=()=>setDrawingTool('arrow');
el.toolImage.onclick=()=>{closeToolMenu();el.imageFile.value='';el.imageFile.click()};
el.imageFile.onchange=e=>{const file=e.target.files?.[0];if(file)chooseDrawingImage(file)};
el.toolDelete.onclick=deleteSelectedDrawingNote;
el.toolUndo.onclick=undoDrawingNote;
el.toolRedo.onclick=redoDrawingNote;
el.viewer.addEventListener('pointerdown',e=>{if(!beginNoteDrag(e)&&!beginBulkDrag(e)&&!beginDrawingTool(e))beginDrawingPan(e)});
el.viewer.addEventListener('pointermove',e=>{if(!moveNoteDrag(e)&&!moveBulkDrag(e)&&!moveDrawingTool(e))moveDrawingPan(e)});
el.viewer.addEventListener('pointerup',e=>{if(drawingNoteDrag)endNoteDrag(e);else if(bulkDrag)endBulkDrag(e);else if(drawingToolGesture)endDrawingTool(e);else endDrawingPan(e)});
el.viewer.addEventListener('pointercancel',e=>{if(drawingNoteDrag)cancelNoteDrag(e);if(bulkDrag){bulkDrag=null;el.selectionRect.hidden=true}if(drawingToolGesture){drawingToolGesture.preview?.remove();drawingToolGesture=null}endDrawingPan(e)});
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