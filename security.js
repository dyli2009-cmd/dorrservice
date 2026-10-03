pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
const $=id=>document.getElementById(id);
const SYSTEMS={
 alarm:{label:'Inbrottslarm',prefix:'I',checks:[
 ['1.1','Lägg anläggningen i serviceläge på larmcentral.'],
 ['1.2','Okulärbesiktning av anläggningen'],
 ['1.3','Pålarmning och stickkontroll detektor.'],
 ['1.4','Kontroll att siren ljuder.'],
 ['1.5','Kontroll av sabotagelarm.'],
 ['1.6','Kontroll med larmcentral att larm inkommit.'],
 ['1.7','Rengöring av manöverpanel och detektorer.'],
 ['1.8','Kontroll att utrymmen är larmade i den utsträckning som behövs.'],
 ['1.9','Inspektion av dekaler byten eller komplettering vid behov.'],
 ['1.10','Kontroll av batterier.']
 ],faults:{
 '1.1':['Kan inte lägga anläggningen i serviceläge','Fel information/kontakt med larmcentral'],
 '1.2':['Synlig skada eller slitage','Kapsling/detektor sitter löst'],
 '1.3':['Detektor reagerar inte','Fel sektion/detektor reagerar'],
 '1.4':['Siren ljuder inte','Låg eller avvikande ljudnivå'],
 '1.5':['Sabotagelarm fungerar inte','Sabotagekontakt behöver justeras'],
 '1.6':['Larm når inte larmcentral','Fel sektion visas hos larmcentral'],
 '1.7':['Rengöring krävs','Manöverpanel/detektor kraftigt smutsig'],
 '1.8':['Utrymme saknar tillräcklig detektering','Del av anläggningen är inte larmad'],
 '1.9':['Dekal saknas','Dekal behöver bytas'],
 '1.10':['Batteri svagt','Batteri behöver bytas']
 }},
 lock:{label:'Lås & Dörrmiljö',prefix:'L',checks:[
 ['1.1','Okulärbesiktning av dörrautomatik/dörrmiljö.'],
 ['1.2','Funktionskontroll av låsfunktioner (dörrblad, elslutbleck, motorlås, ellås, låshus).'],
 ['1.3','Kontroll fastsättning, infästning och eventuella efterdragningar av skruvar.'],
 ['1.4','Nödkåpor och plombering.'],
 ['1.5','Kontroll av dörrstängare.'],
 ['1.6','Prov väsentlig funktion.'],
 ['1.7','Prov daglarm.'],
 ['1.8','Beslagning utrymningsdörr.'],
 ['1.9','Skyltning nödutgång.'],
 ['1.10','Funktionskontroll impulsgivare (radar, armbågskontakter etc).'],
 ['1.11','Sensorlister och säkerhetsanordningar.'],
 ['1.12','Funktionskontroll och eventuell justering av uppställningsmagnet & dörrstopp.'],
 ['1.13','Behovsrengöring dörrautomatik och sensorlister']
 ],faults:{
 '1.1':['Skada/slitage i dörrmiljön','Dörrblad/karm behöver justeras'],
 '1.2':['Lås öppnar inte korrekt','Elslutbleck fungerar inte','Motorlås/ellås fungerar inte','Låshus kärvar'],
 '1.3':['Infästning lös','Skruvar saknas eller behöver efterdras'],
 '1.4':['Nödkåpa saknas/skadad','Plombering saknas'],
 '1.5':['Dörrstängare saknas','Dörrstängare läcker','Stänger inte hela vägen','Hastighet behöver justeras'],
 '1.6':['Väsentlig funktion fungerar inte'],
 '1.7':['Daglarm fungerar inte'],
 '1.8':['Utrymningsbeslag fungerar inte','Beslag skadat/saknas'],
 '1.9':['Nödutgångsskylt saknas','Skylt behöver bytas'],
 '1.10':['Impulsgivare fungerar inte','Armbågskontakt/radar behöver justeras'],
 '1.11':['Sensorlist fungerar inte','Säkerhetsanordning behöver justeras'],
 '1.12':['Uppställningsmagnet fungerar inte','Dörrstopp behöver justeras'],
 '1.13':['Rengöring krävs']
 }},
 access:{label:'Passer',prefix:'P',checks:[
 ['1.1','Okulärbesiktning av anläggningen'],
 ['1.2','Kontroll fastsättning.'],
 ['1.3','Kontroll av batteribackup.'],
 ['1.4','Test av öppnaknapp.'],
 ['1.5','Kontroll av händelselogg.'],
 ['1.6','Kontroll att dörr öppnar och låser korrekt.'],
 ['1.7','Rengöring av kortläsare.']
 ],faults:{
 '1.1':['Synlig skada/slitage','Kortläsare/enhet sitter löst'],
 '1.2':['Infästning lös','Skruvar saknas'],
 '1.3':['Batteribackup fungerar inte','Batteri svagt'],
 '1.4':['Öppnaknapp fungerar inte','Fördröjd eller intermittent funktion'],
 '1.5':['Händelser saknas i logg','Fel tid/registrering i logg'],
 '1.6':['Dörr öppnar inte','Dörr låser inte','Lås släpper för sent'],
 '1.7':['Kortläsare behöver rengöras','Kortläsare skadad']
 }}
};
const COLORS={ok:[35,131,84],action:[199,124,19],fail:[189,63,70],untested:[119,133,142]};
let pdf=null,sourceBytes=null,page=1,zoom=1,baseScale=1,visualZoom=1,items=[],selected=null,addType=null,project={},renderTask=null,renderVersion=0,renderQueue=Promise.resolve(),activeKey=null,pinch=null,panTouch=null,panMouse=null,pageWidth=1,pageHeight=1;
const canvas=$('secCanvas'),ctx=canvas.getContext('2d'),markers=$('secMarkers'),viewer=$('secViewer');
const MAX_PIXELS=4000000,MAX_SIDE=4096;
function boundedViewport(p,scale){const natural=p.getViewport({scale:1});return p.getViewport({scale:Math.min(scale,Math.sqrt(MAX_PIXELS/(natural.width*natural.height)),MAX_SIDE/natural.width,MAX_SIDE/natural.height)})}
const PROJECT_FIELDS=['secProjectName','secFacilityNo','secOrder','secDate','secNextDate','secCustomer','secAgreement','secContact','secPhone','secAddress','secCompany','secTechnician','secCompanyContact','secCompanyPhone','secCompanyAddress','secSignature'];
function emptyProject(){return {projectName:'',facilityNo:'',order:'',date:'',nextDate:'',customer:'',agreement:'',contact:'',phone:'',address:'',company:'',technician:'',companyContact:'',companyPhone:'',companyAddress:'',signature:''}}
function statusOf(o){if(o.status==='fail')return'fail';if(Object.values(o.checks||{}).some(c=>c.result==='remark'))return'action';if(o.status==='ok')return'ok';return'untested'}
function normalize(o){o.checks=o.checks||{};const cfg=SYSTEMS[o.type];(cfg?.checks||[]).forEach(([n])=>o.checks[n]=o.checks[n]||{result:'',note:''});o.customChecks=o.customChecks||[];o.customChecks.forEach(c=>o.checks[c.id]=o.checks[c.id]||{result:'',note:''});o.status=o.status||'untested';o.manualFail=!!o.manualFail||o.status==='fail';o.notes=o.notes||'';o.location=o.location||'';syncStatus(o);return o}
function msg(t,e=false){$('securityMessage').textContent=t;$('securityMessage').classList.toggle('error',e)}
async function fingerprint(bytes){const h=await crypto.subtle.digest('SHA-256',bytes);return[...new Uint8Array(h)].map(n=>n.toString(16).padStart(2,'0')).join('')}
function save(){if(!activeKey)return;const data={version:1,items,project,updatedAt:new Date().toISOString()};localStorage.setItem('security-service:'+activeKey,JSON.stringify(data));refreshTop()}
function loadSaved(key){try{return JSON.parse(localStorage.getItem('security-service:'+key)||'null')}catch(e){return null}}
function refreshTop(){$('securityObject').textContent=project.projectName||$('securityFile').files?.[0]?.name||'Säkerhetsservice';$('securityCount').textContent=items.length+' objekt';document.body.classList.toggle('secHasPdf',!!pdf)}
function go(view){document.body.dataset.view=view;$('secNavDrawing').classList.toggle('active',view==='drawing');$('secNavProtocol').classList.toggle('active',view==='protocol');$('secNavProject').classList.toggle('active',view==='project')}
function allChecks(o){const base=SYSTEMS[o.type]?.checks||[];return [...base,...o.customChecks.map(c=>[c.id,c.title])]}
function syncStatus(o){
 if(o.manualFail){o.status='fail';return o.status}
 const checks=allChecks(o),results=checks.map(([n])=>o.checks?.[n]?.result||'');
 if(results.some(r=>r==='remark'))o.status='action';
 else if(checks.length&&results.every(r=>r==='ok'||r==='na'))o.status='ok';
 else o.status='untested';
 return o.status
}
function nextNumber(type){const nums=items.filter(x=>x.type===type).map(x=>Number(x.number)||0);return Math.max(0,...nums)+1}
function createItem(type,x,y){const n=nextNumber(type),cfg=SYSTEMS[type],o=normalize({uid:crypto.randomUUID(),type,number:n,id:cfg.prefix+n,page,x,y,checks:{},customChecks:[],status:'untested'});items.push(o);selected=o.uid;addType=null;document.body.classList.remove('secAdding');$('secHint').hidden=true;save();drawMarkers();showSelected();go('protocol')}
function drawMarkers(){markers.replaceChildren();items.filter(o=>o.page===page).forEach(o=>{const b=document.createElement('button');b.className='secMarker '+o.type+' status-'+statusOf(o);b.textContent=o.id;b.style.left=o.x*100+'%';b.style.top=o.y*100+'%';let drag=null,ignore=0;b.onpointerdown=e=>{if(e.button!==0)return;e.stopPropagation();drag={id:e.pointerId,x:e.clientX,y:e.clientY,moved:false};b.setPointerCapture(e.pointerId)};b.onpointermove=e=>{if(!drag||drag.id!==e.pointerId)return;if(!drag.moved&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<5)return;drag.moved=true;const r=markers.getBoundingClientRect();o.x=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width));o.y=Math.max(0,Math.min(1,(e.clientY-r.top)/r.height));b.style.left=o.x*100+'%';b.style.top=o.y*100+'%'};b.onpointerup=e=>{if(drag?.moved){ignore=Date.now()+700;save()}drag=null};b.onclick=e=>{e.stopPropagation();if(Date.now()<ignore)return;selected=o.uid;showSelected();go('protocol')};markers.appendChild(b)})}
markers.onclick=e=>{if(e.target!==markers||!addType)return;const r=markers.getBoundingClientRect();createItem(addType,(e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height)}
document.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>{if(!pdf)return msg('Öppna en PDF först.',true);addType=b.dataset.add;document.body.classList.add('secAdding');$('secHint').textContent='Tryck där '+SYSTEMS[addType].label+' ska markeras. Nyp för att zooma.';$('secHint').hidden=false;go('drawing')});
function render(fit=false,focus=null){
 if(!pdf)return Promise.resolve();const version=++renderVersion,documentPdf=pdf,pageNumber=page;
 if(renderTask)renderTask.cancel();
 renderQueue=renderQueue.catch(()=>{}).then(async()=>{
  if(version!==renderVersion)return;
  const p=await documentPdf.getPage(pageNumber);if(version!==renderVersion)return;
  const natural=p.getViewport({scale:1});
  if(fit){const availW=Math.max(120,viewer.clientWidth-20),availH=Math.max(120,viewer.clientHeight-20);baseScale=Math.min(1.8,Math.max(.1,Math.min(availW/natural.width,availH/natural.height)))}
  const oldW=pageWidth,oldH=pageHeight,oldSL=viewer.scrollLeft,oldST=viewer.scrollTop;
  const logical=p.getViewport({scale:baseScale*zoom}),raster=boundedViewport(p,baseScale*zoom*Math.min(window.devicePixelRatio||1,2));
  const nextCanvas=document.createElement('canvas');nextCanvas.width=Math.ceil(raster.width);nextCanvas.height=Math.ceil(raster.height);
  const task=p.render({canvasContext:nextCanvas.getContext('2d'),viewport:raster});renderTask=task;
  try{await task.promise}finally{if(renderTask===task)renderTask=null}
  if(version!==renderVersion)return;
  canvas.width=nextCanvas.width;canvas.height=nextCanvas.height;ctx.drawImage(nextCanvas,0,0);nextCanvas.width=nextCanvas.height=0;
  pageWidth=logical.width;pageHeight=logical.height;
  canvas.style.width=pageWidth+'px';canvas.style.height=pageHeight+'px';$('secStage').style.width=pageWidth+'px';$('secStage').style.height=pageHeight+'px';
  $('secPage').textContent='Sida '+pageNumber+' / '+documentPdf.numPages;$('secZoom').textContent=Math.round(zoom*100)+'%';drawMarkers();
  if(focus&&oldW>0&&oldH>0){viewer.scrollLeft=(oldSL+focus.x)/oldW*pageWidth-focus.x;viewer.scrollTop=(oldST+focus.y)/oldH*pageHeight-focus.y}
  return true;
 }).catch(error=>{if(error.name!=='RenderingCancelledException'&&version===renderVersion)msg('Kunde inte visa sidan. Prova Passa eller välj en annan sida.',true);return false});
 return renderQueue;
}
let wheelZoomTimer=null,wheelZoomTarget=null,wheelZoomFocus=null;
function setZoom(z,focus={x:viewer.clientWidth/2,y:viewer.clientHeight/2}){
 zoom=Math.max(.5,Math.min(8,z));visualZoom=1;$('secStage').style.transform='';return render(false,focus)
}
viewer.addEventListener('wheel',e=>{
 if(!pdf)return;
 e.preventDefault();
 const r=viewer.getBoundingClientRect(),focus={x:e.clientX-r.left,y:e.clientY-r.top},base=wheelZoomTarget??zoom;
 wheelZoomTarget=Math.max(.5,Math.min(8,base*(e.deltaY<0?1.12:1/1.12)));wheelZoomFocus=focus;
 visualZoom=wheelZoomTarget/zoom;
 $('secStage').style.transform='scale('+visualZoom+')';
 $('secStage').style.transformOrigin=(viewer.scrollLeft+focus.x)+'px '+(viewer.scrollTop+focus.y)+'px';
 $('secZoom').textContent=Math.round(wheelZoomTarget*100)+'%';
 clearTimeout(wheelZoomTimer);
 wheelZoomTimer=setTimeout(()=>{const target=wheelZoomTarget,finalFocus=wheelZoomFocus;wheelZoomTarget=null;wheelZoomFocus=null;wheelZoomTimer=null;setZoom(target,finalFocus)},180);
},{passive:false});

