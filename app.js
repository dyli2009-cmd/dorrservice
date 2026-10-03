pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
const CHECKS=[['1.1','Samtal med nyttjaren.'],['1.2','Okulärbesiktning av dörrautomatik/dörrmiljö.'],['1.3','Kontroll av eventuella ombyggnader.'],['1.4','Kontroll fastsättning, infästning och eventuella efterdragningar av skruvar.'],['1.5','Funktionskontroll manuell och automatisk öppning (kraft, dämpning & hastighet).'],['1.6','Funktionskontroll manuell och automatisk stängning (kraft, dämpning & hastighet).'],['1.7','Funktionskontroll öppnings- & stängningstider.'],['1.8','Funktionskontroll av nödöppning & utrymning.'],['1.9','Funktionskontroll/justering koordinator och armsystem.'],['1.10','Funktionskontroll impulsgivare (radar, armbågskontakter etc).'],['1.11','Sensorlister och säkerhetsanordningar.'],['1.12','Funktionskontroll låsfunktioner (dörrblad, elslutbleck, motorlås, ellås, låshus).'],['1.13','Kontroll/justering uppställningsmagnet & dörrstopp.'],['1.14','Kontroll gummiupphängningar, fjädrar, tryckslangar & tätning.'],['1.15','Kontroll motor, pump, hydraulik och drivaxel.'],['1.16','Kontroll säkringar / programväljare / styrmodul.'],['1.17','Behovsrengöring dörrautomatik och sensorlister.'],['1.18','Mindre justering.']];
const COMMON_FAULTS={
'1.2':['Skada/slitage i dörrmiljön','Lösa eller skadade delar','Dörrblad/karm behöver justeras'],
'1.4':['Infästning lös – efterdragning krävs','Skruvar saknas/lösa','Automatikhus/arm sitter löst'],
'1.5':['För hög öppningskraft','Fel öppningshastighet','Dämpning behöver justeras','Dörr öppnar inte fullt'],
'1.6':['För hög stängningskraft','Fel stängningshastighet','Dämpning behöver justeras','Dörr stänger inte helt'],
'1.7':['Öppningstid behöver justeras','Stängningstid behöver justeras','Öppethållandetid behöver justeras'],
'1.8':['Nödöppning fungerar ej','Utrymningsfunktion behöver åtgärdas'],
'1.9':['Armsystem behöver justeras','Koordinator fungerar ej korrekt','Glapp/slitage i armsystem'],
'1.10':['Radar/impulsgivare fungerar ej','Armbågskontakt fungerar ej','Impulsgivare behöver justeras'],
'1.11':['Sensor saknas – komplettering krävs enligt SS-EN 16005','Sensorlist fungerar ej','Säkerhetssensor behöver justeras','Sensor täcker inte riskområdet'],
'1.12':['Elslutbleck fungerar ej korrekt','Lås släpper för sent/kort tid','Motorlås/ellås fungerar ej','Dörr/lås behöver justeras'],
'1.13':['Dörrstopp behöver justeras','Uppställningsmagnet fungerar ej'],
'1.14':['Gummiupphängning sliten','Fjäder behöver bytas/justeras','Tryckslang/tätning behöver åtgärdas'],
'1.15':['Motor missljud/slitage','Pump/hydraulik läcker','Drivaxel glapp/slitage'],
'1.16':['Programväljare fungerar ej','Styrmodul fel','Säkring/strömförsörjning behöver åtgärdas'],
'1.17':['Rengöring av automatik krävs','Rengöring av sensor/sensorlist krävs'],
'1.18':['Mindre justering utförd','Ytterligare justering krävs']
};
let pdf,page=1,addMode=false,selected=null,doors=[],baseScale=1,zoom=1,pinch=null,dragging=null,panTouch=null,project={},logoData='',visualZoom=1;
const $=x=>document.getElementById(x),canvas=$('pdfCanvas'),ctx=canvas.getContext('2d'),markers=$('markers'),wrap=$('viewerWrap');
let activeDrawingKey=null,activeDrawingName='',exporting=false,sourcePdfBytes=null;
const DRAWING_PREFIX='doorservice-drawing-v1:';
function normalize(d){d.checks=d.checks||{};CHECKS.forEach(([n])=>d.checks[n]=d.checks[n]||{result:'',note:''});['machineId','location','ao','nextDate','signature','remediationDate','remediationSignature'].forEach(k=>d[k]=d[k]||'');return d}doors.forEach(normalize);
let saveTimer;
function notice(message,error=false){$('appMessage').textContent=message;$('appMessage').classList.toggle('error',error)}
function persist(){
 clearTimeout(saveTimer);if(!activeDrawingKey)return true;
 try{localStorage.setItem(DRAWING_PREFIX+activeDrawingKey,JSON.stringify({version:1,name:activeDrawingName,doors,project,logoData,updatedAt:new Date().toISOString()}));return true}
 catch(e){notice('Kunde inte spara på enheten. Behåll appen öppen och exportera protokollet innan du byter ritning.',true);return false}
}
function legacyWork(){
 try{if(localStorage.getItem('doorservice-legacy-assigned'))return null;const saved=JSON.parse(localStorage.getItem('doors')||'[]');if(!Array.isArray(saved)||!saved.length)return null;return {doors:saved,project:JSON.parse(localStorage.getItem('project')||'{}'),logoData:localStorage.getItem('logoData')||''}}
 catch(e){return null}
}
function refreshDrawingUI(){
 PF.forEach(k=>{$(k).value=project[k]||'';$(k).disabled=!activeDrawingKey});$('logoFile').disabled=!activeDrawingKey;
 $('logoPreview').replaceChildren();if(logoData){const img=document.createElement('img');img.src=logoData;$('logoPreview').appendChild(img)}
 $('drawingInfo').textContent=activeDrawingKey?'Aktuell ritning: '+activeDrawingName:'Ingen ritning vald. Ladda upp en PDF för att börja.';
 $('legacyWorkPanel').hidden=!legacyWork();$('restoreLegacy').disabled=!activeDrawingKey||doors.length>0;
 $('exportBtn').disabled=!activeDrawingKey;
}
async function drawingFingerprint(bytes){const hash=await crypto.subtle.digest('SHA-256',bytes);return Array.from(new Uint8Array(hash),n=>n.toString(16).padStart(2,'0')).join('')}
function savedDrawing(key){
 try{const raw=localStorage.getItem(DRAWING_PREFIX+key);if(!raw)return null;const record=JSON.parse(raw);
  if(record.version!==1||!Array.isArray(record.doors)||record.doors.some(d=>!d||typeof d!=='object'||typeof d.uid!=='string'||typeof d.id!=='string'||!Number.isInteger(d.page)||d.page<1||d.checks&&typeof d.checks!=='object')||!record.project||typeof record.project!=='object')throw new Error('Invalid record');return record;
 }catch(e){const error=new Error('Kunde inte läsa det sparade arbetet för ritningen. Dina tidigare uppgifter har inte skrivits över.');error.storageError=true;throw error}
}
function save(skipOverview=false){$('doorCount').textContent=doors.length+' dörrar';$('restoreLegacy').disabled=!activeDrawingKey||doors.length>0;if(!skipOverview&&$('overviewDialog').open)renderOverview();clearTimeout(saveTimer);saveTimer=setTimeout(persist,250)}
window.addEventListener('pagehide',persist);
document.addEventListener('visibilitychange',()=>{if(document.hidden)persist()});
save();
const PF=['projectName','facilityNo','customer','contact','projectOrder','inspectionDate','projectNextDate','company','phone','technician','serviceSignature'];PF.forEach(k=>{$(k).oninput=()=>{project[k]=$(k).value;save()}});refreshDrawingUI();
$('settingsBtn').onclick=()=>{$('projectPanel').hidden=!$('projectPanel').hidden};
$('logoFile').onchange=e=>{const f=e.target.files[0],key=activeDrawingKey;if(!f||!key)return;const r=new FileReader();r.onload=()=>{if(key!==activeDrawingKey)return;logoData=r.result;refreshDrawingUI();save()};r.readAsDataURL(f)};
$('restoreLegacy').onclick=()=>{
 const legacy=legacyWork();if(!activeDrawingKey||doors.length||!legacy)return;
 if(!confirm('Koppla de '+legacy.doors.length+' äldre dörrarna och protokollen till '+activeDrawingName+'? Välj bara detta om du har öppnat rätt ritning.'))return;
 const previous={doors,project,logoData};doors=legacy.doors.map(d=>normalize(structuredClone(d)));project=legacy.project||{};logoData=legacy.logoData||'';
 if(!persist()){({doors,project,logoData}=previous);return}
 try{localStorage.setItem('doorservice-legacy-assigned',activeDrawingKey)}catch(e){}
 refreshDrawingUI();save();draw();show();notice('Det äldre arbetet är nu kopplat till '+activeDrawingName+'.');
};
let loadVersion=0,renderVersion=0,renderQueue=Promise.resolve(),renderTask=null;
let pageWidth=1,pageHeight=1;
const MAX_PIXELS=4000000,MAX_SIDE=4096;
function boundedViewport(p,scale){const natural=p.getViewport({scale:1});return p.getViewport({scale:Math.min(scale,Math.sqrt(MAX_PIXELS/(natural.width*natural.height)),MAX_SIDE/natural.width,MAX_SIDE/natural.height)})}
$('file').onchange=async e=>{
 const f=e.target.files[0];if(!f)return;if(exporting){notice('Vänta tills PDF-exporten är klar innan du byter ritning.');e.target.value='';return}const version=++loadVersion;let candidate;
 notice('Laddar ritning…');$('exportBtn').disabled=true;$('viewerWrap').setAttribute('aria-busy','true');
 try{
  const bytes=new Uint8Array(await f.arrayBuffer()),key=await drawingFingerprint(bytes);
  if(version!==loadVersion)return;
  const imported=await inspectWorkPdf(bytes);
  if(version!==loadVersion)return;
  const drawingBytes=imported?.drawingBytes||bytes;
  candidate=await pdfjsLib.getDocument({data:drawingBytes.slice()}).promise;
  if(version!==loadVersion){await candidate.destroy();return}
  // Validate the first page before replacing the current drawing.
  await candidate.getPage(1);
  if(version!==loadVersion){await candidate.destroy();return}
  const previous=pdf;++renderVersion;if(renderTask)renderTask.cancel();await renderQueue;
  if(version!==loadVersion){await candidate.destroy();return}
  if(!persist()){await candidate.destroy();return}
  const record=savedDrawing(key)||imported?.work;
  const nextDoors=(record?.doors||[]).map(normalize);
  pdf=candidate;sourcePdfBytes=drawingBytes.slice();activeDrawingKey=key;activeDrawingName=f.name;
  doors=nextDoors;project=record?.project||{};logoData=record?.logoData||'';
  page=1;zoom=1;selected=null;pinch=null;panTouch=null;
  canvas.width=canvas.height=0;canvas.style.width=canvas.style.height='0px';markers.replaceChildren();$('stage').style.width=$('stage').style.height='0px';pageWidth=pageHeight=1;$('pageInfo').textContent='Laddar sida…';
  $('overviewFilter').value='all';$('overviewSearch').value='';refreshDrawingUI();save();if($('overviewDialog').open)$('overviewDialog').close();$('projectPanel').hidden=true;
  $('stage').style.transform='';addMode=false;document.body.classList.remove('placing','protocolOpen');$('hint').style.display='none';show();goView('drawing');
  if(previous)await previous.destroy();
  const rendered=await render(true);wrap.scrollLeft=0;wrap.scrollTop=0;
  if(version===loadVersion&&rendered)notice((imported?'Arbets-PDF öppnad: ':record?'Sparad ritning: ':'Ny ritning: ')+f.name+' – '+doors.length+' dörrar. Välj ＋ Dörr för att lägga till.');
 }catch(error){if(candidate&&candidate!==pdf)await candidate.destroy();if(version===loadVersion)notice(error.storageError||String(error.message).includes('Arbets-PDF')?error.message:'Kunde inte öppna PDF-filen. Kontrollera att den är giltig och inte lösenordsskyddad.',true)}
 finally{if(version===loadVersion){wrap.setAttribute('aria-busy','false');$('exportBtn').disabled=!activeDrawingKey;e.target.value=''}}
};
function render(fit=false,focus=null){
 if(!pdf)return Promise.resolve();const version=++renderVersion,documentPdf=pdf,pageNumber=page;
 if(renderTask)renderTask.cancel();
 renderQueue=renderQueue.catch(()=>{}).then(async()=>{
  if(version!==renderVersion)return;
  const p=await documentPdf.getPage(pageNumber);if(version!==renderVersion)return;
  const natural=p.getViewport({scale:1});if(fit)baseScale=Math.min(1.6,Math.max(1,(wrap.clientWidth||$('drawingView').parentElement.clientWidth)-24)/natural.width);
  const oldW=pageWidth,oldH=pageHeight,oldSL=wrap.scrollLeft,oldST=wrap.scrollTop;
  const logical=p.getViewport({scale:baseScale*zoom}),raster=boundedViewport(p,baseScale*zoom*Math.min(window.devicePixelRatio||1,2));
  // Keep zoom/marker coordinates in CSS pixels; cap only the raster allocation.
  const nextCanvas=document.createElement('canvas');nextCanvas.width=Math.ceil(raster.width);nextCanvas.height=Math.ceil(raster.height);
  const task=p.render({canvasContext:nextCanvas.getContext('2d'),viewport:raster});renderTask=task;
  try{await task.promise}finally{if(renderTask===task)renderTask=null}
  if(version!==renderVersion)return;
  canvas.width=nextCanvas.width;canvas.height=nextCanvas.height;ctx.drawImage(nextCanvas,0,0);nextCanvas.width=nextCanvas.height=0;
  pageWidth=logical.width;pageHeight=logical.height;
  canvas.style.width=pageWidth+'px';canvas.style.height=pageHeight+'px';
  $('stage').style.width=pageWidth+'px';$('stage').style.height=pageHeight+'px';
  $('pageInfo').textContent='Sida '+pageNumber+' / '+documentPdf.numPages;$('zoomInfo').textContent=Math.round(zoom*100)+'%';draw();
  if(focus){wrap.scrollLeft=(oldSL+focus.x)/oldW*pageWidth-focus.x;wrap.scrollTop=(oldST+focus.y)/oldH*pageHeight-focus.y}
  return true;
 }).catch(error=>{if(error.name!=='RenderingCancelledException'&&version===renderVersion)notice('Kunde inte visa sidan. Prova Passa eller välj en annan sida.',true);return false});
 return renderQueue;
}
function setZoom(z,focus={x:wrap.clientWidth/2,y:wrap.clientHeight/2}){zoom=Math.max(.5,Math.min(8,z));visualZoom=1;$('stage').style.transform='';render(false,focus)}$('zoomIn').onclick=()=>setZoom(zoom*1.25);$('zoomOut').onclick=()=>setZoom(zoom/1.25);$('fitBtn').onclick=()=>{zoom=1;render(true)};$('prev').onclick=()=>{if(pdf&&page>1){page--;zoom=1;render(true)}};$('next').onclick=()=>{if(pdf&&page<pdf.numPages){page++;zoom=1;render(true)}};function toggleAdd(){if(!pdf)return alert('Ladda upp en PDF först');addMode=!addMode;document.body.classList.toggle('placing',addMode);$('hint').style.display=addMode?'block':'none'}
markers.addEventListener('click',e=>{if(e.target!==markers||!addMode)return;const r=markers.getBoundingClientRect(),ids=new Set(doors.map(d=>d.id));let n=1;while(ids.has('D'+n))n++;const d=normalize({uid:Date.now()+''+Math.random(),id:'D'+n,page,x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height,model:'',status:'untested',notes:''});d.serialNumber=nextSerial();d.id='D'+Number(d.serialNumber);d.idMode='auto';doors.push(d);selected=d.uid;addMode=false;document.body.classList.remove('placing');$('hint').style.display='none';save();draw();show();if(innerWidth<=800)document.body.classList.add('protocolOpen')});
function draw(){
 markers.replaceChildren();doors.filter(d=>d.page===page).forEach(d=>{
  const el=document.createElement('button');el.type='button';el.className='marker '+(d.status||'untested');el.textContent=d.id;el.setAttribute('aria-label','Öppna protokoll för '+d.id);
  el.style.left=d.x*100+'%';el.style.top=d.y*100+'%';let drag=null;
  el.addEventListener('pointerdown',ev=>{if(ev.button!==0)return;ev.stopPropagation();drag={pointer:ev.pointerId,x:ev.clientX,y:ev.clientY,moved:false,originalX:d.x,originalY:d.y};el.setPointerCapture(ev.pointerId)});
  el.addEventListener('pointermove',ev=>{if(!drag||drag.pointer!==ev.pointerId)return;if(!drag.moved&&Math.hypot(ev.clientX-drag.x,ev.clientY-drag.y)<10)return;drag.moved=true;const r=markers.getBoundingClientRect();d.x=Math.max(0,Math.min(1,(ev.clientX-r.left)/r.width));d.y=Math.max(0,Math.min(1,(ev.clientY-r.top)/r.height));el.style.left=d.x*100+'%';el.style.top=d.y*100+'%'});
  el.addEventListener('pointerup',ev=>{if(!drag||drag.pointer!==ev.pointerId)return;if(drag.moved)save();drag=null});
  el.addEventListener('pointercancel',()=>{if(drag){d.x=drag.originalX;d.y=drag.originalY;el.style.left=d.x*100+'%';el.style.top=d.y*100+'%'}drag=null});
  el.onclick=ev=>{ev.stopPropagation();selected=d.uid;show();if(innerWidth<=800)document.body.classList.add('protocolOpen')};markers.appendChild(el)
 })
}
function cur(){return doors.find(d=>d.uid===selected)}
function buildChecklist(d){
 const box=$('checklist');box.innerHTML='';
 const all=document.createElement('button');all.className='approveAll';all.textContent='✓ Godkänn alla kontrollpunkter';all.onclick=()=>{CHECKS.forEach(([n])=>{d.checks[n].result='ok';d.checks[n].note=''});save();buildChecklist(d)};box.appendChild(all);
 CHECKS.forEach(([n,t])=>{
  const c=d.checks[n],r=document.createElement('div');r.className='checkrow';
  r.innerHTML='<div class="checktitle">'+n+' '+t+'</div><div class="quickBtns"><button data-v="na">– Ingår ej</button><button data-v="ok">✓ OK</button><button data-v="remark">! Fel</button></div><div class="faultArea" hidden><select class="faultSelect"><option value="">Välj vanlig anmärkning…</option></select><input class="faultText" placeholder="Eller skriv egen anmärkning"></div>';
  const area=r.querySelector('.faultArea'),sel=r.querySelector('.faultSelect'),inp=r.querySelector('.faultText');
  (COMMON_FAULTS[n]||['Justering/åtgärd krävs']).forEach(v=>{const o=document.createElement('option');o.value=v;o.textContent=v;sel.appendChild(o)});
  const own=document.createElement('option');own.value='__own';own.textContent='Annat – skriv själv';sel.appendChild(own);
  inp.value=c.note||'';if(c.result==='remark')area.hidden=false;
  r.querySelectorAll('.quickBtns button').forEach(b=>{if(b.dataset.v===c.result)b.classList.add('active');b.onclick=()=>{c.result=b.dataset.v;if(c.result!=='remark')c.note='';save();r.querySelectorAll('.quickBtns button').forEach(button=>button.classList.toggle('active',button.dataset.v===c.result));area.hidden=c.result!=='remark';if(c.result!=='remark'){inp.value='';sel.value=''}}});
  sel.onchange=()=>{if(sel.value&&sel.value!=='__own'){c.note=sel.value;inp.value=c.note;save()}else if(sel.value==='__own'){inp.focus()}};
  inp.oninput=()=>{c.note=inp.value;save()};
  box.appendChild(r)
 })
}
function show(){const d=cur();$('empty').hidden=!!d;$('form').hidden=!d;if(!d)return;normalize(d);$('formTitle').textContent=d.id+' – Sida '+d.page;['doorId','model','status','notes','machineId','location','ao','nextDate','signature'].forEach(id=>$(id).value=d[id==='doorId'?'id':id]||'');buildChecklist(d)}['doorId','model','status','notes','machineId','location','ao','nextDate','signature'].forEach(id=>$(id).oninput=()=>{const d=cur();if(!d)return;d[id==='doorId'?'id':id]=$(id).value;save();if(id==='doorId'||id==='status')draw()});$('deleteBtn').onclick=()=>{const d=cur();if(d&&confirm('Ta bort '+d.id+'?')){doors=doors.filter(x=>x.uid!==d.uid);selected=null;save();draw();show()}};
wrap.addEventListener('touchstart',e=>{
 if(e.touches.length===2){e.preventDefault();panTouch=null;const a=e.touches[0],b=e.touches[1],r=wrap.getBoundingClientRect();pinch={dist:Math.max(1,Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY)),zoom,focus:{x:(a.clientX+b.clientX)/2-r.left,y:(a.clientY+b.clientY)/2-r.top}}}
 else if(e.touches.length===1&&!addMode&&!e.target.closest('.marker')){const t=e.touches[0];panTouch={x:t.clientX,y:t.clientY,left:wrap.scrollLeft,top:wrap.scrollTop}}
},{passive:false});
wrap.addEventListener('touchmove',e=>{
 if(e.touches.length===2&&pinch){e.preventDefault();const a=e.touches[0],b=e.touches[1];visualZoom=Math.max(.5,Math.min(8,pinch.zoom*Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY)/pinch.dist))/pinch.zoom;$('stage').style.transform='scale('+visualZoom+')';$('stage').style.transformOrigin=(wrap.scrollLeft+pinch.focus.x)+'px '+(wrap.scrollTop+pinch.focus.y)+'px';$('zoomInfo').textContent=Math.round(pinch.zoom*visualZoom*100)+'%'}
 else if(e.touches.length===1&&panTouch&&!addMode&&!pinch){e.preventDefault();const t=e.touches[0];wrap.scrollLeft=panTouch.left-(t.clientX-panTouch.x);wrap.scrollTop=panTouch.top-(t.clientY-panTouch.y)}
},{passive:false});
function endTouch(e){
 if(pinch&&e.touches.length<2){const p=pinch;pinch=null;panTouch=null;setZoom(p.zoom*visualZoom,p.focus)}
 if(e.touches.length===0)panTouch=null;
}
wrap.addEventListener('touchend',endTouch,{passive:true});wrap.addEventListener('touchcancel',endTouch,{passive:true});
function cell(doc,x,y,w,h,label,value){doc.rect(x,y,w,h);doc.setFontSize(6.5);doc.setFont('helvetica','bold');doc.text(label,x+2,y+3.5);doc.setFont('helvetica','normal');doc.setFontSize(8);doc.text(String(value||'-').substring(0,45),x+2,y+8)}
async function addDrawingPages(doc,protocolPages={}){if(!pdf)return false;for(let pno=1;pno<=pdf.numPages;pno++){if(pno>1)doc.addPage('a4','portrait');const p=await pdf.getPage(pno),v=boundedViewport(p,1.45),cv=document.createElement('canvas');cv.width=v.width;cv.height=v.height;await p.render({canvasContext:cv.getContext('2d'),viewport:v}).promise;const ds=doors.filter(d=>d.page===pno);const c=cv.getContext('2d');ds.forEach(d=>{const x=d.x*cv.width,y=d.y*cv.height;c.beginPath();c.arc(x,y,12,0,Math.PI*2);c.fillStyle=d.status==='ok'?'#198754':d.status==='fail'?'#dc3545':d.status==='action'?'#e28a00':'#6c757d';c.fill();c.strokeStyle='#fff';c.lineWidth=3;c.stroke();c.fillStyle='#fff';c.font='bold 12px Arial';c.textAlign='center';c.textBaseline='middle';c.fillText(d.id,x,y)});const img=cv.toDataURL('image/jpeg',.88),ratio=Math.min(190/cv.width,267/cv.height),ox=(210-cv.width*ratio)/2,oy=(297-cv.height*ratio)/2;doc.addImage(img,'JPEG',ox,oy,cv.width*ratio,cv.height*ratio);ds.forEach(d=>{const target=protocolPages[d.uid];if(!target)return;const x=ox+d.x*cv.width*ratio,y=oy+d.y*cv.height*ratio,hit=9;doc.link(x-hit/2,y-hit/2,hit,hit,{pageNumber:target})})}return true}
function addProtocol(doc,d,drawingPage=d.page){doc.addPage('a4','portrait');normalize(d);const L=12,W=186;doc.setLineWidth(.25);if(logoData){try{doc.addImage(logoData,'PNG',L,8,36,14)}catch(e){try{doc.addImage(logoData,'JPEG',L,8,36,14)}catch(_){}}}doc.rect(L,7,W,17);doc.setFont('helvetica','bold');doc.setFontSize(13);doc.text('PROVNINGSPROTOKOLL',105,14,{align:'center'});doc.setFontSize(9);doc.text('REVISION AV DÖRRAUTOMATIK',105,19,{align:'center'});let y=27;cell(doc,L,y,62,12,'OBJEKT',project.projectName);cell(doc,L+62,y,62,12,'DATUM',project.inspectionDate);cell(doc,L+124,y,62,12,'ORDER / AO',d.ao||project.projectOrder);y+=12;cell(doc,L,y,62,12,'ANLÄGGNINGSNUMMER',project.facilityNo);cell(doc,L+62,y,62,12,'BESTÄLLARE',project.customer);cell(doc,L+124,y,62,12,'KONTAKTPERSON',project.contact);y+=12;cell(doc,L,y,62,12,'MASKIN-ID',d.machineId);cell(doc,L+62,y,62,12,'PLACERING / DÖRRLITTRA',d.location||d.id);cell(doc,L+124,y,62,12,'AUTOMATIK / MODELL',d.model);y+=15;const widths=[12,91,20,27,27,9],heads=['Nr','Benämning kontroll','Ingår ej','Klart utan anm.','Klart med anm.','Sign'];let x=L;doc.setFontSize(6.5);doc.setFont('helvetica','bold');heads.forEach((h,i)=>{doc.rect(x,y,widths[i],10);doc.text(doc.splitTextToSize(h,widths[i]-2),x+1,y+3);x+=widths[i]});y+=10;doc.setFont('helvetica','normal');CHECKS.forEach(([n,t])=>{const c=d.checks[n],h=9;x=L;const vals=[n,t,c.result==='na'?'X':'',c.result==='ok'?'X':'',c.result==='remark'?'X':'',d.signature||''];vals.forEach((val,i)=>{doc.rect(x,y,widths[i],h);doc.setFontSize(i===1?6.2:7);if(i===0||i>=2){doc.setFont(i>=2&&val?'helvetica':'helvetica',i>=2&&val?'bold':'normal');doc.text(String(val),x+widths[i]/2,y+h/2+1.2,{align:'center'})}else{doc.setFont('helvetica','normal');const lines=doc.splitTextToSize(String(val),widths[i]-2);const lh=2.7,startY=y+h/2-((Math.min(lines.length,2)-1)*lh)/2+1;doc.text(lines.slice(0,2),x+1,startY)}x+=widths[i]});y+=h});const remarks=CHECKS.filter(([n])=>d.checks[n]&&d.checks[n].note&&d.checks[n].note.trim()).map(([n,t])=>n+' '+d.checks[n].note.trim());y+=3;const remarkLines=[];remarks.forEach(r=>remarkLines.push(...doc.splitTextToSize(r,W-4)));const generalLines=doc.splitTextToSize(d.notes||'-',W-4);const boxH=Math.max(30,12+(remarkLines.length+generalLines.length)*4);doc.rect(L,y,W,boxH);doc.setFont('helvetica','bold');doc.setFontSize(7);doc.text('ANMÄRKNINGAR FRÅN KONTROLLPUNKTER',L+2,y+4);doc.setFont('helvetica','normal');doc.setFontSize(8);let ty=y+9;if(remarkLines.length){doc.text(remarkLines,L+2,ty);ty+=remarkLines.length*4+3}else{doc.text('-',L+2,ty);ty+=7}doc.setFont('helvetica','bold');doc.setFontSize(7);doc.text('ALLMÄN INFO / ANMÄRKNING',L+2,ty);ty+=5;doc.setFont('helvetica','normal');doc.setFontSize(8);doc.text(generalLines,L+2,ty);y+=boxH+3;cell(doc,L,y,62,12,'NÄSTA PROVNING',d.nextDate||project.projectNextDate);cell(doc,L+62,y,62,12,'FÖRETAG / TEKNIKER',project.company);cell(doc,L+124,y,62,12,'SIGNATUR',d.signature);doc.setFont('helvetica','bold');doc.setFontSize(8);doc.setTextColor(17,106,153);doc.text('Till ritning / '+d.id,198,291,{align:'right'});doc.link(155,284,43,10,{pageNumber:drawingPage});doc.setTextColor(0,0,0)}
$('exportBtn').onclick=async()=>{if(exporting||wrap.getAttribute('aria-busy')==='true')return;if(!doors.length)return alert('Det finns inga dörrar att spara.');exporting=true;$('file').disabled=true;$('exportBtn').disabled=true;try{const {jsPDF}=window.jspdf,doc=new jsPDF('p','mm','a4');const sorted=doors.slice().sort((a,b)=>a.page-b.page||a.id.localeCompare(b.id,undefined,{numeric:true})),drawingPages=pdf?pdf.numPages:1,protocolPages={};sorted.forEach((d,i)=>protocolPages[d.uid]=drawingPages+i+1);let has=await addDrawingPages(doc,protocolPages);if(!has){doc.setFontSize(16);doc.text('Dörrservice',14,20)}sorted.forEach(d=>addProtocol(doc,d,pdf?d.page:1));doc.save('provningsprotokoll-med-ritning.pdf')}catch(error){alert('Kunde inte skapa protokollet. Kontrollera anslutningen och prova igen.')}finally{exporting=false;$('file').disabled=false;$('exportBtn').disabled=!activeDrawingKey}};
$('addBtn')&&($('addBtn').onclick=toggleAdd);$('mobileAdd').onclick=toggleAdd;$('mobileFit').onclick=()=>{zoom=1;render(true)};$('mobileProtocol').onclick=()=>document.body.classList.add('protocolOpen');$('closeProtocol').onclick=()=>document.body.classList.remove('protocolOpen');

