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
try{doors=JSON.parse(localStorage.getItem('doors')||'[]');project=JSON.parse(localStorage.getItem('project')||'{}');logoData=localStorage.getItem('logoData')||''}catch(e){}
function normalize(d){d.checks=d.checks||{};CHECKS.forEach(([n])=>d.checks[n]=d.checks[n]||{result:'',note:''});['machineId','location','ao','nextDate','signature'].forEach(k=>d[k]=d[k]||'');return d}doors.forEach(normalize);
let saveTimer;
function notice(message,error=false){$('appMessage').textContent=message;$('appMessage').classList.toggle('error',error)}
function persist(){clearTimeout(saveTimer);try{localStorage.setItem('doors',JSON.stringify(doors));localStorage.setItem('project',JSON.stringify(project))}catch(e){notice('Kunde inte spara på enheten. Behåll appen öppen och exportera protokollet.',true)}}
function save(){$('doorCount').textContent=doors.length+' dörrar';if($('overviewDialog').open)renderOverview();clearTimeout(saveTimer);saveTimer=setTimeout(persist,250)}
window.addEventListener('pagehide',persist);
document.addEventListener('visibilitychange',()=>{if(document.hidden)persist()});
save();
const PF=['projectName','facilityNo','customer','contact','projectOrder','inspectionDate','projectNextDate','company','phone'];PF.forEach(k=>{$(k).value=project[k]||'';$(k).oninput=()=>{project[k]=$(k).value;save()}});if(logoData)$('logoPreview').innerHTML='<img src="'+logoData+'">';
$('settingsBtn').onclick=()=>{$('projectPanel').hidden=!$('projectPanel').hidden};$('logoFile').onchange=e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{logoData=r.result;try{localStorage.setItem('logoData',logoData)}catch(e){}$('logoPreview').innerHTML='<img src="'+logoData+'">'};r.readAsDataURL(f)};
let loadVersion=0,renderVersion=0,renderQueue=Promise.resolve(),renderTask=null;
let pageWidth=1,pageHeight=1;
const MAX_PIXELS=4000000,MAX_SIDE=4096;
function boundedViewport(p,scale){const natural=p.getViewport({scale:1});return p.getViewport({scale:Math.min(scale,Math.sqrt(MAX_PIXELS/(natural.width*natural.height)),MAX_SIDE/natural.width,MAX_SIDE/natural.height)})}
$('file').onchange=async e=>{
 const f=e.target.files[0];if(!f)return;const version=++loadVersion;let candidate;
 notice('Laddar ritning…');$('viewerWrap').setAttribute('aria-busy','true');
 try{
  candidate=await pdfjsLib.getDocument({data:new Uint8Array(await f.arrayBuffer())}).promise;
  if(version!==loadVersion){await candidate.destroy();return}
  // Validate the first page before replacing the current drawing.
  await candidate.getPage(1);
  if(version!==loadVersion){await candidate.destroy();return}
  const previous=pdf;++renderVersion;if(renderTask)renderTask.cancel();await renderQueue;
  if(version!==loadVersion){await candidate.destroy();return}
  pdf=candidate;page=1;zoom=1;selected=null;pinch=null;panTouch=null;
  $('stage').style.transform='';addMode=false;document.body.classList.remove('placing','protocolOpen');$('hint').style.display='none';show();
  if(previous)await previous.destroy();
  await render(true);wrap.scrollLeft=0;wrap.scrollTop=0;
  if(version===loadVersion)notice(f.name+' – välj ＋ Dörr för att markera en dörr.');
 }catch(error){if(candidate&&candidate!==pdf)await candidate.destroy();if(version===loadVersion)notice('Kunde inte öppna PDF-filen. Kontrollera att den är giltig och inte lösenordsskyddad.',true)}
 finally{if(version===loadVersion){wrap.setAttribute('aria-busy','false');e.target.value=''}}
};
function render(fit=false,focus=null){
 if(!pdf)return Promise.resolve();const version=++renderVersion,documentPdf=pdf,pageNumber=page;
 if(renderTask)renderTask.cancel();
 renderQueue=renderQueue.catch(()=>{}).then(async()=>{
  if(version!==renderVersion)return;
  const p=await documentPdf.getPage(pageNumber);if(version!==renderVersion)return;
  const natural=p.getViewport({scale:1});if(fit)baseScale=Math.min(1.6,Math.max(1,wrap.clientWidth-24)/natural.width);
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
 }).catch(error=>{if(error.name!=='RenderingCancelledException'&&version===renderVersion)notice('Kunde inte visa sidan. Prova Passa eller välj en annan sida.',true)});
 return renderQueue;
}
function setZoom(z,focus={x:wrap.clientWidth/2,y:wrap.clientHeight/2}){zoom=Math.max(.5,Math.min(8,z));visualZoom=1;$('stage').style.transform='';render(false,focus)}$('zoomIn').onclick=()=>setZoom(zoom*1.25);$('zoomOut').onclick=()=>setZoom(zoom/1.25);$('fitBtn').onclick=()=>{zoom=1;render(true)};$('prev').onclick=()=>{if(pdf&&page>1){page--;zoom=1;render(true)}};$('next').onclick=()=>{if(pdf&&page<pdf.numPages){page++;zoom=1;render(true)}};function toggleAdd(){if(!pdf)return alert('Ladda upp en PDF först');addMode=!addMode;document.body.classList.toggle('placing',addMode);$('hint').style.display=addMode?'block':'none'}
markers.addEventListener('click',e=>{if(e.target!==markers||!addMode)return;const r=markers.getBoundingClientRect(),ids=new Set(doors.map(d=>d.id));let n=1;while(ids.has('D'+n))n++;const d=normalize({uid:Date.now()+''+Math.random(),id:'D'+n,page,x:(e.clientX-r.left)/r.width,y:(e.clientY-r.top)/r.height,model:'',status:'untested',notes:''});doors.push(d);selected=d.uid;addMode=false;document.body.classList.remove('placing');$('hint').style.display='none';save();draw();show();if(innerWidth<=800)document.body.classList.add('protocolOpen')});
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
async function addDrawingPages(doc){if(!pdf)return false;for(let pno=1;pno<=pdf.numPages;pno++){if(pno>1)doc.addPage('a4','portrait');const p=await pdf.getPage(pno),v=boundedViewport(p,1.45),cv=document.createElement('canvas');cv.width=v.width;cv.height=v.height;await p.render({canvasContext:cv.getContext('2d'),viewport:v}).promise;const ds=doors.filter(d=>d.page===pno);const c=cv.getContext('2d');ds.forEach(d=>{const x=d.x*cv.width,y=d.y*cv.height;c.beginPath();c.arc(x,y,16,0,Math.PI*2);c.fillStyle=d.status==='ok'?'#198754':d.status==='fail'?'#dc3545':d.status==='action'?'#e28a00':'#6c757d';c.fill();c.strokeStyle='#fff';c.lineWidth=4;c.stroke();c.fillStyle='#fff';c.font='bold 16px Arial';c.textAlign='center';c.textBaseline='middle';c.fillText(d.id,x,y)});const img=cv.toDataURL('image/jpeg',.88),ratio=Math.min(190/cv.width,267/cv.height);doc.addImage(img,'JPEG',(210-cv.width*ratio)/2,(297-cv.height*ratio)/2,cv.width*ratio,cv.height*ratio)}return true}
function addProtocol(doc,d){doc.addPage('a4','portrait');normalize(d);const L=12,W=186;doc.setLineWidth(.25);if(logoData){try{doc.addImage(logoData,'PNG',L,8,36,14)}catch(e){try{doc.addImage(logoData,'JPEG',L,8,36,14)}catch(_){}}}doc.rect(L,7,W,17);doc.setFont('helvetica','bold');doc.setFontSize(13);doc.text('PROVNINGSPROTOKOLL',105,14,{align:'center'});doc.setFontSize(9);doc.text('REVISION AV DÖRRAUTOMATIK',105,19,{align:'center'});let y=27;cell(doc,L,y,62,12,'OBJEKT',project.projectName);cell(doc,L+62,y,62,12,'DATUM',project.inspectionDate);cell(doc,L+124,y,62,12,'ORDER / AO',d.ao||project.projectOrder);y+=12;cell(doc,L,y,62,12,'ANLÄGGNINGSNUMMER',project.facilityNo);cell(doc,L+62,y,62,12,'BESTÄLLARE',project.customer);cell(doc,L+124,y,62,12,'KONTAKTPERSON',project.contact);y+=12;cell(doc,L,y,62,12,'MASKIN-ID',d.machineId);cell(doc,L+62,y,62,12,'PLACERING / DÖRRLITTRA',d.location||d.id);cell(doc,L+124,y,62,12,'AUTOMATIK / MODELL',d.model);y+=15;const widths=[12,91,20,27,27,9],heads=['Nr','Benämning kontroll','Ingår ej','Klart utan anm.','Klart med anm.','Sign'];let x=L;doc.setFontSize(6.5);doc.setFont('helvetica','bold');heads.forEach((h,i)=>{doc.rect(x,y,widths[i],10);doc.text(doc.splitTextToSize(h,widths[i]-2),x+1,y+3);x+=widths[i]});y+=10;doc.setFont('helvetica','normal');CHECKS.forEach(([n,t])=>{const c=d.checks[n],h=9;x=L;const vals=[n,t,c.result==='na'?'X':'',c.result==='ok'?'X':'',c.result==='remark'?'X':'',d.signature||''];vals.forEach((val,i)=>{doc.rect(x,y,widths[i],h);doc.setFontSize(i===1?6.2:7);if(i===0||i>=2){doc.setFont(i>=2&&val?'helvetica':'helvetica',i>=2&&val?'bold':'normal');doc.text(String(val),x+widths[i]/2,y+h/2+1.2,{align:'center'})}else{doc.setFont('helvetica','normal');const lines=doc.splitTextToSize(String(val),widths[i]-2);const lh=2.7,startY=y+h/2-((Math.min(lines.length,2)-1)*lh)/2+1;doc.text(lines.slice(0,2),x+1,startY)}x+=widths[i]});y+=h});const remarks=CHECKS.filter(([n])=>d.checks[n]&&d.checks[n].note&&d.checks[n].note.trim()).map(([n,t])=>n+' '+d.checks[n].note.trim());y+=3;const remarkLines=[];remarks.forEach(r=>remarkLines.push(...doc.splitTextToSize(r,W-4)));const generalLines=doc.splitTextToSize(d.notes||'-',W-4);const boxH=Math.max(30,12+(remarkLines.length+generalLines.length)*4);doc.rect(L,y,W,boxH);doc.setFont('helvetica','bold');doc.setFontSize(7);doc.text('ANMÄRKNINGAR FRÅN KONTROLLPUNKTER',L+2,y+4);doc.setFont('helvetica','normal');doc.setFontSize(8);let ty=y+9;if(remarkLines.length){doc.text(remarkLines,L+2,ty);ty+=remarkLines.length*4+3}else{doc.text('-',L+2,ty);ty+=7}doc.setFont('helvetica','bold');doc.setFontSize(7);doc.text('ALLMÄN INFO / ANMÄRKNING',L+2,ty);ty+=5;doc.setFont('helvetica','normal');doc.setFontSize(8);doc.text(generalLines,L+2,ty);y+=boxH+3;cell(doc,L,y,62,12,'NÄSTA PROVNING',d.nextDate||project.projectNextDate);cell(doc,L+62,y,62,12,'FÖRETAG / TEKNIKER',project.company);cell(doc,L+124,y,62,12,'SIGNATUR',d.signature)}
$('exportBtn').onclick=async()=>{if(!doors.length)return alert('Det finns inga dörrar att spara.');const {jsPDF}=window.jspdf,doc=new jsPDF('p','mm','a4');let has=await addDrawingPages(doc);if(!has){doc.setFontSize(16);doc.text('Dörrservice',14,20)}doors.slice().sort((a,b)=>a.page-b.page||a.id.localeCompare(b.id,undefined,{numeric:true})).forEach(d=>addProtocol(doc,d));doc.save('provningsprotokoll-med-ritning.pdf')};
$('addBtn')&&($('addBtn').onclick=toggleAdd);$('mobileAdd').onclick=toggleAdd;$('mobileFit').onclick=()=>{zoom=1;render(true)};$('mobileProtocol').onclick=()=>document.body.classList.add('protocolOpen');$('closeProtocol').onclick=()=>document.body.classList.remove('protocolOpen');