viewer.addEventListener('pointerdown',e=>{
 if(!pdf||addType||e.button!==0||e.pointerType==='touch'||e.target.closest('.secMarker'))return;
 panMouse={pointer:e.pointerId,x:e.clientX,y:e.clientY,left:viewer.scrollLeft,top:viewer.scrollTop};
 viewer.classList.add('mousePanning');viewer.setPointerCapture(e.pointerId);e.preventDefault();
});
viewer.addEventListener('pointermove',e=>{
 if(!panMouse||panMouse.pointer!==e.pointerId)return;
 viewer.scrollLeft=panMouse.left-(e.clientX-panMouse.x);viewer.scrollTop=panMouse.top-(e.clientY-panMouse.y);e.preventDefault();
});
function endMousePan(e){
 if(!panMouse||panMouse.pointer!==e.pointerId)return;
 try{viewer.releasePointerCapture(e.pointerId)}catch(_){}
 panMouse=null;viewer.classList.remove('mousePanning');
}
viewer.addEventListener('pointerup',endMousePan);
viewer.addEventListener('pointercancel',endMousePan);
viewer.addEventListener('lostpointercapture',e=>{if(panMouse&&panMouse.pointer===e.pointerId){panMouse=null;viewer.classList.remove('mousePanning')}});

viewer.addEventListener('touchstart',e=>{
 if(e.touches.length===2){
  e.preventDefault();panTouch=null;const a=e.touches[0],b=e.touches[1],r=viewer.getBoundingClientRect();
  pinch={dist:Math.max(1,Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY)),zoom,focus:{x:(a.clientX+b.clientX)/2-r.left,y:(a.clientY+b.clientY)/2-r.top}};
 }else if(e.touches.length===1&&!addType&&!e.target.closest('.secMarker')){
  const t=e.touches[0];panTouch={x:t.clientX,y:t.clientY,left:viewer.scrollLeft,top:viewer.scrollTop};
 }
},{passive:false});
viewer.addEventListener('touchmove',e=>{
 if(e.touches.length===2&&pinch){
  e.preventDefault();const a=e.touches[0],b=e.touches[1];
  visualZoom=Math.max(.5,Math.min(8,pinch.zoom*Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY)/pinch.dist))/pinch.zoom;
  $('secStage').style.transform='scale('+visualZoom+')';
  $('secStage').style.transformOrigin=(viewer.scrollLeft+pinch.focus.x)+'px '+(viewer.scrollTop+pinch.focus.y)+'px';
  $('secZoom').textContent=Math.round(pinch.zoom*visualZoom*100)+'%';
 }else if(e.touches.length===1&&panTouch&&!addType&&!pinch){
  e.preventDefault();const t=e.touches[0];viewer.scrollLeft=panTouch.left-(t.clientX-panTouch.x);viewer.scrollTop=panTouch.top-(t.clientY-panTouch.y);
 }
},{passive:false});
function endTouch(e){
 if(pinch&&e.touches.length<2){const p=pinch;pinch=null;panTouch=null;setZoom(p.zoom*visualZoom,p.focus)}
 if(e.touches.length===0)panTouch=null;
}
viewer.addEventListener('touchend',endTouch,{passive:true});
viewer.addEventListener('touchcancel',endTouch,{passive:true});

