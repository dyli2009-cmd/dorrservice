pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
const $=id=>document.getElementById(id);
const SYSTEMS={
 alarm:{label:'Inbrottslarm',markerLabel:'Inbrott',prefix:'I',checks:[
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
 lock:{label:'Lås & Dörrmiljö',markerLabel:'Lås & Dörrmiljö',prefix:'L',checks:[
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
 access:{label:'Passer',markerLabel:'Passer',prefix:'P',checks:[
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
let pdf=null,sourceBytes=null,page=1,zoom=1,baseScale=1,visualZoom=1,items=[],textNotes=[],drawingExtras=[],selected=null,addType=null,textMode=false,project={},logoData='',renderTask=null,renderVersion=0,renderQueue=Promise.resolve(),activeKey=null,pinch=null,panTouch=null,panMouse=null,pageWidth=1,pageHeight=1,suppressPageSwipeUntil=0,precisionMode=false;
const canvas=$('secCanvas'),ctx=canvas.getContext('2d'),markers=$('secMarkers'),viewer=$('secViewer');
const MAX_PIXELS=4000000,MAX_SIDE=4096;
function boundedViewport(p,scale){const natural=p.getViewport({scale:1});return p.getViewport({scale:Math.min(scale,Math.sqrt(MAX_PIXELS/(natural.width*natural.height)),MAX_SIDE/natural.width,MAX_SIDE/natural.height)})}
const PROJECT_FIELDS=['secProjectName','secFacilityNo','secOrder','secDate','secNextDate','secCustomer','secAgreement','secContact','secPhone','secAddress','secCompany','secTechnician','secCompanyContact','secCompanyPhone','secCompanyAddress','secSignature'];
function localToday(){const d=new Date(),local=new Date(d.getTime()-d.getTimezoneOffset()*60000);return local.toISOString().slice(0,10)}
function cleanSecurityRemarkText(value){return String(value||'').replace(/\s+[–—-]\s+/g,', ').replace(/\s{2,}/g,' ').trim()}
function shiftedNextDate(previousDate,previousNextDate){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(previousDate||'')||!/^\d{4}-\d{2}-\d{2}$/.test(previousNextDate||''))return '';
 const from=new Date(previousDate+'T12:00:00'),to=new Date(previousNextDate+'T12:00:00'),days=Math.round((to-from)/86400000);
 if(!Number.isFinite(days)||days<1||days>730)return '';
 const today=localToday(),base=new Date(today+'T12:00:00');base.setDate(base.getDate()+days);
 const local=new Date(base.getTime()-base.getTimezoneOffset()*60000);return local.toISOString().slice(0,10);
}
function emptyProject(){return {projectName:'',facilityNo:'',order:'',date:localToday(),nextDate:'',customer:'',agreement:'',contact:'',phone:'',address:'',postalCode:'',postalCity:'',company:'',technician:'',companyContact:'',companyPhone:'',companyAddress:'',companyPostalCode:'',companyPostalCity:'',signature:''}}
function hasSecurityRecordedProblem(o){return o.status==='action'||o.status==='fail'||Object.values(o.checks||{}).some(c=>c.result==='remark')}
function isSecurityRemediated(o){return hasSecurityRecordedProblem(o)&&!!String(o.remediationDate||'').trim()&&!!String(o.remediationSignature||'').trim()}
function hasSecurityProblem(o){return hasSecurityRecordedProblem(o)&&!isSecurityRemediated(o)}
function statusOf(o){if(isSecurityRemediated(o))return'ok';if(o.status==='fail')return'fail';if(Object.values(o.checks||{}).some(c=>c.result==='remark'))return'action';if(o.status==='ok')return'ok';return'untested'}
function securityStatusText(o){if(isSecurityRemediated(o))return'Åtgärdad';return statusOf(o)==='fail'?'Ej godkänd':statusOf(o)==='action'?'Åtgärd krävs':statusOf(o)==='ok'?'Godkänd':'Ej klar'}
function normalizeSecurityCheckEdits(o){
 const valid=new Set((SYSTEMS[o.type]?.checks||[]).map(([n])=>n)),raw=o.checkEdits&&typeof o.checkEdits==='object'&&!Array.isArray(o.checkEdits)?o.checkEdits:{},clean={};
 Object.entries(raw).forEach(([id,value])=>{if(!valid.has(id))return;if(value===null)clean[id]=null;else if(typeof value==='string'&&value.trim())clean[id]=value.trim()});
 o.checkEdits=clean;
}
function normalize(o){o.checks=o.checks||{};Object.values(o.checks).forEach(c=>{if(c&&typeof c.note==='string')c.note=cleanSecurityRemarkText(c.note)});if(Array.isArray(o.previousIssues))o.previousIssues.forEach(issue=>{if(issue&&typeof issue.note==='string')issue.note=cleanSecurityRemarkText(issue.note)});const cfg=SYSTEMS[o.type];normalizeSecurityCheckEdits(o);const used=new Set((cfg?.checks||[]).map(([n])=>n));o.customChecks=(Array.isArray(o.customChecks)?o.customChecks:[]).filter(c=>{if(!c||typeof c.id!=='string'||used.has(c.id)||typeof c.title!=='string'||!c.title.trim())return false;used.add(c.id);c.title=c.title.trim();return true});allChecks(o).forEach(([n])=>o.checks[n]=o.checks[n]||{result:'',note:''});o.previousIssues=Array.isArray(o.previousIssues)?o.previousIssues:[];o.previousNotes=o.previousNotes||'';o.previousStatus=o.previousStatus||'';o.previousServiceDate=o.previousServiceDate||'';o.status=o.status||'untested';o.manualFail=!!o.manualFail||o.status==='fail';o.notes=o.notes||'';o.location=o.location||'';o.remediationDate=o.remediationDate||'';o.remediationSignature=o.remediationSignature||'';const legacyId=(cfg?.prefix||'')+(Number(o.number)||1);if(!o.id||o.id===legacyId)o.id=(cfg?.markerLabel||cfg?.label||o.type)+' '+(Number(o.number)||1);if(!Number.isFinite(o.labelX))o.labelX=Math.max(.035,Math.min(.965,o.x+(o.x>.78?-.075:.075)));if(!Number.isFinite(o.labelY))o.labelY=Math.max(.035,Math.min(.965,o.y-.045));syncStatus(o);return o}
function msg(t,e=false){$('securityMessage').textContent=t;$('securityMessage').classList.toggle('error',e)}
async function fingerprint(bytes){const h=await crypto.subtle.digest('SHA-256',bytes);return[...new Uint8Array(h)].map(n=>n.toString(16).padStart(2,'0')).join('')}
function save(){refreshTop();if(!activeKey)return true;const data={version:1,items,textNotes,drawingExtras,project,logoData,updatedAt:new Date().toISOString()};try{localStorage.setItem('security-service:'+activeKey,JSON.stringify(data));return true}catch(e){console.error(e);msg('Kunde inte spara allt på enheten. Prova en mindre logga eller exportera PDF.',true);return false}}
function loadSaved(key){try{return JSON.parse(localStorage.getItem('security-service:'+key)||'null')}catch(e){return null}}
function securityWorkspaceTitle(view=document.body.dataset.view){
 const name=project.projectName||$('securityFile').files?.[0]?.name||(pdf?'Ritning öppnad':'Välj en ritning');
 if(view==='protocol'&&pdf)return name+' – Säkerhetsprotokoll';
 if(view==='project'&&pdf)return 'Aktuell ritning: '+name;
 return name;
}
function securityProtocolTitle(){return securityWorkspaceTitle('protocol')}
function refreshTop(){$('securityObject').textContent=securityWorkspaceTitle();$('securityCount').textContent=items.length+' objekt';document.body.classList.toggle('secHasPdf',!!pdf);if($('secChangeDrawing'))$('secChangeDrawing').hidden=!pdf;if($('secProtocolTitle'))$('secProtocolTitle').textContent=securityProtocolTitle()}
function go(view){document.body.dataset.view=view;$('secNavDrawing').classList.toggle('active',view==='drawing');$('secNavProtocol').classList.toggle('active',view==='protocol');$('secNavProject').classList.toggle('active',view==='project');if(view==='protocol'||view==='project')msg('');refreshTop()}
function allChecks(o){normalizeSecurityCheckEdits(o);const base=(SYSTEMS[o.type]?.checks||[]).filter(([n])=>o.checkEdits[n]!==null).map(([n,title])=>[n,typeof o.checkEdits[n]==='string'?o.checkEdits[n]:title]);return [...base,...(Array.isArray(o.customChecks)?o.customChecks:[]).map(c=>[c.id,c.title])]}
function editSecurityCheck(o,id,title){
 if(typeof title!=='string'||!title.trim())return false;
 normalize(o);const next=title.trim(),custom=o.customChecks.find(c=>c.id===id),base=(SYSTEMS[o.type]?.checks||[]).find(([n])=>n===id);
 if(custom){if(custom.title===next)return false;custom.title=next}
 else if(base){const current=typeof o.checkEdits[id]==='string'?o.checkEdits[id]:base[1];if(current===next)return false;if(next===base[1])delete o.checkEdits[id];else o.checkEdits[id]=next}
 else return false;
 o.checks[id]={result:'',note:''};o.manualFail=false;o.remediationDate='';o.remediationSignature='';syncStatus(o);return true;
}
function removeSecurityCheck(o,id){
 normalize(o);const custom=o.customChecks.some(c=>c.id===id),base=(SYSTEMS[o.type]?.checks||[]).some(([n])=>n===id);
 if(custom)o.customChecks=o.customChecks.filter(c=>c.id!==id);else if(base)o.checkEdits[id]=null;else return false;
 delete o.checks[id];o.manualFail=false;o.remediationDate='';o.remediationSignature='';syncStatus(o);return true;
}
function syncStatus(o){
 if(o.manualFail){o.status='fail';return o.status}
 const checks=allChecks(o),results=checks.map(([n])=>o.checks?.[n]?.result||'');
 if(results.some(r=>r==='remark'))o.status='action';
 else if(checks.length&&results.every(r=>r==='ok'||r==='na'))o.status='ok';
 else o.status='untested';
 return o.status
}
function nextNumber(type){const nums=items.filter(x=>x.type===type).map(x=>Number(x.number)||0);return Math.max(0,...nums)+1}
function securityDrawingLabel(o){const cfg=SYSTEMS[o.type];return (cfg?.markerLabel||cfg?.label||o.type)+' '+(Number(o.number)||1)}
function createItem(type,x,y){const n=nextNumber(type),cfg=SYSTEMS[type],label=(cfg.markerLabel||cfg.label)+' '+n,o=normalize({uid:crypto.randomUUID(),type,number:n,id:label,page,x,y,labelX:Math.max(.035,Math.min(.965,x+(x>.78?-.075:.075))),labelY:Math.max(.035,Math.min(.965,y-.045)),checks:{},customChecks:[],status:'untested',remediationDate:'',remediationSignature:''});items.push(o);selected=o.uid;addType=null;document.body.classList.remove('secAdding');save();drawMarkers();showSelected();go('drawing');$('secHint').textContent=securityDrawingLabel(o)+' är tillagd. Dra pilpunkten och etiketten till rätt läge. Tryck sedan på etiketten för att öppna protokollet.';$('secHint').hidden=false}
function drawMarkers(){
 markers.replaceChildren();
 const pageItems=items.filter(o=>o.page===page).map(normalize);
 const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');
 svg.setAttribute('class','secConnectorLayer');svg.setAttribute('width','100%');svg.setAttribute('height','100%');svg.setAttribute('viewBox','0 0 1000 1000');svg.setAttribute('preserveAspectRatio','none');
 const defs=document.createElementNS(ns,'defs');
 ['ok','action','fail','untested'].forEach(key=>{const marker=document.createElementNS(ns,'marker');marker.setAttribute('id','secArrow-'+key);marker.setAttribute('viewBox','0 0 8 8');marker.setAttribute('refX','7');marker.setAttribute('refY','4');marker.setAttribute('markerWidth','7');marker.setAttribute('markerHeight','7');marker.setAttribute('orient','auto');const path=document.createElementNS(ns,'path');path.setAttribute('d','M0,0 L8,4 L0,8 z');path.setAttribute('fill',key==='ok'?'#238354':key==='action'?'#c77c13':key==='fail'?'#bd3f46':'#77858e');marker.appendChild(path);defs.appendChild(marker)});
 const textArrow=document.createElementNS(ns,'marker');textArrow.setAttribute('id','secTextArrow');textArrow.setAttribute('viewBox','0 0 8 8');textArrow.setAttribute('refX','7');textArrow.setAttribute('refY','4');textArrow.setAttribute('markerWidth','6');textArrow.setAttribute('markerHeight','6');textArrow.setAttribute('orient','auto');const textArrowPath=document.createElementNS(ns,'path');textArrowPath.setAttribute('d','M0,0 L8,4 L0,8 z');textArrowPath.setAttribute('fill','#173f55');textArrow.appendChild(textArrowPath);defs.appendChild(textArrow);
 svg.appendChild(defs);
 pageItems.forEach(o=>{
  const st=statusOf(o),line=document.createElementNS(ns,'line');
  line.setAttribute('x1',String(o.labelX*1000));line.setAttribute('y1',String(o.labelY*1000));line.setAttribute('x2',String(o.x*1000));line.setAttribute('y2',String(o.y*1000));line.setAttribute('class','secConnector '+st);line.setAttribute('marker-end','url(#secArrow-'+st+')');svg.appendChild(line);
 });
 markers.appendChild(svg);
 pageItems.forEach(o=>{
  const target=document.createElement('button');target.type='button';target.className='secTarget status-'+statusOf(o);target.title='Dörrpunkt – dra för att flytta exakt träffpunkt';target.setAttribute('aria-label','Dörrpunkt för '+o.id);
  const grab=document.createElement('button');grab.type='button';grab.className='precisionPointGrab'+(o.uid===selected?' selectedPrecision':'');grab.setAttribute('aria-label','Precisionsgrepp för '+o.id);grab.title='Precision – dra här med fingret så ser du träffpunkten';
  let targetDrag=null;
  const syncTargetPosition=()=>{target.style.left=o.x*100+'%';target.style.top=o.y*100+'%';grab.style.left=o.x*100+'%';grab.style.top=o.y*100+'%';grab.classList.toggle('precisionGrabUp',o.y>.72)};
  const beginTargetDrag=(e,node)=>{if(e.button!==0)return;e.preventDefault();e.stopPropagation();if(precisionMode)selected=o.uid;suppressPageSwipeUntil=Date.now()+1200;panTouch=null;const r=markers.getBoundingClientRect(),ax=r.left+o.x*r.width,ay=r.top+o.y*r.height,precision=window.ServicePrecisionPointer?.begin(e,ax,ay)||null;targetDrag={id:e.pointerId,x:e.clientX,y:e.clientY,originalX:o.x,originalY:o.y,moved:false,threshold:markerDragThreshold(zoom),precision};try{node.setPointerCapture(e.pointerId)}catch(_){}};
  const moveTargetDrag=e=>{if(!targetDrag||targetDrag.id!==e.pointerId||pinch)return;if(!targetDrag.moved&&Math.hypot(e.clientX-targetDrag.x,e.clientY-targetDrag.y)<targetDrag.threshold)return;targetDrag.moved=true;const r=markers.getBoundingClientRect();if(targetDrag.precision){const p=window.ServicePrecisionPointer.point(e,targetDrag.precision);o.x=Math.max(0,Math.min(1,(p.x-r.left)/r.width));o.y=Math.max(0,Math.min(1,(p.y-r.top)/r.height))}else{o.x=Math.max(0,Math.min(1,targetDrag.originalX+(e.clientX-targetDrag.x)/r.width));o.y=Math.max(0,Math.min(1,targetDrag.originalY+(e.clientY-targetDrag.y)/r.height))}syncTargetPosition();const line=svg.querySelector('[data-uid="'+CSS.escape(o.uid)+'"]');if(line){line.setAttribute('x2',String(o.x*1000));line.setAttribute('y2',String(o.y*1000))}};
  const endTargetDrag=e=>{suppressPageSwipeUntil=Date.now()+700;if(!targetDrag||targetDrag.id!==e.pointerId)return;window.ServicePrecisionPointer?.hide();if(targetDrag.moved)save();targetDrag=null};
  const cancelTargetDrag=()=>{suppressPageSwipeUntil=Date.now()+700;window.ServicePrecisionPointer?.hide();if(targetDrag){o.x=targetDrag.originalX;o.y=targetDrag.originalY;syncTargetPosition()}targetDrag=null;drawMarkers()};
  [target,grab].forEach(node=>{node.onpointerdown=e=>beginTargetDrag(e,node);node.onpointermove=moveTargetDrag;node.onpointerup=endTargetDrag;node.onpointercancel=cancelTargetDrag});
  syncTargetPosition();markers.append(target,grab);
  const line=svg.lastElementChild; // ignored; connector lookup uses data uid below
 });
 // tag connector lines after targets are known
 Array.from(svg.querySelectorAll('.secConnector')).forEach((line,i)=>line.setAttribute('data-uid',pageItems[i].uid));
 pageItems.forEach(o=>{
  const b=document.createElement('button');b.type='button';b.className='secMarker '+o.type+' status-'+statusOf(o);b.textContent=securityDrawingLabel(o);b.title=securityDrawingLabel(o)+' – dra etiketten. Pilen fortsätter peka på objektet.';b.style.left=o.labelX*100+'%';b.style.top=o.labelY*100+'%';
  let drag=null,ignore=0;
  b.onpointerdown=e=>{if(e.button!==0)return;e.stopPropagation();suppressPageSwipeUntil=Date.now()+1200;panTouch=null;const r=markers.getBoundingClientRect(),ax=r.left+o.labelX*r.width,ay=r.top+o.labelY*r.height,precision=window.ServicePrecisionPointer?.begin(e,ax,ay)||null;drag={id:e.pointerId,x:e.clientX,y:e.clientY,moved:false,originalX:o.labelX,originalY:o.labelY,threshold:markerDragThreshold(zoom),precision};b.setPointerCapture(e.pointerId)};
  b.onpointermove=e=>{if(!drag||drag.id!==e.pointerId||pinch)return;if(!drag.moved&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<drag.threshold)return;drag.moved=true;const r=markers.getBoundingClientRect();if(drag.precision){const p=window.ServicePrecisionPointer.point(e,drag.precision);o.labelX=Math.max(.015,Math.min(.985,(p.x-r.left)/r.width));o.labelY=Math.max(.015,Math.min(.985,(p.y-r.top)/r.height))}else{o.labelX=Math.max(.015,Math.min(.985,drag.originalX+(e.clientX-drag.x)/r.width));o.labelY=Math.max(.015,Math.min(.985,drag.originalY+(e.clientY-drag.y)/r.height))}b.style.left=o.labelX*100+'%';b.style.top=o.labelY*100+'%';const line=svg.querySelector('[data-uid="'+CSS.escape(o.uid)+'"]');if(line){line.setAttribute('x1',String(o.labelX*1000));line.setAttribute('y1',String(o.labelY*1000))}};
  b.onpointerup=e=>{suppressPageSwipeUntil=Date.now()+700;window.ServicePrecisionPointer?.hide();if(drag?.moved){ignore=Date.now()+700;save()}drag=null};
  b.onpointercancel=()=>{suppressPageSwipeUntil=Date.now()+700;window.ServicePrecisionPointer?.hide();if(drag){o.labelX=drag.originalX;o.labelY=drag.originalY}drag=null;ignore=Date.now()+300;drawMarkers()};
  b.onclick=e=>{e.stopPropagation();if(Date.now()<ignore)return;$('secHint').hidden=true;selected=o.uid;showSelected();go('protocol')};
  markers.appendChild(b)
 })
 const pageNotes=textNotes.filter(n=>n.page===page);
 pageNotes.forEach(n=>{
  const line=document.createElementNS(ns,'line');line.setAttribute('data-note',n.uid);line.setAttribute('x1',String(n.labelX*1000));line.setAttribute('y1',String(n.labelY*1000));line.setAttribute('x2',String(n.x*1000));line.setAttribute('y2',String(n.y*1000));line.setAttribute('class','secTextConnector');line.setAttribute('marker-end','url(#secTextArrow)');svg.appendChild(line);
  const target=document.createElement('button');target.type='button';target.className='secTextTarget';target.style.left=n.x*100+'%';target.style.top=n.y*100+'%';target.setAttribute('aria-label','Punkt för textanteckning');
  let td=null;target.onpointerdown=e=>{if(e.button!==0)return;e.stopPropagation();suppressPageSwipeUntil=Date.now()+1200;panTouch=null;td={id:e.pointerId};target.setPointerCapture(e.pointerId)};
  target.onpointermove=e=>{if(!td||td.id!==e.pointerId)return;const r=markers.getBoundingClientRect();n.x=Math.max(0,Math.min(1,(e.clientX-r.left)/r.width));n.y=Math.max(0,Math.min(1,(e.clientY-r.top)/r.height));target.style.left=n.x*100+'%';target.style.top=n.y*100+'%';line.setAttribute('x2',String(n.x*1000));line.setAttribute('y2',String(n.y*1000))};
  target.onpointerup=e=>{suppressPageSwipeUntil=Date.now()+700;if(td?.id===e.pointerId)save();td=null};target.onpointercancel=()=>{td=null};markers.appendChild(target);
  const note=document.createElement('button');note.type='button';note.className='secTextNote';note.textContent=n.text;note.style.left=n.labelX*100+'%';note.style.top=n.labelY*100+'%';
  let nd=null,ignore=0;note.onpointerdown=e=>{if(e.button!==0)return;e.stopPropagation();suppressPageSwipeUntil=Date.now()+1200;panTouch=null;nd={id:e.pointerId,x:e.clientX,y:e.clientY,moved:false};note.setPointerCapture(e.pointerId)};
  note.onpointermove=e=>{if(!nd||nd.id!==e.pointerId)return;if(!nd.moved&&Math.hypot(e.clientX-nd.x,e.clientY-nd.y)<5)return;nd.moved=true;const r=markers.getBoundingClientRect();n.labelX=Math.max(.02,Math.min(.98,(e.clientX-r.left)/r.width));n.labelY=Math.max(.02,Math.min(.98,(e.clientY-r.top)/r.height));note.style.left=n.labelX*100+'%';note.style.top=n.labelY*100+'%';line.setAttribute('x1',String(n.labelX*1000));line.setAttribute('y1',String(n.labelY*1000))};
  note.onpointerup=e=>{suppressPageSwipeUntil=Date.now()+700;if(nd?.moved){ignore=Date.now()+700;save()}nd=null};note.onpointercancel=()=>{nd=null};
  note.onclick=e=>{e.stopPropagation();if(Date.now()<ignore)return;const value=prompt('Ändra text. Lämna tomt för att ta bort:',n.text);if(value===null)return;if(!value.trim()){if(confirm('Ta bort textanteckningen?'))textNotes=textNotes.filter(x=>x.uid!==n.uid)}else n.text=value.trim();save();drawMarkers()};
  markers.appendChild(note)
 })
}
function placeSecurityText(clientX,clientY){if(!textMode||!pdf)return false;const r=markers.getBoundingClientRect(),x=Math.max(0,Math.min(1,(clientX-r.left)/r.width)),y=Math.max(0,Math.min(1,(clientY-r.top)/r.height)),value=prompt('Skriv anteckningen:','');if(value===null)return true;if(value.trim()){textNotes.push({uid:'txt-'+crypto.randomUUID(),page,x,y,labelX:Math.max(.03,Math.min(.97,x+(x>.72?-.12:.12))),labelY:Math.max(.03,Math.min(.97,y-.06)),text:value.trim()});textMode=false;document.body.classList.remove('secTextAdding');$('secAddText').classList.remove('primary');$('secHint').hidden=true;save();drawMarkers();msg('Textanteckningen är tillagd. Dra textrutan eller pilpunkten för att justera.')}return true}
let textPointerStart=null;
markers.addEventListener('pointerdown',e=>{if(!textMode||e.target!==markers)return;e.preventDefault();e.stopPropagation();textPointerStart={id:e.pointerId,x:e.clientX,y:e.clientY};suppressPageSwipeUntil=Date.now()+1000;try{markers.setPointerCapture(e.pointerId)}catch(_){}});
markers.addEventListener('pointerup',e=>{if(!textMode||!textPointerStart||textPointerStart.id!==e.pointerId)return;const p=textPointerStart;textPointerStart=null;e.preventDefault();e.stopPropagation();if(Math.hypot(e.clientX-p.x,e.clientY-p.y)<18)placeSecurityText(e.clientX,e.clientY)});
markers.addEventListener('pointercancel',()=>{textPointerStart=null});
markers.onclick=e=>{if(textMode){e.preventDefault();e.stopPropagation();return}if(e.target!==markers)return;const r=markers.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;if(!addType)return;createItem(addType,x,y)}
function setSecurityPrecisionMode(on){
 precisionMode=!!on;document.body.classList.toggle('precisionMode',precisionMode);
 const b=$('secPrecision');if(b){b.classList.toggle('active',precisionMode);b.setAttribute('aria-pressed',precisionMode?'true':'false');b.title=precisionMode?'Precision på – tryck för att stänga av':'Precision';b.setAttribute('aria-label',b.title);if(!b.closest('.serviceToolsMenu'))b.textContent=precisionMode?'⌖ Precision på':'⌖ Precision'}
 if(precisionMode&&pdf){$('secHint').textContent='Precision på: dra i det lilla greppet en bit från pinnen. Pilspetsen visar exakt var träffpunkten hamnar.';$('secHint').hidden=false}
 else if(!addType&&!textMode)$('secHint').hidden=true;
 if(pdf)drawMarkers();
}
$('secPrecision')&&($('secPrecision').onclick=()=>setSecurityPrecisionMode(!precisionMode));
document.querySelectorAll('[data-add]').forEach(b=>b.onclick=()=>{if(!pdf)return msg('Öppna en PDF först.',true);textMode=false;document.body.classList.remove('secTextAdding');addType=b.dataset.add;document.body.classList.add('secAdding');$('secHint').textContent='Tryck där '+SYSTEMS[addType].label+' ska markeras. Nyp för att zooma.';$('secHint').hidden=false;go('drawing')});
$('secAddText').onclick=()=>{if(!pdf)return msg('Öppna en PDF först.',true);addType=null;textMode=!textMode;document.body.classList.remove('secAdding');document.body.classList.toggle('secTextAdding',textMode);$('secAddText').classList.toggle('primary',textMode);$('secHint').textContent=textMode?'TEXTLÄGE: Tryck en gång på ritningen där pilen ska peka.':'Textläget avstängt.';$('secHint').hidden=!textMode;go('drawing')};
function render(fit=false,focus=null,anchor=null){
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
  canvas.style.width=pageWidth+'px';canvas.style.height=pageHeight+'px';const stage=$('secStage');stage.style.width=pageWidth+'px';stage.style.height=pageHeight+'px';
  const centerGap=Math.max(0,(viewer.clientHeight-pageHeight)/2);stage.style.marginTop=centerGap+'px';stage.style.marginBottom=centerGap+'px';
  const drawingUiScale=Math.max(.52,Math.min(1,Math.sqrt(Math.max(.01,baseScale*zoom))));
  $('secStage').style.setProperty('--drawing-ui-scale',drawingUiScale.toFixed(3));
  $('secStage').style.setProperty('--drawing-line-width',Math.max(.9,2*drawingUiScale).toFixed(2)+'px');
  $('secStage').style.setProperty('--drawing-box-stroke',Math.max(.8,1.5*drawingUiScale).toFixed(2)+'px');
  $('secStage').style.setProperty('--security-marker-size',(30*drawingUiScale).toFixed(1)+'px');
  $('secStage').style.setProperty('--security-marker-font',Math.max(6.5,10*drawingUiScale).toFixed(1)+'px');
  $('secStage').style.setProperty('--security-point-size',Math.max(7,12*drawingUiScale).toFixed(1)+'px');
  $('secStage').style.setProperty('--security-note-font',Math.max(7,10*drawingUiScale).toFixed(1)+'px');
  $('secStage').style.setProperty('--security-note-max',Math.max(100,180*drawingUiScale).toFixed(0)+'px');
  $('secPage').textContent='Sida '+pageNumber+' / '+documentPdf.numPages;$('secZoom').textContent=Math.round(zoom*100)+'%';drawMarkers();
  if(anchor&&focus){
   const left=stage.offsetLeft||0,top=stage.offsetTop||0;
   viewer.scrollLeft=left+anchor.x*pageWidth-focus.x;
   viewer.scrollTop=top+anchor.y*pageHeight-focus.y;
  }else if(focus&&oldW>0&&oldH>0){
   viewer.scrollLeft=(oldSL+focus.x)/oldW*pageWidth-focus.x;
   viewer.scrollTop=(oldST+focus.y)/oldH*pageHeight-focus.y;
  }
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
 if(!pdf||addType||textMode||e.button!==0||e.pointerType==='touch'||e.target.closest('.secMarker,.secTarget,.secTextNote,.secTextTarget,.serviceDrawingOverlay'))return;
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

function beginSecurityPinch(e){
 const a=e.touches[0],b=e.touches[1],r=viewer.getBoundingClientRect(),stage=$('secStage');
 const focus={x:(a.clientX+b.clientX)/2-r.left,y:(a.clientY+b.clientY)/2-r.top};
 const anchor={
  x:Math.max(0,Math.min(1,(viewer.scrollLeft+focus.x-(stage.offsetLeft||0))/Math.max(1,pageWidth))),
  y:Math.max(0,Math.min(1,(viewer.scrollTop+focus.y-(stage.offsetTop||0))/Math.max(1,pageHeight)))
 };
 pinch={
  dist:Math.max(1,Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY)),
  zoom,focus,currentFocus:focus,anchor,targetZoom:zoom,
  stageLeft:stage.offsetLeft||0,stageTop:stage.offsetTop||0
 };
 panTouch=null;visualZoom=1;stage.style.transformOrigin='0 0';viewer.classList.add('pinching');suppressPageSwipeUntil=Date.now()+900;
}
function commitSecurityPinch(p){
 const target=Math.max(.5,Math.min(8,p.targetZoom||p.zoom)),focus=p.currentFocus||p.focus;
 visualZoom=1;$('secStage').style.transform='';$('secStage').style.transformOrigin='0 0';viewer.classList.remove('pinching');
 zoom=target;return render(false,focus,p.anchor);
}
viewer.addEventListener('touchstart',e=>{
 if(e.touches.length===2){e.preventDefault();beginSecurityPinch(e);return}
 if(e.target.closest('.secMarker,.secTarget,.secTextNote,.secTextTarget,.serviceDrawingOverlay')){panTouch=null;suppressPageSwipeUntil=Date.now()+1200;return}
 if(e.touches.length===1&&!addType&&!textMode){
  const t=e.touches[0];panTouch={x:t.clientX,y:t.clientY,startX:t.clientX,startY:t.clientY,left:viewer.scrollLeft,top:viewer.scrollTop,started:Date.now(),pageSwipe:zoom<=1.05&&Math.abs(visualZoom-1)<.02};
 }
},{passive:false});
viewer.addEventListener('touchmove',e=>{
 if(e.touches.length===2){
  e.preventDefault();if(!pinch){beginSecurityPinch(e);return}
  const a=e.touches[0],b=e.touches[1],r=viewer.getBoundingClientRect(),focus={x:(a.clientX+b.clientX)/2-r.left,y:(a.clientY+b.clientY)/2-r.top};
  const target=Math.max(.5,Math.min(8,pinch.zoom*Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY)/pinch.dist));
  visualZoom=target/pinch.zoom;pinch.targetZoom=target;pinch.currentFocus=focus;
  const stage=$('secStage');stage.style.transformOrigin='0 0';stage.style.transform='scale('+visualZoom+')';
  viewer.scrollLeft=pinch.stageLeft+pinch.anchor.x*pageWidth*visualZoom-focus.x;
  viewer.scrollTop=pinch.stageTop+pinch.anchor.y*pageHeight*visualZoom-focus.y;
  $('secZoom').textContent=Math.round(target*100)+'%';
 }else if(e.touches.length===1&&panTouch&&!addType&&!textMode&&!pinch){
  e.preventDefault();const t=e.touches[0];viewer.scrollLeft=panTouch.left-(t.clientX-panTouch.x);viewer.scrollTop=panTouch.top-(t.clientY-panTouch.y);
 }
},{passive:false});
function endTouch(e){
 if(pinch&&e.touches.length<2){const p=pinch;pinch=null;panTouch=null;suppressPageSwipeUntil=Date.now()+500;commitSecurityPinch(p);return}
 if(e.touches.length===0&&panTouch){
  const t=e.changedTouches?.[0],p=panTouch;panTouch=null;
  if(Date.now()<suppressPageSwipeUntil)return;
  if(t&&p.pageSwipe&&Date.now()-p.started<900){
   const dx=t.clientX-p.startX,dy=t.clientY-p.startY;
   if(Math.abs(dx)>=65&&Math.abs(dx)>Math.abs(dy)*1.35){
    if(changeSecurityPage(dx<0?1:-1)){e.preventDefault?.();return}
   }
  }
 }
}
viewer.addEventListener('touchend',endTouch,{passive:true});
viewer.addEventListener('touchcancel',endTouch,{passive:true});

async function inspectSecurityWorkPdf(bytes){
 if(!window.PDFLib)throw new Error('PDF-biblioteket är inte tillgängligt.');
 const {PDFDocument,PDFName,PDFDict,PDFNumber,PDFRawStream,decodePDFRawStream}=PDFLib;
 const doc=await PDFDocument.load(bytes,{updateMetadata:false}),ref=doc.catalog.get(PDFName.of('SecurityServiceWork'));if(!ref)return null;
 const metadata=doc.context.lookup(ref);if(!(metadata instanceof PDFDict))throw new Error('Säkerhetsservice-arbetsfilens uppgifter är skadade.');
 const version=metadata.lookup(PDFName.of('Version'),PDFNumber).asNumber();if(version<2)throw new Error('Säkerhetsservice-arbetsfilen har en äldre dataversion.');
 const data=metadata.lookup(PDFName.of('Data'),PDFRawStream),drawing=metadata.lookup(PDFName.of('Drawing'),PDFRawStream);
 const state=JSON.parse(new TextDecoder().decode(decodePDFRawStream(data).decode()));
 if(state.app!=='security-service'||state.version<2||!Array.isArray(state.items)||!state.project||typeof state.project!=='object'||state.items.some(o=>!o||typeof o.uid!=='string'||!SYSTEMS[o.type]||!Number.isInteger(o.page)||o.page<1||!Number.isFinite(o.x)||!Number.isFinite(o.y)))throw new Error('Säkerhetsservice-arbetsfilen innehåller ogiltiga objektuppgifter.');
 const drawingBytes=decodePDFRawStream(drawing).decode().slice(),source=await PDFDocument.load(drawingBytes,{updateMetadata:false});
 if(state.items.some(o=>o.page>source.getPageCount()))throw new Error('Objekten hör inte till arbetsfilens ritningssidor.');
 return {drawingBytes,work:{items:state.items,textNotes:Array.isArray(state.textNotes)?state.textNotes:[],drawingExtras:Array.isArray(state.drawingExtras)?state.drawingExtras:[],project:state.project,logoData:state.logoData||''}};
}
if($('secChangeDrawing'))$('secChangeDrawing').onclick=()=>$('securityFile').click();
$('securityFile').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{
 msg('Laddar ritning…');const bytes=new Uint8Array(await f.arrayBuffer()),imported=await inspectSecurityWorkPdf(bytes),drawingBytes=imported?.drawingBytes||bytes,key=await fingerprint(drawingBytes),saved=loadSaved(key),record=imported?.work||saved,candidate=await pdfjsLib.getDocument({data:drawingBytes.slice()}).promise;
 if(pdf)try{await pdf.destroy()}catch(_){}
 pdf=candidate;sourceBytes=drawingBytes.slice();activeKey=key;items=(record?.items||[]).map(normalize);textNotes=Array.isArray(record?.textNotes)?record.textNotes:[];drawingExtras=Array.isArray(record?.drawingExtras)?record.drawingExtras:[];project={...emptyProject(),...(record?.project||{})};logoData=record?.logoData||'';page=1;zoom=1;visualZoom=1;pinch=null;panTouch=null;panMouse=null;addType=null;textMode=false;document.body.classList.remove('secAdding','secTextAdding');$('secAddText').classList.remove('primary');$('secStage').style.transform='';syncProjectInputs();refreshTop();save();await render(true);viewer.scrollLeft=0;viewer.scrollTop=0;
 if(imported&&items.length){
  $('secOpenWorkMeta').textContent=[project.projectName||project.facilityNo||'Säkerhetsservice',items.length+' objekt',project.date?'senaste service '+project.date:''].filter(Boolean).join(' · ');
  $('secOpenWorkDialog').showModal();
  msg('Arbets-PDF öppnad. Välj Ny service eller Fortsätt / ändra.');
 }else msg((imported?'Arbets-PDF öppnad. ':'Ritningen är klar. ')+(items.length?items.length+' objekt återställda.':'Lägg till Inbrottslarm, Lås & Dörrmiljö eller Passer.'));
 }catch(err){console.error(err);msg(err.message||'Kunde inte öppna PDF-filen.',true)}finally{e.target.value=''}};
$('secOpenWorkDialog').addEventListener('cancel',e=>e.preventDefault());
$('secOpenContinue').onclick=()=>{$('secOpenWorkDialog').close();go('drawing');msg('')};
$('secOpenNewService').onclick=()=>{if(startNewSecurityService(false))$('secOpenWorkDialog').close()};

function changeSecurityPage(delta){
 if(!pdf)return false;
 const next=Math.max(1,Math.min(pdf.numPages,page+delta));if(next===page)return false;
 clearTimeout(wheelZoomTimer);wheelZoomTarget=null;wheelZoomFocus=null;page=next;zoom=1;visualZoom=1;$('secStage').style.transform='';render(true);viewer.scrollLeft=0;viewer.scrollTop=0;return true
}
$('secPrev').onclick=()=>changeSecurityPage(-1);$('secNext').onclick=()=>changeSecurityPage(1);$('secZoomIn').onclick=()=>{clearTimeout(wheelZoomTimer);wheelZoomTarget=null;setZoom(zoom*1.25)};$('secZoomOut').onclick=()=>{clearTimeout(wheelZoomTimer);wheelZoomTarget=null;setZoom(zoom/1.25)};$('secFit').onclick=$('secFitMobile').onclick=()=>{clearTimeout(wheelZoomTimer);wheelZoomTarget=null;zoom=1;visualZoom=1;$('secStage').style.transform='';render(true)};
function cur(){return items.find(o=>o.uid===selected)}
const secProtocolTextSmaller=$('secProtocolTextSmaller'),secProtocolTextLarger=$('secProtocolTextLarger');
let secProtocolTextLevel=Math.max(-1,Math.min(3,Number(localStorage.getItem('doorservice-protocol-size')||0)));
function applySecProtocolTextLevel(){
 document.body.dataset.protocolSize=String(secProtocolTextLevel);
 if(secProtocolTextSmaller)secProtocolTextSmaller.disabled=secProtocolTextLevel<=-1;
 if(secProtocolTextLarger)secProtocolTextLarger.disabled=secProtocolTextLevel>=3;
 localStorage.setItem('doorservice-protocol-size',String(secProtocolTextLevel));
}
if(secProtocolTextSmaller)secProtocolTextSmaller.onclick=()=>{secProtocolTextLevel=Math.max(-1,secProtocolTextLevel-1);applySecProtocolTextLevel()};
if(secProtocolTextLarger)secProtocolTextLarger.onclick=()=>{secProtocolTextLevel=Math.min(3,secProtocolTextLevel+1);applySecProtocolTextLevel()};
applySecProtocolTextLevel();
let securityCheckEditUid=null;
function buildChecklist(o){
 const box=$('secChecklist');box.replaceChildren();const checks=allChecks(o),editing=securityCheckEditUid===o.uid;
 const group=document.createElement('details');group.className='checkGroup secCheckGroup';group.open=true;
 const summary=document.createElement('summary');summary.textContent='Kontrollpunkter';const count=document.createElement('span');summary.appendChild(count);group.appendChild(summary);
 checks.forEach(([n,title])=>{
  const c=o.checks[n]||{result:'',note:''};o.checks[n]=c;
  const row=document.createElement('div');row.className='checkrow secCheck'+(c.result?' result-'+c.result:'');
  const head=document.createElement('div');head.className='checktitle secCheckHead';
  const nr=document.createElement('span');nr.className='checkNumber';nr.textContent=n;
  const titleEl=document.createElement('span');titleEl.className='secCheckText';titleEl.textContent=title;
  head.append(nr,titleEl);
  if(o.customChecks.some(x=>x.id===n)){const badge=document.createElement('em');badge.className='secCustomBadge doorCustomBadge';badge.textContent='Egen';head.appendChild(badge)}
  if(editing){
   const actions=document.createElement('span');actions.className='secEditActions checkEditActions';
   const change=document.createElement('button');change.type='button';change.className='secEditCheck doorEditCheck';change.textContent='Ändra';change.setAttribute('aria-label','Ändra kontrollpunkt '+n);
   change.onclick=e=>{e.stopPropagation();const value=prompt('Ändra kontrollpunkt:',title);if(value===null)return;if(!value.trim()){alert('Kontrollpunkten måste ha text. Använd Ta bort om den inte ska finnas kvar.');return}if(!editSecurityCheck(o,n,value))return;save();buildChecklist(o);$('secStatus').value=o.status;drawMarkers();showOverview()};
   const remove=document.createElement('button');remove.type='button';remove.className='secRemoveCheck doorRemoveCheck';remove.textContent='Ta bort';remove.setAttribute('aria-label','Ta bort kontrollpunkt '+n);
   remove.onclick=e=>{e.stopPropagation();if(!confirm('Ta bort kontrollpunkten '+n+'?'))return;if(!removeSecurityCheck(o,n))return;save();buildChecklist(o);$('secStatus').value=o.status;drawMarkers();showOverview()};
   actions.append(change,remove);head.appendChild(actions)
  }
  row.appendChild(head);
  const choices=document.createElement('div');choices.className='quickBtns secChoices';
  [['na','Ingår ej'],['ok','Klart utan anmärkning'],['remark','Klart med anmärkning']].forEach(([value,label])=>{
   const b=document.createElement('button');b.type='button';b.textContent=label;b.dataset.v=value;b.classList.toggle('active',c.result===value);
   b.onclick=()=>{c.result=value;o.checks[n]=c;if(value==='remark'&&!c.note)c.note='';if(value!=='remark'&&c.note)c.note='';o.manualFail=false;syncStatus(o);save();buildChecklist(o);$('secStatus').value=o.status;drawMarkers();updateProgress(o);showOverview()};
   choices.appendChild(b)
  });
  row.appendChild(choices);
  if(c.result==='remark'){
   const fault=document.createElement('div');fault.className='faultArea secFault';
   const faults=SYSTEMS[o.type].faults[n]||[];
   const select=document.createElement('select');select.className='faultSelect';select.setAttribute('aria-label','Vanlig anmärkning '+n);select.innerHTML='<option value="">Välj anmärkning…</option>';
   for(const f of faults){const op=document.createElement('option');op.value=f;op.textContent=f;select.appendChild(op)}
   const custom=document.createElement('option');custom.value='__custom__';custom.textContent='✎ Beskriv själv…';select.appendChild(custom);
   const input=document.createElement('input');input.className='faultText';input.placeholder='Beskriv felet…';input.setAttribute('aria-label','Egen anmärkning '+n);
   const back=document.createElement('button');back.type='button';back.className='faultBack secFaultBack';back.textContent='‹';back.setAttribute('aria-label','Till färdiga anmärkningar');
   const known=faults.includes(c.note||'');select.value=known?c.note:'';input.value=known?'':(c.note||'');
   const showCustom=show=>{select.hidden=show;input.hidden=!show;back.hidden=!show};showCustom(!!c.note&&!known);
   select.onchange=()=>{if(select.value==='__custom__'){c.note='';input.value='';showCustom(true);input.classList.add('iosTyping');requestAnimationFrame(()=>input.focus());save();showOverview();return}c.note=cleanSecurityRemarkText(select.value||'');save();showOverview()};
   input.oninput=()=>{c.note=input.value;save();showOverview()};input.onblur=()=>{input.classList.remove('iosTyping');c.note=cleanSecurityRemarkText(input.value);input.value=c.note;save();showOverview()};
   back.onclick=()=>{c.note='';input.value='';select.value='';showCustom(false);save();showOverview();select.focus()};
   fault.append(select,input,back);
   row.appendChild(fault)
  }
  group.appendChild(row)
 });
 box.appendChild(group);count.textContent=checks.filter(([n])=>!!o.checks[n]?.result).length+' / '+checks.length;updateProgress(o)
}
function updateProgress(o){const checks=allChecks(o),done=checks.filter(([n])=>['na','ok','remark'].includes(o.checks[n]?.result)).length;$('secProgress').textContent=done+' / '+checks.length+' kontrollerade'}
function renderSecurityPrevious(o){
 const panel=$('secPreviousPanel'),box=$('secPreviousIssues');if(!panel||!box)return;
 const rows=[...(o.previousIssues||[])];if(o.previousNotes)rows.push({n:'Övrigt',title:'Allmän anmärkning',note:o.previousNotes});
 panel.hidden=!rows.length&&!o.previousStatus;
 box.replaceChildren();if(panel.hidden)return;
 if(o.previousStatus||o.previousServiceDate){const meta=document.createElement('div');meta.className='previousIssue';const strong=document.createElement('strong');strong.textContent=[o.previousServiceDate,o.previousStatus].filter(Boolean).join(' · ');meta.appendChild(strong);box.appendChild(meta)}
 rows.forEach(issue=>{const row=document.createElement('div');row.className='previousIssue';const strong=document.createElement('strong');strong.textContent=[issue.n,issue.title].filter(Boolean).join(' · ');const text=document.createElement('span');text.textContent=issue.note?.trim()||issue.title||'Tidigare anmärkning';row.append(strong,text);box.appendChild(row)});
}
function showSelected(){const o=cur();$('secNoSelection').hidden=!!o;$('secForm').hidden=!o;$('secProtocolTitle').textContent=securityProtocolTitle();if(!o)return;const cfg=SYSTEMS[o.type];$('secType').value=cfg.label;$('secNumber').value=o.number;$('secLocation').value=o.location;$('secId').value=o.id;$('secNotes').value=o.notes;$('secProtocolSignature').value=project.signature||project.technician||'';syncStatus(o);$('secStatus').value=isSecurityRemediated(o)?'ok':o.status;$('secEditChecks').textContent=securityCheckEditUid===o.uid?'Klar':'Redigera kontrollpunkter';renderSecurityPrevious(o);buildChecklist(o)}
['secLocation','secId','secNotes'].forEach(id=>$(id).oninput=()=>{const o=cur();if(!o)return;if(id==='secLocation')o.location=$(id).value;if(id==='secId')o.id=$(id).value;if(id==='secNotes')o.notes=$(id).value;save();drawMarkers();showOverview()});
$('secStatus').onchange=()=>{const o=cur();if(!o)return;o.manualFail=$('secStatus').value==='fail';syncStatus(o);$('secStatus').value=o.status;save();drawMarkers();showOverview()};
$('secAddCheck').onclick=()=>{const o=cur();if(!o)return;const title=prompt('Skriv den extra kontrollpunkten:','');if(!title?.trim())return;const used=new Set(allChecks(o).map(([n])=>n));let next=SYSTEMS[o.type].checks.length+1;while(used.has('1.'+next))next++;const id='1.'+next;o.customChecks.push({id,title:title.trim()});o.checks[id]={result:'',note:''};o.manualFail=false;o.remediationDate='';o.remediationSignature='';syncStatus(o);save();buildChecklist(o);$('secStatus').value=o.status;drawMarkers()};
$('secEditChecks').onclick=()=>{const o=cur();if(!o)return;securityCheckEditUid=securityCheckEditUid===o.uid?null:o.uid;$('secEditChecks').textContent=securityCheckEditUid===o.uid?'Klar':'Redigera kontrollpunkter';buildChecklist(o)};
$('secApproveAll').onclick=()=>{const o=cur();if(!o)return;allChecks(o).forEach(([n])=>{o.checks[n]=o.checks[n]||{result:'',note:''};o.checks[n].result='ok';o.checks[n].note=''});o.manualFail=false;syncStatus(o);save();buildChecklist(o);$('secStatus').value=o.status;drawMarkers();showOverview()};
$('secDelete').onclick=()=>{const o=cur();if(o&&confirm('Ta bort '+o.id+'?')){items=items.filter(x=>x.uid!==o.uid);selected=null;save();drawMarkers();showSelected();go('drawing')}};
function issues(o){const arr=[];allChecks(o).forEach(([n,t])=>{const c=o.checks[n];if(c?.result==='remark')arr.push(c.note?.trim()||t)});if(o.notes.trim())arr.push('Allmän anmärkning: '+o.notes.trim());return arr}
function securityPriority(o){if(isSecurityRemediated(o))return 3;const s=statusOf(o);return s==='fail'?0:s==='action'?1:s==='untested'?2:4}
function setSecurityOverviewSummary(){
 const target=$('secOverviewSummary');if(!target)return;
 const open=items.filter(o=>statusOf(o)==='action').length,failed=items.filter(o=>statusOf(o)==='fail').length,done=items.filter(isSecurityRemediated).length,ready=items.filter(o=>o.status==='ok'&&!hasSecurityRecordedProblem(o)).length,untested=items.filter(o=>statusOf(o)==='untested').length;
 target.replaceChildren();
 [['Totalt',items.length,'total','Alla objekt'],['Klara',ready,'ready','Godkänd'],['Åtgärdade',done,'done','Godkänd / åtgärdad'],['Öppna fel',open,'open','Åtgärd krävs'],['Ej godkända',failed,'fail','Ej godkänd'],['Ej kontrollerade',untested,'untested','Ej kontrollerad']].forEach(([label,value,key,meaning])=>{
  const box=document.createElement('span');box.className='overviewStat '+key;
  const strong=document.createElement('strong');strong.textContent=String(value);
  const small=document.createElement('small');small.textContent=label;
  const meta=document.createElement('em');meta.className='overviewMeaning';meta.textContent=meaning;
  box.append(strong,small,meta);target.appendChild(box);
 });
}
function syncSecurityOverviewCard(card,badge,o){
 const st=statusOf(o);
 card.className='secSummaryCard '+st+(isSecurityRemediated(o)?' remediated':'');
 badge.className='secStatusBadge '+st;
 badge.textContent=securityStatusText(o);
}
function showOverview(){
 const list=$('secOverviewList');if(!list)return;list.replaceChildren();setSecurityOverviewSummary();
 const filter=$('secOverviewFilter')?.value||'all',query=($('secOverviewSearch')?.value||'').trim().toLocaleLowerCase('sv');
 const visible=items.filter(o=>{
  const st=statusOf(o);
  if(filter==='problems'&&!hasSecurityProblem(o))return false;
  if(filter==='untested'&&st!=='untested')return false;
  if(filter==='ok'&&st!=='ok')return false;
  return !query||[o.id,securityDrawingLabel(o),SYSTEMS[o.type]?.label,o.location,o.notes,...issues(o)].join(' ').toLocaleLowerCase('sv').includes(query);
 }).sort((a,b)=>securityPriority(a)-securityPriority(b)||a.type.localeCompare(b.type)||a.number-b.number);
 if(!visible.length){const p=document.createElement('p');p.className='overviewEmpty';p.textContent=query?'Inga objekt matchar sökningen.':filter==='problems'?'Inga objekt med öppna fel.':'Inga objekt i det här urvalet.';list.appendChild(p);return}
 visible.forEach((o,index)=>{
  const card=document.createElement('article');card.dataset.uid=o.uid;
  const head=document.createElement('div');head.className='secSummaryHead';
  const h=document.createElement('h3');h.textContent=securityDrawingLabel(o)+' · '+SYSTEMS[o.type].label;
  const badge=document.createElement('span');head.append(h,badge);card.appendChild(head);syncSecurityOverviewCard(card,badge,o);
  const meta=document.createElement('p');meta.className='secSummaryMeta';meta.textContent=o.location?'Placering: '+o.location:'Placering saknas';card.appendChild(meta);
  const iss=issues(o);if(iss.length){const ul=document.createElement('ul');iss.forEach(t=>{const li=document.createElement('li');li.textContent=t;ul.appendChild(li)});card.appendChild(ul)}else{const p=document.createElement('p');p.textContent=statusOf(o)==='ok'?'Godkänd utan anmärkning':'Inga registrerade anmärkningar.';card.appendChild(p)}
  if(hasSecurityRecordedProblem(o)){
   const grid=document.createElement('div');grid.className='grid2 secRemediationGrid';
   [['remediationDate','Åtgärdat datum','date'],['remediationSignature','Åtgärdssignatur','text']].forEach(([key,title,type])=>{
    const label=document.createElement('label');label.textContent=title;
    const input=document.createElement('input');input.type=type;input.value=o[key]||'';input.setAttribute('aria-label',title+' för '+securityDrawingLabel(o));
    input.onclick=e=>e.stopPropagation();
    input.oninput=e=>{e.stopPropagation();o[key]=input.value;save();syncSecurityOverviewCard(card,badge,o);setSecurityOverviewSummary();drawMarkers()};
    input.onchange=e=>{e.stopPropagation();save();showOverview();drawMarkers()};
    label.appendChild(input);grid.appendChild(label);
   });card.appendChild(grid);
  }
  card.onclick=e=>{if(e.target.closest('input,select,textarea,button,label'))return;selected=o.uid;showSelected();$('securityOverview').close();go('protocol')};
  list.appendChild(card);
 })
}
$('secOverviewFilter').onchange=showOverview;$('secOverviewSearch').oninput=showOverview;
$('secNavOverview').onclick=()=>{showOverview();$('securityOverview').showModal()};$('secCloseOverview').onclick=()=>$('securityOverview').close();$('secNavDrawing').onclick=()=>go('drawing');$('secNavProtocol').onclick=()=>go('protocol');$('secNavProject').onclick=()=>go('project');$('secCloseProtocol').onclick=$('secCloseProject').onclick=()=>go('drawing');
function projectFieldMap(){return {secProjectName:'projectName',secFacilityNo:'facilityNo',secOrder:'order',secDate:'date',secNextDate:'nextDate',secCustomer:'customer',secAgreement:'agreement',secContact:'contact',secPhone:'phone',secAddress:'address',secPostalCode:'postalCode',secPostalCity:'postalCity',secCompany:'company',secCompanyContact:'companyContact',secCompanyPhone:'companyPhone',secCompanyAddress:'companyAddress',secCompanyPostalCode:'companyPostalCode',secCompanyPostalCity:'companyPostalCity',secTechnician:'technician',secSignature:'signature'}}
function refreshLogoPreview(){
 const box=$('secLogoPreview');if(!box)return;box.replaceChildren();
 const status=$('secLogoStatus'),remove=$('secLogoRemove');
 if(logoData){
  const img=document.createElement('img');img.src=logoData;img.alt='Företagslogotyp';box.appendChild(img);
  if(status)status.textContent='Logotyp inlagd och sparad i projektet.';
  if(remove)remove.hidden=false;
 }else{
  if(status)status.textContent='Ingen logotyp vald.';
  if(remove)remove.hidden=true;
 }
}
function syncProjectInputs(){for(const[id,key]of Object.entries(projectFieldMap()))$(id).value=project[key]||'';refreshLogoPreview()}
for(const[id,key]of Object.entries(projectFieldMap()))$(id).oninput=()=>{project[key]=$(id).value;save()};
$('secTechnician').oninput=()=>{
 const previous=project.technician||'',value=$('secTechnician').value;
 project.technician=value;
 if(!project.companyContact||project.companyContact===previous){project.companyContact=value;$('secCompanyContact').value=value}
 save();
};
function startNewSecurityService(requireConfirm=true){
 if(!pdf||!items.length){msg('Lägg till objekt innan du startar en ny service.',true);return false}
 if(requireConfirm&&!confirm('Starta en ny service med samma ritning och objekt? Dagens kontroller nollställs. Projekt, kontaktuppgifter, företag, logga, objektplaceringar och servicetekniker behålls.'))return false;
 const previousDate=project.date||'',previousNextDate=project.nextDate||'',suggestedNextDate=shiftedNextDate(previousDate,previousNextDate);
 items.forEach(o=>{
  o.previousIssues=allChecks(o).filter(([n])=>o.checks?.[n]?.result==='remark').map(([n,title])=>({n,title,note:o.checks[n]?.note||''}));
  o.previousNotes=o.notes||'';
  o.previousStatus=securityStatusText(o);
  o.previousServiceDate=previousDate;
  o.checks={};o.notes='';o.manualFail=false;o.status='untested';o.remediationDate='';o.remediationSignature='';normalize(o);
 });
 project.order='';project.date=localToday();project.nextDate=suggestedNextDate;project.signature='';
 selected=null;syncProjectInputs();save();drawMarkers();showSelected();showOverview();go('project');msg('Ny service startad. Grunduppgifter, logga, objekt och servicetekniker är kvar. Fyll i nytt ordernummer och nästa provningsdatum.');
 requestAnimationFrame(()=>$('secOrder')?.focus());
 return true;
}
$('secNewServiceBtn').onclick=()=>startNewSecurityService(true);
async function prepareLogoFile(file){
 if(!file||!file.type.startsWith('image/'))throw new Error('Välj en bildfil.');
 const data=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(String(r.result||''));r.onerror=()=>reject(new Error('Kunde inte läsa bilden.'));r.readAsDataURL(file)});
 const img=await new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(new Error('Bildformatet kunde inte läsas. Prova PNG eller JPG.'));im.src=data});
 const maxW=1000,maxH=500,scale=Math.min(1,maxW/img.naturalWidth,maxH/img.naturalHeight),w=Math.max(1,Math.round(img.naturalWidth*scale)),h=Math.max(1,Math.round(img.naturalHeight*scale));
 const cv=document.createElement('canvas');cv.width=w;cv.height=h;const cx=cv.getContext('2d');cx.clearRect(0,0,w,h);cx.drawImage(img,0,0,w,h);
 return cv.toDataURL('image/png');
}
$('secLogoFile').onchange=async e=>{
 const input=e.currentTarget,file=input.files?.[0];if(!file)return;
 const status=$('secLogoStatus');if(status)status.textContent='Läser in loggan…';
 try{
  const prepared=await prepareLogoFile(file);
  logoData=prepared;refreshLogoPreview();
  try{save()}catch(err){console.error(err)}
  if(status)status.textContent='Logotyp inlagd och sparad i projektet.';
 }catch(err){
  console.error(err);if(status)status.textContent=err.message||'Kunde inte lägga in loggan.';
  msg(err.message||'Kunde inte lägga in loggan.',true);
 }finally{input.value=''}
};
$('secLogoRemove').onclick=()=>{
 logoData='';refreshLogoPreview();
 try{save()}catch(err){console.error(err)}
};
function reportDoc(){
 const doc=new jspdf.jsPDF('p','mm','a4'),left=12,width=186,bottom=277;
 doc.__protocolPages={};doc.__backLinks=[];
 function txt(value,x,y,size=8,bold=false,color=[25,40,48],opts){doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(size);doc.setTextColor(...color);doc.text(String(value||''),x,y,opts||{})}
 function addLogo(x,y,w,h){if(!logoData)return;try{const im=doc.getImageProperties(logoData),pad=2.5,sc=Math.min((w-pad*2)/im.width,(h-pad*2)/im.height),iw=im.width*sc,ih=im.height*sc;doc.addImage(logoData,x+(w-iw)/2,y+(h-ih)/2,iw,ih)}catch(_){}}
 function summaryHeader(title='ANMÄRKNINGSÖVERSIKT'){doc.setFillColor(255,255,255);doc.setDrawColor(55,55,55);doc.setLineWidth(.22);doc.rect(left,8,width,18,'FD');doc.line(left+58,8,left+58,26);if(logoData)addLogo(left,8,58,18);txt(title,left+58+(width-58)/2,16.2,9.6,true,[25,25,25],{align:'center'});txt('SÄKERHETSSERVICE · KUNDRAPPORT',left+58+(width-58)/2,21.4,6.8,false,[70,82,90],{align:'center'})}
 summaryHeader();let y=32;
 const field=(label,value,x,yy,w,signature=false)=>{doc.setFillColor(248,248,248);doc.setDrawColor(185,185,185);doc.setLineWidth(.22);doc.rect(x,yy,w,13,'FD');txt(label,x+2,yy+4,6.6,true,[82,82,82]);doc.setFont('helvetica',signature?'italic':'normal');doc.setFontSize(signature?8.8:8.2);doc.setTextColor(...(signature?[70,125,165]:[25,25,25]));doc.text(doc.splitTextToSize(String(value||'-'),w-4).slice(0,2),x+2,yy+8.8,{lineHeightFactor:1.05})};
 field('ANLÄGGNING',project.projectName||project.facilityNo,left,y,70);
 field('ANLÄGGNINGSNUMMER',project.facilityNo,left+70,y,50);
 field('ORDER',project.order,left+120,y,66);y+=15;
 field('DATUM',project.date,left,y,42);field('NÄSTA PROVNING',project.nextDate,left+42,y,48);field('BESTÄLLARE',project.customer,left+90,y,48);field('SERVICEFÖRETAG',project.company,left+138,y,48);y+=17;
 const open=items.filter(o=>statusOf(o)==='action').length,failed=items.filter(o=>statusOf(o)==='fail').length,done=items.filter(isSecurityRemediated).length,ready=items.filter(o=>o.status==='ok'&&!hasSecurityRecordedProblem(o)).length,untested=items.filter(o=>statusOf(o)==='untested').length;
 const light={ok:[229,244,234],action:[255,242,216],fail:[252,229,231],untested:[235,241,244]};
 const stats=[
  ['TOTALT',items.length,'Alla objekt',[243,247,249],[45,69,82]],
  ['KLARA',ready,'Godkända',light.ok,COLORS.ok],
  ['ÅTGÄRDADE',done,'Klarmarkerade',light.ok,COLORS.ok],
  ['ÖPPNA FEL',open,'Åtgärd krävs',light.action,COLORS.action],
  ['EJ GODKÄNDA',failed,'Underkända',light.fail,COLORS.fail],
  ['EJ KONTROLL.',untested,'Ej kontrollerade',light.untested,COLORS.untested]
 ];
 const boxW=width/6;
 stats.forEach(([label,value,meaning,bg,fg],i)=>{const x=left+i*boxW;doc.setFillColor(...bg);doc.setDrawColor(185,195,201);doc.setLineWidth(.25);doc.rect(x,y,boxW,15.4,'FD');txt(label,x+boxW/2,y+4.25,6.25,true,[65,75,82],{align:'center'});txt(value,x+boxW/2,y+9.65,11.4,true,fg,{align:'center'});txt(meaning,x+boxW/2,y+13.55,5.8,true,fg,{align:'center'})});y+=17.2;
 const problemItems=items.filter(hasSecurityRecordedProblem).sort((a,b)=>securityPriority(a)-securityPriority(b)||a.type.localeCompare(b.type)||a.number-b.number);
 if(!problemItems.length){doc.setFillColor(235,244,239);doc.rect(left,y,width,16,'F');txt('Inga anmärkningar registrerade vid detta besök.',left+3,y+7,10,true,[29,112,71]);txt('Se protokollen för genomförda kontrollpunkter.',left+3,y+12,8);y+=20}
 problemItems.forEach(o=>{
  const st=statusOf(o),statusLabel=isSecurityRemediated(o)?'Åtgärdad':st==='action'?'Åtgärd krävs':st==='fail'?'Ej godkänd':st==='untested'?'Ej färdigkontrollerad':'Godkänd';
  const titleBase=securityDrawingLabel(o)+' · '+SYSTEMS[o.type].label+(o.location?' · '+o.location:'');
  const issueText=issues(o),remediation=isSecurityRemediated(o)?'Åtgärdad: '+o.remediationDate+' · Signatur: '+o.remediationSignature:'';
  const bodyParts=issueText.length?issueText.map(t=>'• '+t):[(st==='untested'?'• Ej färdigkontrollerad':'• '+statusLabel)];if(remediation)bodyParts.push('• '+remediation);const bodySource=bodyParts.join('\n');
  doc.setFont('helvetica','bold');doc.setFontSize(7.8);
  const titleLines=doc.splitTextToSize(titleBase,width-38);
  doc.setFont('helvetica','normal');doc.setFontSize(6.4);
  const bodyLines=doc.splitTextToSize(bodySource,width-18);
  let bodyOffset=0,first=true;
  do{
   const pageRoom=bottom-y;
   const titleCount=first?Math.min(2,titleLines.length):1;
   const titleH=titleCount*3.5;
   const fixedH=7+titleH;
   let maxBody=Math.max(1,Math.floor((pageRoom-fixedH-3)/3.15));
   if(pageRoom<18||maxBody<1){doc.addPage();summaryHeader('ANMÄRKNINGSÖVERSIKT – forts.');y=32;maxBody=Math.max(1,Math.floor((bottom-y-fixedH-3)/3.15))}
   const remaining=Math.max(1,bodyLines.length-bodyOffset),take=Math.min(maxBody,remaining),chunk=bodyLines.length?bodyLines.slice(bodyOffset,bodyOffset+take):[''];
   const cardH=Math.max(16,fixedH+chunk.length*3.15+3);
   const stLight=st==='ok'?[229,244,234]:st==='action'?[255,242,216]:st==='fail'?[252,229,231]:[235,241,244];
   doc.setFillColor(250,250,250);doc.setDrawColor(180,180,180);doc.setLineWidth(.2);doc.roundedRect(left,y,width,cardH,1.5,1.5,'FD');
   doc.setFillColor(...COLORS[st]);doc.rect(left,y,2.4,cardH,'F');
   const badgeW=31;doc.setFillColor(...stLight);doc.setDrawColor(...COLORS[st]);doc.roundedRect(left+width-badgeW-3,y+3,badgeW,6,1.2,1.2,'FD');
   txt(statusLabel,left+width-badgeW/2-3,y+7.1,5.8,true,COLORS[st],{align:'center'});
   doc.setFont('helvetica','bold');doc.setFontSize(7.8);doc.setTextColor(26,48,61);
   const shownTitle=first?titleLines.slice(0,2):[o.id+' · forts.'];doc.text(shownTitle,left+7,y+5.4,{lineHeightFactor:1.05});
   const bodyY=y+6.6+shownTitle.length*3.5;
   doc.setFont('helvetica','normal');doc.setFontSize(6.4);doc.setTextColor(32,52,64);
   doc.text(chunk,left+7,bodyY,{lineHeightFactor:1.12,maxWidth:width-14});
   y+=cardH+3;bodyOffset+=take;first=false;
   if(bodyOffset<bodyLines.length&&y>bottom-16){doc.addPage();summaryHeader('ANMÄRKNINGSÖVERSIKT – forts.');y=32}
  }while(bodyOffset<bodyLines.length);
 });

 function cell(label,value,x,yy,w,h=7,bold=false,signature=false){
  doc.setFillColor(252,252,252);doc.setDrawColor(150,150,150);doc.setLineWidth(.2);doc.rect(x,yy,w,h,'FD');
  const labelText=String(label||'');doc.setFont('helvetica','bold');doc.setFontSize(5.9);doc.setTextColor(82,82,82);
  const labelW=Math.min(w-7,doc.getTextWidth(labelText)+2.2);doc.text(labelText,x+1.5,yy+h/2+1);
  if(value!==undefined&&value!==null&&String(value)!==''){doc.setFont('helvetica',signature?'italic':(bold?'bold':'normal'));doc.setFontSize(signature?7.2:6.7);doc.setTextColor(...(signature?[70,125,165]:[20,20,20]));doc.text(doc.splitTextToSize(String(value),Math.max(5,w-labelW-3)).slice(0,1),x+1.5+labelW,yy+h/2+1)}
 }
 function pdfCheckmark(cx,cy,size=8){
  doc.setFont('zapfdingbats','normal');doc.setFontSize(size);doc.setTextColor(20,20,20);
  doc.text(String.fromCharCode(51),cx,cy+size*.12,{align:'center'});
 }
 function pdfMinus(cx,cy,size=3.2){
  const r=size/2;doc.setDrawColor(20,20,20);doc.setLineWidth(.55);doc.setLineCap('round');doc.line(cx-r,cy,cx+r,cy);doc.setLineCap('butt');
 }
 function pdfCross(cx,cy,size=3.2){
  const r=size/2;doc.setDrawColor(20,20,20);doc.setLineWidth(.55);doc.setLineCap('round');doc.line(cx-r,cy-r,cx+r,cy+r);doc.line(cx+r,cy-r,cx-r,cy+r);doc.setLineCap('butt');
 }
 function backButton(o){
  const bx=188,by=19.1,bw=8,bh=5.8;doc.setFillColor(19,43,56);doc.setDrawColor(19,43,56);doc.rect(bx,by,bw,bh,'FD');
  const cy=by+bh/2;doc.setDrawColor(255,255,255);doc.setLineWidth(.6);doc.line(bx+2.1,cy,bx+5.9,cy);doc.line(bx+2.1,cy,bx+3.8,cy-1.35);doc.line(bx+2.1,cy,bx+3.8,cy+1.35);
  doc.__backLinks.push({pageNo:doc.getNumberOfPages(),drawingPage:o.page,rect:[bx,by,bw,bh]});
 }
 function protocolTop(o,continuation=false){
  doc.setDrawColor(55,55,55);doc.setLineWidth(.22);doc.rect(left,8,width,18);addLogo(left,8,58,18);doc.line(left+58,8,left+58,26);
  txt('Dokumentnr: 2519-1',left+61,12.4,6.3,true,[25,25,25]);
  txt('CHECKLISTA REVISION AV '+SYSTEMS[o.type].label,left+58+(width-58)/2,18.7,9.4,true,[25,25,25],{align:'center'});
  if(continuation){txt('fortsättning',left+58+(width-58)/2,23,6,false,[70,70,70],{align:'center'});y=31;cell('Objekt:',o.id,left,y,62,8);cell('Placering/Dörrlittra:',o.location,left+62,y,62,8);cell('Ao nummer:',project.order,left+124,y,62,8);y+=12;return}
  doc.setDrawColor(155,155,155);doc.setLineWidth(.22);doc.line(left,36.2,left+width,36.2);doc.setFillColor(255,255,255);doc.rect(left,31.8,28,7,'F');txt('SERVICE',left+1.5,36.7,9.4,true,[25,25,25]);y=40;
  cell('Bokat datum:',project.date,left,y,93);cell('Nästa provning:',project.nextDate,left+93,y,93);y+=7;
  cell('ANLÄGGNING:',project.projectName,left,y,93,7,true);cell('Anläggningsnr:',project.facilityNo,left+93,y,93,7,true);y+=7;
  cell('SERVICEFÖRETAG:',project.company,left,y,93,7,true);cell('BESTÄLLARE / KUND:',project.customer,left+93,y,93,7,true);y+=7;
  cell('Kontaktperson på objektet:',project.companyContact,left,y,93);cell('Kontaktperson:',project.contact,left+93,y,93);y+=7;
  cell('Telefon:',project.companyPhone,left,y,93);cell('Telefon:',project.phone,left+93,y,93);y+=7;
  cell('Adress:',project.companyAddress,left,y,93);cell('Adress:',project.address,left+93,y,93);y+=7;
  cell('Postnummer / Postadress:',[project.companyPostalCode,project.companyPostalCity].filter(Boolean).join(' '),left,y,93);cell('Postnummer / Postadress:',[project.postalCode,project.postalCity].filter(Boolean).join(' '),left+93,y,93);y+=7;
  cell('ID / märkning:',o.id,left,y,54,8,true);cell('Placering:',o.location,left+54,y,66,8);cell('AO nummer:',project.order,left+120,y,66,8,true);y+=8;
 }
 function checkHeader(){
  const ws=[9,91,16,24,28,18],titles=['Nr','Benämning / kontrollpunkt','Ingår ej','Klart utan\nanmärkning','Klart med\nanmärkning','Signatur'];let x=left;
  titles.forEach((t,i)=>{doc.setFillColor(...(i===1?[226,226,226]:[238,238,238]));doc.setDrawColor(120,120,120);doc.setLineWidth(.24);doc.rect(x,y,ws[i],10,'FD');doc.setFont('helvetica','bold');doc.setFontSize(i>1?5.9:6.6);doc.setTextColor(35,35,35);const lines=t.split('\n');if(i===1)doc.text(lines,x+2,y+6.1);else doc.text(lines,x+ws[i]/2,y+3.7,{align:'center',lineHeightFactor:1});x+=ws[i]});y+=10;
 }

 items.slice().sort((a,b)=>a.page-b.page||a.number-b.number).forEach(o=>{
  doc.addPage();doc.__protocolPages[o.uid]=doc.getNumberOfPages();backButton(o);protocolTop(o);checkHeader();
  const ws=[9,91,16,24,28,18],checks=allChecks(o),notesReserve=29,rowH=Math.max(6.15,Math.min(7.8,(270-y-notesReserve)/Math.max(1,checks.length)));
  checks.forEach(([n,title])=>{
   const check=o.checks[n]||{},titleSize=rowH<7?5.9:6.3,step=rowH<7?2.1:2.3;let x=left;doc.setFont('helvetica','normal');doc.setFontSize(titleSize);const titleLines=doc.splitTextToSize(String(title||''),ws[1]-3.8).slice(0,2);
   const vals=[n,title,check.result==='na'?'–':'','',check.result==='remark'?'X':'',project.signature||''];
   vals.forEach((v,i)=>{
    doc.setFillColor(...(i===1?[248,248,248]:[255,255,255]));doc.setDrawColor(145,145,145);doc.setLineWidth(.18);doc.rect(x,y,ws[i],rowH,'FD');
    if(i===1){doc.setFont('helvetica','normal');doc.setFontSize(titleSize);doc.setTextColor(25,25,25);const startY=y+rowH/2-((titleLines.length-1)*step)/2+.7;doc.text(titleLines,x+1.7,startY,{lineHeightFactor:1})}
    else if(i===2&&check.result==='na'){const cx=x+ws[i]/2,cy=y+rowH/2;pdfMinus(cx,cy,3.2)}
    else if(i===3&&check.result==='ok'){const cx=x+ws[i]/2,cy=y+rowH/2;pdfCheckmark(cx,cy,8.2)}
    else if(i===4&&check.result==='remark'){const cx=x+ws[i]/2,cy=y+rowH/2;pdfCross(cx,cy,3.2)}
    else if(i===5&&String(v||'')){doc.setFont('times','italic');doc.setFontSize(7.2);doc.setTextColor(55,112,165);doc.text(doc.splitTextToSize(String(v),ws[i]-2.5).slice(0,1),x+ws[i]/2,y+rowH/2+1.15,{align:'center'})}
    else{doc.setFont('helvetica',i===0?'bold':'normal');doc.setFontSize(6.2);doc.setTextColor(25,25,25);doc.text(String(v||''),x+ws[i]/2,y+rowH/2+1,{align:'center'})}
    x+=ws[i];
   });y+=rowH;
  });
  y+=3;doc.setFillColor(238,238,238);doc.setDrawColor(130,130,130);doc.setLineWidth(.2);doc.rect(left,y,width,6,'FD');txt('ALLMÄN INFO / ANMÄRKNING',left+2,y+4.2,6.7,true,[55,55,55]);y+=6;
  const remediationNote=isSecurityRemediated(o)?'Åtgärdad '+o.remediationDate+' · Signatur: '+o.remediationSignature:'';const noteLines=[...issues(o),remediationNote,o.notes].filter(Boolean);
  const noteText=noteLines.join('  ·  '),boxH=Math.max(12,276-y);doc.setFillColor(255,255,255);doc.setDrawColor(145,145,145);doc.setLineWidth(.18);doc.rect(left,y,width,boxH,'FD');
  if(noteText){let fs=6.8,lines=doc.splitTextToSize(noteText,width-7),maxLines=Math.max(1,Math.floor((boxH-4)/2.8));while(lines.length>maxLines&&fs>5.2){fs-=.3;doc.setFontSize(fs);lines=doc.splitTextToSize(noteText,width-7);maxLines=Math.max(1,Math.floor((boxH-4)/(fs*.42)))}if(lines.length>maxLines){lines=lines.slice(0,maxLines);lines[maxLines-1]=String(lines[maxLines-1]).replace(/\s*$/,'')+' …'}doc.setFont('helvetica','normal');doc.setFontSize(fs);doc.setTextColor(35,35,35);doc.text(lines,left+3,y+4.5,{lineHeightFactor:1.1})}
 });
 const pages=doc.getNumberOfPages();for(let i=1;i<=pages;i++){doc.setPage(i);doc.setDrawColor(204,215,223);doc.line(left,284,198,284);txt([project.company,project.projectName||project.facilityNo].filter(Boolean).join(' · ')||'Säkerhetsservice',left,289,7,false,[89,110,123]);txt('Sida '+i+' av '+pages,177,289,7,false,[89,110,123])}
 return doc
}
async function exportPdf(){if(!pdf||!sourceBytes)return msg('Öppna en ritning först.',true);try{msg('Skapar arbets-PDF…');const snapshot=structuredClone({items,textNotes,drawingExtras,project,logoData}),originalBytes=sourceBytes.slice(),{PDFDocument,PDFName,PDFArray,StandardFonts,rgb,degrees}=PDFLib,src=await PDFDocument.load(originalBytes,{updateMetadata:false}),out=await PDFDocument.create(),copied=await out.copyPages(src,src.getPageIndices());copied.forEach(p=>out.addPage(p));const font=await out.embedFont(StandardFonts.HelveticaBold),links=[];for(let i=0;i<copied.length;i++){const pg=copied[i],p=await pdf.getPage(i+1),vp=p.getViewport({scale:1});items.filter(o=>o.page===i+1).forEach(o=>{const[x,y]=vp.convertToPdfPoint(o.x*vp.width,o.y*vp.height),[lx,ly]=vp.convertToPdfPoint(o.labelX*vp.width,o.labelY*vp.height),label=securityDrawingLabel(o),size=label.length>16?7.5:8.5,tw=font.widthOfTextAtSize(label,size),s=statusOf(o),sc=COLORS[s]||COLORS.untested,c=rgb(sc[0]/255,sc[1]/255,sc[2]/255),angle=pg.getRotation().angle,rad=angle*Math.PI/180,cos=Math.cos(rad),sin=Math.sin(rad),boxW=Math.max(34,tw+12),boxH=size+8,halfW=boxW/2,halfH=boxH/2,dx=x-lx,dy=y-ly,dist=Math.max(.001,Math.hypot(dx,dy)),ux=dx/dist,uy=dy/dist,localUx=cos*ux+sin*uy,localUy=-sin*ux+cos*uy,edge=Math.min(Math.abs(localUx)>.0001?halfW/Math.abs(localUx):Infinity,Math.abs(localUy)>.0001?halfH/Math.abs(localUy):Infinity),startX=lx+ux*(edge+1.5),startY=ly+uy*(edge+1.5),endX=x-ux*2,endY=y-uy*2;pg.drawLine({start:{x:startX,y:startY},end:{x:endX,y:endY},thickness:1.05,color:c,opacity:.9});const ah=5,aw=2.8,px=-uy,py=ux;pg.drawLine({start:{x,y},end:{x:x-ux*ah+px*aw,y:y-uy*ah+py*aw},thickness:1.05,color:c});pg.drawLine({start:{x,y},end:{x:x-ux*ah-px*aw,y:y-uy*ah-py*aw},thickness:1.05,color:c});pg.drawCircle({x,y,size:2.2,color:c,borderColor:rgb(1,1,1),borderWidth:.7});const boxX=lx-cos*halfW+sin*halfH,boxY=ly-sin*halfW-cos*halfH;pg.drawRectangle({x:boxX,y:boxY,width:boxW,height:boxH,color:c,borderColor:rgb(1,1,1),borderWidth:1,rotate:degrees(angle)});const tx=-tw/2,ty=-size/3,textX=lx+tx*cos-ty*sin,textY=ly+tx*sin+ty*cos;pg.drawText(label,{x:textX,y:textY,size,font,color:rgb(1,1,1),rotate:degrees(angle)});links.push({pageIndex:i,uid:o.uid,x:lx,y:ly,radius:Math.max(boxW,boxH)/2+4})});
 const noteFont=await out.embedFont(StandardFonts.Helvetica);
 (textNotes||[]).filter(n=>n.page===i+1&&n.text).forEach(n=>{const[x,y]=vp.convertToPdfPoint(n.x*vp.width,n.y*vp.height),[lx,ly]=vp.convertToPdfPoint(n.labelX*vp.width,n.labelY*vp.height),safe=String(n.text).replace(/[^\x20-\x7e\u00a0-\u00ff]/g,'?').slice(0,180),size=7,maxW=Math.min(145,vp.width*.3),lines=[];let line='';safe.split(/\s+/).forEach(word=>{const t=line?line+' '+word:word;if(noteFont.widthOfTextAtSize(t,size)<=maxW)line=t;else{if(line)lines.push(line);line=word}});if(line)lines.push(line);const shown=lines.slice(0,4),pad=4,lineH=9,w=Math.max(34,...shown.map(t=>noteFont.widthOfTextAtSize(t,size)))+pad*2,h=shown.length*lineH+pad*2,dx=x-lx,dy=y-ly,dist=Math.max(.001,Math.hypot(dx,dy)),ux=dx/dist,uy=dy/dist,startX=lx+ux*(Math.min(w,h)/2+2),startY=ly+uy*(Math.min(w,h)/2+2),endX=x-ux*2,endY=y-uy*2,c=rgb(.09,.25,.33);pg.drawLine({start:{x:startX,y:startY},end:{x:endX,y:endY},thickness:.9,color:c});const ah=4,aw=2.2,px=-uy,py=ux;pg.drawLine({start:{x,y},end:{x:x-ux*ah+px*aw,y:y-uy*ah+py*aw},thickness:.9,color:c});pg.drawLine({start:{x,y},end:{x:x-ux*ah-px*aw,y:y-uy*ah-py*aw},thickness:.9,color:c});pg.drawCircle({x,y,size:1.8,color:c});pg.drawRectangle({x:lx-w/2,y:ly-h/2,width:w,height:h,color:rgb(1,1,.94),borderColor:c,borderWidth:.7,opacity:.96});shown.forEach((t,k)=>pg.drawText(t,{x:lx-w/2+pad,y:ly+h/2-pad-size-k*lineH,size,font:noteFont,color:rgb(.05,.12,.16)}))})
 ServiceDrawingTools.drawToPdf(pg,i+1,vp.width,vp.height,snapshot.drawingExtras,noteFont);
}const report=reportDoc(),map=report.__protocolPages||{},backs=report.__backLinks||[],rpdf=await PDFDocument.load(report.output('arraybuffer')),rpages=await out.copyPages(rpdf,rpdf.getPageIndices());rpages.forEach(p=>out.addPage(p));function addLink(sp,tp,rect){const ref=out.context.register(out.context.obj({Type:'Annot',Subtype:'Link',Rect:rect,Border:[0,0,0],Dest:out.context.obj([tp.ref,PDFName.of('Fit')])}));const ex=sp.node.get(PDFName.of('Annots'));if(ex)sp.node.lookup(PDFName.of('Annots'),PDFArray).push(ref);else sp.node.set(PDFName.of('Annots'),out.context.obj([ref]))}links.forEach(l=>{const n=map[l.uid];if(n){const hit=Math.max(14,l.radius||12);addLink(out.getPage(l.pageIndex),out.getPage(src.getPageCount()+n-1),[l.x-hit,l.y-hit,l.x+hit,l.y+hit])}});backs.forEach(b=>{const spi=src.getPageCount()+b.pageNo-1,tpi=b.drawingPage-1;if(spi>=out.getPageCount()||tpi<0)return;const sp=out.getPage(spi),tp=out.getPage(tpi),sz=sp.getSize(),sx=sz.width/210,sy=sz.height/297,[mx,my,mw,mh]=b.rect;addLink(sp,tp,[mx*sx,sz.height-(my+mh)*sy,(mx+mw)*sx,sz.height-my*sy])});
 const state={app:'security-service',version:2,exportedAt:new Date().toISOString(),...snapshot};
 const dataRef=out.context.register(out.context.flateStream(new TextEncoder().encode(JSON.stringify(state)))),drawingRef=out.context.register(out.context.flateStream(originalBytes));
 out.catalog.set(PDFName.of('SecurityServiceWork'),out.context.register(out.context.obj({Version:2,Data:dataRef,Drawing:drawingRef})));
 out.setTitle('Säkerhetsservice – '+(snapshot.project.projectName||snapshot.project.facilityNo||'Service'));out.setSubject('Ritning, anmärkningsöversikt och protokoll. Arbets-PDF för Säkerhetsservice.');out.setCreator('Dörrservice Säkerhetsservice');
 const bytes=await out.save(),url=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'})),a=document.createElement('a'),object=(project.projectName||project.facilityNo||'objekt').trim().replace(/[^a-zA-Z0-9åäöÅÄÖ_-]+/g,'-').replace(/^-+|-+$/g,'')||'objekt',date=project.date||new Date().toISOString().slice(0,10);a.href=url;a.download='sakerhetsservice-'+object+'-'+date+'.pdf';a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);msg('Arbets-PDF skapad. Samma fil kan öppnas nästa service med projekt, logga, objekt och historik kvar.')}catch(e){console.error(e);msg(e.message||'Kunde inte skapa arbets-PDF.',true)}}

let previewPdf=null,previewPage=1,previewRenderTask=null;
async function renderCustomerPreview(){
 if(!previewPdf)return;
 if(previewRenderTask)try{previewRenderTask.cancel()}catch(_){}
 const p=await previewPdf.getPage(previewPage),wrap=$('secPreviewWrap'),natural=p.getViewport({scale:1}),scale=Math.max(.2,Math.min((wrap.clientWidth-24)/natural.width,(wrap.clientHeight-24)/natural.height)),dpr=Math.min(Math.max(2.5,(window.devicePixelRatio||1)*1.6),4),vp=p.getViewport({scale:scale*dpr}),cssVp=p.getViewport({scale});
 const cv=$('secPreviewCanvas');cv.width=Math.ceil(vp.width);cv.height=Math.ceil(vp.height);cv.style.width=cssVp.width+'px';cv.style.height=cssVp.height+'px';
 const previewCtx=cv.getContext('2d');previewCtx.imageSmoothingEnabled=true;previewCtx.imageSmoothingQuality='high';previewRenderTask=p.render({canvasContext:previewCtx,viewport:vp});try{await previewRenderTask.promise}catch(e){if(e.name!=='RenderingCancelledException')throw e}
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
/* Offline wording: same review/apply flow as Door Automation. */

const DOOR_WORDING=[
 'Dörrbladet tar i karmen',
 'Dörrbladet tar i det andra dörrbladet',
 'Dörrbladet tar i golvet',
 'Dörren kärvar vid öppning',
 'Dörren kärvar vid stängning',
 'Dörren går inte att stänga helt',
 'Dörren stannar under öppning',
 'Dörren stannar under stängning',
 'Dörren stänger för hårt',
 'Dörrbladet hänger snett'
];

function doorWordingVariants(problem){
 const alternatives={
  'Dörrbladet tar i karmen':['Dörrbladet går emot karmen','Dörrbladet kommer i kontakt med karmen'],
  'Dörrbladet tar i det andra dörrbladet':['Dörrbladen tar i varandra','Dörrbladet går emot det andra dörrbladet'],
  'Dörrbladet tar i golvet':['Dörrbladet går emot golvet','Dörrbladet kommer i kontakt med golvet'],
  'Dörren kärvar vid öppning':['Dörren går trögt att öppna','Dörren öppnas med motstånd'],
  'Dörren kärvar vid stängning':['Dörren går trögt att stänga','Dörren stängs med motstånd'],
  'Dörren går inte att stänga helt':['Dörren stänger inte helt','Dörren når inte helt stängt läge'],
  'Dörren stänger för hårt':['Dörrens stängning är för hård'],
  'Dörrbladet hänger snett':['Dörrbladet har en sned hängning']
 };
 return [problem,...(alternatives[problem]||[])];
}

function doorWordingSentence(problem,frequency,action){
 const sentence=s=>s.trim().replace(/[.!?]+$/,'')+'.';
 return [problem?sentence(problem+(frequency?' '+frequency:'')):'',action?sentence(action):''].filter(Boolean).join(' ');
}
function openDoorWording({title,original,choices,apply,actions=['Fortsatt felsökning krävs']}){
 const dialog=document.createElement('dialog');dialog.className='doorWordingDialog';dialog.setAttribute('aria-labelledby','doorWordingTitle');
 const h=document.createElement('h2');h.id='doorWordingTitle';h.textContent='Hjälp med formulering';
 const context=document.createElement('p');context.textContent=title;
 const help=document.createElement('p');help.textContent='Fungerar utan internet. Välj det du har observerat och granska förslaget. Befintlig text ersätts först när du väljer Använd texten.';
 const old=document.createElement('p');old.className='doorWordingOriginal';old.textContent='Din text: '+(original||'Ingen text ännu.');
 const field=(caption,element)=>{const l=document.createElement('label');l.append(document.createTextNode(caption),element);return l};
 const select=(items,empty)=>{const el=document.createElement('select');for(const [value,label] of [['',empty],...items.map(x=>[x,x])]){const o=document.createElement('option');o.value=value;o.textContent=label;el.appendChild(o)}return el};
 const problem=select([...new Set(choices)],'Välj beskrivning…');
 const frequency=select(['ibland','vid varje manövrering','under sista delen av stängningen'],'Ingen uppgift om när');
 const action=select(actions,'Ingen åtgärd angiven');
 const preview=document.createElement('textarea');preview.rows=4;preview.value=original;preview.id='doorWordingPreview';
 const status=document.createElement('p');status.setAttribute('role','status');
 const make=document.createElement('button');make.type='button';make.textContent='Skapa förslag';
 let variant=0;
 const another=document.createElement('button');another.type='button';another.textContent='Annan formulering';another.disabled=true;
 const generate=()=>{if(!problem.value){status.textContent='Välj en beskrivning. Du kan också redigera texten direkt nedan.';return}const options=doorWordingVariants(problem.value);preview.value=doorWordingSentence(options[variant%options.length],frequency.value,action.value);another.disabled=options.length<2;status.textContent=options.length>1?'Förslag '+((variant%options.length)+1)+' av '+options.length+'. Kontrollera att texten stämmer.':'Förslaget är klart. Du kan redigera texten nedan.'};
 make.onclick=()=>{variant=0;generate()};
 another.onclick=()=>{variant++;generate()};
 problem.onchange=()=>{variant=0;another.disabled=true};
 const buttons=document.createElement('div');buttons.className='doorWordingActions';
 const use=document.createElement('button');use.type='button';use.className='primary';use.textContent='Använd texten';
 use.onclick=()=>{if(!preview.value.trim()){status.textContent='Skriv eller skapa ett förslag först.';return}apply(preview.value.trim());dialog.close()};
 const cancel=document.createElement('button');cancel.type='button';cancel.textContent='Avbryt';cancel.onclick=()=>dialog.close();
 buttons.append(cancel,use);
 dialog.append(h,context,help,old,field('Beskrivning',problem),field('När händer det?',frequency),field('Behov av åtgärd – välj bara om det är bedömt',action),make,another,field('Förslag – kan redigeras',preview),status,buttons);
 const previous=document.activeElement;
 dialog.addEventListener('close',()=>{dialog.remove();if(previous?.isConnected)previous.focus()},{once:true});
 document.body.appendChild(dialog);dialog.showModal();problem.focus();
}

function securityWordingChoices(o,n){
 const faults=n?(SYSTEMS[o.type].faults[n]||[]):Object.values(SYSTEMS[o.type].faults).flat();
 return [...new Set([...(o.type==='lock'?DOOR_WORDING:[]),...faults])];
}
function securityWordingActions(o){
 return o.type==='lock'?['Justering av dörrbladet krävs','Justering av gångjärnen krävs','Justering av låsblecket krävs','Fortsatt felsökning krävs']:['Fortsatt felsökning krävs','Rengöring krävs','Byte av komponent krävs'];
}
const generalWording=document.createElement('button');generalWording.type='button';generalWording.className='doorWordingButton';generalWording.textContent='Hjälp med formulering';
$('secNotes').parentElement.insertAdjacentElement('afterend',generalWording);
generalWording.onclick=()=>{const o=cur();if(!o)return;openDoorWording({title:SYSTEMS[o.type].label+' – Allmän anmärkning',original:$('secNotes').value,choices:securityWordingChoices(o),actions:securityWordingActions(o),apply:text=>{if(cur()!==o)return;$('secNotes').value=text;$('secNotes').dispatchEvent(new Event('input',{bubbles:true}))}})};

/* Movement measured in screen pixels: deliberate at overview, precise when zoomed. */
function markerDragThreshold(z){return z<=1.1?22:z<1.8?12:5}

/* Session undo/redo: shared behavior with Door Automation. */
const securitySessionHistory=installServiceHistory({
 scope:()=>pdf,
 capture:()=>({data:JSON.parse(JSON.stringify({items,textNotes,drawingExtras,project,logoData})),selected}),
 restore:state=>{
  ({items,textNotes,drawingExtras,project,logoData}=state.data);
  selected=items.some(o=>o.uid===state.selected)?state.selected:null;
  syncProjectInputs();drawMarkers();showSelected();showOverview();save();
 },
 wrapSave:record=>{const previous=save;save=function(...args){const result=previous(...args);record();return result}},
 blocked:()=>document.body.classList.contains('exporting')||viewer.getAttribute('aria-busy')==='true'
});
const securityDrawingTools=ServiceDrawingTools.create({
 stageId:'secStage',
 getItems:()=>drawingExtras,
 setItems:value=>{drawingExtras=value},
 onChange:()=>save(),
 message:msg,
 activateDrawing:()=>go('drawing')
});
const drawMarkersBeforeDrawingTools=drawMarkers;
drawMarkers=function(){drawMarkersBeforeDrawingTools();securityDrawingTools?.render(page,pageWidth,pageHeight)};

