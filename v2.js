const MODELS=[['11','Geze EMD standardarm'],['12','Geze EMD glidarm'],['13','Faac standard'],['14','Faac glidarm'],['15','Besam Powerswing'],['16','Besam SW100'],['17','Dorma ED 200'],['18','Tormax'],['19','Record standardarm'],['20','Powerswing pardörr'],['21','Geze TSA 160'],['22','Record glidarm'],['23','Gilgen FDC'],['24','Dorma ED 100'],['25','Besam SDE'],['26','Ditec hissmonterad'],['27','SR 2000'],['28','OVE'],['29','Dorma CD 80'],['30','Cibes hissöppnare'],['31','Geze TSA 160 dubbeldörr'],['32','Dorma ED 180'],['33','Geze EC Turn'],['34','Besam DHE'],['35','Entramatic PLS 100'],['36','Entramatic PLS 150'],['37','Dorma ED 250'],['38','Geze Powerdrive skjutdörr'],['39','Geze EC Drive skjutdörr'],['40','Geze SL skjutdörr'],['41','Faac 930 skjutdörr'],['42','Faac A140 skjutdörr'],['43','Dorma TS 93 + brandstängning'],['44','Dorma TS 93'],['45','Entramatic SW 300'],['46','Unislide dubbel flyglig'],['47','Unislide enkel flyglig'],['48','Entramatic SL500']];
const GROUPS=[['Förberedelser och infästning',[0,1,2,3]],['Öppning, stängning och utrymning',[4,5,6,7,8]],['Impulsgivare, säkerhet och lås',[9,10,11,12]],['Drivning, rengöring och justering',[13,14,15,16,17]]];
function goView(view){
 if(view!=='doors'&&$('overviewDialog').open)$('overviewDialog').close();
 if(view==='doors'&&!$('overviewDialog').open)$('overviewDialog').show();
 $('projectPanel').hidden=view!=='project';document.body.dataset.view=view;
 document.body.classList.toggle('protocolOpen',view==='protocol');
 const ids={drawing:'navDrawing',doors:'mobileOverview',protocol:'mobileProtocol',project:'settingsBtn'};
 Object.values(ids).forEach(id=>$(id).classList.toggle('active',ids[view]===id));
}
function completedChecks(d){return CHECKS.filter(([n])=>['ok','na','remark'].includes(d.checks?.[n]?.result)).length}
function displayStatus(d){if(d.status==='fail')return 'fail';if(hasDoorProblem(d))return 'action';return d.status==='ok'?'ok':'untested'}
function statusText(d){return {ok:'Godkänd',fail:'Ej godkänd',action:d.status==='action'?'Åtgärd krävs':'Anmärkningar',untested:'Ej klar'}[displayStatus(d)]}
function updateCompactUI(){
 document.body.classList.toggle('hasDrawing',!!pdf);$('objectLabel').textContent=project.projectName||project.facilityNo||activeDrawingName||'Välj en ritning';
 $('newServiceBtn').disabled=!pdf;$('mobileAdd').disabled=!pdf;
 const d=cur();if(d){$('checkProgress').textContent=completedChecks(d)+' / '+CHECKS.length+' kontrollerade';$('signature').value=project.serviceSignature||d.signature||'';$('serviceBy').textContent=[project.technician,project.company,project.inspectionDate].filter(Boolean).join(' · ')}
}
const baseSave=save;save=function(skip=false){baseSave(skip);updateCompactUI()};
const baseRefresh=refreshDrawingUI;refreshDrawingUI=function(){baseRefresh();updateCompactUI()};
function nextSerial(){const largest=Math.max(0,...doors.map(d=>Number(d.serialNumber)||Number(/^D(\d+)$/.exec(d.id)?.[1])||0));const n=Math.max(Number(project.nextDoorNumber)||1,largest+1);project.nextDoorNumber=n+1;return String(n).padStart(3,'0')}
function proposedId(d){return project.facilityNo&&d.modelCode&&d.serialNumber?[project.facilityNo.trim(),d.modelCode,d.serialNumber].join('-'):null}
function setDoorId(d,value,mode){
 const id=String(value||'').trim();if(!id){$('idMessage').textContent='Märkningen får inte vara tom.';return false}
 if(doors.some(other=>other.uid!==d.uid&&other.id===id)){$('idMessage').textContent='Det ID-numret används redan av en annan dörr.';return false}
 d.id=id;d.idMode=mode;$('idMessage').textContent='';$('doorId').value=id;save();draw();$('protocolHeading').textContent=id;return true;
}
MODELS.forEach(([code,name])=>{const option=document.createElement('option');option.value=code;option.textContent=code+' · '+name;$('modelChoice').appendChild(option)});
const custom=document.createElement('option');custom.value='custom';custom.textContent='Annan modell – skriv själv';$('modelChoice').appendChild(custom);
const generate=document.createElement('button');generate.type='button';generate.id='generateId';generate.className='secondary wide';generate.textContent='Skapa märkning från objekt, modell och löpnummer';$('idMessage').after(generate);
generate.onclick=()=>{const d=cur();if(!d)return;const id=proposedId(d);if(!id){$('idMessage').textContent='Fyll i objektnummer under Projekt, välj modell och ange löpnummer.';return}setDoorId(d,id,'auto')};
$('modelChoice').onchange=()=>{const d=cur();if(!d)return;const model=MODELS.find(([code])=>code===$('modelChoice').value);d.modelCode=model?.[0]||'';if(model)d.model=model[1];$('model').value=d.model;$('modelCode').value=d.modelCode;if(d.idMode==='auto'&&proposedId(d))setDoorId(d,proposedId(d),'auto');save()};
$('serialNumber').onchange=()=>{const d=cur();if(!d)return;const value=$('serialNumber').value.trim();if(!/^\d{1,6}$/.test(value)){$('idMessage').textContent='Ange ett löpnummer med 1–6 siffror.';if(lastShownDoor!==d.uid){$('protocolPanel').scrollTop=0;document.querySelector('.doorDetails').open=!d.model;lastShownDoor=d.uid}
 $('serialNumber').value=d.serialNumber||'';return}const old=d.serialNumber;d.serialNumber=value.padStart(3,'0');if(d.idMode==='auto'&&proposedId(d)&&!setDoorId(d,proposedId(d),'auto'))d.serialNumber=old;$('serialNumber').value=d.serialNumber;save()};