$('securityFile').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{msg('Laddar ritning…');const bytes=new Uint8Array(await f.arrayBuffer()),key=await fingerprint(bytes),candidate=await pdfjsLib.getDocument({data:bytes.slice()}).promise,saved=loadSaved(key);if(pdf)try{await pdf.destroy()}catch(_){}
pdf=candidate;sourceBytes=bytes;activeKey=key;items=(saved?.items||[]).map(normalize);project={...emptyProject(),...(saved?.project||{})};page=1;zoom=1;visualZoom=1;pinch=null;panTouch=null;panMouse=null;addType=null;document.body.classList.remove('secAdding');$('secStage').style.transform='';syncProjectInputs();refreshTop();await render(true);viewer.scrollLeft=0;viewer.scrollTop=0;msg('Ritningen är klar. Lägg till Inbrottslarm, Lås & Dörrmiljö eller Passer.')}catch(err){msg('Kunde inte öppna PDF-filen.',true)}};
$('secPrev').onclick=()=>{if(pdf&&page>1){clearTimeout(wheelZoomTimer);wheelZoomTarget=null;page--;zoom=1;visualZoom=1;$('secStage').style.transform='';render(true)}};$('secNext').onclick=()=>{if(pdf&&page<pdf.numPages){clearTimeout(wheelZoomTimer);wheelZoomTarget=null;page++;zoom=1;visualZoom=1;$('secStage').style.transform='';render(true)}};$('secZoomIn').onclick=()=>{clearTimeout(wheelZoomTimer);wheelZoomTarget=null;setZoom(zoom*1.25)};$('secZoomOut').onclick=()=>{clearTimeout(wheelZoomTimer);wheelZoomTarget=null;setZoom(zoom/1.25)};$('secFit').onclick=$('secFitMobile').onclick=()=>{clearTimeout(wheelZoomTimer);wheelZoomTarget=null;zoom=1;visualZoom=1;$('secStage').style.transform='';render(true)};
function cur(){return items.find(o=>o.uid===selected)}
function buildChecklist(o){const box=$('secChecklist');box.replaceChildren();const checks=allChecks(o);checks.forEach(([n,title])=>{const c=o.checks[n]||{result:'',note:''},row=document.createElement('section');row.className='secCheck'+(c.result?' result-'+c.result:'');const head=document.createElement('div');head.className='secCheckHead';head.innerHTML='<strong>'+n+'</strong><span></span>';head.querySelector('span').textContent=title;if(o.customChecks.some(x=>x.id===n)){const badge=document.createElement('em');badge.className='secCustomBadge';badge.textContent='Egen';head.appendChild(badge);const remove=document.createElement('button');remove.type='button';remove.className='secRemoveCustom';remove.textContent='Ta bort';remove.setAttribute('aria-label','Ta bort kontrollpunkt '+n);remove.onclick=e=>{e.stopPropagation();if(!confirm('Ta bort kontrollpunkten '+n+'?'))return;o.customChecks=o.customChecks.filter(x=>x.id!==n);delete o.checks[n];o.manualFail=false;syncStatus(o);save();buildChecklist(o);$('secStatus').value=o.status;drawMarkers();showOverview()};head.appendChild(remove)}row.appendChild(head);const choices=document.createElement('div');choices.className='secChoices';[['na','Ingår ej'],['ok','Klart utan anm.'],['remark','Klart med anm.']].forEach(([value,label])=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.classList.toggle('active',c.result===value);b.onclick=()=>{c.result=value;o.checks[n]=c;if(value==='remark'&&!c.note)c.note='';if(value!=='remark'&&c.note)c.note='';o.manualFail=false;syncStatus(o);save();buildChecklist(o);$('secStatus').value=o.status;drawMarkers();updateProgress(o);showOverview()};choices.appendChild(b)});row.appendChild(choices);if(c.result==='remark'){const fault=document.createElement('div');fault.className='secFault';const select=document.createElement('select');select.innerHTML='<option value="">Välj vanligt fel…</option>';for(const f of SYSTEMS[o.type].faults[n]||[]){const op=document.createElement('option');op.value=f;op.textContent=f;if(c.note===f)op.selected=true;select.appendChild(op)}select.onchange=()=>{if(select.value){c.note=select.value;input.value=c.note;save();showOverview()}};const input=document.createElement('input');input.placeholder='Beskriv felet / annat fel';input.value=c.note||'';input.oninput=()=>{c.note=input.value;save();showOverview()};fault.append(select,input);row.appendChild(fault)}box.appendChild(row)});updateProgress(o)}
function updateProgress(o){const checks=allChecks(o),done=checks.filter(([n])=>['na','ok','remark'].includes(o.checks[n]?.result)).length;$('secProgress').textContent=done+' / '+checks.length+' kontrollerade'}
function showSelected(){const o=cur();$('secNoSelection').hidden=!!o;$('secForm').hidden=!o;if(!o)return;const cfg=SYSTEMS[o.type];$('secProtocolType').textContent='CHECKLISTA REVISION AV '+cfg.label;$('secProtocolTitle').textContent=o.id+' · '+(o.location||'Placering ej angiven');$('secNumber').value=o.number;$('secLocation').value=o.location;$('secId').value=o.id;$('secNotes').value=o.notes;syncStatus(o);$('secStatus').value=o.status;buildChecklist(o)}
['secLocation','secId','secNotes'].forEach(id=>$(id).oninput=()=>{const o=cur();if(!o)return;if(id==='secLocation')o.location=$(id).value;if(id==='secId')o.id=$(id).value;if(id==='secNotes')o.notes=$(id).value;save();drawMarkers();showOverview()});
$('secStatus').onchange=()=>{const o=cur();if(!o)return;o.manualFail=$('secStatus').value==='fail';syncStatus(o);$('secStatus').value=o.status;save();drawMarkers();showOverview()};
$('secAddCheck').onclick=()=>{const o=cur();if(!o)return;const title=prompt('Skriv den extra kontrollpunkten:','');if(!title?.trim())return;const used=new Set(allChecks(o).map(([n])=>n));let next=SYSTEMS[o.type].checks.length+1;while(used.has('1.'+next))next++;const id='1.'+next;o.customChecks.push({id,title:title.trim()});o.checks[id]={result:'',note:''};o.manualFail=false;syncStatus(o);save();buildChecklist(o);$('secStatus').value=o.status;drawMarkers()};
$('secApproveAll').onclick=()=>{const o=cur();if(!o)return;allChecks(o).forEach(([n])=>{o.checks[n]=o.checks[n]||{result:'',note:''};o.checks[n].result='ok';o.checks[n].note=''});o.manualFail=false;syncStatus(o);save();buildChecklist(o);$('secStatus').value=o.status;drawMarkers();showOverview()};
$('secDelete').onclick=()=>{const o=cur();if(o&&confirm('Ta bort '+o.id+'?')){items=items.filter(x=>x.uid!==o.uid);selected=null;save();drawMarkers();showSelected();go('drawing')}};
function issues(o){const arr=[];allChecks(o).forEach(([n,t])=>{const c=o.checks[n];if(c?.result==='remark')arr.push(n+' '+t+' – '+(c.note||'Anmärkning utan beskrivning'))});if(o.notes.trim())arr.push('Allmän anmärkning: '+o.notes.trim());return arr}
function showOverview(){const list=$('secOverviewList');if(!list)return;list.replaceChildren();const counts={ok:0,action:0,fail:0,untested:0};items.forEach(o=>counts[statusOf(o)]++);$('secOverviewSummary').textContent=items.length+' objekt · '+(counts.action+counts.fail)+' med fel/anmärkning · '+counts.untested+' ej klara';items.slice().sort((a,b)=>a.type.localeCompare(b.type)||a.number-b.number).forEach(o=>{const s=statusOf(o),card=document.createElement('article');card.className='secSummaryCard '+s;const h=document.createElement('h3');h.textContent=o.id+' · '+SYSTEMS[o.type].label+(o.location?' · '+o.location:'');card.appendChild(h);const iss=issues(o);if(iss.length){const ul=document.createElement('ul');iss.forEach(t=>{const li=document.createElement('li');li.textContent=t;ul.appendChild(li)});card.appendChild(ul)}else{const p=document.createElement('p');p.textContent=s==='ok'?'Godkänd utan anmärkning':'Inga registrerade anmärkningar.';card.appendChild(p)}card.onclick=()=>{selected=o.uid;showSelected();$('securityOverview').close();go('protocol')};list.appendChild(card)})}
$('secNavOverview').onclick=()=>{showOverview();$('securityOverview').showModal()};$('secCloseOverview').onclick=()=>$('securityOverview').close();$('secNavDrawing').onclick=()=>go('drawing');$('secNavProtocol').onclick=()=>go('protocol');$('secNavProject').onclick=()=>go('project');$('secCloseProtocol').onclick=$('secCloseProject').onclick=()=>go('drawing');
function syncProjectInputs(){const map={secProjectName:'projectName',secFacilityNo:'facilityNo',secOrder:'order',secDate:'date',secNextDate:'nextDate',secCustomer:'customer',secAgreement:'agreement',secContact:'contact',secPhone:'phone',secAddress:'address',secCompany:'company',secTechnician:'technician',secCompanyContact:'companyContact',secCompanyPhone:'companyPhone',secCompanyAddress:'companyAddress',secSignature:'signature'};for(const[id,key]of Object.entries(map))$(id).value=project[key]||''}
(function(){const map={secProjectName:'projectName',secFacilityNo:'facilityNo',secOrder:'order',secDate:'date',secNextDate:'nextDate',secCustomer:'customer',secAgreement:'agreement',secContact:'contact',secPhone:'phone',secAddress:'address',secCompany:'company',secTechnician:'technician',secCompanyContact:'companyContact',secCompanyPhone:'companyPhone',secCompanyAddress:'companyAddress',secSignature:'signature'};for(const[id,key]of Object.entries(map))$(id).oninput=()=>{project[key]=$(id).value;save()}})();
function reportDoc(){const doc=new jspdf.jsPDF('p','mm','a4'),left=12,w=186;doc.__protocolPages={};doc.__backLinks=[];function txt(t,x,y,size=8,bold=false){doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(size);doc.setTextColor(25,40,48);doc.text(String(t||''),x,y)}function head(title){doc.setFillColor(19,43,56);doc.rect(0,0,210,22,'F');doc.setTextColor(255,255,255);doc.setFont('helvetica','bold');doc.setFontSize(14);doc.text(title,left,13)}head('ANMÄRKNINGSÖVERSIKT');let y=30;txt((project.projectName||'Projekt')+' · '+items.length+' objekt',left,y,9,true);y+=8;items.filter(o=>issues(o).length||statusOf(o)!=='ok').forEach(o=>{if(y>268){doc.addPage();head('ANMÄRKNINGSÖVERSIKT – forts.');y=30}const c=COLORS[statusOf(o)];doc.setFillColor(...c);doc.rect(left,y,3,10,'F');txt(o.id+' · '+SYSTEMS[o.type].label+(o.location?' · '+o.location:''),left+5,y+4,8,true);const ins=issues(o);txt(ins.join(' | ')||(statusOf(o)==='untested'?'Ej färdigkontrollerad':'Status: '+statusOf(o)),left+5,y+8,6.5);y+=12});if(!items.length){txt('Inga objekt registrerade.',left,y)}
items.forEach(o=>{doc.addPage();doc.__protocolPages[o.uid]=doc.getNumberOfPages();doc.__backLinks.push({pageNo:doc.getNumberOfPages(),drawingPage:o.page,rect:[187,8,10,7]});doc.setDrawColor(40);doc.rect(left,8,w,18);txt('SERVICE',left,32,8,true);txt('CHECKLISTA REVISION AV '+SYSTEMS[o.type].label,105,18,11,true);txt('←',191,13,12,true);let py=39;const row=(a,b)=>{doc.rect(left,py,93,7);doc.rect(left+93,py,93,7);txt(a,left+2,py+4.5,6.5,true);txt(b,left+95,py+4.5,6.5);py+=7};row('ANLÄGGNING: '+(project.projectName||''),'BESTÄLLARE: '+(project.customer||''));row('Anläggningsnummer: '+(project.facilityNo||''),'Avtalsnummer: '+(project.agreement||''));row('Objekt: '+o.id,'Placering: '+(o.location||''));py+=3;const widths=[13,100,18,25,30],titles=['Nr','Benämning Kontroll','Ingår ej','Klart utan','Klart med'];let x=left;titles.forEach((t,i)=>{doc.setFillColor(240);doc.rect(x,py,widths[i],9,'FD');txt(t,x+1.5,py+5.5,6,true);x+=widths[i]});py+=9;allChecks(o).forEach(([n,t])=>{if(py>265){doc.addPage();py=20}x=left;const c=o.checks[n]||{},vals=[n,t,c.result==='na'?'–':'',c.result==='ok'?'✓':'',c.result==='remark'?'X':''];vals.forEach((v,i)=>{doc.rect(x,py,widths[i],8);txt(v,x+1.5,py+5,6.3,i===0);x+=widths[i]});py+=8;if(c.result==='remark'&&c.note){doc.rect(left+13,py,173,7);txt('Anmärkning: '+c.note,left+15,py+4.5,6);py+=7}});if(o.notes){py+=3;txt('Allmän info: '+o.notes,left,py,7,true)}});return doc}
async function exportPdf(){if(!pdf||!sourceBytes)return msg('Öppna en ritning först.',true);try{msg('Skapar PDF…');const {PDFDocument,PDFName,PDFArray,StandardFonts,rgb}=PDFLib,src=await PDFDocument.load(sourceBytes,{updateMetadata:false}),out=await PDFDocument.create(),copied=await out.copyPages(src,src.getPageIndices());copied.forEach(p=>out.addPage(p));const font=await out.embedFont(StandardFonts.HelveticaBold),links=[];for(let i=0;i<copied.length;i++){const pg=copied[i],p=await pdf.getPage(i+1),vp=p.getViewport({scale:1});items.filter(o=>o.page===i+1).forEach(o=>{const[x,y]=vp.convertToPdfPoint(o.x*vp.width,o.y*vp.height),label=o.id,size=7,tw=font.widthOfTextAtSize(label,size),c=SYSTEMS[o.type].prefix==='I'?rgb(.55,.35,.17):SYSTEMS[o.type].prefix==='L'?rgb(.09,.42,.58):rgb(.42,.29,.6);const r=Math.max(9,tw/2+5);pg.drawCircle({x,y,size:r,color:c,borderColor:rgb(1,1,1),borderWidth:1.4});pg.drawText(label,{x:x-tw/2,y:y-size/3,size,font,color:rgb(1,1,1)});links.push({pageIndex:i,uid:o.uid,x,y,radius:r})})}const report=reportDoc(),map=report.__protocolPages||{},backs=report.__backLinks||[],rpdf=await PDFDocument.load(report.output('arraybuffer')),rpages=await out.copyPages(rpdf,rpdf.getPageIndices());rpages.forEach(p=>out.addPage(p));function addLink(sp,tp,rect){const ref=out.context.register(out.context.obj({Type:'Annot',Subtype:'Link',Rect:rect,Border:[0,0,0],Dest:out.context.obj([tp.ref,PDFName.of('Fit')])}));const ex=sp.node.get(PDFName.of('Annots'));if(ex)sp.node.lookup(PDFName.of('Annots'),PDFArray).push(ref);else sp.node.set(PDFName.of('Annots'),out.context.obj([ref]))}links.forEach(l=>{const n=map[l.uid];if(n){const hit=Math.max(14,l.radius||12);addLink(out.getPage(l.pageIndex),out.getPage(src.getPageCount()+n-1),[l.x-hit,l.y-hit,l.x+hit,l.y+hit])}});backs.forEach(b=>{const spi=src.getPageCount()+b.pageNo-1,tpi=b.drawingPage-1;if(spi>=out.getPageCount()||tpi<0)return;const sp=out.getPage(spi),tp=out.getPage(tpi),sz=sp.getSize(),sx=sz.width/210,sy=sz.height/297,[mx,my,mw,mh]=b.rect;addLink(sp,tp,[mx*sx,sz.height-(my+mh)*sy,(mx+mw)*sx,sz.height-my*sy])});const bytes=await out.save(),url=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'})),a=document.createElement('a');a.href=url;a.download='sakerhetsservice-'+(project.projectName||'projekt').replace(/\s+/g,'-')+'.pdf';a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);msg('PDF skapad med ritning, sammanfattning och protokoll.')}catch(e){console.error(e);msg('Kunde inte skapa PDF.',true)}}

let previewPdf=null,previewPage=1,previewRenderTask=null;
async function renderCustomerPreview(){
 if(!previewPdf)return;
 if(previewRenderTask)try{previewRenderTask.cancel()}catch(_){}
 const p=await previewPdf.getPage(previewPage),wrap=$('secPreviewWrap'),natural=p.getViewport({scale:1}),scale=Math.max(.2,Math.min((wrap.clientWidth-24)/natural.width,(wrap.clientHeight-24)/natural.height)),dpr=Math.min(window.devicePixelRatio||1,2),vp=p.getViewport({scale:scale*dpr}),cssVp=p.getViewport({scale});
 const cv=$('secPreviewCanvas');cv.width=Math.ceil(vp.width);cv.height=Math.ceil(vp.height);cv.style.width=cssVp.width+'px';cv.style.height=cssVp.height+'px';
 previewRenderTask=p.render({canvasContext:cv.getContext('2d'),viewport:vp});try{await previewRenderTask.promise}catch(e){if(e.name!=='RenderingCancelledException')throw e}
 $('secPreviewPage').textContent=previewPage+' / '+previewPdf.numPages;
 $('secPreviewPrev').disabled=previewPage<=1;$('secPreviewNext').disabled=previewPage>=previewPdf.numPages;
}
async function openCustomerPreview(){
 try{
  const report=reportDoc(),pageMap=report.__protocolPages||{},bytes=new Uint8Array(report.output('arraybuffer'));
  if(previewPdf)try{await previewPdf.destroy()}catch(_){}
  previewPdf=await pdfjsLib.getDocument({data:bytes}).promise;
  const o=cur();previewPage=o&&pageMap[o.uid]?pageMap[o.uid]:1;
  $('secPreviewTitle').textContent=o?SYSTEMS[o.type].label+' · '+o.id:'Anmärkningsöversikt';
  $('secPreviewDialog').showModal();await renderCustomerPreview();
 }catch(e){console.error(e);msg('Kunde inte visa kundmallen.',true)}
}
$('securityPreview').onclick=openCustomerPreview;
$('secPreviewClose').onclick=()=>$('secPreviewDialog').close();
$('secPreviewPrev').onclick=()=>{if(previewPdf&&previewPage>1){previewPage--;renderCustomerPreview()}};
$('secPreviewNext').onclick=()=>{if(previewPdf&&previewPage<previewPdf.numPages){previewPage++;renderCustomerPreview()}};
$('secPreviewDialog').addEventListener('close',()=>{if(previewRenderTask)try{previewRenderTask.cancel()}catch(_){}});
window.addEventListener('resize',()=>{if($('secPreviewDialog').open)renderCustomerPreview()});
$('securityExport').onclick=exportPdf;
project=emptyProject();refreshTop();