const STATUS_LABELS={untested:'Ej provad',ok:'Godkänd',action:'Åtgärd krävs',fail:'Ej godkänd'};
function doorProblems(d){return CHECKS.filter(([n])=>d.checks?.[n]?.result==='remark')}
function hasDoorProblem(d){return d.status==='action'||d.status==='fail'||doorProblems(d).length>0}
function renderOverview(){
 const filter=$('overviewFilter').value,query=$('overviewSearch').value.trim().toLocaleLowerCase('sv');
 const problemCount=doors.filter(hasDoorProblem).length;
 $('overviewSummary').textContent=problemCount+' av '+doors.length+' dörrar har problem';
 $('overviewPdf').disabled=problemCount===0;
 const projectInfo=$('overviewProject');projectInfo.replaceChildren();
 [['Objekt',project.projectName],['Datum',project.inspectionDate],['Order nr',project.projectOrder]].forEach(([label,value])=>{const item=document.createElement('p');item.textContent=label+': '+(value||'–');projectInfo.appendChild(item)});
 const list=$('overviewList');list.replaceChildren();
 const visible=doors.filter(d=>{
  if(filter==='problems'&&!hasDoorProblem(d))return false;
  if(filter==='untested'&&d.status!=='untested')return false;
  if(filter==='ok'&&(d.status!=='ok'||hasDoorProblem(d)))return false;
  return !query||[d.id,d.machineId,d.location,d.model,d.notes,...doorProblems(d).map(([n,t])=>n+' '+t+' '+(d.checks[n].note||''))].join(' ').toLocaleLowerCase('sv').includes(query);
 }).sort((a,b)=>a.page-b.page||a.id.localeCompare(b.id,'sv',{numeric:true}));
 if(!visible.length){const empty=document.createElement('p');empty.className='overviewEmpty';empty.textContent=!doors.length?'Inga dörrar ännu. Ladda upp en ritning och lägg till dörrar.':query?'Inga dörrar matchar sökningen.':filter==='problems'?'Inga dörrar med registrerade problem.':'Inga dörrar i det här urvalet.';list.appendChild(empty);return}
 const scroller=document.createElement('div');scroller.className='overviewTableWrap';
 const table=document.createElement('table');table.className='overviewTable';
 const caption=document.createElement('caption');caption.textContent='Anmärkningslista för dörrservice';table.appendChild(caption);
 const head=document.createElement('thead'),headRow=document.createElement('tr');
 ['Dörr nr','Anmärkning','Åtgärdat datum + signatur'].forEach(text=>{const th=document.createElement('th');th.scope='col';th.textContent=text;headRow.appendChild(th)});head.appendChild(headRow);table.appendChild(head);
 const body=document.createElement('tbody');
 visible.forEach(d=>{
  const row=document.createElement('tr');row.className='overviewRow';row.dataset.uid=d.uid;
  const doorCell=document.createElement('td'),doorButton=document.createElement('button');doorButton.type='button';doorButton.textContent=d.id;doorButton.setAttribute('aria-label','Öppna protokoll för '+d.id);doorButton.onclick=()=>openOverviewDoor(d.uid);doorCell.appendChild(doorButton);row.appendChild(doorCell);
  const remarksCell=document.createElement('td');
  const meta=document.createElement('p');meta.className='doorMeta';meta.textContent=(d.location?d.location+' · ':'')+'Sida '+d.page+(d.machineId?' · Maskin-ID '+d.machineId:'');remarksCell.appendChild(meta);
  const badge=document.createElement('span');badge.className='doorStatus '+(hasDoorProblem(d)?'problem':'');badge.textContent=STATUS_LABELS[d.status]||'Ej provad';remarksCell.appendChild(badge);
  const issues=document.createElement('ul');doorProblems(d).forEach(([n,title])=>{const li=document.createElement('li');li.textContent=n+' '+title+' – '+(d.checks[n].note?.trim()||'Fel markerat, beskrivning saknas.');issues.appendChild(li)});if(issues.childElementCount)remarksCell.appendChild(issues);
  if(d.notes?.trim()){const note=document.createElement('p');note.textContent='Allmän anmärkning: '+d.notes;remarksCell.appendChild(note)}row.appendChild(remarksCell);
  const actionCell=document.createElement('td');
  [['remediationDate','Åtgärdat datum','date'],['remediationSignature','Signatur','text']].forEach(([key,title,type])=>{const label=document.createElement('label');label.textContent=title;const input=document.createElement('input');input.type=type;input.value=d[key]||'';input.dataset.field=key;input.setAttribute('aria-label',title+' för '+d.id);input.oninput=()=>{d[key]=input.value;save(true)};label.appendChild(input);actionCell.appendChild(label)});row.appendChild(actionCell);body.appendChild(row);
 });table.appendChild(body);scroller.appendChild(table);list.appendChild(scroller);
}