$('doorId').oninput=()=>{};$('doorId').onchange=()=>{const d=cur();if(d&&!setDoorId(d,$('doorId').value,'manual'))$('doorId').value=d.id};
$('signature').oninput=()=>{};
buildChecklist=function(d){
 const box=$('checklist');box.replaceChildren();
 const approveAll=document.createElement('button');approveAll.type='button';approveAll.className='approveAll';approveAll.textContent='✓ Godkänn alla';approveAll.onclick=()=>{CHECKS.forEach(([n])=>{d.checks[n].result='ok';d.checks[n].note=''});d.status='ok';$('status').value='ok';save();buildChecklist(d);$('status').value=d.status;draw();updateCompactUI()};box.appendChild(approveAll);
 GROUPS.forEach(([title,indices])=>{
  const group=document.createElement('details');group.className='checkGroup';group.open=true;
  const summary=document.createElement('summary');summary.textContent=title;const count=document.createElement('span');summary.appendChild(count);group.appendChild(summary);
  const update=()=>{count.textContent=indices.filter(i=>!!d.checks[CHECKS[i][0]].result).length+' / '+indices.length};
  indices.forEach(i=>{
   const [n,title]=CHECKS[i],c=d.checks[n],row=document.createElement('div');row.className='checkrow';row.dataset.check=n;
   const heading=document.createElement('div');heading.className='checktitle';const nr=document.createElement('span');nr.className='checkNumber';nr.textContent=n;const text=document.createElement('span');text.textContent=title;heading.append(nr,text);row.appendChild(heading);
   const buttons=document.createElement('div');buttons.className='quickBtns';const area=document.createElement('div');area.className='faultArea';area.hidden=c.result!=='remark';
   const select=document.createElement('select');select.className='faultSelect';select.setAttribute('aria-label','Vanlig anmärkning '+n);const placeholder=document.createElement('option');placeholder.value='';placeholder.textContent='Välj vanlig anmärkning…';select.appendChild(placeholder);(COMMON_FAULTS[n]||['Justering/åtgärd krävs']).forEach(value=>{const option=document.createElement('option');option.value=value;option.textContent=value;select.appendChild(option)});
   const input=document.createElement('input');input.className='faultText';input.placeholder='Beskriv felet';input.value=c.note||'';input.setAttribute('aria-label','Anmärkning '+n);area.append(select,input);
   [['ok','OK'],['remark','Fel'],['na','Ingår ej']].forEach(([value,label])=>{const button=document.createElement('button');button.type='button';button.dataset.v=value;button.textContent=label;button.classList.toggle('active',c.result===value);button.onclick=()=>{c.result=c.result===value?'':value;if(c.result!=='remark'){c.note='';input.value='';select.value=''}const anyRemark=CHECKS.some(([cn])=>d.checks[cn]?.result==='remark');const allDone=CHECKS.every(([cn])=>['ok','na','remark'].includes(d.checks[cn]?.result));if(d.status!=='fail')d.status=anyRemark?'action':allDone?'ok':'untested';$('status').value=d.status;buttons.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.v===c.result));area.hidden=c.result!=='remark';update();save();draw()};buttons.appendChild(button)});
   select.onchange=()=>{if(select.value){c.note=select.value;input.value=c.note;if(d.status!=='fail')d.status='action';$('status').value=d.status;save();draw()}};input.oninput=()=>{c.note=input.value;if(c.result==='remark'&&d.status!=='fail')d.status='action';$('status').value=d.status;save();draw()};row.append(buttons,area);group.appendChild(row);
  });update();box.appendChild(group);
 });
};
let lastShownDoor=null;
const baseShow=show;show=function(){baseShow();const d=cur();$('protocolHeading').textContent=d?.id||'Välj en dörr';if(!d)return;
 if(lastShownDoor!==d.uid){$('protocolPanel').scrollTop=0;document.querySelector('.doorDetails').open=!d.model;lastShownDoor=d.uid}
 $('serialNumber').value=d.serialNumber||'';$('modelCode').value=d.modelCode||'';$('modelChoice').value=MODELS.some(([code])=>code===d.modelCode)?d.modelCode:(d.model?'custom':'');$('idMessage').textContent='';
 const prior=d.previousIssues||[];$('previousPanel').hidden=!prior.length&&!d.previousNotes&&!d.previousStatus;$('previousIssues').replaceChildren();
 if(prior.length){const ul=document.createElement('ul');prior.forEach(issue=>{const li=document.createElement('li');li.textContent=issue.n+' '+issue.title+' – '+(issue.note||'Beskrivning saknas');ul.appendChild(li)});$('previousIssues').appendChild(ul)}
 if(d.previousNotes){const p=document.createElement('p');p.textContent=d.previousNotes;$('previousIssues').appendChild(p)}
 if(d.previousStatus){const p=document.createElement('p');p.textContent='Tidigare bedömning: '+(STATUS_LABELS[d.previousStatus]||d.previousStatus);$('previousIssues').appendChild(p)}
 updateCompactUI();goView('protocol');
};
renderOverview=function(){
 const filter=$('overviewFilter').value,query=$('overviewSearch').value.trim().toLocaleLowerCase('sv'),problems=doors.filter(hasDoorProblem).length;
 $('overviewProject').textContent=[project.projectName,project.facilityNo,project.inspectionDate].filter(Boolean).join(' · ');
 $('overviewSummary').textContent=doors.length+' dörrar · '+problems+' med fel · '+doors.filter(d=>completedChecks(d)<CHECKS.length||d.status==='untested').length+' ej klara';$('overviewPdf').disabled=!problems;
 const visible=doors.filter(d=>(filter!=='problems'||hasDoorProblem(d))&&(filter!=='ok'||displayStatus(d)==='ok')&&(filter!=='untested'||completedChecks(d)<CHECKS.length||d.status==='untested')&&(!query||[d.id,d.model,d.location,d.machineId,d.notes,...doorProblems(d).map(([n,t])=>n+' '+t+' '+d.checks[n].note)].join(' ').toLocaleLowerCase('sv').includes(query))).sort((a,b)=>a.page-b.page||a.id.localeCompare(b.id,'sv',{numeric:true}));
 const list=$('overviewList');list.replaceChildren();if(!visible.length){const p=document.createElement('p');p.className='overviewEmpty';p.textContent=!doors.length?'Inga dörrar ännu. Markera automatikerna på ritningen.':query?'Inga dörrar matchar sökningen.':'Inga dörrar i det här urvalet.';list.appendChild(p);return}
 visible.forEach(d=>{
  const card=document.createElement('article');card.className='doorCard overviewRow';card.dataset.uid=d.uid;
  const header=document.createElement('div');header.className='doorCardHeader';const title=document.createElement('h3');title.textContent=d.id;const badge=document.createElement('span');badge.className='doorStatus '+displayStatus(d);badge.textContent=statusText(d);header.append(title,badge);card.appendChild(header);
  const meta=document.createElement('p');meta.className='doorMeta';meta.textContent=[d.location,d.model,'Sida '+d.page,completedChecks(d)+'/'+CHECKS.length+' punkter'].filter(Boolean).join(' · ');card.appendChild(meta);
  const issues=doorProblems(d);if(issues.length){const ul=document.createElement('ul');issues.forEach(([n,t])=>{const li=document.createElement('li');li.textContent=n+' '+(d.checks[n].note?.trim()||'Fel markerat, beskrivning saknas.');ul.appendChild(li)});card.appendChild(ul)}
  if(d.notes){const p=document.createElement('p');p.textContent=d.notes;card.appendChild(p)}
  if(hasDoorProblem(d)){
   const grid=document.createElement('div');grid.className='grid2';[['remediationDate','Åtgärdat datum','date'],['remediationSignature','Åtgärdssignatur','text']].forEach(([key,title,type])=>{const label=document.createElement('label');label.textContent=title;const input=document.createElement('input');input.type=type;input.dataset.field=key;input.value=d[key]||'';input.setAttribute('aria-label',title+' för '+d.id);input.oninput=()=>{d[key]=input.value;save(true)};label.appendChild(input);grid.appendChild(label)});card.appendChild(grid);
  }
  const button=document.createElement('button');button.textContent='Öppna protokoll';button.onclick=()=>openOverviewDoor(d.uid);button.setAttribute('aria-label','Öppna protokoll för '+d.id);card.appendChild(button);list.appendChild(card);
 });
};
openOverview=function(){renderOverview();goView('doors');$('overviewDialog').scrollTop=0};
$('overviewBtn').onclick=openOverview;$('mobileOverview').onclick=openOverview;$('pickDoorBtn').onclick=openOverview;
$('closeOverview').onclick=()=>goView('drawing');$('navDrawing').onclick=()=>goView('drawing');$('closeProtocol').onclick=()=>goView('drawing');$('closeProject').onclick=()=>goView('drawing');
$('mobileProtocol').onclick=()=>{show();goView('protocol')};$('settingsBtn').onclick=()=>goView('project');
$('nextDoorBtn').onclick=()=>{const sorted=doors.slice().sort((a,b)=>a.page-b.page||a.id.localeCompare(b.id,'sv',{numeric:true}));const next=sorted[(sorted.findIndex(d=>d.uid===selected)+1)%sorted.length];if(next)openOverviewDoor(next.uid)};
$('newServiceBtn').onclick=()=>{
 if(!pdf||!doors.length)return notice('Lägg till dörrar innan du startar ett nytt servicebesök.');
 if(!confirm('Starta en ny service med samma dörrar? Dagens kontroller och serviceuppgifter nollställs. Nuvarande anmärkningar visas som tidigare fel. Spara först en arbets-PDF om du vill behålla den färdiga rapporten.'))return;
 doors.forEach(d=>{d.previousIssues=doorProblems(d).map(([n,title])=>({n,title,note:d.checks[n].note||''}));d.previousNotes=d.notes||'';d.previousStatus=hasDoorProblem(d)?d.status:'';d.checks={};normalize(d);d.notes='';d.status='untested';d.signature='';d.ao='';d.remediationDate='';d.remediationSignature=''});
 project.technician='';project.serviceSignature='';project.projectOrder='';project.inspectionDate=new Date().toISOString().slice(0,10);selected=null;refreshDrawingUI();save();draw();show();goView('project');notice('Nytt servicebesök startat. Fyll i tekniker, signatur och order.');
};
async function inspectWorkPdf(bytes){
 if(!window.PDFLib)throw new Error('PDF-biblioteket är inte tillgängligt. Ladda om appen med internetanslutning.');
 const {PDFDocument,PDFName,PDFDict,PDFNumber,PDFRawStream,decodePDFRawStream}=PDFLib;
 const doc=await PDFDocument.load(bytes,{updateMetadata:false});const ref=doc.catalog.get(PDFName.of('DorrserviceWork'));if(!ref)return null;
 const metadata=doc.context.lookup(ref);if(!(metadata instanceof PDFDict))throw new Error('Arbets-PDF:ens uppgifter är skadade.');
 const version=metadata.lookup(PDFName.of('Version'),PDFNumber).asNumber();if(version<2)throw new Error('Arbets-PDF:en har en äldre dataversion som inte kan läsas automatiskt.');
 const data=metadata.lookup(PDFName.of('Data'),PDFRawStream),drawing=metadata.lookup(PDFName.of('Drawing'),PDFRawStream);
 const state=JSON.parse(new TextDecoder().decode(decodePDFRawStream(data).decode()));
 if(state.app!=='dorrservice'||state.version<2||!Array.isArray(state.doors)||!state.project||typeof state.project!=='object'||state.doors.some(d=>!d||typeof d.uid!=='string'||typeof d.id!=='string'||!Number.isInteger(d.page)||d.page<1||!Number.isFinite(d.x)||!Number.isFinite(d.y)||d.x<0||d.x>1||d.y<0||d.y>1))throw new Error('Arbets-PDF:en innehåller ogiltiga dörruppgifter.');
 const drawingBytes=decodePDFRawStream(drawing).decode().slice(),source=await PDFDocument.load(drawingBytes,{updateMetadata:false});
 if(state.doors.some(d=>d.page>source.getPageCount()))throw new Error('Dörrarna hör inte till arbets-PDF:ens ritningssidor.');
 return {drawingBytes,work:{version:1,doors:state.doors,project:state.project,logoData:state.logoData||''}};
}
async function createWorkPdf(){
 if(!pdf||!sourcePdfBytes)throw new Error('Öppna en PDF-ritning först.');
 if(!window.PDFLib||!window.jspdf?.jsPDF)throw new Error('PDF-biblioteken kunde inte laddas.');
 const snapshot=structuredClone({doors,project,logoData}),originalBytes=sourcePdfBytes.slice(),drawingDocument=pdf;
 const {PDFDocument,PDFName,PDFArray,StandardFonts,rgb,degrees}=PDFLib;
 const source=await PDFDocument.load(originalBytes,{updateMetadata:false}),output=await PDFDocument.create(),copied=await output.copyPages(source,source.getPageIndices());copied.forEach(p=>output.addPage(p));const font=await output.embedFont(StandardFonts.HelveticaBold),markerLinks=[];
 for(let index=0;index<copied.length;index++){
  const page=copied[index],originalPage=await drawingDocument.getPage(index+1),viewport=originalPage.getViewport({scale:1}),radius=Math.max(7,Math.min(13,Math.min(viewport.width,viewport.height)*.016));
  snapshot.doors.filter(d=>d.page===index+1).forEach(d=>{
   const [x,y]=viewport.convertToPdfPoint(d.x*viewport.width,d.y*viewport.height),color=REPORT_COLORS[displayStatus(d)].rgb;
   page.drawCircle({x,y,size:radius,color:rgb(...color.map(n=>n/255)),borderColor:rgb(1,1,1),borderWidth:1.5});
   markerLinks.push({pageIndex:index,doorKey:d.uid||d.id,x,y,radius});
   const label=d.serialNumber||d.id.replace(/^D/,'');const safeLabel=String(label).replace(/[^\x20-\x7e\u00a0-\u00ff]/g,'?');const size=Math.min(9,2*radius/Math.max(2,safeLabel.length)*1.35),w=font.widthOfTextAtSize(safeLabel,size),angle=page.getRotation().angle;
   const rad=angle*Math.PI/180;const dx=-w/2,dy=-size/3;page.drawText(safeLabel,{x:x+dx*Math.cos(rad)-dy*Math.sin(rad),y:y+dx*Math.sin(rad)+dy*Math.cos(rad),size,font,color:rgb(1,1,1),rotate:degrees(angle)});
  });
 }
 const report=buildServiceReportDoc(snapshot,true),protocolPageMap=report.__doorProtocolPages||{},reportPdf=await PDFDocument.load(report.output('arraybuffer'));const reportPages=await output.copyPages(reportPdf,reportPdf.getPageIndices());reportPages.forEach(p=>output.addPage(p));
 function addInternalPdfLink(sourcePage,targetPage,rect){
  const linkRef=output.context.register(output.context.obj({Type:'Annot',Subtype:'Link',Rect:rect,Border:[0,0,0],Dest:[targetPage.ref,'Fit']}));
  const existing=sourcePage.node.get(PDFName.of('Annots'));
  if(existing){const annots=sourcePage.node.lookup(PDFName.of('Annots'),PDFArray);annots.push(linkRef)}
  else sourcePage.node.set(PDFName.of('Annots'),output.context.obj([linkRef]));
 }
 markerLinks.forEach(({pageIndex,doorKey,x,y,radius})=>{
  const reportPageNo=protocolPageMap[doorKey];if(!reportPageNo)return;
  const targetIndex=source.getPageCount()+reportPageNo-1,targetPage=output.getPage(targetIndex),sourcePage=output.getPage(pageIndex),hit=Math.max(12,radius*1.8);
  addInternalPdfLink(sourcePage,targetPage,[x-hit,y-hit,x+hit,y+hit]);
 });
 const state={app:'dorrservice',version:2,exportedAt:new Date().toISOString(),...snapshot};
 const dataRef=output.context.register(output.context.flateStream(new TextEncoder().encode(JSON.stringify(state))));const drawingRef=output.context.register(output.context.flateStream(originalBytes));
 output.catalog.set(PDFName.of('DorrserviceWork'),output.context.register(output.context.obj({Version:2,Data:dataRef,Drawing:drawingRef})));
 output.setTitle('Dörrservice – '+(snapshot.project.projectName||snapshot.project.facilityNo||'Service'));output.setSubject('Ritning, anmärkningsöversikt och provningsprotokoll. Arbets-PDF för Dörrservice 2.');output.setCreator('Dörrservice 2.0');
 return output.save();
}
$('exportBtn').onclick=async()=>{
 if(exporting||wrap.getAttribute('aria-busy')==='true')return;
 if(!pdf)return notice('Öppna en ritning först.');exporting=true;document.body.classList.add('exporting');$('file').disabled=true;$('exportBtn').disabled=true;persist();notice('Skapar arbets-PDF och kundrapport…');
 try{const bytes=await createWorkPdf(),url=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'})),a=document.createElement('a');const object=(project.facilityNo||project.projectName||'objekt').replace(/[^a-zA-Z0-9åäöÅÄÖ_-]/g,'-');a.href=url;a.download='dorrservice-'+object+'-'+(project.inspectionDate||new Date().toISOString().slice(0,10))+'.pdf';a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);notice('Arbets-PDF skapad. Spara den till Filer; samma fil kan öppnas nästa service.')}
 catch(error){notice(error.message||'Kunde inte skapa arbets-PDF.',true)}finally{exporting=false;document.body.classList.remove('exporting');$('file').disabled=false;$('exportBtn').disabled=!pdf}
};
createProblemPdf=function(){if(!doors.some(hasDoorProblem))throw new Error('Inga dörrar med registrerade problem.');return buildServiceReportDoc(structuredClone({doors,project,logoData}),false)};
updateCompactUI();

const baseDraw=draw;draw=function(){baseDraw();const items=doors.filter(d=>d.page===page);Array.from(markers.children).forEach((element,index)=>{const d=items[index];element.textContent=d.serialNumber||d.id;element.title=d.id;element.className='marker '+displayStatus(d)})};

function sizeForKeyboard(){document.documentElement.style.setProperty('--app-height',(window.visualViewport?.height||window.innerHeight)+'px')}
window.visualViewport?.addEventListener('resize',()=>{sizeForKeyboard();if(document.activeElement?.matches('input,textarea,select'))requestAnimationFrame(()=>document.activeElement.scrollIntoView({block:'nearest'}))});window.addEventListener('resize',sizeForKeyboard);sizeForKeyboard();

let customerPreviewTimer=null,customerPreviewToken=0,customerPreviewPdf=null;
function customerPreviewDoor(){
 const source=cur()||doors[0];
 if(source)return structuredClone(source);
 const checks={};CHECKS.forEach(([n])=>checks[n]={result:'',note:''});
 return {uid:'preview',id:'D001',serialNumber:'001',page:1,x:.5,y:.5,model:'',machineId:'',location:'',ao:'',nextDate:'',signature:'',status:'untested',notes:'',checks,remediationDate:'',remediationSignature:''};
}
async function renderCustomerPreview(){
 const pane=$('customerPreviewPane');if(!pane||pane.hidden)return;
 const token=++customerPreviewToken,status=$('customerPreviewStatus'),canvas=$('customerPreviewCanvas'),holder=$('customerPreviewCanvasWrap');
 status.textContent='Uppdaterar…';
 try{
  const door=customerPreviewDoor();normalize(door);
  const snapshot=structuredClone({project,logoData,doors:[door]});
  const report=buildServiceReportDoc(snapshot,true);
  const bytes=new Uint8Array(report.output('arraybuffer'));
  const preview=await pdfjsLib.getDocument({data:bytes}).promise;
  if(token!==customerPreviewToken){await preview.destroy();return}
  if(customerPreviewPdf)await customerPreviewPdf.destroy();customerPreviewPdf=preview;
  const firstProtocolPage=preview.numPages>=2?2:1,first=await preview.getPage(firstProtocolPage),base=first.getViewport({scale:1});
  const available=Math.max(320,(holder.clientWidth||760)-22),displayScale=Math.min(1.55,available/base.width),pixelRatio=Math.min(window.devicePixelRatio||1,2),cssGap=14,renderGap=Math.round(cssGap*pixelRatio);
  const cssW=Math.round(base.width*displayScale),cssH=Math.round(base.height*displayScale),renderW=Math.ceil(cssW*pixelRatio),renderH=Math.ceil(cssH*pixelRatio),pageCount=preview.numPages-firstProtocolPage+1;
  canvas.width=renderW;canvas.height=renderH*pageCount+renderGap*Math.max(0,pageCount-1);canvas.style.width=cssW+'px';canvas.style.height=(cssH*pageCount+cssGap*Math.max(0,pageCount-1))+'px';
  const out=canvas.getContext('2d');out.clearRect(0,0,canvas.width,canvas.height);
  for(let pageNo=firstProtocolPage,i=0;pageNo<=preview.numPages;pageNo++,i++){
   if(token!==customerPreviewToken)return;
   const pg=pageNo===firstProtocolPage?first:await preview.getPage(pageNo),viewport=pg.getViewport({scale:displayScale*pixelRatio}),tmp=document.createElement('canvas');
   tmp.width=Math.ceil(viewport.width);tmp.height=Math.ceil(viewport.height);await pg.render({canvasContext:tmp.getContext('2d'),viewport}).promise;
   out.drawImage(tmp,0,i*(renderH+renderGap));tmp.width=tmp.height=0;
  }
  if(token===customerPreviewToken)status.textContent='Visar '+(door.id||'provningsprotokoll')+' · '+pageCount+' sida'+(pageCount===1?'':'or')+' · uppdateras automatiskt';
 }catch(e){if(token===customerPreviewToken)status.textContent='Kunde inte visa mallen'}
}
function scheduleCustomerPreview(){if($('customerPreviewPane')?.hidden)return;clearTimeout(customerPreviewTimer);customerPreviewTimer=setTimeout(renderCustomerPreview,220)}
function setCustomerPreview(open){
 const pane=$('customerPreviewPane');pane.hidden=!open;document.body.classList.toggle('customerPreviewOpen',open);$('projectPanel').classList.toggle('previewing',open);
 $('toggleCustomerPreview').textContent=open?'Dölj kundmall':'👁 Visa kundmall live';
 $('globalCustomerPreview').textContent=open?'Dölj kundmall':'Kundmall';
 if(open)setTimeout(renderCustomerPreview,0)
}
$('toggleCustomerPreview').onclick=()=>setCustomerPreview($('customerPreviewPane').hidden);
$('globalCustomerPreview').onclick=()=>setCustomerPreview($('customerPreviewPane').hidden);
$('closeCustomerPreview').onclick=()=>setCustomerPreview(false);
$('projectPanel').addEventListener('input',scheduleCustomerPreview);$('projectPanel').addEventListener('change',()=>setTimeout(scheduleCustomerPreview,80));
window.addEventListener('resize',()=>{if(!$('customerPreviewPane')?.hidden)scheduleCustomerPreview()});
const customerPreviewSave=save;save=function(skip=false){customerPreviewSave(skip);scheduleCustomerPreview()};
const customerPreviewShow=show;show=function(){customerPreviewShow();scheduleCustomerPreview()};
