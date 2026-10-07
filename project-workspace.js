(() => {
'use strict';

const $=id=>document.getElementById(id);
const el={
 file:$('pwFile'),fileName:$('pwFileName'),state:$('pwState'),positionCount:$('pwPositionCount'),matchedCount:$('pwMatchedCount'),doneCount:$('pwDoneCount'),totalProgress:$('pwTotalProgress'),
 prev:$('pwPrev'),next:$('pwNext'),pageInfo:$('pwPageInfo'),zoomOut:$('pwZoomOut'),zoomIn:$('pwZoomIn'),zoomInfo:$('pwZoomInfo'),fit:$('pwFit'),rescan:$('pwRescan'),
 viewer:$('pwViewer'),stage:$('pwStage'),canvas:$('pwCanvas'),markers:$('pwMarkers'),empty:$('pwEmpty'),groups:$('pwGroups'),currentPageOnly:$('pwCurrentPageOnly'),
 protocol:$('pwProtocol'),back:$('pwBack'),protocolClose:$('pwProtocolClose'),protocolCode:$('pwProtocolCode'),protocolPosition:$('pwProtocolPosition'),protocolPercent:$('pwProtocolPercent'),protocolBar:$('pwProtocolBar'),
 protocolCanvas:$('pwProtocolCanvas'),protocolCanvasWrap:$('pwProtocolCanvasWrap'),protocolStage:$('pwProtocolStage'),protocolMissing:$('pwProtocolMissing'),protocolZoomOut:$('pwProtocolZoomOut'),protocolZoomIn:$('pwProtocolZoomIn'),protocolZoomInfo:$('pwProtocolZoomInfo'),
 checklist:$('pwChecklist'),checklistMeta:$('pwChecklistMeta'),addChecklistItem:$('pwAddChecklistItem'),
 itemEditor:$('pwItemEditor'),itemEditorTitle:$('pwItemEditorTitle'),itemEditorClose:$('pwItemEditorClose'),editLabel:$('pwEditLabel'),editValue:$('pwEditValue'),editNote:$('pwEditNote'),editCancel:$('pwEditCancel'),editSave:$('pwEditSave')
};

if(!window.pdfjsLib||!window.PDFLib){el.state.textContent='PDF-biblioteket kunde inte laddas.';return}
pdfjsLib.GlobalWorkerOptions.workerSrc='vendor/pdf.worker.min.js';

const ctx=el.canvas.getContext('2d');
const protocolCtx=el.protocolCanvas.getContext('2d');

let pdf=null,bytes=null,fileKey='',page=1,scale=1.1,renderTask=null;
let stamps=[],instances=[],protocolMap={},pageTexts={},protocolDefs={};
let selectedId=null,protocolScale=1,protocolRenderTask=null,currentOnly=false,restoreView=null,editingItem=null;

function setState(text){el.state.textContent=text}
function hashBytes(arr){let h=2166136261;const step=Math.max(1,Math.floor(arr.length/50000));for(let i=0;i<arr.length;i+=step){h^=arr[i];h=Math.imul(h,16777619)}return (h>>>0).toString(36)}
function storageKey(){return 'tillsyno-project-workspace-v1:'+fileKey}
function loadSaved(){try{return JSON.parse(localStorage.getItem(storageKey())||'{}')}catch(_){return {}}}
function save(){
 if(!fileKey)return;
 const payload={version:2,updatedAt:new Date().toISOString(),instances:{}};
 instances.forEach(o=>payload.instances[o.id]={
  checks:o.checks||{},progress:o.progress||0,overrides:o.overrides||{},customItems:o.customItems||[]
 });
 try{localStorage.setItem(storageKey(),JSON.stringify(payload))}catch(_){}
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
 const exact=raw.match(/^([A-ZÅÄÖ]{1,10})\s*[- ]?\s*(\d{1,5}[A-Z]?)$/);
 if(exact)return exact[1]+exact[2];
 const embedded=raw.match(/\b([A-ZÅÄÖ]{1,10})\s*[- ]?\s*(\d{1,5}[A-Z]?)\b/);
 return embedded?embedded[1]+embedded[2]:'';
}
function codeRegex(code){
 const m=String(code||'').match(/^([A-ZÅÄÖ]+)(\d+)([A-Z]?)$/i);if(!m)return null;
 const gap='[^A-ZÅÄÖ0-9]*';
 const spread=s=>String(s).split('').join(gap);
 return new RegExp('(^|[^A-ZÅÄÖ0-9])'+spread(m[1])+gap+spread(m[2])+(m[3]?gap+spread(m[3]):'')+'($|[^A-ZÅÄÖ0-9])','i');
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
function isDtWorkReference(value){
 return /(^|[\s:;,\-])DT($|[\s:;,\-])/i.test(String(value||'').trim());
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
  const dtReference=hasPair&&isDtWorkReference(value);
  const prose=!administrative&&!heading&&!value&&(text.length>=34||/[.!?]$/.test(text));
  const actionable=!administrative&&!heading&&hasPair&&!dtReference;
  const reference=!administrative&&!heading&&hasPair&&dtReference;
  return {key:'l'+index,text,heading:!administrative&&heading,prose,actionable,reference,administrative,label,value};
 });
}
async function protocolDef(code){
 const pageNo=protocolMap[code];if(!pageNo)return null;
 const key=code+'@'+pageNo;if(protocolDefs[key])return protocolDefs[key];
 const text=await readPageText(pageNo),lines=groupLines(text.items);
 const filtered=lines.filter(line=>!line.administrative&&(line.heading||line.prose||line.actionable||line.reference));
 const def={code,page:pageNo,lines:filtered,checks:filtered.filter(x=>x.actionable)};
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
 renderMarkers();
}
function renderMarkers(){
 el.markers.replaceChildren();if(!pdf)return;
 const pageItems=instances.filter(o=>o.page===page);
 pdf.getPage(page).then(pg=>{
  const base=pg.getViewport({scale:1}),w=base.width,h=base.height;
  pageItems.forEach(o=>{
   const [x1,y1,x2,y2]=o.rect,rx=Math.min(x1,x2),rw=Math.abs(x2-x1),rh=Math.abs(y2-y1);
   const btn=document.createElement('button');btn.type='button';btn.className='pwStampHit';btn.dataset.progress=String(o.progress||0);
   btn.style.left=(rx/w*100)+'%';btn.style.width=(rw/w*100)+'%';
   btn.style.top=((h-Math.max(y1,y2))/h*100)+'%';btn.style.height=(rh/h*100)+'%';
   btn.title=o.code+' · position '+o.position+' av '+o.totalOfCode+' · '+o.progress+'%';
   btn.setAttribute('aria-label',btn.title);
   if(o.progress>0){const badge=document.createElement('span');badge.className='pwProgressBadge';badge.textContent=o.progress+'%';btn.appendChild(badge)}
   btn.onclick=e=>{e.preventDefault();e.stopPropagation();openProtocol(o)};
   el.markers.appendChild(btn);
  });
 });
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
 if(page!==o.page){page=o.page;await renderDrawing()} selectedId=o.id;
 const pg=await pdf.getPage(page),vp=pg.getViewport({scale}),[x1,y1,x2,y2]=o.rect;
 const cx=(Math.min(x1,x2)+Math.abs(x2-x1)/2)*scale,cy=(vp.height-(Math.min(y1,y2)+Math.abs(y2-y1)/2)*scale);
 el.viewer.scrollTo({left:Math.max(0,cx-el.viewer.clientWidth/2),top:Math.max(0,cy-el.viewer.clientHeight/2),behavior:'smooth'});
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
  if(line.heading){
   const h=document.createElement('div');h.className='pwChecklistHeading';h.textContent=line.text;el.checklist.appendChild(h);return;
  }
  if(line.prose&&!line.actionable){
   const p=document.createElement('div');p.className='pwChecklistText';p.textContent=line.text;el.checklist.appendChild(p);return;
  }
  if(line.reference){
   const ref=document.createElement('div');ref.className='pwChecklistReference';
   const strong=document.createElement('strong'),small=document.createElement('small'),why=document.createElement('em');
   strong.textContent=line.label;small.textContent=line.value;why.textContent='DT – information från originalet, men inte en kontrollpunkt för vårt montage.';
   ref.append(strong,small,why);el.checklist.appendChild(ref);return;
  }
  if(line.actionable){
   const item=effectiveChecks(o,def).find(x=>x.source==='base'&&x.key===line.key);
   if(item)appendEditableCheck(o,item);
  }
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
async function fitDrawing(){
 if(!pdf)return;const pg=await pdf.getPage(page),vp=pg.getViewport({scale:1});
 scale=Math.max(.25,Math.min(2.5,(el.viewer.clientWidth-12)/vp.width,(el.viewer.clientHeight-12)/vp.height));await renderDrawing();
}
async function analyze(file){
 setState('Läser projekt-PDF…');const ab=await file.arrayBuffer();bytes=new Uint8Array(ab);fileKey=hashBytes(bytes);
 pdf=await pdfjsLib.getDocument({data:bytes.slice()}).promise;page=1;scale=1.1;pageTexts={};protocolDefs={};
 el.fileName.textContent=file.name;el.empty.hidden=true;el.rescan.hidden=false;
 setState('Läser gula PDF-stämplar och deras positioner…');stamps=await extractStamps();buildInstances();
 if(!stamps.length){setState('Inga läsbara PDF-stämplar hittades. Projektflödet använder riktiga Stamp-annoteringar, inte vanlig ritningstext.');protocolMap={};updateStats();renderGroups();await renderDrawing();return}
 await buildProtocolMap();
 await recalcAll();
 const codes=[...new Set(stamps.map(s=>s.code))],matched=codes.filter(c=>protocolMap[c]).length;
 setState(stamps.length+' positioner hittade · '+codes.length+' märkningar · '+matched+' av '+codes.length+' protokolltyper matchade.');
 await renderDrawing();renderGroups();updateStats();requestAnimationFrame(fitDrawing);
}
el.file.onchange=e=>{const file=e.target.files?.[0];if(file)analyze(file).catch(err=>{console.error(err);setState('Projektfilen kunde inte analyseras: '+(err?.message||err))})};
el.prev.onclick=async()=>{if(pdf&&page>1){page--;await renderDrawing();renderGroups()}};
el.next.onclick=async()=>{if(pdf&&page<pdf.numPages){page++;await renderDrawing();renderGroups()}};
el.zoomOut.onclick=async()=>{if(pdf){scale=Math.max(.3,scale-.12);await renderDrawing()}};
el.zoomIn.onclick=async()=>{if(pdf){scale=Math.min(3.5,scale+.12);await renderDrawing()}};
el.fit.onclick=fitDrawing;
el.rescan.onclick=()=>{if(el.file.files?.[0])analyze(el.file.files[0]).catch(console.error)};
el.currentPageOnly.onclick=()=>{currentOnly=!currentOnly;el.currentPageOnly.setAttribute('aria-pressed',String(currentOnly));el.currentPageOnly.classList.toggle('active',currentOnly);renderGroups()};
el.back.onclick=closeProtocol;el.protocolClose.onclick=closeProtocol;
el.protocol.addEventListener('cancel',e=>{e.preventDefault();closeProtocol()});
el.protocolZoomOut.onclick=async()=>{protocolScale=Math.max(.45,protocolScale-.12);const o=instances.find(x=>x.id===selectedId);if(o)await renderProtocolPage(protocolMap[o.code])};
el.protocolZoomIn.onclick=async()=>{protocolScale=Math.min(2.6,protocolScale+.12);const o=instances.find(x=>x.id===selectedId);if(o)await renderProtocolPage(protocolMap[o.code])};
el.addChecklistItem.onclick=()=>openItemEditor(selectedInstance());
el.itemEditorClose.onclick=closeItemEditor;el.editCancel.onclick=closeItemEditor;el.editSave.onclick=saveItemEditor;
el.itemEditor.addEventListener('cancel',e=>{e.preventDefault();closeItemEditor()});
window.addEventListener('resize',()=>{if(pdf)requestAnimationFrame(()=>renderDrawing())});
})();