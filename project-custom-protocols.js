(() => {
'use strict';
const $=id=>document.getElementById(id),LIBRARY='tillsyno-project-protocol-templates-v1';
const copy=value=>JSON.parse(JSON.stringify(value));
const uid=()=>crypto.randomUUID?.()||('pc-'+Date.now()+'-'+Math.random().toString(36).slice(2));
let bridge=null,rules=[],objects=[],candidates=[],selectedObject=null,editingRule='',scanVersion=0,scanning=false;
let view=null,baseStats={count:0,done:0,progress:0};
function validRules(value){
 return (Array.isArray(value)?value:[]).filter(r=>r&&typeof r.id==='string'&&typeof r.code==='string'&&r.code.trim()&&typeof r.title==='string'&&Array.isArray(r.points)).map(r=>({id:r.id,code:r.code.slice(0,80),title:r.title.slice(0,160),mode:r.mode==='exact'?'exact':'prefix',points:r.points.filter(p=>typeof p==='string'&&p.trim()).map(p=>p.slice(0,500))})).filter(r=>r.points.length);
}
function validObjects(value){
 return (Array.isArray(value)?value:[]).filter(o=>o&&typeof o.id==='string'&&typeof o.code==='string'&&typeof o.title==='string'&&Number.isInteger(o.page)&&o.page>0&&o.page<=(bridge?.getPdf()?.numPages||Infinity)&&Array.isArray(o.rect)&&o.rect.length===4&&o.rect.every(Number.isFinite)&&Array.isArray(o.points)).map(o=>({...o,points:o.points.filter(p=>p&&typeof p.id==='string'&&typeof p.label==='string').map(p=>({...p,status:['ok','remark','na'].includes(p.status)?p.status:'',note:String(p.note||'')}))}));
}
try{rules=JSON.parse(localStorage.getItem(LIBRARY)||'[]')}catch(_){}
rules=validRules(rules);
const markup=`
<dialog id="pcManager" class="pcDialog">
 <header class="pcHead"><div><small>PROJEKTFLÖDE</small><strong>Egna koder & protokoll</strong></div><button id="pcClose" type="button" aria-label="Stäng egna protokoll">×</button></header>
 <div class="pcBody"><div class="headerDetails pcOffline"></div><p class="pcIntro">Ange vad appen ska hitta i ritningen och vilka kontrollpunkter som ska kopplas till varje träff. Du väljer själv vilka träffar som blir protokoll.</p>
 <div id="pcRules" class="pcRules"></div><button id="pcNewRule" type="button">+ Lägg till mall</button>
 <form id="pcRuleForm" class="pcForm" hidden>
  <label>Kod eller nummer<input id="pcCode" maxlength="80" required placeholder="Exempel: GZ eller 14-18"></label>
  <label>Läs som<select id="pcMatchMode"><option value="prefix">Kodfamilj, till exempel GZ-01 och GZ-02</option><option value="exact">Exakt kod eller nummer</option></select></label>
  <label>Protokollets namn<input id="pcTitle" maxlength="160" required placeholder="Exempel: Egenkontroll lås"></label>
  <label>Kontrollpunkter – en per rad<textarea id="pcPoints" rows="6" maxlength="20000" required placeholder="1.1 Kontroll av infästning\n1.2 Funktionsprov\n1.3 Notering i kontrolljournal"></textarea></label>
  <div class="pcActions"><button id="pcCancelRule" type="button">Avbryt</button><button type="submit">Spara mall</button></div>
 </form>
 <section class="pcScan"><label>Sök på<select id="pcScanScope"><option value="all">Alla sidor</option><option value="current">Aktuell sida</option><option value="pages">Valda sidor</option></select></label><label id="pcPagesLabel" hidden>Sidnummer<input id="pcPages" placeholder="Exempel: 1, 3-5"></label><button id="pcScan" type="button" disabled>Läs PDF med mina mallar</button><p id="pcMessage" role="status">Mallarna sparas på den här enheten och kan användas offline.</p></section>
 <section id="pcResults" hidden><div class="pcResultsHead"><strong id="pcResultCount"></strong><button id="pcSelectAll" type="button">Välj alla</button><button id="pcSelectNone" type="button">Avmarkera</button></div><div id="pcCandidates"></div><button id="pcCreate" type="button" disabled>Skapa valda protokoll</button></section>
 </div>
</dialog>
<dialog id="pcProtocol" class="pcDialog pcProtocol">
 <header class="pcHead"><button id="pcBack" type="button">← Ritning</button><div><small id="pcIdentity"></small><strong id="pcProtocolTitle"></strong></div><button id="pcProtocolClose" type="button" aria-label="Stäng eget protokoll">×</button></header>
 <div class="pcBody"><div class="pcMeta"><label>Datum<input id="pcDate" type="date"></label><label>Utförd av<input id="pcTechnician" maxlength="160"></label><label>Signatur<input id="pcSignature" maxlength="160"></label></div>
 <div class="pcProgress"><strong id="pcProgress">0%</strong><span>godkänd eller ej aktuell</span></div><div id="pcChecks"></div>
 <form id="pcAddPoint" class="pcAddPoint"><label>Ny kontrollpunkt<input id="pcNewPoint" maxlength="500" required placeholder="Nummer och beskrivning"></label><button type="submit">+ Lägg till</button></form>
 <label class="pcNotes">Allmän notering<textarea id="pcNotes" rows="3" maxlength="10000"></textarea></label>
 <div class="pcActions"><button id="pcExport" type="button">Spara protokoll PDF</button></div><p id="pcProtocolMessage" role="status"></p></div>
</dialog>`;
document.body.insertAdjacentHTML('beforeend',markup);
const managerButton=document.createElement('button');managerButton.id='pcOpen';managerButton.type='button';managerButton.textContent='Egna protokoll';document.querySelector('.pwHeaderActions').prepend(managerButton);
const startButton=document.createElement('button');startButton.id='pcStart';startButton.type='button';startButton.textContent='+ Egna koder & protokoll';document.querySelector('.pwEmptyCard').appendChild(startButton);
const layer=document.createElement('div');layer.id='pcMarkers';layer.className='pcMarkers';$('pwStage').appendChild(layer);
const list=document.createElement('section');list.id='pcObjects';list.className='pcObjects';$('pwSide').appendChild(list);
function node(tag,text,className){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(className)n.className=className;return n}
function resetScan(){scanVersion++;scanning=false;candidates=[];$('pcResults').hidden=true;$('pcScan').disabled=!bridge?.getPdf()}
function closeManager(){resetScan();$('pcManager').close()}
function openManager(){renderRules();$('pcScan').disabled=!bridge?.getPdf();if(!$('pcManager').open)$('pcManager').showModal()}
function persist(){bridge?.save();renderObjects();renderMarkers()}
function saveLibrary(){try{localStorage.setItem(LIBRARY,JSON.stringify(rules));return true}catch(_){$('pcMessage').textContent='Mallarna kunde inte sparas på enheten. Spara projekt-PDF för att behålla dem.';return false}}
function renderRules(){
 $('pcRules').replaceChildren();
 if(!rules.length)$('pcRules').appendChild(node('p','Inga egna mallar ännu. Lägg till en kod och dess kontrollpunkter.','pcMuted'));
 rules.forEach(rule=>{
  const row=node('div',undefined,'pcRule');const info=node('div');info.append(node('strong',rule.title),node('small',rule.code+' · '+(rule.mode==='exact'?'exakt kod':'kodfamilj')+' · '+rule.points.length+' punkter'));
  const edit=node('button','Ändra');edit.type='button';edit.onclick=()=>editRule(rule);
  const remove=node('button','Ta bort');remove.type='button';remove.onclick=()=>{rules=rules.filter(r=>r.id!==rule.id);if(editingRule===rule.id)$('pcRuleForm').hidden=true;resetScan();saveLibrary();persist();renderRules();$('pcMessage').textContent='Mallen togs bort. Redan skapade protokoll finns kvar.'};
  row.append(info,edit,remove);$('pcRules').appendChild(row);
 });
}
function editRule(rule=null){
 editingRule=rule?.id||'';$('pcCode').value=rule?.code||'';$('pcTitle').value=rule?.title||'';$('pcMatchMode').value=rule?.mode||'prefix';$('pcPoints').value=rule?.points.join('\n')||'';$('pcRuleForm').hidden=false;$('pcCode').focus();
}
$('pcRuleForm').onsubmit=e=>{
 e.preventDefault();const code=$('pcCode').value.trim().replace(/\s+/g,' '),title=$('pcTitle').value.trim(),points=$('pcPoints').value.split('\n').map(x=>x.trim()).filter(Boolean);
 if(!code||!title||!points.length){$('pcMessage').textContent='Ange kod, namn och minst en kontrollpunkt.';return}
 const rule={id:editingRule||uid(),code,title,mode:$('pcMatchMode').value,points};const index=rules.findIndex(r=>r.id===rule.id);if(index<0)rules.push(rule);else rules[index]=rule;
 $('pcRuleForm').hidden=true;resetScan();const stored=saveLibrary();persist();renderRules();if(stored)$('pcMessage').textContent='Mallen sparades. Öppna en PDF eller läs den öppna ritningen. Ändringen gäller nya protokoll.';
};
function escapeRegExp(value){return value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}
function matcher(rule){
 const literal=escapeRegExp(rule.code.normalize('NFKC')).replace(/ /g,'[ \\t]+');
 const suffix=rule.mode==='exact'?'':'(?:[ \\t_-]*[0-9][\\p{L}\\p{N}]*(?:[._/-][\\p{L}\\p{N}]+)*)?';
 return new RegExp('(?<![\\p{L}\\p{N}_/-])'+literal+suffix+'(?![\\p{L}\\p{N}_/-])','giu');
}
function idFor(rule,page,code,rect){return rule.id+'@'+page+':'+rect.map(n=>Math.round(n*10)).join(':')+':'+code.toLocaleUpperCase('sv')}
function readCandidates(items,rule,page){
 // Join only adjacent fragments on the same baseline. Keep source offsets for hit placement.
 const rows=[];
 for(const item of items){let row=rows.find(r=>Math.abs(r.y-item.y)<=Math.max(2,Math.min(5,item.h*.4)));if(!row){row={y:item.y,items:[]};rows.push(row)}row.items.push(item)}
 const found=[];
 for(const row of rows){
  const sorted=row.items.slice().sort((a,b)=>a.x-b.x);let groups=[],group=[];
  for(const item of sorted){const prev=group[group.length-1];if(prev&&item.x-prev.x-prev.w>Math.max(12,Math.max(item.h,prev.h)*1.4)){groups.push(group);group=[]}group.push(item)}if(group.length)groups.push(group);
  for(const group of groups){
   let text='',segments=[];
   for(const item of group){const part=item.text.normalize('NFKC');const previous=segments[segments.length-1];if(text&&previous&&item.x-previous.item.x-previous.item.w>Math.max(1,item.h*.12))text+=' ';const start=text.length;text+=part;segments.push({start,end:text.length,item})}
   const re=matcher(rule);
   for(const match of text.matchAll(re)){
    const hits=segments.filter(s=>s.end>match.index&&s.start<match.index+match[0].length);if(!hits.length)continue;
    const pieces=hits.map(s=>{const a=Math.max(match.index,s.start)-s.start,b=Math.min(match.index+match[0].length,s.end)-s.start,length=s.end-s.start;return {...s.item,x:s.item.x+s.item.w*a/length,w:s.item.w*(b-a)/length}});
    const rect=[Math.min(...pieces.map(i=>i.x))-2,Math.min(...pieces.map(i=>i.y-i.h*.35))-2,Math.max(...pieces.map(i=>i.x+i.w))+2,Math.max(...pieces.map(i=>i.y+i.h*.95))+2];
    const code=match[0].trim();found.push({id:idFor(rule,page,code,rect),ruleId:rule.id,code,page,rect,title:rule.title,points:rule.points.slice(),selected:false});
   }
  }
 }
 return found;
}
function scanPages(pdf){
 const scope=$('pcScanScope').value;if(scope==='current')return [bridge.getPage()];
 if(scope==='all')return Array.from({length:pdf.numPages},(_,i)=>i+1);
 const pages=new Set();for(const part of $('pcPages').value.split(',')){const m=part.trim().match(/^(\d+)(?:\s*-\s*(\d+))?$/);if(!m)throw Error('Skriv sidnummer som 1, 3-5.');const a=Number(m[1]),b=Number(m[2]||m[1]);if(a<1||b<a||b>pdf.numPages)throw Error('Sidnumren måste ligga inom PDF:ens '+pdf.numPages+' sidor.');for(let n=a;n<=b;n++)pages.add(n)}return [...pages].sort((a,b)=>a-b);
}
async function scan(){
 const pdf=bridge?.getPdf();if(!pdf||scanning)return;if(!rules.length){$('pcMessage').textContent='Lägg till en mall först.';return}
 const version=++scanVersion;scanning=true;$('pcScan').disabled=true;$('pcResults').hidden=true;
 try{
  const pages=scanPages(pdf),found=[],known=new Set(objects.map(o=>o.id));let readable=0;
  for(const page of pages){
   if(version!==scanVersion||pdf!==bridge.getPdf())return;
   $('pcMessage').textContent='Läser sida '+page+' av '+pdf.numPages+'…';
   const text=await bridge.readPageText(page);if(text.items.length)readable++;
   for(const rule of rules)for(const hit of readCandidates(text.items,rule,page))if(!known.has(hit.id)){found.push(hit);known.add(hit.id)}
  }
  if(version!==scanVersion)return;candidates=found;renderCandidates();
  $('pcMessage').textContent=found.length?found.length+' nya träffar. Kontrollera kod och sida, välj sedan vilka som ska få protokoll.':!readable?'Ingen läsbar PDF-text på de valda sidorna. Skannade bilder behöver textigenkänning.':'Inga nya träffar. Kontrollera koden och sidvalet. Befintliga protokoll skapas inte igen.';
 }catch(error){$('pcMessage').textContent=error.message||'PDF:en kunde inte läsas.'}
 finally{if(version===scanVersion){scanning=false;$('pcScan').disabled=false}}
}
function renderCandidates(){
 $('pcCandidates').replaceChildren();$('pcResults').hidden=!candidates.length;$('pcResultCount').textContent=candidates.length+' träffar';
 candidates.forEach(c=>{const row=node('label',undefined,'pcCandidate'),input=node('input');input.type='checkbox';input.checked=c.selected;input.onchange=()=>{c.selected=input.checked;updateCreateButton()};const text=node('span');text.append(node('strong',c.code+' · sida '+c.page),node('small',c.title));row.append(input,text);$('pcCandidates').appendChild(row)});updateCreateButton();
}
function updateCreateButton(){const n=candidates.filter(c=>c.selected).length;$('pcCreate').disabled=!n;$('pcCreate').textContent='Skapa '+n+' valda protokoll'}
$('pcCreate').onclick=()=>{
 const known=new Set(objects.map(o=>o.id));const chosen=candidates.filter(c=>c.selected&&!known.has(c.id));
 for(const c of chosen)objects.push({id:c.id,ruleId:c.ruleId,code:c.code,page:c.page,rect:c.rect,title:c.title,points:c.points.map(label=>({id:uid(),label,status:'',note:''})),date:new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,10),technician:'',signature:'',notes:''});
 persist();closeManager();bridge?.message(chosen.length+' egna protokoll skapades. Klicka på markeringen eller välj under Egna protokoll.');
};
function progress(o){return o.points.length?Math.round(o.points.filter(p=>p.status==='ok'||p.status==='na').length/o.points.length*100):0}
function updateCombinedStats(){
 if(!objects.length)return;
 const total=baseStats.count+objects.length,done=baseStats.done+objects.filter(o=>o.points.length&&progress(o)===100).length;
 $('pwPositionCount').textContent=$('pwMatchedCount').textContent=String(total);$('pwDoneCount').textContent=String(done);
 $('pwTotalProgress').textContent=Math.round((baseStats.progress*baseStats.count+objects.reduce((sum,o)=>sum+progress(o),0))/total)+'%';
}
function renderObjects(){
 updateCombinedStats();list.replaceChildren();if(!objects.length)return;list.append(node('h3','Egna protokoll · '+objects.length));
 for(const o of objects){const b=node('button',undefined,'pcObject');b.type='button';b.append(node('strong',o.code+' · '+progress(o)+'%'),node('small',o.title+' · sida '+o.page));b.onclick=()=>openProtocol(o,true);list.appendChild(b)}
}
function renderMarkers(){
 layer.replaceChildren();if(!view)return;
 for(const o of objects.filter(o=>o.page===view.page)){
  const r=view.viewport.convertToViewportRectangle(o.rect),left=Math.min(r[0],r[2]),top=Math.min(r[1],r[3]);
  const b=node('button',undefined,'pcMarker');b.type='button';b.style.left=left+'px';b.style.top=top+'px';b.style.width=Math.max(24,Math.abs(r[2]-r[0]))+'px';b.style.height=Math.max(24,Math.abs(r[3]-r[1]))+'px';b.dataset.progress=String(progress(o));b.title=o.code+' · '+o.title;b.setAttribute('aria-label',b.title);b.append(node('span',progress(o)===100?'✓':'EK'));
  b.onpointerdown=e=>e.stopPropagation();b.ontouchstart=e=>e.stopPropagation();b.onclick=e=>{e.stopPropagation();openProtocol(o)};layer.appendChild(b);
 }
}
async function openProtocol(o,focus=false){
 if(focus)await bridge?.focus(o);
 selectedObject=o;$('pcIdentity').textContent=o.code+' · sida '+o.page;$('pcProtocolTitle').textContent=o.title;
 for(const [id,key] of [['pcDate','date'],['pcTechnician','technician'],['pcSignature','signature'],['pcNotes','notes']])$(id).value=o[key]||'';
 $('pcProtocolMessage').textContent='Arbetsstatus sparas på enheten. Spara projektet för att få med den i projekt-PDF:en.';
 renderChecks();if(!$('pcProtocol').open)$('pcProtocol').showModal();
}
function renderChecks(){
 const o=selectedObject;$('pcChecks').replaceChildren();if(!o)return;
 for(const point of o.points){
  const row=node('section',undefined,'pcCheck'),head=node('div',undefined,'pcCheckHead'),label=node('input');label.value=point.label;label.maxLength=500;label.setAttribute('aria-label','Kontrollpunkt');label.onchange=()=>{if(label.value.trim()){point.label=label.value.trim();persist()}else label.value=point.label};
  const remove=node('button','×');remove.type='button';remove.setAttribute('aria-label','Ta bort kontrollpunkt');remove.onclick=()=>{o.points=o.points.filter(p=>p.id!==point.id);persist();renderChecks()};head.append(label,remove);
  const choices=node('div',undefined,'pcChoices');for(const [value,title] of [['ok','✓ Godkänd'],['remark','! Anmärkning'],['na','– Ej aktuell']]){const b=node('button',title);b.type='button';b.dataset.status=value;b.classList.toggle('active',point.status===value);b.onclick=()=>{point.status=point.status===value?'':value;persist();renderChecks()};choices.appendChild(b)}
  const note=node('textarea');note.rows=2;note.maxLength=5000;note.placeholder='Kommentar / anmärkning';note.value=point.note||'';note.setAttribute('aria-label','Kommentar till '+point.label);note.onchange=()=>{point.note=note.value;persist()};row.append(head,choices,note);$('pcChecks').appendChild(row);
 }
 $('pcProgress').textContent=progress(o)+'%';
}
$('pcAddPoint').onsubmit=e=>{e.preventDefault();const label=$('pcNewPoint').value.trim();if(!label||!selectedObject)return;selectedObject.points.push({id:uid(),label,status:'',note:''});$('pcNewPoint').value='';persist();renderChecks()};
for(const [id,key] of [['pcDate','date'],['pcTechnician','technician'],['pcSignature','signature'],['pcNotes','notes']])$(id).onchange=()=>{if(selectedObject){selectedObject[key]=$(id).value;persist()}};
function closeProtocol(){if($('pcProtocol').open)$('pcProtocol').close();selectedObject=null}
$('pcExport').onclick=()=>{
 const o=selectedObject;if(!o)return;
 try{
  const doc=new jspdf.jsPDF({unit:'mm',format:'a4'});let y=16;
  const line=(text,size=10,bold=false)=>{doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(size);const lines=doc.splitTextToSize(String(text||''),178);for(const l of lines){if(y>275){doc.addPage();y=16}doc.text(l,16,y);y+=size*.45+2}};
  line(o.title,16,true);line(o.code+' · ritningssida '+o.page,11,true);line('Datum: '+o.date+'    Utförd av: '+o.technician);line('Signatur: '+o.signature);line('Godkänd / ej aktuell: '+progress(o)+'%');y+=4;
  for(const p of o.points){line(p.label,10,true);line('Status: '+({ok:'Godkänd',remark:'Anmärkning',na:'Ej aktuell'}[p.status]||'Ej kontrollerad'));if(p.note)line('Kommentar: '+p.note);y+=3}
  if(o.notes){line('Allmän notering',11,true);line(o.notes)}
  doc.save((o.title+'-'+o.code).replace(/[^a-zA-Z0-9åäöÅÄÖ_-]+/g,'-')+'.pdf');
 }catch(error){$('pcProtocolMessage').textContent='Kunde inte skapa PDF: '+error.message}
};
$('pcOpen').onclick=$('pcStart').onclick=openManager;$('pcClose').onclick=closeManager;$('pcNewRule').onclick=()=>editRule();$('pcCancelRule').onclick=()=>{$('pcRuleForm').hidden=true};$('pcScan').onclick=scan;
$('pcSelectAll').onclick=()=>{candidates.forEach(c=>c.selected=true);renderCandidates()};$('pcSelectNone').onclick=()=>{candidates.forEach(c=>c.selected=false);renderCandidates()};
$('pcScanScope').onchange=()=>{$('pcPagesLabel').hidden=$('pcScanScope').value!=='pages'};
$('pcManager').addEventListener('cancel',e=>{e.preventDefault();closeManager()});$('pcBack').onclick=$('pcProtocolClose').onclick=closeProtocol;
$('pcProtocol').addEventListener('cancel',e=>{e.preventDefault();closeProtocol()});
window.TillsynoCustomProtocols={
 connect(api){bridge=api},
 snapshot(){return copy({schema:1,rules,objects})},
 load(payload){scanVersion++;scanning=false;view=null;layer.replaceChildren();closeProtocol();candidates=[];$('pcResults').hidden=true;
  if(payload&&payload.schema===1){rules=validRules(copy(payload.rules||[]));objects=validObjects(copy(payload.objects||[]))}
  else{try{rules=JSON.parse(localStorage.getItem(LIBRARY)||'[]')}catch(_){rules=[]}rules=validRules(rules);objects=[]}renderObjects();renderRules();},
 render(viewport,page){view={viewport,page};renderMarkers()},
 stats(value){baseStats=value;updateCombinedStats()},
 async analyzed(){ $('pcScan').disabled=false;if(objects.length)bridge.message(objects.length+' egna protokoll återöppnade med sparad arbetsstatus.');if(rules.length&&!objects.length){openManager();await scan()} },
 count(){return objects.length}
};
})();