const STATUS_LABELS={untested:'Ej provad',ok:'Godkänd',action:'Åtgärd krävs',fail:'Ej godkänd'};
function doorProblems(d){return CHECKS.filter(([n])=>d.checks?.[n]?.result==='remark')}
function hasDoorProblem(d){return d.status==='action'||d.status==='fail'||doorProblems(d).length>0}
function renderOverview(){
 const filter=$('overviewFilter').value,query=$('overviewSearch').value.trim().toLocaleLowerCase('sv');
 const problemCount=doors.filter(hasDoorProblem).length;
 $('overviewSummary').textContent=problemCount+' av '+doors.length+' dörrar har problem';
 const list=$('overviewList');list.replaceChildren();
 const visible=doors.filter(d=>{
  if(filter==='problems'&&!hasDoorProblem(d))return false;
  if(filter==='untested'&&d.status!=='untested')return false;
  if(filter==='ok'&&(d.status!=='ok'||hasDoorProblem(d)))return false;
  return !query||[d.id,d.machineId,d.location,d.model,d.notes,...doorProblems(d).map(([n,t])=>n+' '+t+' '+(d.checks[n].note||''))].join(' ').toLocaleLowerCase('sv').includes(query);
 }).sort((a,b)=>a.page-b.page||a.id.localeCompare(b.id,'sv',{numeric:true}));
 if(!visible.length){const empty=document.createElement('p');empty.className='overviewEmpty';empty.textContent=!doors.length?'Inga dörrar ännu. Ladda upp en ritning och lägg till dörrar.':query?'Inga dörrar matchar sökningen.':filter==='problems'?'Inga dörrar med registrerade problem.':'Inga dörrar i det här urvalet.';list.appendChild(empty);return}
 const fragment=document.createDocumentFragment();
 visible.forEach(d=>{
  const card=document.createElement('article');card.className='doorCard';card.dataset.uid=d.uid;
  const heading=document.createElement('h3');heading.textContent=d.id+(d.location?' – '+d.location:'');card.appendChild(heading);
  const meta=document.createElement('p');meta.className='doorMeta';meta.textContent='Sida '+d.page+(d.machineId?' · Maskin-ID '+d.machineId:'')+(d.model?' · '+d.model:'');card.appendChild(meta);
  const badge=document.createElement('span');badge.className='doorStatus '+(hasDoorProblem(d)?'problem':'');badge.textContent=(STATUS_LABELS[d.status]||'Ej provad')+(doorProblems(d).length?' · '+doorProblems(d).length+(doorProblems(d).length===1?' felmarkerad kontrollpunkt':' felmarkerade kontrollpunkter'):'');card.appendChild(badge);
  const issues=document.createElement('ul');doorProblems(d).forEach(([n,title])=>{const li=document.createElement('li');li.textContent=n+' '+title+' – '+(d.checks[n].note?.trim()||'Fel markerat, beskrivning saknas.');issues.appendChild(li)});if(issues.childElementCount)card.appendChild(issues);
  if(d.notes?.trim()){const note=document.createElement('p');note.textContent='Allmän anmärkning: '+d.notes;card.appendChild(note)}
  const button=document.createElement('button');button.type='button';button.textContent='Öppna protokoll';button.setAttribute('aria-label','Öppna protokoll för '+d.id);button.onclick=()=>openOverviewDoor(d.uid);card.appendChild(button);fragment.appendChild(card);
 });list.appendChild(fragment);
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
