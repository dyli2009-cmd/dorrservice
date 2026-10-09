(() => {
'use strict';
const LAB_PREFIX='tillsyno-smartmatch-v11:v1:';
const labStorage={
 getItem:key=>localStorage.getItem(LAB_PREFIX+String(key)),
 setItem:(key,value)=>localStorage.setItem(LAB_PREFIX+String(key),value),
 removeItem:key=>localStorage.removeItem(LAB_PREFIX+String(key))
};
let labManualLinks={},protocolCandidates={},labUnreadableMarks=0,labSourceMarkCount=0,labGraphicsCandidates=0,labGraphicPositions=0,labColorFirstPositions=0,labFallbackPositions=0,labDiagnosticSpot=null,labDiagnosticSequence=0;
let smartDoorCardIndex={},smartDoorCardPages=new Set(),smartScanStats={};
let smartBaseDrawingFile=null,smartAdditionalCardsFile=null;

const $=id=>document.getElementById(id);
const el={
 file:$('pwFile'),openProjectEmpty:$('pwOpenProjectEmpty'),saveProject:$('pwSaveProject'),saveMenu:$('pwSaveMenu'),savePortable:$('pwSavePortable'),saveAs:$('pwSaveAs'),saveCopy:$('pwSaveCopy'),saveSelfchecks:$('pwSaveSelfchecks'),fileName:$('pwFileName'),state:$('pwState'),positionCount:$('pwPositionCount'),matchedCount:$('pwMatchedCount'),doneCount:$('pwDoneCount'),totalProgress:$('pwTotalProgress'),
 prev:$('pwPrev'),next:$('pwNext'),pageInfo:$('pwPageInfo'),zoomOut:$('pwZoomOut'),zoomIn:$('pwZoomIn'),zoomInfo:$('pwZoomInfo'),fit:$('pwFit'),bulkSelect:$('pwBulkSelect'),timeReport:$('pwTimeReport'),toolMenuButton:$('pwToolMenuButton'),toolMenu:$('pwToolMenu'),toolText:$('pwToolText'),toolCallout:$('pwToolCallout'),toolArrow:$('pwToolArrow'),toolImage:$('pwToolImage'),toolDelete:$('pwToolDelete'),toolUndo:$('pwToolUndo'),toolRedo:$('pwToolRedo'),imageFile:$('pwImageFile'),
 viewer:$('pwViewer'),stage:$('pwStage'),canvas:$('pwCanvas'),drawingNotes:$('pwDrawingNotes'),selectionRect:$('pwSelectionRect'),markers:$('pwMarkers'),automationMarkers:$('pwAutomationMarkers'),empty:$('pwEmpty'),side:$('pwSide'),showPositions:$('pwShowPositions'),hidePositions:$('pwHidePositions'),groups:$('pwGroups'),currentPageOnly:$('pwCurrentPageOnly'),
 protocol:$('pwProtocol'),back:$('pwBack'),protocolClose:$('pwProtocolClose'),protocolCode:$('pwProtocolCode'),protocolPosition:$('pwProtocolPosition'),protocolPercent:$('pwProtocolPercent'),protocolBar:$('pwProtocolBar'),
 protocolCanvas:$('pwProtocolCanvas'),protocolCanvasWrap:$('pwProtocolCanvasWrap'),protocolStage:$('pwProtocolStage'),protocolMissing:$('pwProtocolMissing'),protocolFit:$('pwProtocolFit'),protocolZoomOut:$('pwProtocolZoomOut'),protocolZoomIn:$('pwProtocolZoomIn'),protocolZoomInfo:$('pwProtocolZoomInfo'),protocolMax:$('pwProtocolMax'),
 checklist:$('pwChecklist'),checklistMeta:$('pwChecklistMeta'),addChecklistItem:$('pwAddChecklistItem'),
 bulkBar:$('pwBulkBar'),bulkCount:$('pwBulkCount'),bulkPage:$('pwBulkPage'),bulkDone:$('pwBulkDone'),bulkClear:$('pwBulkClear'),
 timeDialog:$('pwTimeDialog'),timeClose:$('pwTimeClose'),timeTotal:$('pwTimeTotal'),timeDone:$('pwTimeDone'),timeLeft:$('pwTimeLeft'),timeProgress:$('pwTimeProgress'),timeUnknown:$('pwTimeUnknown'),timeRows:$('pwTimeRows'),timeAddType:$('pwTimeAddType'),timeSummaryText:$('pwTimeSummaryText'),timeTypeEditor:$('pwTimeTypeEditor'),timeTypeTitle:$('pwTimeTypeTitle'),timeTypeClose:$('pwTimeTypeClose'),timeTypeName:$('pwTimeTypeName'),timeTypeMinutes:$('pwTimeTypeMinutes'),timeTypeTerms:$('pwTimeTypeTerms'),timeTypeCancel:$('pwTimeTypeCancel'),timeTypeSave:$('pwTimeTypeSave'),
 automationDialog:$('pwAutomationDialog'),automationClose:$('pwAutomationClose'),automationPreview:$('pwAutomationPreview'),automationIdentity:$('pwAutomationIdentity'),automationModel:$('pwAutomationModel'),automationSerial:$('pwAutomationSerial'),automationId:$('pwAutomationId'),automationLocation:$('pwAutomationLocation'),automationProgress:$('pwAutomationProgress'),automationApproveAll:$('pwAutomationApproveAll'),automationChecks:$('pwAutomationChecks'),automationNotes:$('pwAutomationNotes'),
 projectName:$('pwProjectName'),projectFacility:$('pwProjectFacility'),projectOrder:$('pwProjectOrder'),projectDate:$('pwProjectDate'),projectNextDate:$('pwProjectNextDate'),projectCustomer:$('pwProjectCustomer'),projectAgreement:$('pwProjectAgreement'),projectContact:$('pwProjectContact'),projectPhone:$('pwProjectPhone'),projectAddress:$('pwProjectAddress'),projectPostalCode:$('pwProjectPostalCode'),projectPostalCity:$('pwProjectPostalCity'),projectCompany:$('pwProjectCompany'),projectCompanyContact:$('pwProjectCompanyContact'),projectCompanyPhone:$('pwProjectCompanyPhone'),projectCompanyAddress:$('pwProjectCompanyAddress'),projectCompanyPostalCode:$('pwProjectCompanyPostalCode'),projectCompanyPostalCity:$('pwProjectCompanyPostalCity'),projectTechnician:$('pwProjectTechnician'),projectSignature:$('pwProjectSignature'),projectLogo:$('pwProjectLogo'),projectLogoRemove:$('pwProjectLogoRemove'),projectLogoStatus:$('pwProjectLogoStatus'),projectLogoPreview:$('pwProjectLogoPreview'),
 automationPreviewDialog:$('pwAutomationPreviewDialog'),automationPreviewClose:$('pwAutomationPreviewClose'),automationPreviewTitle:$('pwAutomationPreviewTitle'),automationPreviewWrap:$('pwAutomationPreviewWrap'),automationPreviewCanvas:$('pwAutomationPreviewCanvas'),
 selfcheckExportDialog:$('pwSelfcheckExportDialog'),selfcheckExportClose:$('pwSelfcheckExportClose'),selfcheckSelectAll:$('pwSelfcheckSelectAll'),selfcheckSelectDone:$('pwSelfcheckSelectDone'),selfcheckExportList:$('pwSelfcheckExportList'),selfcheckExportCount:$('pwSelfcheckExportCount'),selfcheckExportCreate:$('pwSelfcheckExportCreate'),
 itemEditor:$('pwItemEditor'),itemEditorTitle:$('pwItemEditorTitle'),itemEditorClose:$('pwItemEditorClose'),editLabel:$('pwEditLabel'),editValue:$('pwEditValue'),editMinutes:$('pwEditMinutes'),editNote:$('pwEditNote'),editCancel:$('pwEditCancel'),editSave:$('pwEditSave')
};

if(!window.pdfjsLib||!window.PDFLib){el.state.textContent='PDF-biblioteket kunde inte laddas.';return}
pdfjsLib.GlobalWorkerOptions.workerSrc='vendor/pdf.worker.min.js';

const ctx=el.canvas.getContext('2d');
const protocolCtx=el.protocolCanvas.getContext('2d');

let pdf=null,bytes=null,fileKey='',projectId='',currentFileName='Tillsyno-projekt.pdf',currentFileHandle=null,embeddedState={},page=1,scale=1.1,renderTask=null;
let drawingRenderVersion=0,drawingRenderQueue=Promise.resolve(),drawingRaster=null;
const DRAWING_MAX_PIXELS=4000000,DRAWING_MAX_SIDE=4096;
let drawingPan=null,drawingTouch=null,drawingWheelTimer=null,drawingWheelBaseScale=1,drawingWheelTargetScale=1,drawingWheelFocus=null;
let drawingTool='',drawingToolGesture=null,drawingNotes=[],drawingViewport=null,drawingNoteDrag=null,selectedDrawingNoteId='',drawingUndoStack=[],drawingRedoStack=[],pendingImage=null;
let bulkSelectMode=false,bulkSelected=new Set(),bulkDrag=null;
let stamps=[],projectStamps=[],instances=[],protocolMap={},pageTexts={},protocolDefs={},automationItems=[],selectedAutomationId='',projectMeta={},projectLogoData='',automationPreviewPdf=null,automationPreviewRenderTask=null;
let selectedId=null,protocolScale=1,protocolRenderTask=null,protocolGesture=null,currentOnly=false,restoreView=null,editingItem=null,editingTimeTypeKey=null;

const PROJECT_AUTOMATION_ENABLED=false;

const PROJECT_AUTOMATION_CHECKS=[
 ['1.1','Samtal med nyttjaren.'],
 ['1.2','Okulärbesiktning av dörrautomatik/dörrmiljö.'],
 ['1.3','Kontroll av eventuella ombyggnader.'],
 ['1.4','Kontroll fastsättning, infästning och eventuella efterdragningar av skruvar.'],
 ['1.5','Funktionskontroll manuell och automatisk öppning (kraft, dämpning & hastighet).'],
 ['1.6','Funktionskontroll manuell och automatisk stängning (kraft, dämpning & hastighet).'],
 ['1.7','Funktionskontroll öppnings- & stängningstider.'],
 ['1.8','Funktionskontroll av nödöppning & utrymning.'],
 ['1.9','Funktionskontroll/justering koordinator och armsystem.'],
 ['1.10','Funktionskontroll impulsgivare (radar, armbågskontakter etc).'],
 ['1.11','Sensorlister och säkerhetsanordningar.'],
 ['1.12','Funktionskontroll låsfunktioner (dörrblad, elslutbleck, motorlås, ellås, låshus).'],
 ['1.13','Kontroll/justering uppställningsmagnet & dörrstopp.'],
 ['1.14','Kontroll gummiupphängningar, fjädrar, tryckslangar & tätning.'],
 ['1.15','Kontroll motor, pump, hydraulik och drivaxel.'],
 ['1.16','Kontroll säkringar / programväljare / styrmodul.'],
 ['1.17','Behovsrengöring dörrautomatik och sensorlister.'],
 ['1.18','Mindre justering.']
];
const PROJECT_AUTOMATION_FAULTS={
 '1.1':['Nyttjaren uppger återkommande driftstörning','Nyttjaren uppger avvikande funktion','Användning eller förutsättningar har ändrats'],
 '1.2':['Skada/slitage i dörrmiljön','Lösa eller skadade delar','Dörrblad/karm behöver justeras'],
 '1.3':['Ombyggnad påverkar dörrmiljön','Ändrad dörrmiljö kräver ny riskbedömning','Ny eller ändrad utrustning behöver kontrolleras'],
 '1.4':['Infästning lös, efterdragning krävs','Skruvar saknas/lösa','Automatikhus/arm sitter löst'],
 '1.5':['För hög öppningskraft','Fel öppningshastighet','Dämpning behöver justeras','Dörr öppnar inte fullt'],
 '1.6':['För hög stängningskraft','Fel stängningshastighet','Dämpning behöver justeras','Dörr stänger inte helt'],
 '1.7':['Öppningstid behöver justeras','Stängningstid behöver justeras','Öppethållandetid behöver justeras'],
 '1.8':['Nödöppning fungerar ej','Utrymningsfunktion behöver åtgärdas'],
 '1.9':['Armsystem behöver justeras','Koordinator fungerar ej korrekt','Glapp/slitage i armsystem'],
 '1.10':['Radar/impulsgivare fungerar ej','Armbågskontakt fungerar ej','Impulsgivare behöver justeras'],
 '1.11':['Säkerhetssensor saknas, komplettera enligt SS-EN 16005 och aktuell riskbedömning','Klämskydd saknas, komplettera enligt SS-EN 16005 där aktuell riskbedömning visar klämrisk','Säkerhetssensor/sensorlist fungerar ej','Säkerhetssensor täcker inte riskområdet','Klämskydd saknas eller är otillräckligt','Komplettera med säkerhetssensor eller klämskydd'],
 '1.12':['Elslutbleck fungerar ej korrekt','Lås släpper för sent/kort tid','Motorlås/ellås fungerar ej','Dörr/lås behöver justeras'],
 '1.13':['Dörrstopp saknas, komplettera med dörrstopp för att begränsa öppningsvinkeln till 90° där detta är angiven maxvinkel för aktuell automatik/installation','Dörrstopp saknas eller är felplacerat','Dörr öppnar för långt / fel öppningsvinkel','Uppställningsmagnet fungerar ej','Arm eller drivaxel belastas i öppet ändläge','Dörrstopp/öppningsvinkel behöver justeras enligt tillverkarens anvisning'],
 '1.14':['Gummiupphängning sliten','Fjäder behöver bytas/justeras','Tryckslang/tätning behöver åtgärdas'],
 '1.15':['Motor missljud/slitage','Pump/hydraulik läcker','Drivaxel glapp/slitage'],
 '1.16':['Programväljare fungerar ej','Styrmodul fel','Säkring/strömförsörjning behöver åtgärdas'],
 '1.17':['Rengöring av automatik krävs','Rengöring av sensor/sensorlist krävs'],
 '1.18':['Mindre justering utförd','Ytterligare justering krävs']
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
 try{labStorage.setItem('tillsyno-project-positions-hidden',isHidden?'1':'0')}catch(_){}
}
function loadPositionsPreference(){
 let hidden=false;
 try{hidden=labStorage.getItem('tillsyno-project-positions-hidden')==='1'}catch(_){}
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
    smartBaseDrawingFile=file;smartAdditionalCardsFile=null;
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
  smartBaseDrawingFile=file;smartAdditionalCardsFile=null;
  await analyze(file);
 }catch(err){
  const message=String(err?.message||err||'');
  if(/cancel|dismiss|avbr/i.test(message)){setState('Ingen fil vald.');return}
  console.error(err);
  setState('Kunde inte öppna PDF i iOS: '+message);
 }
}
function hashBytes(arr){let h=2166136261;const step=Math.max(1,Math.floor(arr.length/50000));for(let i=0;i<arr.length;i+=step){h^=arr[i];h=Math.imul(h,16777619)}return (h>>>0).toString(36)}
function storageKey(){return 'smartmatch-v11:'+(projectId||fileKey)}
function stateTime(s){const t=Date.parse(String(s?.updatedAt||''));return Number.isFinite(t)?t:0}
function localProjectDate(){const d=new Date(),local=new Date(d.getTime()-d.getTimezoneOffset()*60000);return local.toISOString().slice(0,10)}
function defaultProjectMeta(){return {projectName:'',facilityNo:'',order:'',date:localProjectDate(),nextDate:'',customer:'',agreement:'',contact:'',phone:'',address:'',postalCode:'',postalCity:'',company:'',companyContact:'',companyPhone:'',companyAddress:'',companyPostalCode:'',companyPostalCity:'',technician:'',signature:''}}
function normalizeProjectMeta(value){return {...defaultProjectMeta(),...(value&&typeof value==='object'?value:{})}}

function makeProjectPayload(){
 const payload={labManualLinks:{...labManualLinks},schema:5,projectId:projectId||('pf-'+fileKey),updatedAt:new Date().toISOString(),sourceName:currentFileName,drawingNotes:drawingNotes.map(n=>({...n})),projectMeta:normalizeProjectMeta(projectMeta),projectLogoData:projectLogoData||'',automationItems:automationItems.map(o=>({
  id:o.id,page:o.page,rect:Array.isArray(o.rect)?[...o.rect]:o.rect,objectNo:o.objectNo||'',modelCode:o.modelCode||'',model:o.model||'',serialNumber:o.serialNumber||'',location:o.location||'',sourceText:o.sourceText||'',checks:o.checks||{},notes:o.notes||'',progress:Number(o.progress||0)
 })),instances:{}};
 instances.forEach(o=>payload.instances[o.id]={
  checks:o.checks||{},progress:o.progress||0,overrides:o.overrides||{},customItems:o.customItems||[]
 });
 return payload;
}
function loadSaved(){
 let local={};try{local=JSON.parse(labStorage.getItem(storageKey())||'{}')}catch(_){}
 const embedded=embeddedState&&typeof embeddedState==='object'?embeddedState:{};
 const localValid=local&&typeof local==='object'&&Object.keys(local).length;
 const embeddedValid=embedded&&typeof embedded==='object'&&Object.keys(embedded).length;
 if(!localValid)return embedded;
 if(!embeddedValid)return local;
 return stateTime(embedded)>stateTime(local)?embedded:local;
}
function save(){
 if(!fileKey)return;
 const payload=makeProjectPayload();
 try{labStorage.setItem(storageKey(),JSON.stringify(payload))}catch(_){}
 return payload;
}
async function readEmbeddedProjectState(){
 try{
  const {PDFDocument,PDFName}=PDFLib;
  const doc=await PDFDocument.load(bytes.slice(),{ignoreEncryption:true,updateMetadata:false});
  const raw=doc.catalog.get(PDFName.of('TillsynoSmartMatchV11Data'));
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
 doc.catalog.set(PDFName.of('TillsynoSmartMatchV11Data'),PDFHexString.fromText(JSON.stringify(payload)));
 doc.catalog.set(PDFName.of('TillsynoSmartMatchV11Schema'),PDFString.of('1'));
 const saved=await doc.save({useObjectStreams:false});
 embeddedState=payload;
 bytes=new Uint8Array(saved);
 try{labStorage.setItem(storageKey(),JSON.stringify(payload))}catch(_){}
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
 if(!bytes)return;closeSaveMenu();el.saveProject.disabled=true;
 setState('Skapar separat söktest-PDF…');
 try{
  const savedBytes=await buildPortableProjectPdf();
  const name=fileStem(currentFileName).replace(/-soktest$/i,'')+'-smartmatch-v11.pdf';
  const file=new File([savedBytes],name,{type:'application/pdf'});
  const done=await deliverProjectFile(file,'Tillsyno SmartMatch TEST v11','Separat testkopia – originalfilen ändras inte');
  setState(done?'Söktestet sparades som en separat PDF-kopia.':'Sparandet avbröts. Söktestets arbetsstatus finns kvar lokalt.');
 }catch(err){console.error(err);setState('Söktest-PDF kunde inte sparas: '+(err?.message||err))}
 finally{el.saveProject.disabled=false}
}
async function saveProjectAs(){return savePortableProject()}
async function savePdfCopy(){
 if(!bytes)return;closeSaveMenu();
 const name=fileStem(currentFileName).replace(/-soktest$/i,'')+'-smartmatch-ritningskopia.pdf';
 const done=await deliverProjectFile(new File([bytes.slice()],name,{type:'application/pdf'}),'Kopia från Projektflöde test','Kopia av ritningen');
 setState(done?'Ritningskopia sparad.':'Sparandet avbröts.');
}

function decodePdfText(obj){
 try{
  if(obj&&typeof obj.decodeText==='function')return obj.decodeText();
  if(obj&&typeof obj.asString==='function')return obj.asString();
 }catch(_){}
 return String(obj||'');
}
function normalizeCode(value){
 const raw=String(value||'').toUpperCase().replace(/[\u00A0\u2007\u202F]/g,' ').replace(/\s+/g,' ').trim();
 if(!raw)return '';
 const compactExact=raw.replace(/[\s_-]+/g,'');
 if(/^GS[A-ZÅÄÖ0-9]{1,12}$/.test(compactExact))return compactExact;
 const embedded=raw.match(/(?:^|[^A-ZÅÄÖ0-9])G[\s_-]*S[\s_-]*([A-ZÅÄÖ0-9]{1,12})(?=$|[^A-ZÅÄÖ0-9])/);
 return embedded?'GS'+embedded[1]:'';
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
async function rawProjectStampText(pageNo,rect){
 const text=await readPageText(pageNo);
 const minX=Math.min(rect[0],rect[2])-4,maxX=Math.max(rect[0],rect[2])+4,minY=Math.min(rect[1],rect[3])-7,maxY=Math.max(rect[1],rect[3])+7;
 const inside=text.items.filter(item=>{
  const cx=item.x+Math.max(item.w,1)/2,cy=item.y+Math.max(item.h,1)/2;
  return cx>=minX&&cx<=maxX&&cy>=minY&&cy<=maxY;
 }).sort((a,b)=>Math.abs(a.y-b.y)>4?b.y-a.y:a.x-b.x);
 return inside.map(x=>x.text).join(' ').replace(/\s+/g,' ').trim();
}
function normalizeProjectStampText(value){
 let raw=String(value||'').toUpperCase().replace(/[–—]/g,'-').replace(/\s+/g,' ').trim();
 raw=raw.replace(/[^A-ZÅÄÖ0-9 _\/-]+/g,' ').replace(/\s+/g,' ').trim();
 if(!raw||raw.length>48||raw.split(/\s+/).length>6)return '';
 if(/^(STAMP|HIGHLIGHT|HIGHLIGHTER|FREE TEXT|FREETEXT|TEXT BOX|TEXTBOX|APPROVED|DRAFT)$/i.test(raw))return '';
 return raw;
}
function projectStampKey(value){
 const raw=normalizeProjectStampText(value);if(!raw)return '';
 if(/\d/.test(raw))return raw.replace(/[ _\/-]+/g,'');
 return raw.replace(/\s+/g,' ');
}
function projectStampRegex(value){
 const raw=normalizeProjectStampText(value),key=projectStampKey(raw);if(!raw||!key)return null;
 if(/\d/.test(key)){
  const spread=key.split('').join('[^A-ZÅÄÖ0-9]*');
  return new RegExp('(^|[^A-ZÅÄÖ0-9])'+spread+'($|[^A-ZÅÄÖ0-9])','i');
 }
 const words=raw.match(/[A-ZÅÄÖ0-9]+/g)||[];if(!words.length)return null;
 return new RegExp('(^|[^A-ZÅÄÖ0-9])'+words.join('[\\s_-]+')+'($|[^A-ZÅÄÖ0-9])','i');
}
function annotationProjectText(dict){
 const {PDFName}=PDFLib;
 for(const key of ['Contents','T','Subj']){
  const value=normalizeProjectStampText(decodePdfText(dict.get(PDFName.of(key))));
  if(value)return value;
 }
 return '';
}
async function extractProjectStamps(){
 const {PDFDocument,PDFName,PDFDict}=PDFLib;
 const doc=await PDFDocument.load(bytes.slice(),{ignoreEncryption:true,updateMetadata:false});
 const pending=[];
 doc.getPages().forEach((pg,pi)=>{
  const annots=pg.node.Annots();if(!annots)return;
  for(let i=0;i<annots.size();i++){
   let dict;try{dict=annots.lookup(i,PDFDict)}catch(_){continue}
   if(!dict)continue;
   const subtype=decodePdfText(dict.get(PDFName.of('Subtype'))).replace('/','');
   if(!['Stamp','Highlight','FreeText','Square'].includes(subtype))continue;
   const rect=rectFromAnnotation(dict);if(!rect)continue;
   if(stampCode(dict))continue;
   pending.push({page:pi+1,rect,order:i,meta:annotationProjectText(dict),subtype});
  }
 });
 const out=[];
 for(const mark of pending){
  const under=normalizeProjectStampText(await rawProjectStampText(mark.page,mark.rect));
  const label=under||mark.meta;
  if(!label||normalizeCode(label))continue;
  const code=projectStampKey(label);if(!code)continue;
  out.push({...mark,code,label,sourceKind:'project-code'});
 }
 return out;
}
async function extractStamps(){
 const {PDFDocument,PDFName,PDFDict,PDFArray,PDFNumber}=PDFLib;
 const doc=await PDFDocument.load(bytes.slice(),{ignoreEncryption:true,updateMetadata:false});
 const out=[],pending=[];
 doc.getPages().forEach((pg,pi)=>{
  const annots=pg.node.Annots();if(!annots)return;
  for(let i=0;i<annots.size();i++){
   let dict;try{dict=annots.lookup(i,PDFDict)}catch(_){continue}
   if(!dict)continue;
   const subtype=decodePdfText(dict.get(PDFName.of('Subtype'))).replace('/','');
   if(subtype!=='Stamp')continue;
   let rectArr;try{rectArr=dict.lookup(PDFName.of('Rect'),PDFArray)}catch(_){continue}
   if(!rectArr||rectArr.size()<4)continue;
   const rect=[];
   for(let n=0;n<4;n++){
    let num;try{num=rectArr.lookup(n,PDFNumber)}catch(_){}
    const v=num&&typeof num.asNumber==='function'?num.asNumber():Number(decodePdfText(rectArr.get(n)));
    rect.push(v);
   }
   if(!rect.every(Number.isFinite))continue;
   const code=stampCode(dict);
   if(code)out.push({page:pi+1,code,rect,order:i});
   else pending.push({page:pi+1,rect,order:i});
  }
 });
 for(const mark of pending){
  const code=await codeFromMarkedPageText(mark.page,mark.rect);
  if(code)out.push({...mark,code});
 }
 return out;
}
// SÖKLABB: endast markerad, läsbar text. Ingen fristående GS-textskanning.

function labCodeFromMark(value){
 const raw=String(value||'').toUpperCase().replace(/[\u00a0\u2007\u202f]/g,' ').replace(/\s+/g,' ').trim();
 if(!raw)return '';
 // Treat GS 3, GS/3, 310 A, 310-A, 310/A as exact codes.
 const gs=raw.match(/(?:^|[^A-ZÅÄÖ0-9])G[\s/_-]*S[\s/_-]*(\d{1,6}[A-ZÅÄÖ]{0,3})(?=$|[^A-ZÅÄÖ0-9])/);
 if(gs)return 'GS'+gs[1];
 // Ignore common location/field labels before the actual ID, including "WC 310A" and "DÖRR 1".
 const identity=raw.match(/^(?:WC|ENTRÉ|ENTRE|DÖRR(?:NR|NUMMER)?|LITTERA|POSITION|BETECKNING|OBJEKT(?:NR|NUMMER)?|RUM|ID)\s*[:#-]?\s+(.+)$/i);
 if(identity){
  const candidate=identity[1].replace(/[\s/_-]+/g,'');
  if(/^[A-ZÅÄÖ]{0,4}\d{1,6}[A-ZÅÄÖ]{0,4}$/.test(candidate))return candidate;
 }
 const norm=raw.replace(/[\s/_-]+/g,'');
 if(/^[A-ZÅÄÖ]{0,4}\d{1,6}[A-ZÅÄÖ]{0,4}$/.test(norm))return norm;
 const tokens=raw.match(/[A-ZÅÄÖ0-9]+/g)||[];
 const candidates=[...new Set(tokens.filter(t=>/^[A-ZÅÄÖ]{0,4}\d{1,6}[A-ZÅÄÖ]{0,4}$/.test(t)))];
 return candidates.length===1?candidates[0]:'';
}
function labExactDrawingCode(value){
 // Single marked token or contiguous fragments, never unrelated neighboring labels.
 const raw=String(value||'').toUpperCase().replace(/[\u00a0\u2007\u202f]/g,' ').trim();
 // Printed room labels/fields can be adjacent to the true yellow-marked code.
 // They must never get folded into a new code such as WC310A or 310AWC.
 const tokens=raw.match(/[A-ZÅÄÖ0-9]+/g)||[];
 if(tokens.length>1&&tokens.some(t=>/^(?:WC|DÖRR|DÖRRNR|DÖRRNUMMER|LITTERA|POSITION|BETECKNING|RUM|ENTRÉ|ENTRE|ID|DT)$/.test(t)))return '';
 const compact=raw.replace(/[\s/_-]+/g,'');
 if(/^GS\d{1,6}[A-ZÅÄÖ]{0,3}$/.test(compact))return compact;
 if(/^[A-ZÅÄÖ]{0,4}\d{1,6}[A-ZÅÄÖ]{0,4}$/.test(compact))return compact;
 return '';
}
function labSamePhysicalPosition(mark,pageNo,code,rect){
 if(mark.page!==pageNo||mark.code!==code||!Array.isArray(mark.rect))return false;
 const [a1,b1,a2,b2]=mark.rect,[c1,d1,c2,d2]=rect;
 const w1=Math.abs(a2-a1),w2=Math.abs(c2-c1),h1=Math.abs(b2-b1),h2=Math.abs(d2-d1);
 const dx=Math.abs((a1+a2-c1-c2)/2),dy=Math.abs((b1+b2-d1-d2)/2);
 const minW=Math.max(1,Math.min(w1,w2)),minH=Math.max(1,Math.min(h1,h2));
 const overlapW=Math.max(0,Math.min(Math.max(a1,a2),Math.max(c1,c2))-Math.max(Math.min(a1,a2),Math.min(c1,c2)));
 const overlapH=Math.max(0,Math.min(Math.max(b1,b2),Math.max(d1,d2))-Math.max(Math.min(b1,b2),Math.min(d1,d2)));
 // Two nearby same-code labels remain separate. Only largely coincident boxes are duplicates.
 return dx<=Math.max(2,minW*.42)&&dy<=Math.max(2,minH*.58)&&overlapW/minW>=.55&&overlapH/minH>=.42;
}
function labAlreadyLocated(list,pageNo,code,rect){
 return list.some(o=>labSamePhysicalPosition(o,pageNo,code,rect));
}
function labColorAtRect(bitmap,rect){
 // Sample an area wider than the exact PDF glyph box (some PDF baselines/widths are shifted).
 // Require colored pixels to cross the label itself, not merely touch a neighboring highlight.
 const w=Math.max(0,rect.width),h=Math.max(0,rect.height);
 if(w<1||h<1)return false;
 const padX=Math.max(3,Math.min(18,h*.9)),padY=Math.max(3,Math.min(14,h*.7));
 const x1=Math.max(0,Math.floor(rect.left-padX)),y1=Math.max(0,Math.floor(rect.top-padY));
 const x2=Math.min(bitmap.width,Math.ceil(rect.left+w+padX)),y2=Math.min(bitmap.height,Math.ceil(rect.top+h+padY));
 if(x2-x1<2||y2-y1<2)return false;
 const step=Math.max(1,Math.floor(Math.sqrt((x2-x1)*(y2-y1)/2200)));
 const bins=new Array(5).fill(0),inner=new Array(5).fill(0);
 let tested=0,colored=0,coreColored=0,coreTotal=0;
 const d=bitmap.data,width=bitmap.width;
 for(let y=y1;y<y2;y+=step)for(let x=x1;x<x2;x+=step){
  const k=(y*width+x)*4,r=d[k],g=d[k+1],b=d[k+2],a=d[k+3];
  if(a<185)continue;
  const chroma=Math.max(r,g,b)-Math.min(r,g,b);
  const qualifies=Math.max(r,g,b)>110&&chroma>=22&&chroma/Math.max(1,Math.max(r,g,b))>.08;
  tested++;if(qualifies)colored++;
  const relative=(x-rect.left)/Math.max(1,w);
  if(relative>=0&&relative<=1){
   const bin=Math.min(4,Math.floor(relative*5));
   inner[bin]++;
   if(qualifies){bins[bin]++;coreColored++}
   coreTotal++;
  }
 }
 const meaningfulBins=bins.filter((v,i)=>v>0&&v/Math.max(1,inner[i])>.045).length;
 return tested>=3&&colored>=Math.max(2,Math.ceil(tested*.027))&&
        coreColored>=Math.max(1,Math.ceil(coreTotal*.028))&&meaningfulBins>=Math.min(2,Math.ceil(coreTotal/18));
}
function labPrintedCodeCandidates(items){
 const hits=[],rows=groupTextRowsForAutomation(items);
 for(const row of rows){
  const cells=[...row.items].sort((a,b)=>a.x-b.x),occupied=new Set();
  for(let start=0;start<cells.length;start++){
   if(occupied.has(start))continue;
   let best=null;
   for(let end=start;end<Math.min(start+6,cells.length);end++){
    const segment=cells.slice(start,end+1);
    if(end>start){
     const prev=cells[end-1],now=cells[end];
     const dx=now.x-(prev.x+Math.max(prev.w,1));
     // Adjacent characters forming one code must really be close, not just in same row.
     const maxGap=Math.max(3,Math.min(13,Math.max(prev.h,now.h)*.9));
     if(dx>maxGap)break;
    }
    const raw=segment.map(o=>o.text).join(' ').replace(/\s+/g,' ').trim();
    if(raw.length>32)break;
    const code=labExactDrawingCode(raw);
    if(!code)continue;
    const rect=rectForTextItems(segment,1.8);if(!rect)continue;
    const uniquePart=segment.length===1;
    // Prefer full contiguous code 310A over truncated 310 and GS3 over G / S / 3.
    const score=code.length*10+segment.length*2+(uniquePart?1:0);
    if(!best||score>best.score)best={code,rect,label:raw,score,end,start};
   }
   if(!best)continue;
   for(let i=start;i<=best.end;i++)occupied.add(i);
   const loc={code:best.code,rect:best.rect,label:best.label};
   if(!labAlreadyLocated(hits.map(o=>({...o,page:1})),1,loc.code,loc.rect))hits.push(loc);
  }
 }
 return hits;
}

// Search TEST v6: Color-first geometry; then PDF text; then door-card matching (existing logic).
function labIsHighlightedPixel(r,g,b,a){
 if(a<185)return false;
 const mx=Math.max(r,g,b),mn=Math.min(r,g,b);
 return mx>=132&&mx-mn>=27&&(mx-mn)/Math.max(1,mx)>.105;
}
function labFindColorPatches(bitmap){
 // Each rendered page is capped at 2.6 megapixels. A 2/3-pixel grid keeps iPhone memory bounded.
 const stride=Math.max(2,Math.ceil(Math.max(bitmap.width,bitmap.height)/1500));
 const gw=Math.ceil(bitmap.width/stride),gh=Math.ceil(bitmap.height/stride);
 const color=new Uint8Array(gw*gh),seen=new Uint8Array(gw*gh);
 const d=bitmap.data;
 for(let gy=0;gy<gh;gy++){
  const y=Math.min(bitmap.height-1,gy*stride+Math.floor(stride/2));
  for(let gx=0;gx<gw;gx++){
   const x=Math.min(bitmap.width-1,gx*stride+Math.floor(stride/2)),at=(y*bitmap.width+x)*4;
   if(labIsHighlightedPixel(d[at],d[at+1],d[at+2],d[at+3]))color[gy*gw+gx]=1;
  }
 }
 const regions=[],queue=new Int32Array(color.length);
 for(let i=0;i<color.length;i++){
  if(!color[i]||seen[i])continue;
  let head=0,tail=0,count=0,minX=gw,maxX=0,minY=gh,maxY=0;
  queue[tail++]=i;seen[i]=1;
  while(head<tail){
   const at=queue[head++],x=at%gw,y=(at-x)/gw;
   count++;minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);
   for(let yy=Math.max(0,y-1);yy<=Math.min(gh-1,y+1);yy++){
    for(let xx=Math.max(0,x-1);xx<=Math.min(gw-1,x+1);xx++){
     const n=yy*gw+xx;
     if(!seen[n]&&color[n]){seen[n]=1;queue[tail++]=n}
    }
   }
  }
  const width=(maxX-minX+1)*stride,height=(maxY-minY+1)*stride;
  const fill=count/Math.max(1,(maxX-minX+1)*(maxY-minY+1));
  if(count<5||width<7||height<5||width>bitmap.width*.36||height>bitmap.height*.16)continue;
  if(width/Math.max(1,height)<.72||width/Math.max(1,height)>24||fill<.13)continue;
  regions.push({left:minX*stride,top:minY*stride,width,height,fill,count});
 }
 return regions;
}
function labPatchPdfRect(vp,patch){
 const a=vp.convertToPdfPoint(patch.left,patch.top);
 const b=vp.convertToPdfPoint(patch.left+patch.width,patch.top+patch.height);
 return [Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.max(a[0],b[0]),Math.max(a[1],b[1])];
}
function labPatchOverlap(patch,box){
 const width=Math.max(1,box.width),height=Math.max(1,box.height);
 const intersectionWidth=Math.max(0,Math.min(patch.left+patch.width,box.left+box.width)-Math.max(patch.left,box.left));
 const intersectionHeight=Math.max(0,Math.min(patch.top+patch.height,box.top+box.height)-Math.max(patch.top,box.top));
 return (intersectionWidth/width)*(intersectionHeight/height);
}
function labPatchCodes(patch,items,vp){
 const margin=Math.max(2,Math.min(8,patch.height*.38));
 const boundary={left:patch.left-margin,top:patch.top-margin,width:patch.width+margin*2,height:patch.height+margin*2};
 const relevant=items.filter(item=>{
  const r=rectForTextItems([item],0);if(!r)return false;
  const box=viewportRect(vp,r),coverage=labPatchOverlap(boundary,box);
  // A PDF text item can contain a whole line; also accept an item covering the mark.
  return coverage>.16||labPatchOverlap(box,boundary)>.38;
 });
 if(!relevant.length)return [];
 const candidates=labPrintedCodeCandidates(relevant);
 // Sometimes PDF.js keeps two adjacent words as a single text item. Extract
 // substrings and estimate their bounding boxes instead of swallowing WC/other text.
 for(const item of relevant){
  const raw=String(item.text||'');
  if(labExactDrawingCode(raw))continue; // Already read as one full ID; no substring '310' from '310 A'.
  const matches=[...raw.matchAll(/(?:G[\s/_-]*S[\s/_-]*[0-9]{1,6}[A-ZÅÄÖ0-9]{0,5}|[A-ZÅÄÖ]{0,3}[0-9]{1,6}[A-ZÅÄÖ]{0,3})/gi)];
  if(raw.length>45)continue;
  for(const match of matches){
   if(match.index===0&&match[0].length===raw.length)continue;
   const code=labExactDrawingCode(match[0]);if(!code)continue;
   const fracStart=match.index/Math.max(1,raw.length),fracEnd=(match.index+match[0].length)/Math.max(1,raw.length);
   const x=item.x+item.w*fracStart,w=item.w*(fracEnd-fracStart);
   const segment={...item,text:match[0],x,w};
   const rect=rectForTextItems([segment],1);
   if(rect)candidates.push({code,rect,label:match[0]});
  }
 }
 const accepted=[];
 for(const candidate of candidates){
  const box=viewportRect(vp,candidate.rect);
  const coverage=labPatchOverlap(patch,box);
  const marginCoverage=labPatchOverlap(boundary,box);
  if(coverage<.16||marginCoverage<.38)continue;
  if(!accepted.some(o=>o.code===candidate.code&&labSamePhysicalPosition({page:1,code:o.code,rect:o.rect},1,candidate.code,candidate.rect))){
   accepted.push({...candidate,coverage,score:coverage*100+Math.min(15,candidate.code.length)*2});
  }
 }
 return accepted.sort((a,b)=>b.score-a.score);
}
function labLegacyColorAtRect(bitmap,rect){
 // Second, independent color check used in TEST v4. Helps restore position labels
 // missed when connected-color segments are broken up by lines or outlines.
 const x1=Math.max(0,Math.floor(rect.left)),y1=Math.max(0,Math.floor(rect.top));
 const x2=Math.min(bitmap.width,Math.ceil(rect.left+rect.width));
 const y2=Math.min(bitmap.height,Math.ceil(rect.top+rect.height));
 if(x2-x1<2||y2-y1<2)return false;
 const step=Math.max(1,Math.floor(Math.sqrt((x2-x1)*(y2-y1)/2000)));
 let tested=0,colored=0;const d=bitmap.data,w=bitmap.width;
 for(let y=y1;y<y2;y+=step)for(let x=x1;x<x2;x+=step){
  const at=(y*w+x)*4,r=d[at],g=d[at+1],b=d[at+2],a=d[at+3];
  if(a<190)continue;
  tested++;
  const max=Math.max(r,g,b),min=Math.min(r,g,b);
  if(max>115&&(max-min)>=24&&(max-min)/Math.max(1,max)>.09)colored++;
 }
 return tested>0&&colored>=Math.max(2,Math.ceil(tested*.075));
}
async function extractLabGraphicPositions(already=[]){
 const out=[];labGraphicsCandidates=0;labGraphicPositions=0;labColorFirstPositions=0;labFallbackPositions=0;
 let patchesFound=0,patchesWithText=0,unreadableDrawingPages=0;
 for(let p=1;p<=pdf.numPages;p++){
  const text=await readPageText(p);
  if(smartDoorCardPages.has(p)||looksLikeAutomationProtocolPage(text.raw)||!text.items.length)continue;
  const pg=await pdf.getPage(p),natural=pg.getViewport({scale:1});
  // Sequential scans: controlled resolution and one bitmap at a time.
  const scale=Math.min(1.5,Math.sqrt(3200000/Math.max(1,natural.width*natural.height)),2600/natural.width,2600/natural.height);
  const vp=pg.getViewport({scale:Math.max(.02,scale)});
  const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d',{willReadFrequently:true});
  if(!ctx)continue;
  canvas.width=Math.max(1,Math.ceil(vp.width));canvas.height=Math.max(1,Math.ceil(vp.height));
  try{
   setState('SmartMatch v11: granskar färg och text sida '+p+' av '+pdf.numPages+'…');
   await pg.render({canvasContext:ctx,viewport:vp}).promise;
   const pixels=ctx.getImageData(0,0,canvas.width,canvas.height);
   const patches=labFindColorPatches(pixels);
   patchesFound+=patches.length;
   if(!text.items.length&&patches.length)unreadableDrawingPages++;
   for(const patch of patches){
    const codes=labPatchCodes(patch,text.items,vp);
    if(!codes.length)continue;
    patchesWithText++;
    // A colored island can contain several labels; keep distinct exact text boxes.
    for(const candidate of codes){
     const displayRect=candidate.rect; // Exact location of the read code, not a nearby label.
     if(!smartHasDoorCard(candidate.code)||labAlreadyLocated([...already,...out],p,candidate.code,displayRect))continue;
     out.push({page:p,code:candidate.code,rect:displayRect,
      order:200000+out.length,sourceKind:candidate.code.startsWith('GS')?'gs':'project-code',
      label:candidate.label,subtype:'color-first-pdf',scanScore:Math.round(candidate.coverage*100)});
     labColorFirstPositions++;
    }
   }
   // Restoration pass: if the connected-color scan missed a highlighted label,
   // retain the reliable TEST v5 text candidates on the SAME rendered page.
   // This is additive, never removes any of the color-first discoveries.
   const legacyCandidates=labPrintedCodeCandidates(text.items);
   for(const candidate of legacyCandidates){
    if(!smartHasDoorCard(candidate.code)||labAlreadyLocated([...already,...out],p,candidate.code,candidate.rect))continue;
    const drawn=viewportRect(vp,candidate.rect);
    if(!labColorAtRect(pixels,drawn)&&!labLegacyColorAtRect(pixels,drawn))continue;
    if(labAlreadyLocated([...already,...out],p,candidate.code,candidate.rect))continue;
    out.push({...candidate,page:p,order:300000+out.length,
      sourceKind:candidate.code.startsWith('GS')?'gs':'project-code',subtype:'text-color-fallback'});
    labFallbackPositions++;
   }
  }catch(error){console.warn('Färgscanning av ritning sida '+p,error)}
  finally{canvas.width=0;canvas.height=0}
 }
 labGraphicPositions=out.length;labGraphicsCandidates=out.length;
 console.info('[SmartMatch v11]',{patchesFound,patchesWithText,linkedCandidates:out.length,colorFirst:labColorFirstPositions,textFallback:labFallbackPositions,unreadableDrawingPages});
 return out;
}


function labStrictAnnotationCode(value){
 // Accept ONLY the annotation's own actual identifier, not arbitrary numbers
 // in its notes, neighboring drawing, room descriptions or equipment lists.
 const raw=String(value||'').toUpperCase().replace(/[\u00a0\u2007\u202f]/g,' ').replace(/[–—]/g,'-').trim();
 if(!raw||raw.length>35)return '';
 const compact=raw.replace(/[\s/_-]+/g,'');
 if(/^GS\d{1,6}[A-ZÅÄÖ]{0,3}$/.test(compact))return compact;
 if(/^[A-ZÅÄÖ]{0,4}\d{1,6}[A-ZÅÄÖ]{0,4}$/.test(compact))return compact;
 return '';
}


function smartNormalizeGS(value){
 const raw=String(value||'').toUpperCase().replace(/[\u00a0\u2007\u202f]/g,' ').trim();
 const compact=raw.replace(/[\s/_-]+/g,'');
 return /^GS\d{1,6}[A-ZÅÄÖ]{0,3}$/.test(compact)?compact:'';
}
function smartGSInHeader(line){
 const raw=String(line||'').toUpperCase().replace(/[\u00a0\u2007\u202f]/g,' ').trim();
 if(!raw||/^(?:SIDA|PAGE|SIDNR|SIDAN|REVISION|REV|VERSION|DATUM|ANTAL|RITNINGSNUMMER|PROJEKTNUMMER|ORDERNR|AO|RUMSNAMN)\b/.test(raw))return '';
 if(/\b(?:LÅSHUS|LASHUS|SLUTBLECK|CYLINDER|TRYCKE|BESLAG|FABRIKAT|MATERIAL|MONTERAS|LEVERERAS)\b/.test(raw))return '';
 const matches=[...raw.matchAll(/(?:^|[^A-ZÅÄÖ0-9])G[\s/_-]*S[\s/_-]*(\d{1,6}[A-ZÅÄÖ]{0,3})(?=$|[^A-ZÅÄÖ0-9])/g)];
 const codes=[...new Set(matches.map(m=>'GS'+m[1]))];
 return codes.length===1?codes[0]:'';
}

function smartHeaderCode(value){
 const text=String(value||'').toUpperCase().replace(/[\u00a0\u2007\u202f]/g,' ').replace(/\s+/g,' ').trim();
 if(!text)return '';
 if(/^(?:SIDA|PAGE|SIDNR|SIDAN|REVISION|REV|VERSION|DATUM|ANTAL|RITNINGSNUMMER|PROJEKTNUMMER|ORDERNR|AO|RUMSNAMN)\b/.test(text))return '';
 // Accept GS3, GS / 3, "WC GS3", "GS3 WC", "Dörrkort GS3" in header area.
 const gs=smartGSInHeader(text);if(gs)return gs;
 if(/(?:G[\s/_-]*S[\s/_-]*\d)/.test(text))return ''; // Two GS IDs or a malformed combination: never guess.
 const prefix=text.replace(/^(?:DÖRR(?:NUMMER|NR)?|LITTERA|POSITION|BETECKNING|OBJEKT(?:NR|NUMMER)?|DÖRRKORT|WC|ENTRÉ|ENTRE|ID)\s*[:#-]?\s+/i,'');
 if(prefix===text&&text.length>25)return '';
 return labStrictAnnotationCode(prefix);
}
function smartDoorCardSignals(raw,headerCodes=[]){
 const text=String(raw||'');
 const named=/(?:dörrkort|dorrkort|beslagskort|beslagsförteckning|dörrspecifikation|dorrspecifikation)/i.test(text);
 const heading=/(?:littera|dörrnummer|dorrnummer|dörrnr|dorrnr|antal)/i.test(text);
 const hardware=/(?:daglåsning|daglasning|nattlåsning|nattlasning|låshus|lashus|slutbleck|cylinder|trycke|beslag|styrbleck)/i.test(text);
 const controls=/(?:egenkontroll|besiktning|provning|kontrollpunkt|kontrollpunkter)/i.test(text);
 const gsCode=headerCodes.some(code=>/^GS\d/.test(code));
 const equipmentGroups=['låshus','lashus','slutbleck','cylinder','trycke','beslag','styrbleck','daglås','daglas','nattlås','nattlas'].filter(word=>text.toLowerCase().includes(word)).length;
 if(/\b(?:PLANRITNING|PLAN\s*RITNING|SKALA\s*1\s*:)\b/i.test(text)&&!named&&!controls&&!heading)return false;
 return (named&&(hardware||heading||controls))||
  (heading&&hardware&&(controls||/låsning|lasning/i.test(text)))||
  (gsCode&&hardware&&(controls||equipmentGroups>=2));
}

async function smartIndexDoorCardsFirst(){
 smartDoorCardIndex={};smartDoorCardPages=new Set();
 const uncertain=[];
 for(let p=1;p<=pdf.numPages;p++){
  setState('SmartMatch TEST v11: läser dörrkort sida '+p+' av '+pdf.numPages+'…');
  const page=await pdf.getPage(p);
  const text=await readPageText(p);
  const v=page.getViewport({scale:1});
  // A door card's ID belongs to the TOP identity area, not any GS in
  // the table of installer responsibilities or in the drawing legend.
  const top=text.items.filter(item=>item.y>=v.height*.66);
  const gsInTop=[...new Set(labHeaderRows({items:top}).map(smartGSInHeader).filter(Boolean))];
  const header=labDoorCardHeader(text).slice(0,10);
  const standard=[...new Set(header.map(smartHeaderCode).filter(Boolean))];
  const candidates=gsInTop.length?gsInTop:standard;
  const hasIdentity=candidates.length===1;
  // Strong physical door-card signal; GS identifiers and several hardware
  // items cannot on their own make a floor plan a door card.
  const hasStructuredCard=smartDoorCardSignals(text.raw,candidates);
  if(!hasStructuredCard)continue;
  if(!hasIdentity){uncertain.push({page:p,candidates});smartDoorCardPages.add(p);continue}
  const code=candidates[0],pages=smartDoorCardIndex[code]||[];
  pages.push(p);smartDoorCardIndex[code]=pages;
  smartDoorCardPages.add(p);
 }
 smartScanStats={
  cards:Object.values(smartDoorCardIndex).reduce((sum,pages)=>sum+pages.length,0),
  cardCodes:Object.keys(smartDoorCardIndex).length,
  gsCards:Object.keys(smartDoorCardIndex).filter(code=>code.startsWith('GS')).length,
  uncertainCardPages:uncertain,gsWithoutCard:{},
  gsAnnotationsSeen:0,gsAnnotationsLinked:0,
  annotationAccepted:0,annotationRejected:0,extraGraphic:0,linkedPositions:0
 };
 console.info('[SmartMatch TEST v11] door-card index',smartDoorCardIndex,uncertain);
 return smartDoorCardIndex;
}
function smartHasDoorCard(code){
 return !!(smartDoorCardIndex[String(code||'').toUpperCase()]||[]).length;
}

async function extractLabMarkedPositions(){
 const {PDFDocument,PDFName,PDFDict}=PDFLib;
 const doc=await PDFDocument.load(bytes.slice(),{ignoreEncryption:true,updateMetadata:false});
 const candidates=[];
 let annotationCodes=0,nonIdMarks=0;
 labUnreadableMarks=0;labSourceMarkCount=0;
 // The user's real technicianunderlag PDF contains true FreeText annotations
 // with exact /Contents (310a, 310b etc), yellow /C, and precise /Rect.
 // Using 'underlying page text' first loses real markers by reading a neighboring dimension.
 for(const [index,pg] of doc.getPages().entries()){
  const annots=pg.node.Annots();if(!annots)continue;
  for(let j=0;j<annots.size();j++){
   let dict;try{dict=annots.lookup(j,PDFDict)}catch(_){continue}
   if(!dict)continue;
   const subtype=decodePdfText(dict.get(PDFName.of('Subtype'))).replace('/','');
   if(!['Highlight','Stamp','Square','FreeText'].includes(subtype))continue;
   if(['Square','FreeText'].includes(subtype)&&!dict.get(PDFName.of('C'))&&!dict.get(PDFName.of('IC')))continue;
   const rect=rectFromAnnotation(dict);if(!rect)continue;
   labSourceMarkCount++;
   const own=decodePdfText(dict.get(PDFName.of('Contents')));
   const alternative=decodePdfText(dict.get(PDFName.of('Subj')));
   const named=decodePdfText(dict.get(PDFName.of('T')));
   const ownCode=labStrictAnnotationCode(own)||labStrictAnnotationCode(alternative)||labStrictAnnotationCode(named);
   let code=ownCode;
   if(!code){
    // FreeText labels with readable, NON-ID contents (e.g. "cyl" or an
    // explanatory note) must never accidentally become door positions.
    if(String(own||'').trim()||String(alternative||'').trim()){nonIdMarks++;continue}
    // Only fall back to underlying text when an annotation has no identity
    // metadata at all. 'GS ID'/'GS IDW' are placeholders, NOT door codes.
    const inside=await rawProjectStampText(index+1,rect);
    code=labStrictAnnotationCode(inside);
   }
   if(!code){labUnreadableMarks++;continue}
   if(code.startsWith('GS'))smartScanStats.gsAnnotationsSeen++;
   if(!smartHasDoorCard(code)){
    smartScanStats.annotationRejected++;
    if(code.startsWith('GS'))smartScanStats.gsWithoutCard[code]=(smartScanStats.gsWithoutCard[code]||0)+1;
   }else{
    smartScanStats.annotationAccepted++;
    if(code.startsWith('GS'))smartScanStats.gsAnnotationsLinked++;
   }
   if(ownCode)annotationCodes++;
   // PDF /Rect is the authoritative text-mark placement.
   candidates.push({page:index+1,code,rect,order:j,sourceKind:code.startsWith('GS')?'gs':'project-code',label:ownCode?String(own||code).trim():code,subtype,scanSource:ownCode?'annotation-metadata':'annotation-under-text'});
  }
 }
 // Different annotation objects remain DIFFERENT positions even when they
 // share a code or overlap. Only duplicate alternative scanner results are removed.
 const result=candidates.slice();
 setState('SmartMatch TEST v11: '+annotationCodes+' riktiga PDF-markeringar hittade; söker kompletterande färgmarkeringar…');
 const graphic=await extractLabGraphicPositions(result);
 console.info('[SmartMatch TEST v11 - annotations]',{readableAnnotations:annotationCodes,nonIdMarks,totalMarkerCodes:candidates.length,extraGraphicMarkers:graphic.length});
 return [...result,...graphic];
}

function labHeaderRows(text){
 const items=(text?.items||[]).slice().sort((a,b)=>b.y-a.y||a.x-b.x),rows=[];
 for(const item of items){
  let row=rows.find(r=>Math.abs(r.y-item.y)<=Math.max(2.4,Math.min(5,item.h*.45)));
  if(!row){row={y:item.y,items:[]};rows.push(row)}
  row.items.push(item);
 }
 return rows.sort((a,b)=>b.y-a.y).map(row=>row.items.sort((a,b)=>a.x-b.x).map(x=>x.text).join(' ').replace(/\s+/g,' ').trim()).filter(Boolean);
}
function labDoorCardHeader(text){
 const rows=labHeaderRows(text),ignore=/^(?:dörrkort|dorrkort|dörrspecifikation|dorrspecifikation|beslagslista|ritningsnummer|projektnummer|projektnr|upprättad|version|revision|rev\.?\s*\d|datum|sida\s*\d|page\s*\d|ritning\b)/i;
 return rows.filter(line=>!ignore.test(line)).slice(0,4);
}
function labHeaderMatch(code,lines){
 const rx=code.startsWith('GS')?codeRegex(code):projectStampRegex(code);
 if(!rx)return false;
 return lines.some(line=>{
  if(!rx.test(line))return false;
  // Dörrkort kan ha logga och projekthuvud. Beslagsrader är aldrig ett dörr-ID.
  if(/\b(?:slutbleck|elslutbleck|lås(?:hus|kista|cylinder)|låshus|cylinder|trycke|dörrstängare|dorrstangare|beslag|artikel(?:nr|nummer)?|produkt|material|antal|montering|kontrollpunkt|sensor|radar|gångjärn|gangjarn|karm|fabrikat|leverantör)\b/i.test(line))return false;
  if(/^(?:sida|page|rev|revision|datum|version|våning|ritningsnummer|projektnummer|projektnr)\b/i.test(line))return false;
  if(/^\d{1,6}$/.test(code)){
   return line.trim().toUpperCase()===code||/\b(?:DÖRR(?:NUMMER|NR)?|LITTERA|POSITION|BETECKNING|ID|WC)\b/i.test(line);
  }
  return true;
 });
}

/* TEST v4: Diagnose existing drawing-search decisions. Read only: no saved-data changes. */
function labDiagnosticCode(value){return String(value||'').toUpperCase().replace(/[^A-ZÅÄÖ0-9]/g,'').slice(0,16)}
function labDiagnosticPattern(code){
 const k=labDiagnosticCode(code);return k?new RegExp('(^|[^A-ZÅÄÖ0-9])'+k.split('').join('[^A-ZÅÄÖ0-9]*')+'($|[^A-ZÅÄÖ0-9])','i'):null;
}
function labDiagnosticTextHits(text,code,pageNo){
 const rx=labDiagnosticPattern(code),out=[];
 if(!rx)return out;
 for(const row of groupTextRowsForAutomation(text.items)){
  const cells=[...row.items].sort((a,b)=>a.x-b.x);
  for(let start=0;start<cells.length;start++){
   for(let end=start;end<Math.min(start+7,cells.length);end++){
    const part=cells.slice(start,end+1);if(!gsItemsCloseEnough(part))break;
    const raw=part.map(x=>x.text).join(' ').replace(/\s+/g,' ').trim();
    if(raw.length>65)break;
    if(!rx.test(raw))continue;
    const rect=rectForTextItems(part,1);if(!rect)break;
    const x=(rect[0]+rect[2])/2,y=(rect[1]+rect[3])/2;
    if(!out.some(h=>Math.abs(h.cx-x)<2.5&&Math.abs(h.cy-y)<2.5))
     out.push({page:pageNo,code,rect,cx:x,cy:y,raw,parsed:labCodeFromMark(raw)});
    break;
   }
  }
 }
 return out;
}
async function labDiagnosticColorForPage(group){
 const pg=await pdf.getPage(group[0].page),natural=pg.getViewport({scale:1});
 const scale=Math.max(.02,Math.min(1.2,Math.sqrt(2600000/Math.max(1,natural.width*natural.height)),2200/natural.width,2200/natural.height));
 const vp=pg.getViewport({scale});
 const canvas=document.createElement('canvas');
 canvas.width=Math.max(1,Math.ceil(vp.width));canvas.height=Math.max(1,Math.ceil(vp.height));
 const ctx=canvas.getContext('2d',{willReadFrequently:true});
 if(!ctx)return group.map(()=>null);
 try{
  await pg.render({canvasContext:ctx,viewport:vp}).promise;
  const bits=ctx.getImageData(0,0,canvas.width,canvas.height);
  return group.map(h=>labColorAtRect(bits,viewportRect(vp,h.rect)));
 }catch(e){console.warn('Diagnos färg sida '+group[0].page,e);return group.map(()=>null)}
 finally{canvas.width=canvas.height=0}
}
function labDiagnosticReason(h,code,cardPages){
 if(h.registered&&cardPages.length===1)return {level:'found',text:'Registrerad och kopplad till dörrkort'};
 if(h.registered&&cardPages.length>1)return {level:'found',text:'Registrerad – flera möjliga dörrkort'};
 if(h.registered)return {level:'error',text:'Registrerad men dörrkortets identifiering matchade inte'};
 if(h.parsed!==code)return {level:'error',text:'Texten delades upp: sökningen tolkade '+(h.parsed||'ingen kod')+' i stället för '+code};
 if(h.possibleDuplicate)return {level:'error',text:'Troligen bortsorterad som dubblett nära en annan position'};
 if(h.color===false)return {level:'error',text:'PDF-text finns men färgmarkeringen uppfyllde inte gränsvärdet'};
 if(h.color===true)return {level:'error',text:'PDF-text och färg finns – positionen registrerades ändå inte'};
 return {level:'error',text:'PDF-text finns, men färgavläsningen gick inte att kontrollera'};
}
function labDiagnosticOutline(vp){
 if(!labDiagnosticSpot||labDiagnosticSpot.page!==page)return;
 const r=viewportRect(vp,labDiagnosticSpot.rect);
 if(!Number.isFinite(r.left+r.top+r.width+r.height))return;
 const node=document.createElement('div');node.className='labDiagnosticFrame';
 node.style.left=r.left+'px';node.style.top=r.top+'px';
 node.style.width=Math.max(14,r.width)+'px';node.style.height=Math.max(14,r.height)+'px';
 el.markers.appendChild(node);
}
async function labDiagnosticGoTo(hit){
 document.getElementById('labDiagnosticDialog').close();
 labDiagnosticSpot={page:hit.page,rect:hit.rect};page=hit.page;
 await renderDrawing();
 const pg=await pdf.getPage(hit.page),r=viewportRect(pg.getViewport({scale}),hit.rect);
 el.viewer.scrollTo({left:Math.max(0,r.left+r.width/2-el.viewer.clientWidth/2),top:Math.max(0,r.top+r.height/2-el.viewer.clientHeight/2),behavior:'smooth'});
 renderMarkers();
}
async function labDiagnosticAnalyze(){
 const inp=document.getElementById('labDiagnosticCode'),summary=document.getElementById('labDiagnosticSummary');
 const list=document.getElementById('labDiagnosticResults'),button=document.getElementById('labDiagnosticRun');
 if(!pdf){summary.textContent='Öppna först en PDF-ritning.';return}
 const code=labDiagnosticCode(inp.value);if(!code){summary.textContent='Ange en beteckning, exempelvis 310A.';return}
 inp.value=code;button.disabled=true;list.replaceChildren();
 const seq=++labDiagnosticSequence,documentPdf=pdf;
 try{
  const rows=[],all=[...stamps,...projectStamps],marked=all.filter(x=>x.code===code);
  for(let p=1;p<=documentPdf.numPages;p++){
   if(seq!==labDiagnosticSequence||pdf!==documentPdf)return;
   summary.textContent='Undersöker text på sida '+p+' av '+documentPdf.numPages+'…';
   const text=await readPageText(p);
   if(looksLikeAutomationProtocolPage(text.raw)||likelyDoorCardPage(text))continue;
   rows.push(...labDiagnosticTextHits(text,code,p));
   if(rows.length>=500)break;
  }
  const used=new Set();
  for(const row of rows){
   row.marker=marked.find(m=>m.page===row.page&&gsPositionDuplicate([m],row.page,code,row.rect))||null;
   row.possibleDuplicate=!!row.marker&&used.has(row.marker);
   row.registered=!!row.marker&&!row.possibleDuplicate;
   if(row.registered)used.add(row.marker);
  }
  for(const m of marked)if(!used.has(m))rows.push({page:m.page,rect:m.rect,raw:m.label||code,parsed:code,marker:m,registered:true,annotation:true,color:null});
  const groups=new Map();
  for(const hit of rows)if(!hit.annotation){const g=groups.get(hit.page)||[];g.push(hit);groups.set(hit.page,g)}
  let p=0;
  for(const group of groups.values()){
   if(seq!==labDiagnosticSequence||pdf!==documentPdf)return;
   summary.textContent='Jämför färger: '+(++p)+' av '+groups.size+' sidor…';
   const colors=await labDiagnosticColorForPage(group);
   group.forEach((h,i)=>h.color=colors[i]);
  }
  const fromMap=protocolCandidates[code];
  const cardPages=Array.isArray(fromMap)?fromMap:Array.from({length:documentPdf.numPages},(_,i)=>i+1).filter(p=>labHeaderMatch(code,labDoorCardHeader(pageTexts[p]||{items:[]})));
  const located=rows.filter(h=>h.registered).length,missing=rows.length-located;
  const textSplit=rows.filter(h=>!h.registered&&h.parsed!==code).length;
  const noColor=rows.filter(h=>!h.registered&&h.color===false).length;
  summary.textContent=code+': '+rows.length+' möjliga förekomster i läsbar PDF-text/markeringar.\n'+located+' registrerade · '+missing+' inte registrerade · '+textSplit+' misstänkta textuppdelningar · '+noColor+' utan bekräftad färg.\nDörrkort: '+(cardPages.length?cardPages.join(', '):'ingen matchning i identifieringsraderna')+'.';
  if(!rows.length){
   const n=document.createElement('p');n.className='labDiagnosticIntro';n.textContent='Ingen läsbar '+code+' hittades i de sidor som tolkas som ritningar. En bildbaserad text går inte att felsöka utan bildtextigenkänning (OCR).';
   list.appendChild(n);return;
  }
  rows.sort((a,b)=>a.page-b.page||b.rect[1]-a.rect[1]||a.rect[0]-b.rect[0]);
  for(const [i,hit] of rows.slice(0,250).entries()){
   const status=labDiagnosticReason(hit,code,cardPages);
   const b=document.createElement('button');b.type='button';b.className='labDiagnosticHit';b.dataset.level=status.level;
   const title=document.createElement('b'),detail=document.createElement('span'),hint=document.createElement('small');
   title.textContent=(i+1)+'. Sida '+hit.page+' · '+status.text;
   detail.textContent='Text: '+hit.raw+' → '+(hit.parsed||'oläsbar')+(hit.annotation?' · PDF-markering':hit.color===true?' · färg hittad':hit.color===false?' · färg missad':' · färg okänd');
   hint.textContent='Visa platsen på ritningen';
   b.append(title,detail,hint);b.onclick=()=>labDiagnosticGoTo(hit).catch(console.error);list.appendChild(b);
  }
  if(rows.length>250){const more=document.createElement('p');more.textContent='Visar de första 250 av '+rows.length+' träffar.';list.appendChild(more)}
 }catch(e){console.error(e);summary.textContent='Felsökningen kunde inte slutföras: '+(e?.message||e)}
 finally{button.disabled=false}
}

async function buildProtocolMap(){
 protocolMap={};protocolCandidates={};
 // Card index is scanned BEFORE drawing positions; never match codes in
 // equipment tables, dimension text or arbitrary PDF page contents.
 for(const [code,pages] of Object.entries(smartDoorCardIndex)){
  protocolCandidates[code]=pages.slice();
  const manual=Number(labManualLinks[code]);
  if(pages.includes(manual))protocolMap[code]=manual;
  else if(pages.length===1)protocolMap[code]=pages[0];
 }
}
async function buildProjectStampMap(){/* Samma söklabbsmotor söker redan alla färgmarkerade koder. */}
function labState(code){
 return protocolMap[code]?'matched':(protocolCandidates[code]?.length>1?'ambiguous':'missing');
}
function renderLabStats(){
 // Sammanställningen visas direkt i Projektflödets vanliga positionsräknare och lista.
 // Ingen separat sökpanel eller andra arbetsytor.
}
function openLabChoices(position){
 const dialog=document.getElementById('labSelectDialog'),title=document.getElementById('labDialogTitle'),caption=document.getElementById('labDialogText'),choices=document.getElementById('labChoices');
 if(!dialog||!position)return;
 const code=position.code,pages=protocolCandidates[code]||[];
 title.textContent=code+' · välj dörrkort';
 caption.textContent=pages.length?'Beteckningen finns högst upp på dessa dörrkortsidor. Välj den korrekta sidan för '+code+'.':'Inget matchande dörrkort hittades i de fyra översta relevanta raderna. Positionen ligger kvar på ritningen.';
 choices.replaceChildren();
 for(const pageNo of pages){
  const button=document.createElement('button');button.type='button';button.textContent='Koppla '+code+' till dörrkort sida '+pageNo;
  button.onclick=async()=>{labManualLinks[code]=pageNo;protocolMap[code]=pageNo;protocolDefs={};dialog.close();await recalcAll();setState(code+' är nu kopplad till dörrkort på sida '+pageNo+' i Projektflöde test.')};
  choices.appendChild(button);
 }
 dialog.showModal();
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


function gsItemsCloseEnough(items){
 if(items.length<2)return true;
 const ordered=[...items].sort((a,b)=>a.x-b.x);
 for(let i=1;i<ordered.length;i++){
  const prev=ordered[i-1],next=ordered[i];
  const gap=next.x-(prev.x+Math.max(prev.w,1));
  const maxGap=Math.max(14,Math.max(prev.h,next.h)*2.8);
  if(gap>maxGap)return false;
 }
 return true;
}
function gsTextCandidatesFromItems(items){
 const rows=groupTextRowsForAutomation(items),out=[];
 rows.forEach((row,rowIndex)=>{
  const ordered=[...row.items].sort((a,b)=>a.x-b.x),seen=new Set();
  for(let start=0;start<ordered.length;start++){
   for(let end=start;end<Math.min(ordered.length,start+6);end++){
    const slice=ordered.slice(start,end+1);
    if(!gsItemsCloseEnough(slice))break;
    const joined=slice.map(x=>x.text).join(' ').replace(/\s+/g,' ').trim();
    if(!/[Gg][\s_-]*[Ss]/.test(joined))continue;
    const code=normalizeCode(joined);
    if(!code)continue;
    const key=code+'@'+Math.round(slice[0].x)+'@'+Math.round(slice[0].y);
    if(seen.has(key))continue;
    seen.add(key);
    const rect=rectForTextItems(slice,2.5);
    if(rect)out.push({code,rect,label:joined,rowIndex});
    break;
   }
  }
 });
 return out;
}
function likelyDoorCardPage(text){
 const raw=String(text?.raw||'').toLocaleLowerCase('sv');
 if(/dörrkort|dorrkort|beslagslista|dörrspecifikation|dorrspecifikation/.test(raw))return true;
 const workLines=groupLines(text?.items||[]).filter(line=>line.actionable).length;
 if(workLines>=2)return true;
 const standaloneGs=(text?.items||[]).filter(x=>/^GS$/i.test(String(x.text||'').trim())).length;
 const signals=['slutbleck','elslutbleck','trycke','låshus','lashus','cylinder','dörrstäng','dorrstang','monteras','levereras','ansvar'];
 const signalHits=signals.reduce((n,s)=>n+(raw.includes(s)?1:0),0);
 return standaloneGs>=2&&signalHits>=2;
}
function gsPositionDuplicate(list,pageNo,code,rect){
 const cx=(Number(rect[0])+Number(rect[2]))/2,cy=(Number(rect[1])+Number(rect[3]))/2;
 return list.some(o=>{
  if(o.page!==pageNo||o.code!==code||!Array.isArray(o.rect))return false;
  const ox=(Number(o.rect[0])+Number(o.rect[2]))/2,oy=(Number(o.rect[1])+Number(o.rect[3]))/2;
  const sx=Math.max(12,Math.abs(Number(rect[2])-Number(rect[0]))+Math.abs(Number(o.rect[2])-Number(o.rect[0])));
  const sy=Math.max(10,Math.abs(Number(rect[3])-Number(rect[1]))+Math.abs(Number(o.rect[3])-Number(o.rect[1])));
  return Math.abs(cx-ox)<=sx*.55&&Math.abs(cy-oy)<=sy*.55;
 });
}
async function extractTextGsStamps(existing=[]){
 const out=[];
 for(let p=1;p<=pdf.numPages;p++){
  const text=await readPageText(p);
  if(looksLikeAutomationProtocolPage(text.raw)||likelyDoorCardPage(text))continue;
  const candidates=gsTextCandidatesFromItems(text.items);
  candidates.forEach((candidate,index)=>{
   if(gsPositionDuplicate([...existing,...out],p,candidate.code,candidate.rect))return;
   out.push({page:p,code:candidate.code,rect:candidate.rect,order:100000+index,sourceKind:'gs-text',label:candidate.label});
  });
 }
 return out;
}

function compactAutomationText(value){return String(value||'').toLocaleLowerCase('sv').replace(/[^a-z0-9åäö]+/g,'')}
function automationModelFromText(value){
 const compact=compactAutomationText(value);
 const aliases={
  '11':['gezeemd','emdstandardarm'],'12':['gezeemdglidarm','emdglidarm'],'13':['faacstandard'],'14':['faacglidarm'],
  '15':['powerswing'],'16':['sw100'],'17':['ed200'],'18':['tormax'],'19':['recordstandardarm'],
  '20':['powerswingpardörr','powerswingpardorr'],'21':['tsa160'],'22':['recordglidarm'],'23':['gilgenfdc','fdc'],'24':['ed100'],
  '25':['besamsde','sde'],'26':['ditechissmonterad'],'27':['sr2000'],'28':['ove'],'29':['cd80'],
  '30':['cibeshissöppnare','cibeshissoppnare'],'31':['tsa160dubbeldörr','tsa160dubbeldorr'],'32':['ed180'],'33':['ecturn'],
  '34':['besamdhe','dhe'],'35':['pls100'],'36':['pls150'],'37':['ed250'],'38':['powerdrive'],
  '39':['ecdrive'],'40':['gezeslskjutdörr','gezeslskjutdorr'],'41':['faac930'],'42':['faaca140'],
  '43':['ts93brandstängning','ts93brandstangning'],'44':['dormats93','ts93'],'45':['sw300'],
  '46':['unislidedubbelflyglig'],'47':['unislideenkel flyglig','unislideenkel flyglig'.replace(/\s/g,'')],'48':['sl500']
 };
 for(const [code,name] of PROJECT_AUTOMATION_MODELS){
  const full=compactAutomationText(name);
  if(full&&compact.includes(full))return {code,name};
  if((aliases[code]||[]).some(a=>a&&compact.includes(compactAutomationText(a))))return {code,name};
 }
 return null;
}
function automationObjectNoFromItems(items,model){
 const text=items.map(x=>x.text).join(' ').replace(/\s+/g,' ').trim();
 const labelled=text.match(/\b(?:objektnr|objektnummer|objekt|id|märkning|markning|littera)\s*[:#-]?\s*([A-ZÅÄÖ]?\d{2,6}(?:[-/]\d{1,4})?(?:\s*[A-ZÅÄÖ])?)\b/i);
 if(labelled)return labelled[1].toUpperCase().replace(/\s+/g,' ').trim();
 const modelCompact=compactAutomationText(model?.name||'');
 const ordered=[...items].sort((a,b)=>a._distance-b._distance);
 for(const item of ordered){
  const t=String(item.text||'').trim();
  if(!t||/^DA$/i.test(t)||/dörr.?automatik/i.test(t)||compactAutomationText(t)&&modelCompact.includes(compactAutomationText(t)))continue;
  const m=t.match(/\b([A-ZÅÄÖ]?\d{2,6}(?:[-/]\d{1,4})?(?:\s*[A-ZÅÄÖ])?)\b/i);
  if(m)return m[1].toUpperCase().replace(/\s+/g,' ').trim();
 }
 return '';
}
function automationSerialFromText(value){
 const text=String(value||'');
 const labelled=text.match(/\b(?:antal|löpnummer|lopnummer|nr)\s*[:#-]?\s*(\d{1,6})\b/i);
 return labelled?String(Number(labelled[1])||1):'';
}
function automationProgressOf(o){
 const done=PROJECT_AUTOMATION_CHECKS.filter(([id])=>['ok','remark','na'].includes(o?.checks?.[id]?.result)).length;
 return Math.round(done/PROJECT_AUTOMATION_CHECKS.length*100);
}
function parseStructuredAutomationId(value){
 const text=String(value||'').toUpperCase();
 const matches=text.match(/\d{1,6}(?:\s*-\s*\d{1,6}){2,}/g)||[];
 for(const raw of matches){
  const parts=raw.split(/\s*-\s*/).filter(Boolean);
  if(parts.length<3)continue;
  const modelCode=String(Number(parts.at(-2))),serialNumber=String(Number(parts.at(-1)));
  const known=PROJECT_AUTOMATION_MODELS.find(([code])=>code===modelCode);
  if(!known||!Number(serialNumber))continue;
  const objectNo=parts.slice(0,-2).join('-');
  if(!objectNo)continue;
  return {fullId:[objectNo,modelCode,serialNumber].join('-'),objectNo,modelCode,model:known[1],serialNumber,matchText:raw};
 }
 return null;
}
function groupTextRowsForAutomation(items){
 const groups=[];
 [...items].sort((a,b)=>b.y-a.y||a.x-b.x).forEach(item=>{
  let group=groups.find(g=>Math.abs(g.y-item.y)<=Math.max(3,Math.min(6,item.h*.55)));
  if(!group){group={y:item.y,items:[]};groups.push(group)}
  group.items.push(item);
 });
 return groups.map(g=>{
  const row=[...g.items].sort((a,b)=>a.x-b.x);
  return {items:row,text:row.map(x=>x.text).join(' ').replace(/\s+/g,' ').trim()};
 });
}
function rectForTextItems(items,padding=5){
 if(!items?.length)return null;
 const left=Math.min(...items.map(x=>x.x)),right=Math.max(...items.map(x=>x.x+Math.max(x.w,1)));
 const bottom=Math.min(...items.map(x=>x.y-Math.max(x.h,1)*.35)),top=Math.max(...items.map(x=>x.y+Math.max(x.h,1)*.95));
 return [left-padding,bottom-padding,right+padding,top+padding];
}
function normalizedAutomationIdText(value){
 return String(value||'').toUpperCase().replace(/[–—]/g,'-').replace(/\s+/g,'');
}
function itemsForStructuredAutomationId(items,matchText){
 const target=normalizedAutomationIdText(matchText);
 if(!target)return [];
 const ordered=[...items].sort((a,b)=>a.x-b.x);
 let best=[];
 for(let start=0;start<ordered.length;start++){
  let combined='';
  for(let end=start;end<Math.min(ordered.length,start+12);end++){
   combined+=normalizedAutomationIdText(ordered[end].text);
   if(combined===target){
    const candidate=ordered.slice(start,end+1);
    if(!best.length||candidate.length<best.length)best=candidate;
    break;
   }
   if(!target.startsWith(combined))break;
  }
 }
 return best;
}
function looksLikeAutomationProtocolPage(raw){
 const t=String(raw||'').toLocaleLowerCase('sv');
 return /egenkontroll\s+d[oö]rrautomatik|checklista\s+revision\s+d[oö]rrautomatik|dokumentnr\s*:?\s*2519-1|kundrapport/.test(t);
}
async function discoverDoorAutomations(){
 const saved=loadSaved(),savedItems=Array.isArray(saved.automationItems)?saved.automationItems:[],savedByIdentity=new Map();
 savedItems.forEach(o=>{const key=automationDisplayId(o);if(key&&!savedByIdentity.has(key))savedByIdentity.set(key,o)});
 const found=[];

 for(let p=1;p<=pdf.numPages;p++){
  const text=await readPageText(p);
  if(looksLikeAutomationProtocolPage(text.raw))continue;

  const rows=groupTextRowsForAutomation(text.items);
  const occurrences=new Map();

  for(const row of rows){
   const parsed=parseStructuredAutomationId(row.text);
   if(!parsed)continue;

   const exactItems=itemsForStructuredAutomationId(row.items,parsed.matchText);
   if(!exactItems.length)continue;

   const rect=rectForTextItems(exactItems,2.5);
   if(!rect)continue;

   const identity=parsed.fullId;
   const occurrence=(occurrences.get(identity)||0)+1;
   occurrences.set(identity,occurrence);

   const id='automation@'+p+':'+identity+':'+occurrence;
   const old=savedItems.find(x=>x.id===id)||savedByIdentity.get(identity)||{};
   const item={
    id,
    page:p,
    rect,
    objectNo:old.objectNo??parsed.objectNo,
    modelCode:old.modelCode??parsed.modelCode,
    model:old.model??parsed.model,
    serialNumber:old.serialNumber??parsed.serialNumber,
    location:old.location||'',
    sourceText:row.text,
    checks:old.checks&&typeof old.checks==='object'?old.checks:{},
    notes:old.notes||'',
    progress:0,
    sourceKind:'structured-id'
   };
   item.progress=automationProgressOf(item);
   found.push(item);
  }
 }
 automationItems=found;
}
function selectedAutomation(){return automationItems.find(o=>o.id===selectedAutomationId)||null}
function automationDisplayId(o){
 const parts=[o?.objectNo,o?.modelCode,o?.serialNumber].filter(Boolean);
 return parts.length?parts.join('-'):(o?.objectNo||'Dörrautomatik');
}
function syncAutomationModelFromCode(o){
 const known=PROJECT_AUTOMATION_MODELS.find(([code,name])=>code===String(o.modelCode||'')||name.toLocaleLowerCase('sv')===String(o.model||'').toLocaleLowerCase('sv'));
 if(known){o.modelCode=known[0];o.model=known[1]}
}
function syncProjectMetaInputs(){
 el.projectName.value=projectMeta.projectName||'';el.projectFacility.value=projectMeta.facilityNo||'';el.projectOrder.value=projectMeta.order||'';
 el.projectDate.value=projectMeta.date||localProjectDate();el.projectNextDate.value=projectMeta.nextDate||'';
 el.projectCustomer.value=projectMeta.customer||'';el.projectAgreement.value=projectMeta.agreement||'';el.projectContact.value=projectMeta.contact||'';
 el.projectPhone.value=projectMeta.phone||'';el.projectAddress.value=projectMeta.address||'';el.projectPostalCode.value=projectMeta.postalCode||'';el.projectPostalCity.value=projectMeta.postalCity||'';
 el.projectCompany.value=projectMeta.company||'';el.projectCompanyContact.value=projectMeta.companyContact||'';el.projectCompanyPhone.value=projectMeta.companyPhone||'';
 el.projectCompanyAddress.value=projectMeta.companyAddress||'';el.projectCompanyPostalCode.value=projectMeta.companyPostalCode||'';el.projectCompanyPostalCity.value=projectMeta.companyPostalCity||'';
 el.projectTechnician.value=projectMeta.technician||'';el.projectSignature.value=projectMeta.signature||'';
 refreshProjectLogoPreview();
}
function refreshProjectLogoPreview(){
 el.projectLogoPreview.replaceChildren();
 if(projectLogoData){const img=document.createElement('img');img.src=projectLogoData;img.alt='Företagslogotyp';el.projectLogoPreview.appendChild(img)}
 el.projectLogoStatus.textContent=projectLogoData?'Logotyp inlagd och sparad för alla egenkontroller.':'Ingen logotyp vald.';
 el.projectLogoRemove.hidden=!projectLogoData;
}
async function prepareProjectLogoFile(file){
 if(!file||!file.type.startsWith('image/'))throw new Error('Välj en bildfil.');
 const data=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result||''));r.onerror=()=>reject(new Error('Kunde inte läsa bilden.'));r.readAsDataURL(file)});
 const img=await new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(new Error('Bildformatet kunde inte läsas. Prova PNG eller JPG.'));im.src=data});
 const maxW=1000,maxH=500,scale=Math.min(1,maxW/img.naturalWidth,maxH/img.naturalHeight),w=Math.max(1,Math.round(img.naturalWidth*scale)),h=Math.max(1,Math.round(img.naturalHeight*scale));
 const cv=document.createElement('canvas');cv.width=w;cv.height=h;const c=cv.getContext('2d');c.clearRect(0,0,w,h);c.drawImage(img,0,0,w,h);
 return cv.toDataURL('image/png');
}
function renderAutomationChecks(o){
 el.automationChecks.replaceChildren();
 PROJECT_AUTOMATION_CHECKS.forEach(([id,title])=>{
  const check=o.checks[id]||(o.checks[id]={result:'',note:''});
  const row=document.createElement('div');row.className='pwAutomationCheck '+(check.result?'result-'+check.result:'');
  const head=document.createElement('div');head.className='pwAutomationCheckHead';head.innerHTML='<strong>'+id+'</strong><span></span>';head.querySelector('span').textContent=title;
  const choices=document.createElement('div');choices.className='pwAutomationChoices';
  [['na','Ingår ej'],['ok','Klart utan anmärkning'],['remark','Klart med anmärkning']].forEach(([value,label])=>{
   const b=document.createElement('button');b.type='button';b.dataset.v=value;b.textContent=label;b.classList.toggle('active',check.result===value);
   b.onclick=()=>{check.result=value;if(value!=='remark')check.note='';o.progress=automationProgressOf(o);save();renderAutomationProtocol(o);renderAutomationMarkers();renderGroups()};
   choices.appendChild(b);
  });
  row.append(head,choices);
  if(check.result==='remark'){
   const fault=document.createElement('div');fault.className='pwAutomationFault';
   const faults=PROJECT_AUTOMATION_FAULTS[id]||[];
   const select=document.createElement('select');select.innerHTML='<option value="">Välj anmärkning…</option>';
   faults.forEach(v=>{const op=document.createElement('option');op.value=v;op.textContent=v;select.appendChild(op)});
   const custom=document.createElement('option');custom.value='__custom__';custom.textContent='✎ Beskriv själv…';select.appendChild(custom);
   const note=document.createElement('input');note.type='text';note.placeholder='Beskriv felet…';
   const back=document.createElement('button');back.type='button';back.className='pwAutomationFaultBack';back.textContent='‹';back.setAttribute('aria-label','Till färdiga anmärkningar');
   const known=faults.includes(check.note||'');select.value=known?check.note:'';note.value=known?'':(check.note||'');
   const showCustom=show=>{select.hidden=show;note.hidden=!show;back.hidden=!show};showCustom(!!check.note&&!known);
   select.onchange=()=>{
    if(select.value==='__custom__'){check.note='';note.value='';showCustom(true);requestAnimationFrame(()=>note.focus());save();return}
    check.note=select.value||'';save();
   };
   note.oninput=()=>{check.note=note.value;save()};
   note.onblur=()=>{check.note=note.value.trim();note.value=check.note;save()};
   back.onclick=()=>{check.note='';note.value='';select.value='';showCustom(false);save();select.focus()};
   fault.append(select,note,back);row.appendChild(fault);
  }
  el.automationChecks.appendChild(row);
 });
}
function renderAutomationProtocol(o){
 if(!o)return;
 syncAutomationModelFromCode(o);
 el.automationIdentity.textContent=[automationDisplayId(o),o.model].filter(Boolean).join(' · ')||'Dörrautomatik';
 el.automationModel.value=PROJECT_AUTOMATION_MODELS.some(([code])=>code===o.modelCode)?o.modelCode:'';
 el.automationSerial.value=o.serialNumber||'';el.automationId.value=o.objectNo||'';el.automationLocation.value=o.location||'';el.automationNotes.value=o.notes||'';
 o.progress=automationProgressOf(o);el.automationProgress.textContent=o.progress+'%';
 syncProjectMetaInputs();renderAutomationChecks(o);
}
function openAutomationProtocol(o){
 if(!o)return;selectedAutomationId=o.id;renderAutomationProtocol(o);el.automationDialog.showModal();
}
function closeAutomationProtocol(){if(el.automationDialog.open)el.automationDialog.close();selectedAutomationId=''}

function renderSelfcheckExportList(){
 el.selfcheckExportList.replaceChildren();
 if(!automationItems.length){const p=document.createElement('p');p.className='pwMuted';p.textContent='Inga dörrautomatiker hittades i projektet.';el.selfcheckExportList.appendChild(p)}
 automationItems.forEach(o=>{
  const label=document.createElement('label');label.className='pwSelfcheckExportRow';
  const input=document.createElement('input');input.type='checkbox';input.value=o.id;input.checked=o.progress===100;
  const text=document.createElement('span'),strong=document.createElement('strong'),small=document.createElement('small');
  strong.textContent=automationDisplayId(o);small.textContent=[o.model||'Typ ej avläst','Sida '+o.page,o.progress+'% klar'].join(' · ');
  text.append(strong,small);label.append(input,text);el.selfcheckExportList.appendChild(label);
  input.onchange=updateSelfcheckExportCount;
 });
 updateSelfcheckExportCount();
}
function updateSelfcheckExportCount(){
 const n=el.selfcheckExportList.querySelectorAll('input[type="checkbox"]:checked').length;
 el.selfcheckExportCount.textContent=n+' valda';el.selfcheckExportCreate.disabled=n===0;
}
function openSelfcheckExport(){
 if(!pdf)return;closeSaveMenu();renderSelfcheckExportList();el.selfcheckExportDialog.showModal();
}
function closeSelfcheckExport(){if(el.selfcheckExportDialog.open)el.selfcheckExportDialog.close()}
function safePdfName(value){return String(value||'dorrautomatik').replace(/[^a-zA-Z0-9åäöÅÄÖ_-]+/g,'-').replace(/^-+|-+$/g,'')||'dorrautomatik'}
function createAutomationSelfcheckPdf(o,options={}){
 const entries=options.entries||PROJECT_AUTOMATION_CHECKS,meta=options.meta||projectMeta,heading=options.title||'CHECKLISTA REVISION DÖRRAUTOMATIK';
 if(!window.jspdf?.jsPDF)throw new Error('PDF-generatorn kunde inte laddas.');
 const doc=new jspdf.jsPDF('p','mm','a4'),left=12,width=186;
 const txt=(value,x,y,size=8,bold=false,color=[25,40,48],opts)=>{doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(size);doc.setTextColor(...color);doc.text(String(value||''),x,y,opts||{})};
 const addLogo=(x,y,w,h)=>{if(!projectLogoData)return;try{const im=doc.getImageProperties(projectLogoData),pad=2.5,sc=Math.min((w-pad*2)/im.width,(h-pad*2)/im.height),iw=im.width*sc,ih=im.height*sc;doc.addImage(projectLogoData,x+(w-iw)/2,y+(h-ih)/2,iw,ih)}catch(_){}};
 const cell=(label,value,x,y,w,h=7,bold=false,signature=false)=>{doc.setFillColor(252,252,252);doc.setDrawColor(150,150,150);doc.setLineWidth(.2);doc.rect(x,y,w,h,'FD');doc.setFont('helvetica','bold');doc.setFontSize(7.4);doc.setTextColor(82,82,82);const lw=Math.min(w-7,doc.getTextWidth(label)+2.2);doc.text(label,x+1.5,y+h/2+1);if(String(value||'')){doc.setFont('helvetica',signature?'italic':(bold?'bold':'normal'));doc.setFontSize(signature?9.1:8.5);doc.setTextColor(...(signature?[70,125,165]:[20,20,20]));doc.text(doc.splitTextToSize(String(value),Math.max(5,w-lw-3)).slice(0,1),x+1.5+lw,y+h/2+1)}};
 const mark=(kind,cx,cy)=>{doc.setTextColor(20,20,20);if(kind==='na'){doc.setFont('helvetica','bold');doc.setFontSize(7);doc.text('-',cx,cy+1,{align:'center'});return}doc.setFont('zapfdingbats','normal');doc.setFontSize(10.2);doc.text(String.fromCharCode(kind==='remark'?53:51),cx,cy+1.2,{align:'center'})};
 doc.setDrawColor(55,55,55);doc.setLineWidth(.22);doc.rect(left,8,width,18);addLogo(left,8,58,18);doc.line(left+58,8,left+58,26);
 txt(options.title?'EGENKONTROLL':'Dokumentnr: 2519-1',left+61,12.4,7.8,true,[25,25,25]);
 txt(heading.toLocaleUpperCase('sv').slice(0,65),left+58+(width-58)/2,18.7,options.title?Math.min(11.9,Math.max(7.1,115/Math.max(1,heading.length))):11.9,true,[25,25,25],{align:'center'});
 txt('PROJEKT',left+1.5,36.7,11.4,true,[25,25,25]);let y=40;
 cell('Bokat datum:',meta.date,left,y,93);cell('Nästa provning:',meta.nextDate,left+93,y,93);y+=7;
 cell('ANLÄGGNING:',meta.projectName,left,y,93,7,true);cell('Anläggningsnr:',meta.facilityNo,left+93,y,93,7,true);y+=7;
 cell('SERVICEFÖRETAG:',meta.company,left,y,93,7,true);cell('BESTÄLLARE / KUND:',meta.customer,left+93,y,93,7,true);y+=7;
 cell('Kontaktperson på objektet:',meta.companyContact,left,y,93);cell('Kontaktperson:',meta.contact,left+93,y,93);y+=7;
 cell('Telefon:',meta.companyPhone,left,y,93);cell('Telefon:',meta.phone,left+93,y,93);y+=7;
 cell('Adress:',meta.companyAddress,left,y,93);cell('Adress:',meta.address,left+93,y,93);y+=7;
 cell('Postnummer / Postadress:',[meta.companyPostalCode,meta.companyPostalCity].filter(Boolean).join(' '),left,y,93);cell('Postnummer / Postadress:',[meta.postalCode,meta.postalCity].filter(Boolean).join(' '),left+93,y,93);y+=7;
 cell('ID / märkning:',automationDisplayId(o),left,y,54,8,true);cell(options.equipmentLabel||'Typ av automatik:',o.model||o.modelCode,left+54,y,66,8,true);cell('AO nummer:',meta.order,left+120,y,66,8,true);y+=8;
 cell('Placering / Dörrlittra:',o.location,left,y,93,8);cell('Utförd av / tekniker:',meta.technician,left+93,y,93,8,true);y+=10;
 const ws=[9,101,14,21,25,16],titles=['Nr','Benämning / kontrollpunkt','Ingår ej','Klart utan\nanmärkning','Klart med\nanmärkning','Signatur'];let x=left;
 titles.forEach((t,i)=>{doc.setFillColor(...(i===1?[226,226,226]:[238,238,238]));doc.setDrawColor(120,120,120);doc.rect(x,y,ws[i],10,'FD');doc.setFont('helvetica','bold');doc.setFontSize(i>1?6.8:8);doc.setTextColor(35,35,35);const lines=t.split('\n'),hy=lines.length===1?y+6.2:y+4.15;if(i===1)doc.text(lines,x+2,hy,{lineHeightFactor:1});else doc.text(lines,x+ws[i]/2,hy,{align:'center',lineHeightFactor:1});x+=ws[i]});y+=10;
 const notesReserve=30,rowH=Math.max(6.15,Math.min(7.8,(270-y-notesReserve)/Math.max(1,entries.length)));
 entries.forEach(([id,title])=>{
  if(y+rowH>260){
   doc.addPage();y=18;txt(heading+' · fortsättning',left,12,9,true,[25,40,48]);y=19;
   let tx=left;titles.forEach((t,i)=>{doc.setFillColor(...(i===1?[226,226,226]:[238,238,238]));doc.setDrawColor(120,120,120);doc.rect(tx,y,ws[i],10,'FD');doc.setFont('helvetica','bold');doc.setFontSize(i>1?6.8:8);doc.setTextColor(35,35,35);const rows=t.split('\n');doc.text(rows, i===1?tx+2:tx+ws[i]/2, y+(rows.length>1?4.15:6.2),{align:i===1?'left':'center',lineHeightFactor:1});tx+=ws[i]});y+=10;
  }
  const check=o.checks?.[id]||{};let xx=left;const vals=[id,title,'','','',meta.signature||''];
  vals.forEach((v,i)=>{doc.setFillColor(...(i===1?[248,248,248]:[255,255,255]));doc.setDrawColor(145,145,145);doc.rect(xx,y,ws[i],rowH,'FD');
   if(i===1){const titleSize=rowH<7?6.8:7.4,lines=doc.splitTextToSize(title,ws[i]-4).slice(0,2),step=rowH<7?2.4:2.7,startY=y+rowH/2-((lines.length-1)*step)/2+.7;doc.setFont('helvetica','normal');doc.setFontSize(titleSize);doc.setTextColor(25,25,25);doc.text(lines,xx+1.7,startY,{lineHeightFactor:1})}
   else if(i===2&&check.result==='na')mark('na',xx+ws[i]/2,y+rowH/2);
   else if(i===3&&check.result==='ok')mark('ok',xx+ws[i]/2,y+rowH/2);
   else if(i===4&&check.result==='remark')mark('remark',xx+ws[i]/2,y+rowH/2);
   else if(i===5&&String(v||'')){doc.setFont('times','italic');doc.setFontSize(8.8);doc.setTextColor(55,112,165);doc.text(String(v),xx+ws[i]/2,y+rowH/2+1.15,{align:'center',maxWidth:ws[i]-2})}
   else if(i===0){doc.setFont('helvetica','bold');doc.setFontSize(7.7);doc.setTextColor(25,25,25);doc.text(String(v||''),xx+ws[i]/2,y+rowH/2+1,{align:'center'})}
   xx+=ws[i];
  });
  if(options.title&&!check.result){doc.setFont('helvetica','normal');doc.setFontSize(6.8);doc.setTextColor(100,114,123);doc.text('Ej kontrollerad',left+9+101+(14+21+25)/2,y+rowH/2+1,{align:'center'})}
  y+=rowH;
 });
 y+=3;if(y+22>276){doc.addPage();y=21}doc.setFillColor(238,238,238);doc.setDrawColor(130,130,130);doc.rect(left,y,width,6,'FD');txt('ALLMÄN INFO / ANMÄRKNING',left+2,y+4.2,8.2,true,[55,55,55]);y+=6;
 const issueText=[...entries.flatMap(([id,title])=>{const c=o.checks?.[id];return c?.result==='remark'?[id+' – '+(c.note?.trim()||title)]:[]}),o.notes].filter(Boolean).join('  ·  ');
 const boxH=Math.max(12,276-y);doc.setFillColor(255,255,255);doc.setDrawColor(145,145,145);doc.rect(left,y,width,boxH,'FD');
 if(issueText){doc.setFont('helvetica','normal');doc.setFontSize(8.3);doc.setTextColor(35,35,35);doc.text(doc.splitTextToSize(issueText,width-7).slice(0,12),left+3,y+5,{lineHeightFactor:1.1})}
 const pageCount=doc.internal.getNumberOfPages();for(let n=1;n<=pageCount;n++){doc.setPage(n);doc.setDrawColor(204,215,223);doc.line(left,284,198,284);txt([meta.company,meta.projectName||meta.facilityNo].filter(Boolean).join(' · ')||'Tillsyno',left,289,7,false,[89,110,123]);txt('Sida '+n+' av '+pageCount,177,289,7,false,[89,110,123])}
 return doc;
}

async function renderAutomationCustomerPreview(){
 if(!automationPreviewPdf)return;
 if(automationPreviewRenderTask)try{automationPreviewRenderTask.cancel()}catch(_){}
 const pg=await automationPreviewPdf.getPage(1),natural=pg.getViewport({scale:1});
 const width=Math.max(280,el.automationPreviewWrap.clientWidth-20),previewScale=Math.max(.55,Math.min(2.1,width/natural.width));
 const vp=pg.getViewport({scale:previewScale}),canvas=el.automationPreviewCanvas,ctx=canvas.getContext('2d');
 const dpr=Math.min(2,window.devicePixelRatio||1);
 canvas.width=Math.ceil(vp.width*dpr);canvas.height=Math.ceil(vp.height*dpr);canvas.style.width=vp.width+'px';canvas.style.height=vp.height+'px';
 ctx.setTransform(dpr,0,0,dpr,0,0);
 automationPreviewRenderTask=pg.render({canvasContext:ctx,viewport:vp});
 try{await automationPreviewRenderTask.promise}catch(err){if(err?.name!=='RenderingCancelledException')throw err}
}
async function openAutomationCustomerPreview(){
 const o=selectedAutomation();if(!o)return;
 try{
  const doc=createAutomationSelfcheckPdf(o),arrayBuffer=doc.output('arraybuffer');
  if(automationPreviewPdf)try{await automationPreviewPdf.destroy()}catch(_){}
  automationPreviewPdf=await pdfjsLib.getDocument({data:new Uint8Array(arrayBuffer)}).promise;
  el.automationPreviewTitle.textContent=[automationDisplayId(o),o.model].filter(Boolean).join(' · ');
  el.automationPreviewDialog.querySelector('.pwAutomationHead strong').textContent='Checklista revision dörrautomatik';
  el.automationPreviewDialog.showModal();
  requestAnimationFrame(()=>renderAutomationCustomerPreview().catch(console.error));
 }catch(err){console.error(err);setState('Kundmallen kunde inte visas: '+(err?.message||err))}
}
async function closeAutomationCustomerPreview(){
 if(el.automationPreviewDialog.open)el.automationPreviewDialog.close();
 if(automationPreviewRenderTask)try{automationPreviewRenderTask.cancel()}catch(_){}
 automationPreviewRenderTask=null;
 if(automationPreviewPdf)try{await automationPreviewPdf.destroy()}catch(_){}
 automationPreviewPdf=null;
}
async function exportSelectedSelfchecks(){
 const ids=[...el.selfcheckExportList.querySelectorAll('input[type="checkbox"]:checked')].map(x=>x.value),selected=automationItems.filter(o=>ids.includes(o.id));
 if(!selected.length)return;
 el.selfcheckExportCreate.disabled=true;setState('Skapar '+selected.length+' egenkontroll-PDF…');
 try{
  const files=selected.map(o=>{const doc=createAutomationSelfcheckPdf(o),blob=doc.output('blob'),name='Checklista-revision-'+safePdfName(automationDisplayId(o))+'.pdf';return new File([blob],name,{type:'application/pdf'})});
  if(navigator.share&&(!navigator.canShare||navigator.canShare({files}))){
   try{await navigator.share({title:'Checklista revision dörrautomatik',files});setState(files.length+' egenkontroller klara.');closeSelfcheckExport();return}catch(err){if(err?.name==='AbortError'){setState('Exporten avbröts.');return}}
  }
  files.forEach((file,i)=>setTimeout(()=>downloadProjectFile(file),i*120));
  setState(files.length+' egenkontroller skapade som separata PDF-filer.');closeSelfcheckExport();
 }catch(err){console.error(err);setState('Egenkontrollerna kunde inte skapas: '+(err?.message||err))}
 finally{el.selfcheckExportCreate.disabled=false}
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
// Projektflöde test: Kryssrutor ska endast komma från faktiska GS-arbetsrader i dörrkortet.
// DT-beslag, littera/antal, tomma celler och enbart streck är inte arbetsmoment.
function labGsWorkItem(line){
 const original=String(line?.text||'').replace(/\s+/g,' ').trim();
 if(!original)return null;
 const gsTag=/(^|[^A-ZÅÄÖ0-9])G[\s/_-]*S(?=$|[^A-ZÅÄÖ0-9])/i;
 const dtTag=/(^|[^A-ZÅÄÖ0-9])D[\s/_-]*T(?=$|[^A-ZÅÄÖ0-9])/i;
 if(!gsTag.test(original)||dtTag.test(original))return null;
 if(line.administrative)return null;
 const withoutGs=original.replace(gsTag,' ').trim();
 if(/(?:^|[\s:;])[-–—]\s*$/.test(withoutGs))return null;
 const detail=withoutGs.replace(/^[\s:;,\-–—]+|[\s:;,\-–—]+$/g,'').trim();
 if(!detail||/^(?:[-–—.]+|ej\s+aktuellt|ingår\s+ej)$/i.test(detail))return null;
 if(!/[A-ZÅÄÖ]/i.test(detail))return null;
 // Ingen kryssruta för tabellhuvud eller identifieringsfält.
 if(/\b(?:littera|antal|dörr(?:nummer|nr)?|dörrkort|beslagslista|ritningsnummer|projektnummer|projektnr|anläggning|anlaggning|adress|telefon|datum|revision|version|sidnr|sida)\b/i.test(detail))return null;
 const parts=detail.match(/^(.+?)\s+(?=(?:\d|standard\b|typ\b|modell\b))/i);
 const label=parts?parts[1].trim():detail;
 const value=parts?detail.slice(parts[0].length).trim():'';
 if(!label||!/[\p{L}]/u.test(label))return null;
 if(value&&/^(?:[-–—.]+)$/.test(value))return null;
 return {...line,label,value,actionable:true};
}
async function protocolDef(code){
 const pageNo=protocolMap[code];if(!pageNo)return null;
 const key=code+'@'+pageNo;if(protocolDefs[key])return protocolDefs[key];
 const text=await readPageText(pageNo),lines=groupLines(text.items);
 const filtered=lines.map(labGsWorkItem).filter(Boolean);
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
 labManualLinks=saved.labManualLinks&&typeof saved.labManualLinks==='object'?{...saved.labManualLinks}:{};
 projectMeta=normalizeProjectMeta(saved.projectMeta);projectLogoData=String(saved.projectLogoData||'');
 automationItems=Array.isArray(saved.automationItems)?saved.automationItems.map(o=>({...o,checks:o.checks&&typeof o.checks==='object'?o.checks:{},progress:Number(o.progress||0)})):[];
 stamps.sort((a,b)=>a.page-b.page||b.rect[1]-a.rect[1]||a.rect[0]-b.rect[0]);
 projectStamps.sort((a,b)=>a.page-b.page||b.rect[1]-a.rect[1]||a.rect[0]-b.rect[0]);
 const gsInstances=stamps.map((s,index)=>{
  const countKey='gs|'+s.code;counts[countKey]=(counts[countKey]||0)+1;
  const id=s.code+'@'+s.page+':'+s.order+':'+index,old=saved.instances?.[id]||{};
  return {...s,sourceKind:'gs',id,position:counts[countKey],checks:old.checks||{},overrides:old.overrides||{},customItems:Array.isArray(old.customItems)?old.customItems:[],progress:Number(old.progress||0)};
 });
 const freeInstances=projectStamps.map((s,index)=>{
  const countKey='project-code|'+s.code;counts[countKey]=(counts[countKey]||0)+1;
  const id='doorcode:'+s.code+'@'+s.page+':'+s.order+':'+index,old=saved.instances?.[id]||{};
  return {...s,sourceKind:'project-code',id,position:counts[countKey],checks:old.checks||{},overrides:old.overrides||{},customItems:Array.isArray(old.customItems)?old.customItems:[],progress:Number(old.progress||0)};
 });
 instances=[...gsInstances,...freeInstances].sort((a,b)=>a.page-b.page||b.rect[1]-a.rect[1]||a.rect[0]-b.rect[0]);
 const totals={};
 instances.forEach(o=>{const key=o.sourceKind+'|'+o.code;totals[key]=(totals[key]||0)+1});
 instances.forEach(o=>o.totalOfCode=totals[o.sourceKind+'|'+o.code]);
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
function matchedProjectInstances(){return instances.filter(o=>(protocolCandidates[o.code]||[]).length>0)}
async function recalcAll(){for(const o of instances)await recalc(o);save();updateStats();renderGroups();renderMarkers()}
function updateStats(){
 const matched=matchedProjectInstances();
 el.positionCount.textContent=matched.length;
 el.matchedCount.textContent=matched.filter(o=>!!protocolMap[o.code]).length;
 el.doneCount.textContent=matched.filter(o=>o.progress===100).length;
 const trackable=matched.filter(o=>(Number(o.workItemCount)||0)>0);
 const totalMinutes=trackable.reduce((a,o)=>a+Math.max(0,Number(o.estimatedMinutes)||0),0);
 const doneMinutes=trackable.reduce((a,o)=>a+Math.max(0,Number(o.doneMinutes)||0),0);
 const allDone=trackable.length>0&&trackable.every(o=>o.progress===100);
 let progress;
 if(totalMinutes>0)progress=allDone?100:Math.min(99,Math.max(0,Math.round(doneMinutes/totalMinutes*100)));
 else progress=trackable.length?Math.round(trackable.reduce((a,o)=>a+o.progress,0)/trackable.length):0;
 el.totalProgress.textContent=progress+'%';renderLabStats();

}
function renderDrawing(){
 if(!pdf)return Promise.resolve();
 const version=++drawingRenderVersion,documentPdf=pdf,pageNumber=page,targetScale=scale;
 if(renderTask)try{renderTask.cancel()}catch(_){}
 drawingRenderQueue=drawingRenderQueue.catch(()=>{}).then(async()=>{
  if(version!==drawingRenderVersion)return;
  const pg=await documentPdf.getPage(pageNumber);if(version!==drawingRenderVersion)return;
  const vp=pg.getViewport({scale:targetScale}),natural=pg.getViewport({scale:1});
  // Marker and note coordinates use the full logical viewport; only pixels are capped.
  const raster=pg.getViewport({scale:Math.min(targetScale,Math.sqrt(DRAWING_MAX_PIXELS/(natural.width*natural.height)),DRAWING_MAX_SIDE/natural.width,DRAWING_MAX_SIDE/natural.height)});
  const width=Math.ceil(raster.width),height=Math.ceil(raster.height);
  if(!drawingRaster||drawingRaster.document!==documentPdf||drawingRaster.page!==pageNumber||drawingRaster.width!==width||drawingRaster.height!==height){
   const nextCanvas=document.createElement('canvas');nextCanvas.width=width;nextCanvas.height=height;
   const task=pg.render({canvasContext:nextCanvas.getContext('2d'),viewport:raster});renderTask=task;
   try{await task.promise}catch(e){if(e?.name==='RenderingCancelledException')return;throw e}finally{if(renderTask===task)renderTask=null}
   if(version!==drawingRenderVersion)return;
   el.canvas.width=width;el.canvas.height=height;ctx.drawImage(nextCanvas,0,0);nextCanvas.width=nextCanvas.height=0;
   drawingRaster={document:documentPdf,page:pageNumber,width,height};
  }
  el.canvas.style.width=vp.width+'px';el.canvas.style.height=vp.height+'px';
  el.stage.style.width=vp.width+'px';el.stage.style.height=vp.height+'px';
  el.pageInfo.textContent='Sida '+pageNumber+' / '+documentPdf.numPages;el.zoomInfo.textContent=Math.round(targetScale*100)+'%';
  renderDrawingNotes(vp);renderMarkers();renderAutomationMarkers();

 });
 return drawingRenderQueue;
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
 matchedProjectInstances().filter(o=>o.page===page).forEach(o=>bulkSelected.add(o.id));
 updateBulkBar();renderMarkers();
}
function beginBulkDrag(e){
 if(!bulkSelectMode||!pdf||e.pointerType!=='mouse'||e.button!==0||e.target.closest?.('.pwStampHit,.pwAutomationMarker'))return false;
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
 matchedProjectInstances().filter(o=>o.page===page).forEach(o=>{
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
 let saved=[];try{saved=JSON.parse(labStorage.getItem('tillsyno-project-time-custom-v1')||'[]')}catch(_){}
 if(!Array.isArray(saved))return [];
 return saved.map(x=>({
  key:String(x?.key||''),
  label:String(x?.label||'').trim(),
  minutes:Math.max(0,Number(x?.minutes)||0),
  terms:Array.isArray(x?.terms)?x.terms.map(v=>String(v||'').trim().toLocaleLowerCase('sv')).filter(Boolean):[]
 })).filter(x=>x.key&&x.label);
}
function saveCustomTimeCategories(list){
 try{labStorage.setItem('tillsyno-project-time-custom-v1',JSON.stringify(list))}catch(_){}
}
function allTimeCategoryDefs(){
 return [
  ...loadCustomTimeCategories().map(x=>({...x,custom:true})),
  ...TIME_CATEGORY_DEFS.map(x=>({...x,custom:false}))
 ];
}
function loadTimeSettings(){
 let saved={};try{saved=JSON.parse(labStorage.getItem('tillsyno-project-time-estimates-v1')||'{}')}catch(_){}
 const out={};TIME_CATEGORY_DEFS.forEach(d=>out[d.key]=Number.isFinite(Number(saved[d.key]))?Math.max(0,Number(saved[d.key])):d.minutes);
 return out;
}
function saveTimeSettings(settings){
 try{labStorage.setItem('tillsyno-project-time-estimates-v1',JSON.stringify(settings))}catch(_){}
}
function loadDisabledTimeCategories(){
 let saved=[];try{saved=JSON.parse(labStorage.getItem('tillsyno-project-time-disabled-v1')||'[]')}catch(_){}
 return new Set(Array.isArray(saved)?saved:[]);
}
function saveDisabledTimeCategories(set){
 try{labStorage.setItem('tillsyno-project-time-disabled-v1',JSON.stringify([...set]))}catch(_){}
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
 const renderPage=page,pageItems=matchedProjectInstances().filter(o=>o.page===renderPage);
 pdf.getPage(renderPage).then(pg=>{
  if(renderPage!==page)return;
  const vp=pg.getViewport({scale});
  pageItems.forEach(o=>{
   const r=viewportRect(vp,o.rect);
   if(!Number.isFinite(r.left+r.top+r.width+r.height)||r.width<=0||r.height<=0)return;
   const btn=document.createElement('button');btn.type='button';btn.className='pwStampHit';btn.dataset.progress=String(o.progress||0);btn.dataset.match=labState(o.code);if(o.id===selectedId)btn.classList.add('selected');if(bulkSelected.has(o.id))btn.classList.add('bulkSelected');
   btn.style.left=r.left+'px';btn.style.top=r.top+'px';btn.style.width=Math.max(10,r.width)+'px';btn.style.height=Math.max(10,r.height)+'px';
   btn.title=o.code+' · position '+o.position+' av '+o.totalOfCode+(protocolMap[o.code]?' · dörrkort sida '+protocolMap[o.code]:' · '+(labState(o.code)==='ambiguous'?'välj dörrkort':'ingen dörrkortsträff'))+' · '+o.progress+'%';
   btn.setAttribute('aria-label',btn.title);
   if(o.progress>0){const badge=document.createElement('span');badge.className='pwProgressBadge';badge.textContent=o.progress+'%';btn.appendChild(badge)}
   btn.onclick=e=>{e.preventDefault();e.stopPropagation();if(bulkSelectMode)toggleBulkInstance(o);else if(protocolMap[o.code])openProtocol(o);else openLabChoices(o)};
   el.markers.appendChild(btn);
  });
  labDiagnosticOutline(vp);
 }).catch(console.error);
}
function renderAutomationMarkers(){
 el.automationMarkers.replaceChildren();if(!PROJECT_AUTOMATION_ENABLED||!pdf)return;
 const renderPage=page,pageItems=automationItems.filter(o=>o.page===renderPage);
 pdf.getPage(renderPage).then(pg=>{
  if(renderPage!==page)return;
  const vp=pg.getViewport({scale});
  pageItems.forEach(o=>{
   const r=viewportRect(vp,o.rect);
   if(!Number.isFinite(r.left+r.top+r.width+r.height)||r.width<=0||r.height<=0)return;
   const btn=document.createElement('button');btn.type='button';btn.className='pwAutomationMarker structured';btn.dataset.progress=String(o.progress||0);
   btn.style.left=r.left+'px';btn.style.top=r.top+'px';btn.style.width=Math.max(16,r.width)+'px';btn.style.height=Math.max(14,r.height)+'px';
   btn.title='Egenkontroll · '+automationDisplayId(o)+(o.model?' · '+o.model:'')+' · '+o.progress+'%';
   btn.setAttribute('aria-label',btn.title);
   const badge=document.createElement('span');badge.textContent=o.progress===100?'✓':'EK';btn.appendChild(badge);
   btn.onclick=e=>{e.preventDefault();e.stopPropagation();if(!bulkSelectMode)openAutomationProtocol(o)};
   el.automationMarkers.appendChild(btn);
  });
 }).catch(console.error);
}
function renderGroups(){
 const groups={};
 matchedProjectInstances().filter(o=>!currentOnly||o.page===page).forEach(o=>(groups[o.code]??=[]).push(o));
 const visibleAutomations=PROJECT_AUTOMATION_ENABLED?automationItems.filter(o=>!currentOnly||o.page===page):[];
 el.groups.replaceChildren();
 const codes=Object.keys(groups).sort((a,b)=>a.localeCompare(b,'sv',{numeric:true}));
 if(!codes.length&&!visibleAutomations.length){const p=document.createElement('p');p.className='pwMuted';p.textContent=currentOnly?'Inga projektpositioner på den här sidan.':'Inga projektpositioner hittades.';el.groups.appendChild(p);return}
 if(visibleAutomations.length){
  const wrap=document.createElement('section');wrap.className='pwGroup pwAutomationGroup';
  const title=document.createElement('div');title.className='pwGroupTitle';title.innerHTML='<strong>DA · Egenkontroller</strong><span>'+visibleAutomations.length+' automatiker</span>';wrap.appendChild(title);
  const list=document.createElement('div');list.className='pwGroupItems';
  visibleAutomations.forEach(o=>{
   const b=document.createElement('button');b.type='button';b.className='pwPosition pwAutomationPosition';
   const left=document.createElement('span'),strong=document.createElement('strong'),small=document.createElement('small'),pct=document.createElement('b');
   strong.textContent=automationDisplayId(o);small.textContent='Sida '+o.page+(o.model?' · '+o.model:' · typ ej avläst');pct.textContent=o.progress+'%';
   left.append(strong,small);b.append(left,pct);b.onclick=()=>openAutomationProtocol(o);list.appendChild(b);
  });
  wrap.appendChild(list);el.groups.appendChild(wrap);
 }
 codes.forEach(code=>{
  const wrap=document.createElement('section');wrap.className='pwGroup';
  const title=document.createElement('div');title.className='pwGroupTitle';
  const strong=document.createElement('strong');strong.textContent=code;
  const span=document.createElement('span');span.textContent=groups[code].length+' positioner · '+(protocolMap[code]?'dörrkort ✓':labState(code)==='ambiguous'?'välj dörrkort':'saknar dörrkort');
  title.append(strong,span);wrap.appendChild(title);
  const list=document.createElement('div');list.className='pwGroupItems';
  groups[code].forEach(o=>{
   const b=document.createElement('button');b.type='button';b.className='pwPosition';
   const left=document.createElement('span'),s=document.createElement('strong'),small=document.createElement('small'),pct=document.createElement('b');
   s.textContent=code+' · position '+o.position+' av '+o.totalOfCode;small.textContent='Ritning sida '+o.page+(protocolMap[code]?' · dörrkort sida '+protocolMap[code]:' · '+(labState(code)==='ambiguous'?'flera möjliga dörrkort':'ingen säker dörrkortskoppling'));pct.textContent=o.progress+'%';
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
async function smartMergeDrawingWithCards(drawingFile,cardsFile){
 const doc=await PDFLib.PDFDocument.create();
 for(const file of [drawingFile,cardsFile]){
  const input=await PDFLib.PDFDocument.load(new Uint8Array(await file.arrayBuffer()),{ignoreEncryption:true,updateMetadata:false});
  const pages=await doc.copyPages(input,input.getPageIndices());
  for(const page of pages)doc.addPage(page);
 }
 const output=await doc.save({useObjectStreams:false});
 return new File([output],fileStem(drawingFile.name)+'-med-dorrkort-v11.pdf',{type:'application/pdf'});
}


function smartRenderGSReport(){
 const container=document.getElementById('smartGSReportBody');
 const caption=document.getElementById('smartGSReportTitle');
 if(!container||!caption)return;
 container.replaceChildren();
 const counts={},linked={};
 for(const stamp of stamps){
  if(!/^GS\d/.test(stamp.code))continue;
  counts[stamp.code]=(counts[stamp.code]||0)+1;
  if((protocolCandidates[stamp.code]||[]).length)linked[stamp.code]=(linked[stamp.code]||0)+1;
 }
 const codes=Object.keys(counts).sort((a,b)=>a.localeCompare(b,'sv',{numeric:true}));
 const total=Object.values(counts).reduce((a,b)=>a+b,0);
 const paired=Object.values(linked).reduce((a,b)=>a+b,0);
 caption.textContent='GS-rapport: '+total+' numrerade stämplar, '+paired+' med dörrkort';
 const table=document.createElement('table');
 table.style.cssText='width:100%;border-collapse:collapse;font-size:12px';
 const head=document.createElement('thead'),headRow=document.createElement('tr');
 for(const label of ['GS-kod','Hittade stämplar','Dörrkort','Kopplade']){
  const cell=document.createElement('th');cell.textContent=label;cell.style.cssText='text-align:left;padding:6px 8px;border-bottom:1px solid #bfd4df';headRow.appendChild(cell);
 }
 head.appendChild(headRow);table.appendChild(head);
 const body=document.createElement('tbody');
 for(const code of codes){
  const tr=document.createElement('tr');
  const values=[code,String(counts[code]),(protocolCandidates[code]||[]).join(', ')||'Saknas',String(linked[code]||0)];
  for(const value of values){
   const cell=document.createElement('td');cell.textContent=value;cell.style.cssText='padding:6px 8px;border-bottom:1px solid #deedf2';tr.appendChild(cell);
  }
  if(!linked[code])tr.style.color='#a33e2c';
  body.appendChild(tr);
 }
 table.appendChild(body);container.appendChild(table);
}

async function analyze(file){
 labDiagnosticSequence++;labDiagnosticSpot=null;
 const dlg=document.getElementById('labDiagnosticDialog');if(dlg?.open)dlg.close();
 setState('Läser projekt-PDF…');document.body.classList.remove('pwStartMode');const ab=await file.arrayBuffer();bytes=new Uint8Array(ab);fileKey=hashBytes(bytes);currentFileName=file.name||'Tillsyno-projekt.pdf';
 embeddedState=await readEmbeddedProjectState();projectId=String(embeddedState.projectId||('smartmatch-v11-'+fileKey));
 pdf=await pdfjsLib.getDocument({data:bytes.slice()}).promise;page=1;scale=1.1;pageTexts={};protocolDefs={};drawingNotes=[];drawingViewport=null;drawingNoteDrag=null;selectedDrawingNoteId='';drawingUndoStack=[];drawingRedoStack=[];pendingImage=null;bulkSelected.clear();bulkSelectMode=false;el.bulkSelect.setAttribute('aria-pressed','false');updateBulkBar();setDrawingTool('');
 el.fileName.textContent=currentFileName;el.empty.hidden=true;el.saveProject.disabled=false;
 const restoredCount=embeddedState?.instances?Object.keys(embeddedState.instances).length:0;
 setState(restoredCount?'Sparad projektstatus hittad. Läser positioner och protokoll…':'Läser projektmarkeringar och dörr-ID:n…');
 await smartIndexDoorCardsFirst();
 const marked=await extractLabMarkedPositions();
 stamps=marked.filter(m=>m.sourceKind==='gs');
 projectStamps=marked.filter(m=>m.sourceKind!=='gs');
 buildInstances();
 await buildProtocolMap();
 await buildProjectStampMap();
 if(PROJECT_AUTOMATION_ENABLED)await discoverDoorAutomations();
 await recalcAll();
 const gsCodes=[...new Set(stamps.map(s=>s.code))],matchedGsCodes=gsCodes.filter(c=>protocolMap[c]).length,textGsCount=0;
 const freeCodes=[...new Set(projectStamps.map(s=>s.code))],matchedFreeCodes=freeCodes.filter(c=>protocolMap[c]).length,matchedPositions=instances.filter(o=>!!protocolMap[o.code]).length;
 const restored=restoredCount?' · sparad arbetsstatus inläst':'';
 if(!stamps.length&&!projectStamps.length)setState('SmartMatch TEST v11 hittade '+smartScanStats.gsCards+' GS-dörrkort och '+smartScanStats.gsAnnotationsSeen+' numrerade GS-stämplar. Om de ligger i separata PDF-filer, välj Lägg till dörrkort-PDF.');
 else if(!matchedProjectInstances().length)setState('SmartMatch TEST v11 läste '+smartScanStats.gsAnnotationsSeen+' GS-stämplar men hittade ingen matchning mot '+smartScanStats.gsCards+' GS-dörrkort. Om dörrkorten ligger i en annan PDF, tryck Lägg till dörrkort-PDF.');
 else {smartScanStats.linkedPositions=matchedProjectInstances().length;smartScanStats.extraGraphic=labGraphicPositions;const unlinked=Object.entries(smartScanStats.gsWithoutCard||{}).map(([code,n])=>code+' ('+n+')').slice(0,6);setState('SmartMatch TEST v11: '+smartScanStats.gsAnnotationsSeen+' GS-stämplar i PDF · '+smartScanStats.gsAnnotationsLinked+' har dörrkort · '+smartScanStats.gsCards+' GS-dörrkort · '+matchedProjectInstances().length+' visade positioner'+(unlinked.length?' · GS utan dörrkort: '+unlinked.join(', '):'')+restored+'.')}
 await renderDrawing();renderGroups();updateStats();smartRenderGSReport();requestAnimationFrame(fitDrawing);

}
document.getElementById('labDiagnoseOpen').onclick=()=>document.getElementById('labDiagnosticDialog').showModal();
document.getElementById('labDiagnosticClose').onclick=()=>document.getElementById('labDiagnosticDialog').close();
document.getElementById('labDiagnosticRun').onclick=labDiagnosticAnalyze;
document.getElementById('labDiagnosticCode').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();labDiagnosticAnalyze()}};
document.getElementById('smartAddCards').onclick=()=>document.getElementById('smartCardsFile').click();
document.getElementById('smartCardsFile').onchange=async e=>{
 const cards=e.target.files?.[0];if(!cards)return;
 if(!smartBaseDrawingFile){setState('Öppna först ritningsfilen och välj sedan dörrkorten.');return}
 smartAdditionalCardsFile=cards;currentFileHandle=null;
 try{setState('Sammanfogar ritningar och dörrkort lokalt…');
  const merged=await smartMergeDrawingWithCards(smartBaseDrawingFile,cards);
  await analyze(merged);
  const note=document.getElementById('smartCardsNote');
  if(note)note.textContent='Dörrkort inlästa: '+cards.name;
 }catch(err){console.error(err);setState('Kunde inte kombinera PDF-filerna: '+(err?.message||err))}
};
el.file.onchange=e=>{const file=e.target.files?.[0];if(file){smartBaseDrawingFile=file;smartAdditionalCardsFile=null;currentFileHandle=null;analyze(file).catch(err=>{console.error(err);setState('Projektfilen kunde inte analyseras: '+(err?.message||err))})}};
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

PROJECT_AUTOMATION_MODELS.forEach(([code,name])=>{const op=document.createElement('option');op.value=code;op.textContent=code+' · '+name;el.automationModel.appendChild(op)});
{const op=document.createElement('option');op.value='custom';op.textContent='Annan modell…';el.automationModel.appendChild(op)}
el.automationClose.onclick=closeAutomationProtocol;
el.automationDialog.addEventListener('cancel',e=>{e.preventDefault();closeAutomationProtocol()});
el.automationModel.onchange=()=>{
 const o=selectedAutomation();if(!o)return;
 if(el.automationModel.value==='custom'){
  const entered=window.prompt('Skriv modell / typ av automatik:',o.model||'');
  if(entered&&entered.trim()){o.modelCode=entered.trim();o.model=entered.trim()}else renderAutomationProtocol(o);
 }else{
  const known=PROJECT_AUTOMATION_MODELS.find(([code])=>code===el.automationModel.value);
  if(known){o.modelCode=known[0];o.model=known[1]}else{o.modelCode='';o.model=''}
 }
 save();renderAutomationProtocol(o);renderGroups();renderAutomationMarkers();
};
el.automationSerial.onchange=()=>{const o=selectedAutomation();if(!o)return;o.serialNumber=el.automationSerial.value.trim();save();renderAutomationProtocol(o);renderGroups();renderAutomationMarkers()};
el.automationId.oninput=()=>{const o=selectedAutomation();if(!o)return;o.objectNo=el.automationId.value.trim();save();el.automationIdentity.textContent=[automationDisplayId(o),o.model].filter(Boolean).join(' · ');renderGroups()};
el.automationLocation.oninput=()=>{const o=selectedAutomation();if(!o)return;o.location=el.automationLocation.value;save()};
el.automationNotes.oninput=()=>{const o=selectedAutomation();if(!o)return;o.notes=el.automationNotes.value;save()};
el.automationApproveAll.onclick=()=>{const o=selectedAutomation();if(!o)return;PROJECT_AUTOMATION_CHECKS.forEach(([id])=>o.checks[id]={...(o.checks[id]||{}),result:'ok',note:''});o.progress=100;save();renderAutomationProtocol(o);renderAutomationMarkers();renderGroups()};

[
 [el.projectName,'projectName'],[el.projectFacility,'facilityNo'],[el.projectOrder,'order'],[el.projectDate,'date'],[el.projectNextDate,'nextDate'],
 [el.projectCustomer,'customer'],[el.projectAgreement,'agreement'],[el.projectContact,'contact'],[el.projectPhone,'phone'],[el.projectAddress,'address'],[el.projectPostalCode,'postalCode'],[el.projectPostalCity,'postalCity'],
 [el.projectCompany,'company'],[el.projectCompanyContact,'companyContact'],[el.projectCompanyPhone,'companyPhone'],[el.projectCompanyAddress,'companyAddress'],[el.projectCompanyPostalCode,'companyPostalCode'],[el.projectCompanyPostalCity,'companyPostalCity'],
 [el.projectTechnician,'technician'],[el.projectSignature,'signature']
].forEach(([input,key])=>input.oninput=()=>{projectMeta[key]=input.value;save()});
el.projectLogo.onchange=async e=>{
 const input=e.currentTarget,file=input.files?.[0];if(!file)return;
 el.projectLogoStatus.textContent='Läser in loggan…';
 try{projectLogoData=await prepareProjectLogoFile(file);save();refreshProjectLogoPreview()}
 catch(err){console.error(err);el.projectLogoStatus.textContent=err?.message||'Kunde inte lägga in loggan.'}
 finally{input.value=''}
};
el.projectLogoRemove.onclick=()=>{projectLogoData='';save();refreshProjectLogoPreview()};

el.saveSelfchecks.onclick=openSelfcheckExport;
el.automationPreview.onclick=openAutomationCustomerPreview;
el.automationPreviewClose.onclick=closeAutomationCustomerPreview;
el.automationPreviewDialog.addEventListener('cancel',e=>{e.preventDefault();closeAutomationCustomerPreview()});
window.addEventListener('resize',()=>{if(el.automationPreviewDialog.open)renderAutomationCustomerPreview().catch(console.error)});
el.selfcheckExportClose.onclick=closeSelfcheckExport;
el.selfcheckExportDialog.addEventListener('cancel',e=>{e.preventDefault();closeSelfcheckExport()});
el.selfcheckSelectAll.onclick=()=>{el.selfcheckExportList.querySelectorAll('input[type="checkbox"]').forEach(x=>x.checked=true);updateSelfcheckExportCount()};
el.selfcheckSelectDone.onclick=()=>{el.selfcheckExportList.querySelectorAll('input[type="checkbox"]').forEach(x=>{const o=automationItems.find(a=>a.id===x.value);x.checked=o?.progress===100});updateSelfcheckExportCount()};
el.selfcheckExportCreate.onclick=exportSelectedSelfchecks;

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
// Egna protokoll är borttaget. Ordinarie projektpositioner och kontrollprotokoll är kvar.
})();
