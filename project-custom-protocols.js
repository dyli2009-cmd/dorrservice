(() => {
'use strict';
const $=id=>document.getElementById(id),LIBRARY='tillsyno-project-protocol-templates-v1';
const TEMPLATES=window.TillsynoProjectTemplates||{},DEFAULTS='tillsyno-project-installation-defaults-v1';
const COMPANY_FIELDS=['company','companyContact','companyPhone','companyAddress','technician','signature'];
let sharedDefaults={};try{sharedDefaults=JSON.parse(localStorage.getItem(DEFAULTS)||'{}')}catch(_){}
const copy=value=>JSON.parse(JSON.stringify(value));
const uid=()=>crypto.randomUUID?.()||('pc-'+Date.now()+'-'+Math.random().toString(36).slice(2));
let bridge=null,rules=[],objects=[],candidates=[],selectedObject=null,editingRule='',scanVersion=0,scanning=false;
let view=null,baseStats={count:0,done:0,progress:0};
let cardRenderTask=null,cardScale=1,cardPage=0,cardVersion=0;
function validRules(value){
 return (Array.isArray(value)?value:[]).filter(r=>r&&typeof r.id==='string'&&typeof r.code==='string'&&r.code.trim()&&typeof r.title==='string'&&Array.isArray(r.points)).map(r=>({...r,id:r.id,code:r.code.slice(0,80),title:r.title.slice(0,160),target:['doorcard','selfcheck'].includes(r.target)?r.target:'custom',mode:['exact','sequence','object'].includes(r.mode)?r.mode:'prefix',points:r.points.filter(p=>typeof p==='string'&&p.trim()).map(p=>p.slice(0,500))})).filter(r=>r.target==='doorcard'||r.points.length);
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
 <div class="pcCommand"><label>Snabbkommando – kod eller objekt-ID<input id="pcQuickCode" maxlength="100" placeholder="GS1 eller 2167-20-24-45-2"></label><button id="pcRunCode" type="button">Hitta och skapa</button></div>
 <p class="pcMuted">Hitta positioner automatiskt. Oklara dörrkort väljer du själv.</p>
 <div id="pcRules" class="pcRules"></div><button id="pcNewRule" type="button">+ Lägg till mall</button>
 <button id="pcAttachCards" type="button">Lägg till dörrkort-PDF</button><input id="pcCardsFile" type="file" accept="application/pdf,.pdf" hidden>
 <p class="pcMuted">Har du dörrkorten i en separat fil? Lägg till dem här. De följer med när du sparar projektet.</p>
 <form id="pcRuleForm" class="pcForm" hidden>
  <label>Vad ska öppnas?<select id="pcTarget"><option value="custom">Eget protokoll med egna punkter</option><option value="doorcard">Dörrkort från projekt-PDF</option><option value="selfcheck">Egenkontroll från befintlig mall</option></select></label>
  <label>Kod eller nummer<input id="pcCode" maxlength="80" required placeholder="Exempel: GZ eller 14-18"></label>
  <label>Läs som<select id="pcMatchMode"><option value="prefix">Kodfamilj, till exempel GZ-01 och GZ-02</option><option value="exact">Exakt kod eller nummer</option><option value="sequence">Nummerserie, till exempel GS1 och uppåt</option><option value="object">Objekt–modellkod–antal, till exempel 1111-45-3</option></select></label>
  <label id="pcTemplateLabel" hidden>Välj kontrollmall<select id="pcTemplate"></select></label>
  <p id="pcRuleHint" class="pcMuted"></p>
  <label>Protokollets namn<input id="pcTitle" maxlength="160" required placeholder="Exempel: Egenkontroll lås"></label>
  <label>Kontrollpunkter – en per rad<textarea id="pcPoints" rows="6" maxlength="20000" required placeholder="1.1 Kontroll av infästning\n1.2 Funktionsprov\n1.3 Notering i kontrolljournal"></textarea></label>
  <div class="pcActions"><button id="pcCancelRule" type="button">Avbryt</button><button type="submit">Spara mall</button></div>
 </form>
 <details class="pcShared"><summary>Företag & installatör · gemensamt för egenkontrollerna</summary><p class="pcMuted">Uppgifterna används av alla egenkontroller i projektet. Företag och installatör sparas också som förval på enheten.</p><div id="pcSharedFields" class="pcSharedGrid"></div></details>
 <section class="pcScan"><label>Sök på<select id="pcScanScope"><option value="all">Alla sidor</option><option value="current">Aktuell sida</option><option value="pages">Valda sidor</option></select></label><label id="pcPagesLabel" hidden>Sidnummer<input id="pcPages" placeholder="Exempel: 1, 3-5"></label><button id="pcScan" type="button" disabled>Läs PDF med mina mallar</button><p id="pcMessage" role="status">Mallarna sparas på den här enheten och kan användas offline.</p></section>
 <section id="pcResults" hidden><div class="pcResultsHead"><strong id="pcResultCount"></strong><button id="pcSelectAll" type="button">Välj alla</button><button id="pcSelectNone" type="button">Avmarkera</button></div><div id="pcCandidates"></div><button id="pcCreate" type="button" disabled>Skapa valda protokoll</button></section>
 </div>
</dialog>
<dialog id="pcProtocol" class="pcDialog pcProtocol">
 <header class="pcHead"><button id="pcBack" type="button">← Ritning</button><div><small id="pcIdentity"></small><strong id="pcProtocolTitle"></strong></div><button id="pcProtocolClose" type="button" aria-label="Stäng eget protokoll">×</button></header>
 <div class="pcBody"><div class="pcMeta"><label>Datum<input id="pcDate" type="date"></label><label>Utförd av<input id="pcTechnician" maxlength="160"></label><label>Signatur<input id="pcSignature" maxlength="160"></label></div>
 <p id="pcSharedInfo" class="pcMuted" hidden></p><button id="pcEditShared" type="button" hidden>Företag & installatör</button>
 <div id="pcObjectMeta" class="pcMeta pcObjectMeta" hidden><label>Objekt<input id="pcObjectNo" maxlength="80"></label><label id="pcModelLabel">Typ av automatik<select id="pcModel"></select></label><label id="pcEquipmentLabel" hidden>Typ av utrustning<input id="pcEquipmentType" maxlength="160"></label><label>Antal / löpnummer<input id="pcQuantity" inputmode="numeric" maxlength="12"></label></div>
 <section id="pcCardPreview" hidden><div class="pcCardTools"><strong id="pcCardLabel">Originaldörrkort</strong><button id="pcCardOut" type="button" aria-label="Zooma ut dörrkort">−</button><button id="pcCardIn" type="button" aria-label="Zooma in dörrkort">+</button></div><div id="pcCardWrap"><canvas id="pcCardCanvas"></canvas></div></section>
 <div class="pcProgress"><strong id="pcProgress">0%</strong><span>kontrollerade punkter</span><button id="pcApproveAll" type="button">✓ Godkänn alla</button></div><div id="pcChecks"></div>
 <form id="pcAddPoint" class="pcAddPoint"><label>Ny kontrollpunkt<input id="pcNewPoint" maxlength="500" required placeholder="Nummer och beskrivning"></label><button type="submit">+ Lägg till</button></form>
 <label class="pcNotes">Allmän notering<textarea id="pcNotes" rows="3" maxlength="10000"></textarea></label>
 <div class="pcActions"><button id="pcPreview" type="button">Visa kundmall</button><button id="pcExport" type="button">Spara protokoll PDF</button></div><p id="pcProtocolMessage" role="status"></p></div>
</dialog>`;
document.body.insertAdjacentHTML('beforeend',markup);
const managerButton=document.createElement('button');managerButton.id='pcOpen';managerButton.type='button';managerButton.textContent='Egna protokoll';document.querySelector('.pwHeaderActions').prepend(managerButton);
const startButton=document.createElement('button');startButton.id='pcStart';startButton.type='button';startButton.textContent='+ Egna koder & protokoll';document.querySelector('.pwEmptyCard').appendChild(startButton);
const layer=document.createElement('div');layer.id='pcMarkers';layer.className='pcMarkers';$('pwStage').appendChild(layer);
const list=document.createElement('section');list.id='pcObjects';list.className='pcObjects';$('pwSide').appendChild(list);
function node(tag,text,className){const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(className)n.className=className;return n}
const SHARED_FIELDS=[['projectName','Projekt / objekt'],['facilityNo','Objektnummer'],['order','Ordernummer / AO'],['date','Datum','date'],['nextDate','Nästa provning','date'],['customer','Beställare / kund'],['contact','Kontaktperson'],['phone','Telefon kund'],['address','Adress kund'],['company','Installerande företag'],['companyContact','Kontaktman företag'],['companyPhone','Telefon företag'],['companyAddress','Adress företag'],['technician','Utförd av / installatör'],['signature','Signatur']];
for(const [key,title,type] of SHARED_FIELDS){const label=node('label',title),input=node('input');input.id='pcShared-'+key;input.type=type||'text';input.maxLength=250;input.onchange=()=>{bridge?.setProjectMeta({[key]:input.value});if(COMPANY_FIELDS.includes(key)){sharedDefaults[key]=input.value;try{localStorage.setItem(DEFAULTS,JSON.stringify(sharedDefaults))}catch(_){}}syncShared();persist()};label.appendChild(input);$('pcSharedFields').appendChild(label)}
for(const [key,t] of Object.entries(TEMPLATES)){const option=node('option',t.label);option.value=key;$('pcTemplate').appendChild(option)}
$('pcTemplate').value='automation_selfcheck';
function syncShared(){
 const meta=bridge?.getProjectMeta()||sharedDefaults;
 for(const [key] of SHARED_FIELDS)$('pcShared-'+key).value=meta[key]||'';
 if(selectedObject?.target==='selfcheck'){
  $('pcDate').value=meta.date||'';$('pcTechnician').value=meta.technician||'';$('pcSignature').value=meta.signature||'';
  $('pcSharedInfo').textContent=[meta.company,meta.companyContact,meta.companyPhone,meta.companyAddress].filter(Boolean).join(' · ')||'Ange företag och installatör. Uppgifterna delas med alla egenkontroller.';
 }
}
function configureRule(applyTemplate=false){
 const target=$('pcTarget').value,door=target==='doorcard',self=target==='selfcheck';
 $('pcTemplateLabel').hidden=!self;$('pcTitle').disabled=door;$('pcPoints').disabled=door;$('pcTitle').readOnly=$('pcPoints').readOnly=self;
 $('pcTitle').closest('label').hidden=door;$('pcPoints').closest('label').hidden=door;
 if(door){$('pcTitle').value='Dörrkort';$('pcRuleHint').textContent='GS1 och uppåt hittar hela nummerserien. Varje ritningskod matchas exakt mot sitt eget dörrkort i PDF:en.'}
 else if(self){if(applyTemplate){const t=TEMPLATES[$('pcTemplate').value];if(t){$('pcTitle').value=t.label;$('pcPoints').value=t.checks.map(([n,label])=>n+' '+label).join('\n')}}$('pcRuleHint').textContent='Skriv objektnumret. Med Objekt–modellkod–antal läses till exempel 1111-45-3 som objekt 1111, SW300 och antal/löpnummer 3. Granska uppgifterna före skapandet.'}
 else $('pcRuleHint').textContent='Skapa ett eget protokoll med valfria kontrollpunkter.';
}
$('pcTarget').onchange=()=>{if($('pcTarget').value==='doorcard')$('pcMatchMode').value='sequence';if($('pcTarget').value==='selfcheck')$('pcMatchMode').value='object';configureRule(true)};
$('pcTemplate').onchange=()=>configureRule(true);
function resetScan(){scanVersion++;scanning=false;candidates=[];$('pcResults').hidden=true;$('pcScan').disabled=!bridge?.getPdf()}
function closeManager(){resetScan();$('pcManager').close();syncShared()}
function openManager(){renderRules();syncShared();$('pcScan').disabled=$('pcAttachCards').disabled=!bridge?.getPdf();if(!$('pcManager').open)$('pcManager').showModal()}
function persist(){bridge?.save();renderObjects();renderMarkers()}
function saveLibrary(){try{localStorage.setItem(LIBRARY,JSON.stringify(rules));return true}catch(_){$('pcMessage').textContent='Mallarna kunde inte sparas på enheten. Spara projekt-PDF för att behålla dem.';return false}}
function renderRules(){
 $('pcRules').replaceChildren();
 if(!rules.length)$('pcRules').appendChild(node('p','Inga egna mallar ännu. Lägg till en kod och dess kontrollpunkter.','pcMuted'));
 rules.forEach(rule=>{
  const row=node('div',undefined,'pcRule');const info=node('div');info.append(node('strong',rule.title),node('small',rule.code+' · '+({exact:'exakt kod',sequence:'och uppåt',object:'objekt–typ–antal'}[rule.mode]||'kodfamilj')+' · '+(rule.target==='doorcard'?'matcha originaldörrkort':rule.points.length+' punkter')));
  const edit=node('button','Ändra');edit.type='button';edit.onclick=()=>editRule(rule);
  const remove=node('button','Ta bort');remove.type='button';remove.onclick=()=>{rules=rules.filter(r=>r.id!==rule.id);if(editingRule===rule.id)$('pcRuleForm').hidden=true;resetScan();saveLibrary();persist();renderRules();$('pcMessage').textContent='Mallen togs bort. Redan skapade protokoll finns kvar.'};
  row.append(info,edit,remove);$('pcRules').appendChild(row);
 });
}
function editRule(rule=null){
 editingRule=rule?.id||'';$('pcTarget').value=rule?.target||'custom';$('pcTemplate').value=rule?.template||'automation_selfcheck';$('pcCode').value=rule?.code||'';$('pcTitle').value=rule?.title||'';$('pcMatchMode').value=rule?.mode||'prefix';$('pcPoints').value=rule?.points.join('\n')||'';configureRule();$('pcRuleForm').hidden=false;$('pcCode').focus();
}
$('pcRuleForm').onsubmit=e=>{
 e.preventDefault();const code=$('pcCode').value.trim().replace(/\s+/g,' '),title=$('pcTitle').value.trim(),points=$('pcPoints').value.split('\n').map(x=>x.trim()).filter(Boolean);
 const target=$('pcTarget').value,mode=$('pcMatchMode').value;
 if(!code||!title||(target!=='doorcard'&&!points.length)){ $('pcMessage').textContent='Ange kod, namn och minst en kontrollpunkt.';return }
 if(mode==='sequence'&&!/^\p{L}+[\s_-]*\d+$/u.test(code)){ $('pcMessage').textContent='För nummerserie: skriv en startkod som GS1.';return }
 const rule={id:editingRule||uid(),code,title,mode,points:target==='doorcard'?[]:points,target,template:target==='selfcheck'?$('pcTemplate').value:''};const index=rules.findIndex(r=>r.id===rule.id);if(index<0)rules.push(rule);else rules[index]=rule;
 $('pcRuleForm').hidden=true;resetScan();const stored=saveLibrary();persist();renderRules();if(stored)$('pcMessage').textContent='Mallen sparades. Öppna en PDF eller läs den öppna ritningen. Ändringen gäller nya protokoll.';
};
function escapeRegExp(value){return value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}
function matcher(rule){
 const series=rule.mode==='sequence'?rule.code.match(/^(\p{L}+)[\s_-]*(\d+)$/u):null;
 const structured=rule.mode==='exact'&&/^\d+(?:-\d+){2,}$/.test(rule.code.replace(/\s+/g,''));
 const literal=structured?rule.code.replace(/\s+/g,'').split('').map(c=>c==='-'?'[ \\t]*[-–—][ \\t]*':escapeRegExp(c)+'[ \\t]*').join(''):series?series[1].split('').map(escapeRegExp).join('[ \\t_-]*'):escapeRegExp(rule.code.normalize('NFKC')).replace(/ /g,'[ \\t]+');
 const suffix=series?'[ \\t_-]*[0-9](?:[ \\t]*[0-9])*':rule.mode==='object'?'(?:(?:[ \\t]*[-–—][ \\t]*[0-9]+){2,})?':rule.mode==='exact'?'':'(?:[ \\t_-]*[0-9][\\p{L}\\p{N}]*(?:[._/-][\\p{L}\\p{N}]+)*)?';
 return new RegExp('(?<![\\p{L}\\p{N}_/-])'+literal+suffix+'(?![\\p{L}\\p{N}_/-])','giu');
}
function idFor(rule,page,code,rect){return rule.id+(rule.target&&rule.target!=='custom'?'|'+rule.target:'')+'@'+page+':'+rect.map(n=>Math.round(n*10)).join(':')+':'+code.toLocaleUpperCase('sv')}
function objectInfo(code,items,rect){
 const parsed=bridge?.parseAutomation(code.replace(/[–—]/g,'-'));
 if(parsed)return {objectNo:parsed.objectNo,modelCode:parsed.modelCode,model:parsed.model,quantity:parsed.serialNumber};
 const x=(rect[0]+rect[2])/2,y=(rect[1]+rect[3])/2;
 const nearby=items.filter(i=>Math.abs(i.y-y)<65&&i.x<x+180&&i.x+i.w>x-120),models=new Map();
 for(const i of nearby){const model=bridge?.modelFromText(i.text);if(model)models.set(model.code,model)}
 const model=models.size===1?[...models.values()][0]:null,text=nearby.map(i=>i.text).join(' '),quantity=text.match(/\b(?:antal|löpnummer|lopnummer)\s*[:#-]?\s*(\d{1,6})\b/i)?.[1]||'';
 return {objectNo:code,modelCode:model?.code||'',model:model?.name||'',quantity};
}
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
    if(rule.mode==='sequence'){const minimum=Number(rule.code.match(/\d+$/)?.[0]||0),number=Number(match[0].replace(/[^0-9]/g,''));if(number<minimum)continue}
    const hits=segments.filter(s=>s.end>match.index&&s.start<match.index+match[0].length);if(!hits.length)continue;
    const pieces=hits.map(s=>{const a=Math.max(match.index,s.start)-s.start,b=Math.min(match.index+match[0].length,s.end)-s.start,length=s.end-s.start;return {...s.item,x:s.item.x+s.item.w*a/length,w:s.item.w*(b-a)/length}});
    const rect=[Math.min(...pieces.map(i=>i.x))-2,Math.min(...pieces.map(i=>i.y-i.h*.35))-2,Math.max(...pieces.map(i=>i.x+i.w))+2,Math.max(...pieces.map(i=>i.y+i.h*.95))+2];
    const code=rule.mode==='sequence'?match[0].replace(/[\\s_-]+/g,'').toUpperCase():rule.mode==='exact'&&/^\\d+(?:-\\d+){2,}$/.test(rule.code.replace(/\\s/g,''))?match[0].replace(/\\s+/g,'').replace(/[–—]/g,'-'):match[0].trim();found.push({id:idFor(rule,page,code,rect),ruleId:rule.id,code,page,rect,title:rule.title,points:rule.points.slice(),selected:false,target:rule.target||'custom',template:rule.template||'',sourceKind:'text',...(rule.target==='selfcheck'?objectInfo(code,items,rect):{})});
   }
  }
 }
 return found;
}
function samePosition(a,b){
 if(a.ruleId!==b.ruleId||a.page!==b.page)return false;
 const canonical=value=>value.replace(/[\s_-]+/g,'').toUpperCase();
 if(canonical(a.code)!==canonical(b.code)){
  if(a.target!=='selfcheck'||b.target!=='selfcheck')return false;
  const pa=bridge?.parseAutomation(a.code),pb=bridge?.parseAutomation(b.code);
  // A plain object label and its full automation ID describe one marking.
  if(!!pa===!!pb||canonical(pa?.objectNo||a.code)!==canonical(pb?.objectNo||b.code))return false;
 }
 const [ax,ay,ar,at]=a.rect,[bx,by,br,bt]=b.rect;
 // Duplicate only when both hit centres belong to the same marking, not a nearby door.
 return (ax+ar)/2>=bx-3&&(ax+ar)/2<=br+3&&(ay+at)/2>=by-3&&(ay+at)/2<=bt+3||
        (bx+br)/2>=ax-3&&(bx+br)/2<=ar+3&&(by+bt)/2>=ay-3&&(by+bt)/2<=at+3;
}
function markedCandidates(marks,items,rule,page){
 const found=[];
 for(const mark of marks){
  const rect=mark.rect,label=mark.label||mark.code||'';
  const synthetic={text:label,x:rect[0],y:rect[1],w:Math.max(1,rect[2]-rect[0]),h:Math.max(1,rect[3]-rect[1])};
  for(const hit of readCandidates([synthetic],rule,page)){
   hit.rect=rect.slice();hit.id=idFor(rule,page,hit.code,rect);hit.sourceKind=mark.sourceKind||'marking';
   if(rule.target==='selfcheck')Object.assign(hit,objectInfo(hit.code,items,rect));
   found.push(hit);
  }
 }
 return found.sort((a,b)=>Number(!!bridge?.parseAutomation(b.code))-Number(!!bridge?.parseAutomation(a.code))).filter((hit,index,all)=>!all.slice(0,index).some(o=>samePosition(o,hit)));
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
   const text=await bridge.readPageText(page),marks=await bridge.sourceMarkings(page);if(text.items.length||marks.length)readable++;
   for(const rule of rules){
    if(rule.target==='doorcard'&&bridge.isDoorCardPage(text))continue;
    if(rule.target==='selfcheck'&&bridge.isAutomationProtocolPage(text.raw))continue;
    for(const hit of [...readCandidates(text.items,rule,page),...markedCandidates(marks,text.items,rule,page)])if(!known.has(hit.id)&&![...objects,...found].some(o=>samePosition(o,hit))){found.push(hit);known.add(hit.id)}
   }
  }
  const sourcePages=[...new Set([...found,...objects].filter(c=>c.target==='doorcard').map(c=>c.page))];
  const cards=new Map();for(const hit of found.filter(c=>c.target==='doorcard')){
   if(!cards.has(hit.code))cards.set(hit.code,await bridge.doorCards(hit.code,sourcePages));
   hit.cardMatches=cards.get(hit.code);hit.protocolPage=hit.cardMatches.length===1?hit.cardMatches[0].page:null;
   hit.points=hit.protocolPage?hit.cardMatches[0].points:[];
  }
  if(version!==scanVersion)return;candidates=found;renderCandidates();
  $('pcMessage').textContent=found.length?found.length+' nya träffar. Kontrollera kod och sida, välj sedan vilka som ska få protokoll.':!readable?'Ingen läsbar PDF-text på de valda sidorna. Skannade bilder behöver textigenkänning.':'Inga nya träffar. Kontrollera koden och sidvalet. Befintliga protokoll skapas inte igen.';
 }catch(error){$('pcMessage').textContent=error.message||'PDF:en kunde inte läsas.'}
 finally{if(version===scanVersion){scanning=false;$('pcScan').disabled=false}}
}
function renderCandidates(){
 $('pcCandidates').replaceChildren();$('pcResults').hidden=!candidates.length;$('pcResultCount').textContent=candidates.length+' träffar';
 candidates.forEach(c=>{
  const row=node('div',undefined,'pcCandidate'),input=node('input');input.type='checkbox';input.setAttribute('aria-label','Välj '+c.code+' på sida '+c.page);input.checked=c.selected;input.disabled=c.target==='doorcard'&&!c.protocolPage;input.onchange=()=>{c.selected=input.checked;updateCreateButton()};const text=node('span');text.append(node('strong',c.code+' · sida '+c.page),node('small',c.target==='doorcard'?(c.protocolPage?'Dörrkort sida '+c.protocolPage:c.cardMatches.length?'Flera möjliga dörrkort – välj rätt sida':'Inget matchande dörrkort hittades'):c.title));row.append(input,text);
  if(c.target==='doorcard'&&c.cardMatches.length>1){const select=node('select');select.setAttribute('aria-label','Välj dörrkort för '+c.code);select.appendChild(node('option','Välj dörrkort…'));for(const card of c.cardMatches){const option=node('option','Dörrkort sida '+card.page);option.value=String(card.page);select.appendChild(option)}select.onchange=()=>{const card=c.cardMatches.find(m=>String(m.page)===select.value);c.protocolPage=card?.page||null;c.points=card?.points||[];c.selected=false;renderCandidates()};select.value=c.protocolPage?String(c.protocolPage):'';row.appendChild(select)}
  if(c.target==='selfcheck'){
   const auto=['automation','automation_selfcheck'].includes(c.template),fields=node('div',undefined,'pcCandidateMeta'),object=node('input'),model=node(auto?'select':'input'),quantity=node('input');object.value=c.objectNo;object.setAttribute('aria-label','Objekt för '+c.code);quantity.value=c.quantity;quantity.inputMode='numeric';quantity.setAttribute('aria-label','Antal för '+c.code);quantity.placeholder='Antal';model.setAttribute('aria-label','Typ för '+c.code);if(auto)fillModels(model,c.modelCode);else{model.value=c.model||'';model.className='pcCandidateEquipment';model.placeholder='Typ av utrustning'}object.onchange=()=>c.objectNo=object.value.trim();quantity.onchange=()=>c.quantity=quantity.value.trim();model.onchange=()=>{c.modelCode=auto?model.value:'';c.model=auto?bridge.models.find(([code])=>code===model.value)?.[1]||'':model.value.trim()};fields.append(object,model,quantity);row.appendChild(fields);
  }
  $('pcCandidates').appendChild(row)
 });updateCreateButton();
}
function fillModels(select,value=''){select.replaceChildren();const empty=node('option','Typ ej avläst / välj typ');empty.value='';select.appendChild(empty);for(const [code,name] of bridge?.models||[]){const option=node('option',code+' · '+name);option.value=code;select.appendChild(option)}select.value=value||''}
function updateCreateButton(){const n=candidates.filter(c=>c.selected).length;$('pcCreate').disabled=!n;$('pcCreate').textContent='Skapa '+n+' valda protokoll'}
function createSelected(){
 const known=new Set(objects.map(o=>o.id)),chosen=candidates.filter(c=>c.selected&&!known.has(c.id));
 for(const c of chosen)objects.push({id:c.id,ruleId:c.ruleId,code:c.code,page:c.page,rect:c.rect,title:c.title,target:c.target,template:c.template,sourceKind:c.sourceKind||'text',protocolPage:c.protocolPage||null,objectNo:c.objectNo||'',modelCode:c.modelCode||'',model:c.model||'',quantity:c.quantity||'',points:c.points.map(label=>({id:uid(),label,status:'',note:''})),date:new Date(Date.now()-new Date().getTimezoneOffset()*60000).toISOString().slice(0,10),technician:'',signature:'',notes:''});
 persist();closeManager();bridge?.message(chosen.length+' egna protokoll skapades. Klicka på märkningen eller välj under Egna protokoll.');
 return chosen.length;
}
$('pcCreate').onclick=createSelected;
async function runQuickCommand(){
 const input=$('pcQuickCode').value.toUpperCase().replace(/[–—]/g,'-').trim();
 const gs=input.match(/\bGS\s*[0-9]+\b/i),serial=input.match(/\b[0-9]{1,6}(?:\s*-\s*[0-9]{1,6}){2,}\b/);
 const code=(serial?.[0]||gs?.[0]||input).replace(/\s*-\s*/g,'-').replace(/\s+/g,'').trim();
 if(!code){$('pcMessage').textContent='Skriv en kod eller ett objekt-ID.';return}
 if(!bridge?.getPdf()){$('pcMessage').textContent='Öppna en ritning först.';return}
 let rule=rules.find(r=>r.code.replace(/\s+/g,'').toUpperCase()===code);
 if(!rule){
  const parsed=bridge.parseAutomation(code),isGs=/^GS\d+$/i.test(code);
  if(!parsed&&!isGs){editRule();$('pcCode').value=code;$('pcMessage').textContent='Skapa först en mall med kontrollpunkter för den här koden.';return}
  const template=TEMPLATES.automation_selfcheck;
  rule={id:uid(),code,mode:isGs?'sequence':'exact',title:isGs?'Dörrkort':template?.label||'Egenkontroll dörrautomatik',target:isGs?'doorcard':'selfcheck',template:isGs?'':'automation_selfcheck',points:isGs?[]:(template?.checks||[]).map(([n,label])=>n+' '+label)};
  rules.push(rule);saveLibrary();persist();renderRules();
 }
 $('pcScanScope').value='all';$('pcPagesLabel').hidden=true;$('pcRunCode').disabled=true;
 try{
  await scan();
  const ready=candidates.filter(c=>c.ruleId===rule.id&&(c.target!=='doorcard'||!!c.protocolPage));
  if(!ready.length){$('pcMessage').textContent='Ingen säker matchning för '+code+'. Kontrollera träffarna och välj dörrkort manuellt vid behov.';return}
  ready.forEach(c=>c.selected=true);
  const count=createSelected();bridge?.message(count+' träffar skapades från kommandot '+code+'.');
 }finally{$('pcRunCode').disabled=false}
}
$('pcRunCode').onclick=()=>runQuickCommand().catch(error=>$('pcMessage').textContent='Kunde inte läsa kommandot: '+(error.message||error));
$('pcQuickCode').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();$('pcRunCode').click()}};

function progress(o){return o.points.length?Math.round(o.points.filter(p=>['ok','na','remark'].includes(p.status)).length/o.points.length*100):0}
function updateCombinedStats(){
 if(!objects.length)return;
 const existing=bridge?.existingPositions()||[],replaced=existing.filter(e=>objects.some(o=>o.target==='doorcard'&&samePosition(o,{...e,ruleId:o.ruleId})));
 const baseCount=Math.max(0,baseStats.count-replaced.length),total=baseCount+objects.length,done=baseStats.done-replaced.filter(o=>o.progress===100).length+objects.filter(o=>o.points.length&&progress(o)===100).length;
 $('pwPositionCount').textContent=$('pwMatchedCount').textContent=String(total);$('pwDoneCount').textContent=String(done);
 $('pwTotalProgress').textContent=Math.round((baseStats.progress*baseCount+objects.reduce((sum,o)=>sum+progress(o),0))/total)+'%';
}
function renderObjects(){
 updateCombinedStats();list.replaceChildren();if(!objects.length)return;list.append(node('h3','Egna protokoll · '+objects.length));
 for(const o of objects){const b=node('button',undefined,'pcObject');b.type='button';b.append(node('strong',o.code+' · '+progress(o)+'%'),node('small',o.title+' · sida '+o.page));b.onclick=()=>openProtocol(o,true);list.appendChild(b)}
}
function renderMarkers(){
 layer.replaceChildren();if(!view)return;
 for(const o of objects.filter(o=>o.page===view.page)){
  const r=view.viewport.convertToViewportRectangle(o.rect),originLeft=Math.min(r[0],r[2]),originTop=Math.min(r[1],r[3]),naturalW=Math.abs(r[2]-r[0]),naturalH=Math.abs(r[3]-r[1]);
  const annotation=o.sourceKind&&o.sourceKind!=='text',w=annotation?Math.min(44,Math.max(16,naturalW)):Math.max(12,Math.min(180,naturalW)),h=annotation?Math.min(18,Math.max(12,naturalH)):Math.max(12,Math.min(30,naturalH));
  const left=annotation?originLeft+(naturalW-w)/2:originLeft,top=annotation?originTop+(naturalH-h)/2:originTop;
  const b=node('button',undefined,'pcMarker pcMarkerExact');b.type='button';b.style.left=left+'px';b.style.top=top+'px';b.style.width=w+'px';b.style.height=h+'px';
  const pct=progress(o),untested=o.points.every(p=>!p.status);
  b.dataset.progress=String(pct);b.dataset.state=untested?'untested':pct===100?'done':'inprogress';b.dataset.target=o.target||'custom';b.dataset.source=o.sourceKind||'text';
  b.title=o.code+' · '+o.title+' · '+(untested?'Ej kontrollerad':pct+'% klar');b.setAttribute('aria-label',b.title);
  b.append(node('span',o.code,'pcMarkerText'),node('small',untested?'Ej kontrollerad':pct===100?'✓':pct+'%','pcMarkerStatus'));
  b.onpointerdown=e=>e.stopPropagation();b.ontouchstart=e=>e.stopPropagation();b.onclick=e=>{e.stopPropagation();openProtocol(o)};layer.appendChild(b);
 }
}

async function openProtocol(o,focus=false){
 if(focus)await bridge?.focus(o);
 selectedObject=o;$('pcIdentity').textContent=o.code+' · sida '+o.page;$('pcProtocolTitle').textContent=o.title;
 for(const [id,key] of [['pcDate','date'],['pcTechnician','technician'],['pcSignature','signature'],['pcNotes','notes']])$(id).value=o[key]||'';
 $('pcProtocolMessage').textContent='Arbetsstatus sparas på enheten. Spara projektet för att få med den i projekt-PDF:en.';
 const self=o.target==='selfcheck';$('pcSharedInfo').hidden=$('pcEditShared').hidden=$('pcObjectMeta').hidden=!self;$('pcObjectNo').value=o.objectNo||o.code;$('pcQuantity').value=o.quantity||'';fillModels($('pcModel'),o.modelCode);syncShared();
 const auto=['automation','automation_selfcheck'].includes(o.template);$('pcModelLabel').hidden=!auto;$('pcEquipmentLabel').hidden=auto;$('pcEquipmentType').value=o.model||'';
 cardPage=o.target==='doorcard'?o.protocolPage:0;cardScale=1;$('pcCardPreview').hidden=!cardPage;
 renderChecks();if(!$('pcProtocol').open)$('pcProtocol').showModal();if(cardPage)await renderCard();
}
async function renderCard(){
 const version=++cardVersion;
 if(cardRenderTask)try{cardRenderTask.cancel()}catch(_){}
 const pdf=bridge?.getPdf(),no=cardPage;if(!pdf||!no)return;
 const pg=await pdf.getPage(no);if(version!==cardVersion||no!==cardPage||pdf!==bridge.getPdf()||!$('pcProtocol').open)return;
 const base=pg.getViewport({scale:1}),scale=Math.max(.2,Math.min(3,($('pcCardWrap').clientWidth-12)/base.width))*cardScale,vp=pg.getViewport({scale}),raster=pg.getViewport({scale:Math.min(scale,Math.sqrt(7000000/(base.width*base.height)),4200/Math.max(base.width,base.height))});
 const canvas=document.createElement('canvas');canvas.width=Math.ceil(raster.width);canvas.height=Math.ceil(raster.height);
 const task=pg.render({canvasContext:canvas.getContext('2d'),viewport:raster});cardRenderTask=task;try{await task.promise}catch(e){if(e.name!=='RenderingCancelledException')throw e}finally{if(cardRenderTask===task)cardRenderTask=null}
 if(version!==cardVersion||no!==cardPage)return;const visible=$('pcCardCanvas');visible.width=canvas.width;visible.height=canvas.height;visible.getContext('2d').drawImage(canvas,0,0);visible.style.width=vp.width+'px';visible.style.height=vp.height+'px';$('pcCardLabel').textContent='Originaldörrkort · sida '+no;
}
function renderChecks(){
 const o=selectedObject;$('pcChecks').replaceChildren();if(!o)return;
 for(const point of o.points){
  const row=node('section',undefined,'pcCheck'),head=node('div',undefined,'pcCheckHead'),label=node('textarea');label.className='pcPointLabel';label.rows=2;label.value=point.label;label.maxLength=500;label.oninput=()=>{label.style.height='auto';label.style.height=label.scrollHeight+'px'};label.setAttribute('aria-label','Kontrollpunkt');label.onchange=()=>{if(label.value.trim()){point.label=label.value.trim();persist()}else label.value=point.label};
  const remove=node('button','×');remove.type='button';remove.setAttribute('aria-label','Ta bort kontrollpunkt');remove.onclick=()=>{o.points=o.points.filter(p=>p.id!==point.id);persist();renderChecks()};head.append(label,remove);
  const state=node('small',point.status?({ok:'Godkänd',remark:'Anmärkning',na:'Ej aktuell'}[point.status]||'Ej kontrollerad'):'Ej kontrollerad','pcCheckState');row.appendChild(state);
   const choices=node('div',undefined,'pcChoices');for(const [value,title] of [['ok','✓ Godkänd'],['remark','! Anmärkning'],['na','– Ej aktuell']]){const b=node('button',title);b.type='button';b.dataset.status=value;b.classList.toggle('active',point.status===value);b.onclick=()=>{point.status=point.status===value?'':value;persist();renderChecks()};choices.appendChild(b)}
  const note=node('textarea');note.className='pcPointNote';note.rows=2;note.maxLength=5000;note.placeholder='Kommentar / anmärkning';note.value=point.note||'';note.setAttribute('aria-label','Kommentar till '+point.label);note.onchange=()=>{point.note=note.value;persist()};row.append(head,choices,note);$('pcChecks').appendChild(row);requestAnimationFrame(()=>{label.style.height='auto';label.style.height=label.scrollHeight+'px'});
 }
 $('pcProgress').textContent=progress(o)+'%';
}
$('pcApproveAll').onclick=()=>{if(!selectedObject)return;for(const point of selectedObject.points)if(!point.status)point.status='ok';persist();renderChecks()};
$('pcAddPoint').onsubmit=e=>{e.preventDefault();const label=$('pcNewPoint').value.trim();if(!label||!selectedObject)return;selectedObject.points.push({id:uid(),label,status:'',note:''});$('pcNewPoint').value='';persist();renderChecks()};
for(const [id,key] of [['pcDate','date'],['pcTechnician','technician'],['pcSignature','signature'],['pcNotes','notes']])$(id).onchange=()=>{if(selectedObject){if(selectedObject.target==='selfcheck'&&key!=='notes'){bridge.setProjectMeta({[key]:$(id).value});if(COMPANY_FIELDS.includes(key)){sharedDefaults[key]=$(id).value;try{localStorage.setItem(DEFAULTS,JSON.stringify(sharedDefaults))}catch(_){}}syncShared()}else selectedObject[key]=$(id).value;persist()}};
for(const [id,key] of [['pcObjectNo','objectNo'],['pcQuantity','quantity']])$(id).onchange=()=>{if(selectedObject){selectedObject[key]=$(id).value.trim();persist()}};
$('pcModel').onchange=()=>{if(selectedObject){selectedObject.modelCode=$('pcModel').value;selectedObject.model=bridge.models.find(([code])=>code===$('pcModel').value)?.[1]||'';persist()}};
$('pcEquipmentType').onchange=()=>{if(selectedObject){selectedObject.model=$('pcEquipmentType').value.trim();persist()}};
$('pcEditShared').onclick=()=>{openManager();document.querySelector('.pcShared').open=true};
$('pcCardOut').onclick=()=>{cardScale=Math.max(.5,cardScale-.25);renderCard().catch(e=>$('pcProtocolMessage').textContent=e.message)};
$('pcCardIn').onclick=()=>{cardScale=Math.min(4,cardScale+.25);renderCard().catch(e=>$('pcProtocolMessage').textContent=e.message)};
function closeProtocol(){cardVersion++;cardPage=0;if(cardRenderTask)try{cardRenderTask.cancel()}catch(_){}if($('pcProtocol').open)$('pcProtocol').close();selectedObject=null}
$('pcPreview').onclick=async()=>{if(!selectedObject)return;try{await bridge.previewCustomer(selectedObject)}catch(error){$('pcProtocolMessage').textContent='Kundmallen kunde inte visas: '+(error.message||error)}};
$('pcExport').onclick=async()=>{if(!selectedObject)return;try{const ok=await bridge.exportCustomer(selectedObject);$('pcProtocolMessage').textContent=ok?'Kundprotokollet är klart.':'Sparandet avbröts.'}catch(error){$('pcProtocolMessage').textContent='Kunde inte skapa PDF: '+(error.message||error)}};
$('pcOpen').onclick=$('pcStart').onclick=openManager;$('pcClose').onclick=closeManager;$('pcNewRule').onclick=()=>editRule();$('pcCancelRule').onclick=()=>{$('pcRuleForm').hidden=true};$('pcScan').onclick=scan;
$('pcSelectAll').onclick=()=>{candidates.forEach(c=>c.selected=c.target!=='doorcard'||!!c.protocolPage);renderCandidates()};$('pcSelectNone').onclick=()=>{candidates.forEach(c=>c.selected=false);renderCandidates()};
$('pcScanScope').onchange=()=>{$('pcPagesLabel').hidden=$('pcScanScope').value!=='pages'};
$('pcManager').addEventListener('cancel',e=>{e.preventDefault();closeManager()});$('pcBack').onclick=$('pcProtocolClose').onclick=closeProtocol;
$('pcProtocol').addEventListener('cancel',e=>{e.preventDefault();closeProtocol()});
$('pcAttachCards').onclick=async()=>{
 resetScan();$('pcAttachCards').disabled=true;
 try{
  const file=await bridge.pickDoorCards();if(!file)return;
  $('pcMessage').textContent='Läser in dörrkorten…';
  const count=await bridge.attachDoorCards(file);
  $('pcScanScope').value='all';$('pcPagesLabel').hidden=true;
  await scan();$('pcMessage').textContent=count+' dörrkortssidor tillagda. '+$('pcMessage').textContent;
 }catch(error){$('pcMessage').textContent='Dörrkorten kunde inte läsas in: '+(error.message||error)}
 finally{$('pcAttachCards').disabled=!bridge?.getPdf()}
};
window.TillsynoCustomProtocols={
 connect(api){bridge=api},
 installationDefaults(){return Object.fromEntries(COMPANY_FIELDS.filter(key=>typeof sharedDefaults?.[key]==='string').map(key=>[key,sharedDefaults[key]]))},
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