function openOverview(){document.body.classList.remove('protocolOpen');renderOverview();$('overviewDialog').showModal();$('overviewDialog').scrollTop=0}
async function openOverviewDoor(uid){
 const d=doors.find(item=>item.uid===uid);if(!d)return;
 selected=uid;$('overviewDialog').close();addMode=false;document.body.classList.remove('placing');$('hint').style.display='none';show();
 if(innerWidth<=800)document.body.classList.add('protocolOpen');$('protocolPanel').scrollTop=0;
 if(pdf&&d.page>=1&&d.page<=pdf.numPages){page=d.page;zoom=1;await render(true);wrap.scrollLeft=Math.max(0,d.x*pageWidth-wrap.clientWidth/2);wrap.scrollTop=Math.max(0,d.y*pageHeight-wrap.clientHeight/2)}
 else if(!pdf)notice('Protokollet är öppet. Ladda upp ritningen igen för att se dörren på PDF-sidan.');
}
$('overviewBtn').onclick=openOverview;$('mobileOverview').onclick=openOverview;
$('closeOverview').onclick=()=>$('overviewDialog').close();
$('overviewFilter').onchange=renderOverview;$('overviewSearch').oninput=renderOverview;

function problemRemarkText(d){
 const lines=doorProblems(d).map(([n,title])=>n+' '+title+' – '+(d.checks[n].note?.trim()||'Fel markerat, beskrivning saknas.'));
 if(!lines.length)lines.push(STATUS_LABELS[d.status]||'Anmärkning');
 if(d.location)lines.unshift('Placering: '+d.location);
 if(d.notes?.trim())lines.push('Allmän anmärkning: '+d.notes.trim());
 return lines.join('\n');
}
function createProblemPdf(){
 const problemDoors=doors.filter(hasDoorProblem).sort((a,b)=>a.page-b.page||a.id.localeCompare(b.id,'sv',{numeric:true}));
 if(!problemDoors.length)throw new Error('Inga dörrar med registrerade problem.');
 if(!window.jspdf?.jsPDF)throw new Error('PDF-biblioteket kunde inte laddas. Kontrollera internetanslutningen och ladda om appen.');
 const doc=new window.jspdf.jsPDF('p','mm','a4'),left=12,widths=[18,128,40],bottom=275,lineHeight=3.8;
 let y;
 function startPage(){
  doc.setDrawColor(120);doc.setLineWidth(.25);doc.rect(left,12,186,20);
  if(logoData){try{doc.addImage(logoData,left+3,15,32,14)}catch(error){}}
  else{doc.setFont('helvetica','bold');doc.setFontSize(10);doc.text(doc.splitTextToSize(project.company||'Dörrservice',45).slice(0,2),left+3,20)}
  doc.setFont('helvetica','bold');doc.setFontSize(12);doc.text('ANMÄRKNINGSLISTA',left+52,20);doc.setFontSize(9);doc.text('Egenkontroll av dörrautomatik',left+52,26);
  [['OBJEKT',project.projectName],['DATUM',project.inspectionDate],['ORDER NR',project.projectOrder]].forEach(([label,value],i)=>{
   const x=left+i*62;doc.rect(x,42,62,15);doc.setFont('helvetica','bold');doc.setFontSize(7);doc.text(label,x+2,46);doc.setFont('helvetica','normal');doc.setFontSize(9);doc.text(doc.splitTextToSize(String(value||'-'),58).slice(0,2),x+2,51);
  });
  y=65;doc.setFont('helvetica','bold');doc.setFontSize(8);let x=left;
  ['Dörr nr','Anmärkning','Åtgärdat datum + sign.'].forEach((title,i)=>{doc.rect(x,y,widths[i],9);doc.text(title,x+2,y+5.5);x+=widths[i]});y+=9;doc.setFont('helvetica','normal');doc.setFontSize(8);
 }
 startPage();
 problemDoors.forEach(d=>{
  const values=[d.id,problemRemarkText(d),[d.remediationDate,d.remediationSignature].filter(Boolean).join('\n')];
  const columns=values.map((value,i)=>doc.splitTextToSize(String(value||''),widths[i]-4));
  let offset=0,total=Math.max(1,...columns.map(lines=>lines.length));
  while(offset<total){
   const capacity=Math.floor((bottom-y-4)/lineHeight);
   if(capacity<1||bottom-y<10){doc.addPage();startPage();continue}
   const count=Math.min(capacity,total-offset),height=Math.max(10,4+count*lineHeight);let x=left;
   columns.forEach((lines,i)=>{doc.rect(x,y,widths[i],height);const chunk=i===0&&offset>=lines.length?lines.slice(0,count):lines.slice(offset,offset+count);if(chunk.length)doc.text(chunk,x+2,y+4);x+=widths[i]});
   y+=height;offset+=count;
   if(offset<total){doc.addPage();startPage()}
  }
 });
 while(y+8<=bottom){let x=left;widths.forEach(w=>{doc.rect(x,y,w,8);x+=w});y+=8}
 const pages=doc.getNumberOfPages();
 for(let number=1;number<=pages;number++){doc.setPage(number);doc.setFontSize(7);doc.setTextColor(80);doc.line(left,282,198,282);doc.text('Anmärkningslista – dörrservice',left,286);doc.text('Sida '+number+' av '+pages,198,286,{align:'right'})}
 return doc;
}
$('overviewPdf').onclick=()=>{try{persist();createProblemPdf().save('anmarkningslista-dorrservice.pdf')}catch(error){alert(error.message||'Kunde inte skapa PDF. Prova igen.')}};
