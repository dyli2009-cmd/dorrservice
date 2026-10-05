const MODELS=[['11','Geze EMD standardarm'],['12','Geze EMD glidarm'],['13','Faac standard'],['14','Faac glidarm'],['15','Besam Powerswing'],['16','Besam SW100'],['17','Dorma ED 200'],['18','Tormax'],['19','Record standardarm'],['20','Powerswing pardörr'],['21','Geze TSA 160'],['22','Record glidarm'],['23','Gilgen FDC'],['24','Dorma ED 100'],['25','Besam SDE'],['26','Ditec hissmonterad'],['27','SR 2000'],['28','OVE'],['29','Dorma CD 80'],['30','Cibes hissöppnare'],['31','Geze TSA 160 dubbeldörr'],['32','Dorma ED 180'],['33','Geze EC Turn'],['34','Besam DHE'],['35','Entramatic PLS 100'],['36','Entramatic PLS 150'],['37','Dorma ED 250'],['38','Geze Powerdrive skjutdörr'],['39','Geze EC Drive skjutdörr'],['40','Geze SL skjutdörr'],['41','Faac 930 skjutdörr'],['42','Faac A140 skjutdörr'],['43','Dorma TS 93 + brandstängning'],['44','Dorma TS 93'],['45','Entramatic SW 300'],['46','Unislide dubbel flyglig'],['47','Unislide enkel flyglig'],['48','Entramatic SL500']];
const GROUPS=[['Förberedelser och infästning',[0,1,2,3]],['Öppning, stängning och utrymning',[4,5,6,7,8]],['Impulsgivare, säkerhet och lås',[9,10,11,12]],['Drivning, rengöring och justering',[13,14,15,16,17]]];

window.inspectLegacyLinkedPdf=async function(bytes,fileName,onProgress=()=>{}){
 let scan=null;
 const cleanName=name=>String(name||'').split('#')[0].replace(/\(\d+\)$/,'').trim().toLocaleLowerCase('sv');
 const cleanValue=value=>{
  if(value===undefined||value===null)return '';
  const text=(Array.isArray(value)?value.join(' '):String(value)).trim();
  return /^(?:off|\.)$/i.test(text)?'':text
 };
 const getField=(fields,...names)=>{
  for(const name of names){const value=fields.get(cleanName(name));if(value)return value}
  return ''
 };
 const collectFields=annotations=>{
  const fields=new Map();
  for(const a of annotations||[]){
   if(!a?.fieldName)continue;
   const key=cleanName(a.fieldName),value=cleanValue(a.fieldValue);
   if(key&&value&&!fields.has(key))fields.set(key,value)
  }
  return fields
 };
 const resolveDest=async dest=>{
  try{
   let explicit=dest;
   if(typeof explicit==='string')explicit=await scan.getDestination(explicit);
   if(!Array.isArray(explicit)||!explicit[0])return null;
   const ref=explicit[0];
   if(Number.isInteger(ref))return ref+1;
   if(ref&&typeof ref==='object'&&Number.isInteger(ref.num))return (await scan.getPageIndex(ref))+1;
  }catch(e){}
  return null
 };
 const parseId=id=>{
  const parts=String(id||'').trim().split('-').map(x=>x.trim()).filter(Boolean);
  if(parts.length<3)return {prefix:'',modelCode:'',serial:''};
  const modelCode=parts.at(-2),rawSerial=parts.at(-1),serialMatch=String(rawSerial).match(/\d+/);
  return {prefix:parts.slice(0,-2).join('-'),modelCode,serial:serialMatch?serialMatch[0]:rawSerial}
 };
 const majority=values=>{
  const counts=new Map();for(const value of values.filter(Boolean))counts.set(value,(counts.get(value)||0)+1);
  return [...counts.entries()].sort((a,b)=>b[1]-a[1])[0]?.[0]||''
 };
 try{
  scan=await pdfjsLib.getDocument({data:bytes.slice()}).promise;
  const linkedPages=[],rawLinks=[];let seen=false,gap=0;
  const scanLimit=Math.min(scan.numPages,30);
  for(let pageNo=1;pageNo<=scanLimit;pageNo++){
   onProgress('Söker äldre länkade automatiker… sida '+pageNo+' / '+scanLimit);
   const pg=await scan.getPage(pageNo),annotations=await pg.getAnnotations({intent:'any'}),viewport=pg.getViewport({scale:1});
   const candidates=annotations.filter(a=>a?.fieldType==='Btn'&&!a.checkBox&&!a.radioButton&&a.dest&&Array.isArray(a.rect));
   const resolved=[];
   for(const a of candidates){const targetPage=await resolveDest(a.dest);if(targetPage&&targetPage!==pageNo)resolved.push({targetPage,rect:a.rect})}
   if(resolved.length){
    seen=true;gap=0;linkedPages.push({originalPage:pageNo,viewport});
    resolved.forEach(item=>rawLinks.push({drawingPage:pageNo,...item}))
   }else if(seen&&++gap>=2)break;
  }
  if(rawLinks.length<2)return null;

  const targets=[...new Set(rawLinks.map(x=>x.targetPage))].sort((a,b)=>a-b),protocols=new Map();
  for(let start=0;start<targets.length;start+=6){
   const batch=targets.slice(start,start+6);
   onProgress('Läser gamla protokoll… '+Math.min(start+batch.length,targets.length)+' / '+targets.length);
   await Promise.all(batch.map(async targetPage=>{
    const pg=await scan.getPage(targetPage),annotations=await pg.getAnnotations({intent:'any'}),fields=collectFields(annotations);
    const id=getField(fields,'Id nummermaskin');
    if(id)protocols.set(targetPage,{id,fields})
   }))
  }
  const validLinks=rawLinks.filter(link=>protocols.has(link.targetPage));
  if(validLinks.length<2)return null;

  const drawingNumbers=[...new Set(validLinks.map(x=>x.drawingPage))].sort((a,b)=>a-b),pageMap=new Map(drawingNumbers.map((n,i)=>[n,i+1])),viewportMap=new Map(linkedPages.map(x=>[x.originalPage,x.viewport]));
  const used=new Set(),doors=[];
  for(const link of validLinks){
   const protocol=protocols.get(link.targetPage),id=protocol.id;if(!id||used.has(id))continue;used.add(id);
   const viewport=viewportMap.get(link.drawingPage);if(!viewport)continue;
   const vr=viewport.convertToViewportRectangle(link.rect),x=Math.max(0,Math.min(1,((vr[0]+vr[2])/2)/viewport.width)),y=Math.max(0,Math.min(1,((vr[1]+vr[3])/2)/viewport.height));
   const parsed=parseId(id),modelEntry=MODELS.find(([code])=>String(code)===String(parsed.modelCode)),checks={};CHECKS.forEach(([n])=>checks[n]={result:'',note:''});
   doors.push(normalize({
    uid:'legacy:'+link.targetPage+':'+id,id,machineId:id,page:pageMap.get(link.drawingPage),x,y,
    serialNumber:String(Number(parsed.serial||doors.length+1)),modelCode:parsed.modelCode||'',model:modelEntry?.[1]||'',idMode:'manual',
    location:getField(protocol.fields,'Placering/Dörrlittra'),ao:'',nextDate:'',signature:'',status:'untested',notes:'',checks,remediationDate:'',remediationSignature:''
   }))
  }
  if(doors.length<2)return null;

  doors.sort((a,b)=>a.page-b.page||a.id.localeCompare(b.id,'sv',{numeric:true}));
  const firstProtocol=protocols.get(validLinks[0].targetPage),first=firstProtocol?.fields||new Map(),prefixes=doors.map(d=>parseId(d.id).prefix),facilityNo=majority(prefixes);
  const serials=doors.map(d=>Number(d.serialNumber)||0),oldOrder=getField(first,'Order').replace(/,00$/,'');
  const projectName=String(fileName||'').replace(/\.pdf$/i,'').replace(/^service\s+/i,'').trim();
  const project={
   projectName,facilityNo,customer:getField(first,'Företag'),agreementNo:'',contact:getField(first,'Kontaktperson'),projectOrder:oldOrder,
   inspectionDate:'',projectNextDate:'',company:getField(first,'kontakt f','kontakt g'),companyContact:getField(first,'kontakt g','kontakt f'),
   companyPhone:getField(first,'tel g'),companyAddress:getField(first,'adress g'),companyPostalCode:getField(first,'postnr g'),companyPostalCity:getField(first,'post g'),
   phone:getField(first,'tel'),address:getField(first,'adress'),postalCode:getField(first,'postnr'),postalCity:getField(first,'postadress'),technician:'',serviceSignature:'',
   nextDoorNumber:Math.max(0,...serials)+1
  };

  onProgress('Bygger ren ritning med '+doors.length+' automatiker…');
  const {PDFDocument,PDFName}=PDFLib,source=await PDFDocument.load(bytes,{updateMetadata:false}),output=await PDFDocument.create(),copied=await output.copyPages(source,drawingNumbers.map(n=>n-1));
  copied.forEach(pg=>{pg.node.delete(PDFName.of('Annots'));output.addPage(pg)});
  try{output.catalog.delete(PDFName.of('AcroForm'))}catch(e){}
  const drawingBytes=new Uint8Array(await output.save());

  const modelCounts=new Map(),prefixCounts=new Map();
  doors.forEach(d=>{const model=d.model||('Kod '+(d.modelCode||'?'));modelCounts.set(model,(modelCounts.get(model)||0)+1);const prefix=parseId(d.id).prefix;if(prefix)prefixCounts.set(prefix,(prefixCounts.get(prefix)||0)+1)});
  const modelText=[...modelCounts.entries()].sort((a,b)=>b[1]-a[1]).map(([name,count])=>count+' '+name).join(', ');
  const prefixText=prefixCounts.size>1?' '+prefixCounts.size+' objektnummer hittades - kontrollera objektnummer under Projekt.':'';
  return {drawingBytes,work:{version:2,doors,project,logoData:''},summaryText:(modelText?'Typer: '+modelText+'.':'')+prefixText+' Kontroller och datum är nollställda för nytt servicebesök.'}
 }catch(error){
  console.warn('Äldre PDF kunde inte autoimporteras',error);return null
 }finally{
  if(scan){try{await scan.destroy()}catch(e){}}
 }
};

function goView(view){
 if(view!=='doors'&&$('overviewDialog').open)$('overviewDialog').close();
 if(view==='doors'&&!$('overviewDialog').open)$('overviewDialog').show();
 $('projectPanel').hidden=view!=='project';document.body.dataset.view=view;
 document.body.classList.toggle('protocolOpen',view==='protocol');
 const ids={drawing:'navDrawing',doors:'mobileOverview',protocol:'mobileProtocol',project:'settingsBtn'};
 Object.entries(ids).forEach(([name,id])=>{const button=$(id),active=name===view;button.classList.toggle('active',active);if(active)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current')});
}
function completedChecks(d){return doorChecks(d).filter(([n])=>['ok','na','remark'].includes(d.checks?.[n]?.result)).length}
function displayStatus(d){if(isDoorRemediated(d))return 'ok';if(d.status==='fail')return 'fail';if(hasDoorProblem(d))return 'action';return d.status==='ok'?'ok':'untested'}
function statusText(d){if(isDoorRemediated(d))return 'Åtgärdad';return {ok:'Godkänd',fail:'Ej godkänd',action:d.status==='action'?'Åtgärd krävs':'Anmärkningar',untested:'Ej klar'}[displayStatus(d)]}
function updateCompactUI(){
 document.body.classList.toggle('hasDrawing',!!pdf);$('objectLabel').textContent=project.projectName||project.facilityNo||activeDrawingName||'Välj en ritning';
 $('newServiceBtn').disabled=!pdf;$('mobileAdd').disabled=!pdf;
 const d=cur();if(d){$('checkProgress').textContent=completedChecks(d)+' / '+doorChecks(d).length+' kontrollerade';$('signature').value=project.serviceSignature||d.signature||'';$('serviceBy').textContent=[project.technician,project.company,project.inspectionDate].filter(Boolean).join(' · ')}
}
const baseSave=save;save=function(skip=false){baseSave(skip);updateCompactUI()};
const baseRefresh=refreshDrawingUI;refreshDrawingUI=function(){baseRefresh();updateCompactUI()};
function nextSerial(){const largest=Math.max(0,...doors.map(d=>Number(d.serialNumber)||Number(/^D(\d+)$/.exec(d.id)?.[1])||0));const n=Math.max(Number(project.nextDoorNumber)||1,largest+1);project.nextDoorNumber=n+1;return String(n)}
function proposedId(d){return project.facilityNo&&d.modelCode&&d.serialNumber?[project.facilityNo.trim(),d.modelCode,d.serialNumber].join('-'):null}
function setDoorId(d,value,mode){
 const id=String(value||'').trim();if(!id){$('idMessage').textContent='Märkningen får inte vara tom.';return false}
 if(doors.some(other=>other.uid!==d.uid&&other.id===id)){$('idMessage').textContent='Det ID-numret används redan av en annan dörr.';return false}
 d.id=id;d.idMode=mode;$('idMessage').textContent='';$('doorId').value=id;save();draw();$('protocolHeading').textContent=id;return true;
}

function syncAutoDoorIds(){
 let changed=false;
 doors.forEach(d=>{if(d.idMode!=='auto')return;const id=proposedId(d);if(!id||doors.some(other=>other.uid!==d.uid&&other.id===id))return;if(d.id!==id){d.id=id;changed=true}});
 const current=cur();if(current&&current.idMode==='auto'){$('doorId').value=current.id;$('protocolHeading').textContent=current.id}
 if(changed){save();draw()}
}
const baseFacilityInput=$('facilityNo').oninput;
$('facilityNo').oninput=()=>{if(baseFacilityInput)baseFacilityInput();syncAutoDoorIds()};
MODELS.forEach(([code,name])=>{const option=document.createElement('option');option.value=code;option.textContent=code+' · '+name;$('modelChoice').appendChild(option)});
const custom=document.createElement('option');custom.value='custom';custom.textContent='Annan modell…';$('modelChoice').appendChild(custom);
$('modelChoice').onchange=()=>{const d=cur();if(!d)return;const value=$('modelChoice').value,model=MODELS.find(([code])=>code===value);
 if(value==='custom'){
  const entered=prompt('Skriv modell / typ av automatik:',d.modelCode||d.model||'');
  if(entered===null||!entered.trim()){$('modelChoice').value=d.modelCode&&MODELS.some(([code])=>code===d.modelCode)?d.modelCode:'';return}
  d.modelCode=entered.trim();d.model=entered.trim();
 }else{d.modelCode=model?.[0]||'';if(model)d.model=model[1]}
 if(d.idMode!=='manual')d.idMode='auto';const nextId=proposedId(d);if(nextId&&d.idMode==='auto')setDoorId(d,nextId,'auto');else save()
};
$('serialNumber').onchange=()=>{const d=cur();if(!d)return;const value=$('serialNumber').value.trim();if(!/^\d{1,6}$/.test(value)||Number(value)<1){$('idMessage').textContent='Ange ett löpnummer från 1 till 999999.';if(lastShownDoor!==d.uid){$('protocolPanel').scrollTop=0;lastShownDoor=d.uid}
 $('serialNumber').value=d.serialNumber||'';return}const old=d.serialNumber;d.serialNumber=String(Number(value));if(d.idMode==='auto'&&proposedId(d)&&!setDoorId(d,proposedId(d),'auto'))d.serialNumber=old;$('serialNumber').value=d.serialNumber;save()};
$('doorId').oninput=()=>{};$('doorId').onchange=()=>{const d=cur();if(d&&!setDoorId(d,$('doorId').value,'manual'))$('doorId').value=d.id};
$('signature').oninput=()=>{};
const DOOR_CHECK_RESULTS=[['na','Ingår ej'],['ok','Klart utan anmärkning'],['remark','Klart med anmärkning']];
const protocolTextSmaller=$('protocolTextSmaller'),protocolTextLarger=$('protocolTextLarger');
let protocolTextLevel=Math.max(-1,Math.min(3,Number(localStorage.getItem('doorservice-protocol-size')||0)));
function applyProtocolTextLevel(){
 document.body.dataset.protocolSize=String(protocolTextLevel);
 if(protocolTextSmaller)protocolTextSmaller.disabled=protocolTextLevel<=-1;
 if(protocolTextLarger)protocolTextLarger.disabled=protocolTextLevel>=3;
 localStorage.setItem('doorservice-protocol-size',String(protocolTextLevel));
}
if(protocolTextSmaller)protocolTextSmaller.onclick=()=>{protocolTextLevel=Math.max(-1,protocolTextLevel-1);applyProtocolTextLevel()};
if(protocolTextLarger)protocolTextLarger.onclick=()=>{protocolTextLevel=Math.min(3,protocolTextLevel+1);applyProtocolTextLevel()};
applyProtocolTextLevel();
buildChecklist=function(d){
 normalize(d);const box=$('checklist');box.replaceChildren();
 const actions=document.createElement('div');actions.className='doorCheckActions';box.appendChild(actions);
 const approveAll=document.createElement('button');approveAll.type='button';approveAll.className='approveAll';approveAll.textContent='✓ Godkänn alla';approveAll.onclick=()=>{doorChecks(d).forEach(([n])=>{d.checks[n].result='ok';d.checks[n].note=''});d.status='ok';$('status').value='ok';save();buildChecklist(d);$('status').value=d.status;draw();updateCompactUI()};actions.appendChild(approveAll);
 const groups=GROUPS.map(([title,indices])=>[title,indices.map(i=>CHECKS[i])]);
 if(d.customChecks.length)groups.push(['Egna kontrollpunkter',d.customChecks.map(c=>[c.id,c.title])]);
 groups.forEach(([title,checks])=>{
  const group=document.createElement('details');group.className='checkGroup';group.open=true;
  const summary=document.createElement('summary');summary.textContent=title;const count=document.createElement('span');summary.appendChild(count);group.appendChild(summary);
  const update=()=>{count.textContent=checks.filter(([n])=>!!d.checks[n].result).length+' / '+checks.length};
  checks.forEach(([n,title])=>{
   const c=d.checks[n],row=document.createElement('div');row.className='checkrow';row.dataset.check=n;
   const heading=document.createElement('div');heading.className='checktitle';const nr=document.createElement('span');nr.className='checkNumber';nr.textContent=n;const text=document.createElement('span');text.textContent=title;heading.append(nr,text);
   if(d.customChecks.some(c=>c.id===n)){
    const remove=document.createElement('button');remove.type='button';remove.className='doorRemoveCheck';remove.textContent='Ta bort';remove.setAttribute('aria-label','Ta bort kontrollpunkt '+n);
    remove.onclick=()=>{if(!confirm('Ta bort kontrollpunkten '+n+'?'))return;removeDoorCustomCheck(d,n);$('status').value=d.status;save();buildChecklist(d);draw()};heading.appendChild(remove);
   }
   row.appendChild(heading);
   const buttons=document.createElement('div');buttons.className='quickBtns';const area=document.createElement('div');area.className='faultArea';area.hidden=c.result!=='remark';
   const faults=COMMON_FAULTS[n]||['Justering/åtgärd krävs'];
   const select=document.createElement('select');select.className='faultSelect';select.setAttribute('aria-label','Vanlig anmärkning '+n);
   const placeholder=document.createElement('option');placeholder.value='';placeholder.textContent='Välj anmärkning…';select.appendChild(placeholder);
   faults.forEach(value=>{const option=document.createElement('option');option.value=value;option.textContent=value;select.appendChild(option)});
   const customOption=document.createElement('option');customOption.value='__custom__';customOption.textContent='✎ Beskriv själv…';select.appendChild(customOption);
   const input=document.createElement('input');input.className='faultText';input.placeholder='Beskriv felet…';input.setAttribute('aria-label','Egen anmärkning '+n);
   const back=document.createElement('button');back.type='button';back.className='faultBack';back.textContent='‹';back.setAttribute('aria-label','Till färdiga anmärkningar');
   const showCustom=show=>{select.hidden=show;input.hidden=!show;back.hidden=!show};
   const known=faults.includes(c.note||'');input.value=known?'':(c.note||'');select.value=known?c.note:'';showCustom(!!c.note&&!known);
   area.append(select,input,back);
   const wording=document.createElement('button');wording.type='button';wording.className='doorWordingButton';wording.textContent='Formulera';wording.setAttribute('aria-label','Hjälp med formulering för kontrollpunkt '+n);
   wording.onclick=()=>openDoorWording({title:n+' '+title,original:c.note||'',choices:[...(['1.2','1.5','1.6','1.9','1.12','1.18'].includes(n)?DOOR_WORDING:[]),...faults],apply:text=>{if(cur()?.uid!==d.uid||d.checks[n]!==c||c.result!=='remark')return;showCustom(true);input.value=text;input.dispatchEvent(new Event('input',{bubbles:true}))}});
   area.appendChild(wording);
   DOOR_CHECK_RESULTS.forEach(([value,label])=>{const button=document.createElement('button');button.type='button';button.dataset.v=value;button.textContent=label;button.classList.toggle('active',c.result===value);button.onclick=()=>{c.result=c.result===value?'':value;if(c.result!=='remark'){c.note='';input.value='';select.value='';showCustom(false)}syncDoorCheckStatus(d);$('status').value=d.status;buttons.querySelectorAll('button').forEach(b=>b.classList.toggle('active',b.dataset.v===c.result));area.hidden=c.result!=='remark';update();save();draw()};buttons.appendChild(button)});
   select.onchange=()=>{if(select.value==='__custom__'){c.note='';input.value='';showCustom(true);input.classList.add('iosTyping');requestAnimationFrame(()=>input.focus());save();draw();return}c.note=select.value||'';if(d.status!=='fail')d.status='action';$('status').value=d.status;save();draw()};
   input.oninput=()=>{c.note=input.value;if(c.result==='remark'&&d.status!=='fail')d.status='action';$('status').value=d.status;save();draw()};input.onblur=()=>input.classList.remove('iosTyping');
   back.onclick=()=>{c.note='';input.value='';select.value='';showCustom(false);save();draw();select.focus()};
   row.append(buttons,area);group.appendChild(row);
  });update();box.appendChild(group);
 });
 const add=document.createElement('button');add.type='button';add.className='doorAddCheck';add.textContent='＋ Egen kontrollpunkt';
 add.onclick=()=>{const title=prompt('Skriv den extra kontrollpunkten:','');if(!addDoorCustomCheck(d,title))return;$('status').value=d.status;save();buildChecklist(d);draw();requestAnimationFrame(()=>{const rows=box.querySelectorAll('.checkrow');rows[rows.length-1]?.scrollIntoView({block:'nearest'})})};actions.appendChild(add);
};
let lastShownDoor=null;
const baseShow=show;show=function(){baseShow();const d=cur();$('protocolHeading').textContent=d?.id||'Välj en dörr';if(!d)return;
 if(lastShownDoor!==d.uid){$('protocolPanel').scrollTop=0;lastShownDoor=d.uid}
 if(isDoorRemediated(d))$('status').value='ok';
 if(d.serialNumber)d.serialNumber=String(Number(d.serialNumber)||1);$('serialNumber').value=d.serialNumber||'';$('modelChoice').value=MODELS.some(([code])=>code===d.modelCode)?d.modelCode:(d.model?'custom':'');$('idMessage').textContent='';
 const prior=d.previousIssues||[];$('previousPanel').hidden=!prior.length&&!d.previousNotes&&!d.previousStatus;$('previousIssues').replaceChildren();
 if(prior.length){const ul=document.createElement('ul');prior.forEach(issue=>{const li=document.createElement('li');li.textContent=issue.n+' '+issue.title+' – '+(issue.note||'Beskrivning saknas');ul.appendChild(li)});$('previousIssues').appendChild(ul)}
 if(d.previousNotes){const p=document.createElement('p');p.textContent=d.previousNotes;$('previousIssues').appendChild(p)}
 if(d.previousStatus){const p=document.createElement('p');p.textContent='Tidigare bedömning: '+(STATUS_LABELS[d.previousStatus]||d.previousStatus);$('previousIssues').appendChild(p)}
 updateCompactUI();goView('protocol');
};
function overviewPriority(d){
 if(isDoorRemediated(d))return 3;
 const state=displayStatus(d);
 return state==='fail'?0:state==='action'?1:state==='untested'?2:4;
}
function setOverviewSummary(){
 const target=$('overviewSummary');if(!target)return;
 const open=doors.filter(hasDoorProblem).length,done=doors.filter(isDoorRemediated).length,ready=doors.filter(d=>displayStatus(d)==='ok').length;
 target.replaceChildren();
 [['Totalt',doors.length,'total'],['Öppna fel',open,'open'],['Åtgärdade',done,'done'],['Klara',ready,'ready']].forEach(([label,value,key])=>{
  const box=document.createElement('span');box.className='overviewStat '+key;
  const strong=document.createElement('strong');strong.textContent=String(value);
  const small=document.createElement('small');small.textContent=label;
  box.append(strong,small);target.appendChild(box);
 });
}
function syncDoorOverviewCard(card,badge,d){
 const state=displayStatus(d);
 card.className='doorCard overviewRow status-'+state+(isDoorRemediated(d)?' status-remediated':'');
 badge.className='doorStatus '+state;
 badge.textContent=statusText(d);
}
renderOverview=function(){
 const filter=$('overviewFilter').value,query=$('overviewSearch').value.trim().toLocaleLowerCase('sv'),recorded=doors.filter(hasRecordedDoorProblem).length;
 $('overviewProject').textContent=[project.projectName,project.facilityNo,project.inspectionDate].filter(Boolean).join(' · ');
 setOverviewSummary();$('overviewPdf').disabled=!recorded;
 const visible=doors.filter(d=>(filter!=='problems'||hasDoorProblem(d))&&(filter!=='ok'||displayStatus(d)==='ok')&&(filter!=='untested'||completedChecks(d)<doorChecks(d).length||d.status==='untested')&&(!query||[d.id,d.model,d.location,d.machineId,d.notes,...doorProblems(d).map(([n,t])=>n+' '+t+' '+(d.checks[n].note||''))].join(' ').toLocaleLowerCase('sv').includes(query))).sort((a,b)=>overviewPriority(a)-overviewPriority(b)||a.page-b.page||a.id.localeCompare(b.id,'sv',{numeric:true}));
 const list=$('overviewList');list.replaceChildren();if(!visible.length){const p=document.createElement('p');p.className='overviewEmpty';p.textContent=!doors.length?'Inga dörrar ännu. Markera automatikerna på ritningen.':query?'Inga dörrar matchar sökningen.':'Inga dörrar i det här urvalet.';list.appendChild(p);return}
 visible.forEach(d=>{
  const card=document.createElement('article');card.dataset.uid=d.uid;
  const header=document.createElement('div');header.className='doorCardHeader';const title=document.createElement('h3');title.textContent=d.id;const badge=document.createElement('span');header.append(title,badge);card.appendChild(header);syncDoorOverviewCard(card,badge,d);
  const meta=document.createElement('p');meta.className='doorMeta';meta.textContent=[d.location?'Placering: '+d.location:'Placering saknas',d.model,'Sida '+d.page,completedChecks(d)+'/'+doorChecks(d).length+' punkter'].filter(Boolean).join(' · ');card.appendChild(meta);
  const issues=doorProblems(d);if(issues.length){const ul=document.createElement('ul');ul.className='doorIssues';issues.forEach(([n,title])=>{const li=document.createElement('li');li.textContent=d.checks[n].note?.trim()||title;ul.appendChild(li)});card.appendChild(ul)}
  if(d.notes){const p=document.createElement('p');p.className='generalRemark';p.textContent=d.notes;card.appendChild(p)}
  if(hasRecordedDoorProblem(d)){
   const grid=document.createElement('div');grid.className='grid2 remediationGrid';[['remediationDate','Åtgärdat datum','date'],['remediationSignature','Åtgärdssignatur','text']].forEach(([key,title,type])=>{const label=document.createElement('label');label.textContent=title;const input=document.createElement('input');input.type=type;input.dataset.field=key;input.value=d[key]||'';input.setAttribute('aria-label',title+' för '+d.id);input.oninput=()=>{d[key]=input.value;save(true);syncDoorOverviewCard(card,badge,d);setOverviewSummary();draw()};input.onchange=()=>{save(true);renderOverview();draw()};label.appendChild(input);grid.appendChild(label)});card.appendChild(grid);
  }
  const button=document.createElement('button');button.className='openProtocolBtn';button.textContent='Öppna protokoll';button.onclick=()=>openOverviewDoor(d.uid);button.setAttribute('aria-label','Öppna protokoll för '+d.id);card.appendChild(button);list.appendChild(card);
 });
};
openOverview=function(){renderOverview();goView('doors');$('overviewDialog').scrollTop=0};
$('overviewBtn').onclick=openOverview;$('mobileOverview').onclick=openOverview;$('pickDoorBtn').onclick=openOverview;
$('closeOverview').onclick=()=>goView('drawing');$('navDrawing').onclick=()=>goView('drawing');$('closeProtocol').onclick=()=>goView('drawing');$('closeProject').onclick=()=>goView('drawing');
$('mobileProtocol').onclick=()=>{show();goView('protocol')};$('settingsBtn').onclick=()=>goView('project');
$('nextDoorBtn').onclick=()=>{const sorted=doors.slice().sort((a,b)=>a.page-b.page||a.id.localeCompare(b.id,'sv',{numeric:true}));const next=sorted[(sorted.findIndex(d=>d.uid===selected)+1)%sorted.length];if(next)openOverviewDoor(next.uid)};
function shiftedDoorNextDate(previousDate,previousNextDate){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(previousDate||'')||!/^\d{4}-\d{2}-\d{2}$/.test(previousNextDate||''))return '';
 const from=new Date(previousDate+'T12:00:00'),to=new Date(previousNextDate+'T12:00:00'),days=Math.round((to-from)/86400000);
 if(!Number.isFinite(days)||days<1||days>730)return '';
 const base=new Date(doorLocalToday()+'T12:00:00');base.setDate(base.getDate()+days);
 const local=new Date(base.getTime()-base.getTimezoneOffset()*60000);return local.toISOString().slice(0,10);
}
function startNewDoorService(requireConfirm=true){
 if(!pdf||!doors.length){notice('Lägg till dörrar innan du startar ett nytt servicebesök.');return false}
 if(requireConfirm&&!confirm('Starta en ny service med samma dörrar? Dagens kontroller nollställs. Projekt, kund, företag, logga, dörrar och servicetekniker behålls.'))return false;
 const previousDate=project.inspectionDate||'',previousNextDate=project.projectNextDate||'',suggestedNextDate=shiftedDoorNextDate(previousDate,previousNextDate);
 doors.forEach(d=>{
  d.previousIssues=doorProblems(d).map(([n,title])=>({n,title,note:d.checks[n].note||''}));
  d.previousNotes=d.notes||'';
  d.previousStatus=statusText(d);
  d.previousServiceDate=previousDate;
  d.checks={};normalize(d);d.notes='';d.status='untested';d.signature='';d.ao='';d.remediationDate='';d.remediationSignature='';
 });
 project.serviceSignature='';project.projectOrder='';project.inspectionDate=doorLocalToday();project.projectNextDate=suggestedNextDate;
 selected=null;refreshDrawingUI();save();draw();show();goView('project');notice('Nytt servicebesök startat. Grunduppgifter, logga, dörrar och servicetekniker är kvar. Fyll i nytt ordernummer och kontrollera nästa provningsdatum.');
 requestAnimationFrame(()=>$('projectOrder')?.focus());
 return true;
}
$('newServiceBtn').onclick=()=>startNewDoorService(true);
$('doorOpenWorkDialog').addEventListener('cancel',e=>e.preventDefault());
$('doorOpenContinue').onclick=()=>{$('doorOpenWorkDialog').close();goView('drawing');notice('Arbetsfilen är öppnad för fortsatt arbete/ändringar.')};
$('doorOpenNewService').onclick=()=>{if(startNewDoorService(false))$('doorOpenWorkDialog').close()};
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
 return {drawingBytes,work:{version:1,doors:state.doors,textNotes:Array.isArray(state.textNotes)?state.textNotes:[],project:state.project,logoData:state.logoData||''}};
}
async function createWorkPdf(){
 if(!pdf||!sourcePdfBytes)throw new Error('Öppna en PDF-ritning först.');
 if(!window.PDFLib||!window.jspdf?.jsPDF)throw new Error('PDF-biblioteken kunde inte laddas.');
 const snapshot=structuredClone({doors,textNotes,project,logoData}),originalBytes=sourcePdfBytes.slice(),drawingDocument=pdf;
 const {PDFDocument,PDFName,PDFArray,StandardFonts,rgb,degrees}=PDFLib;
 const source=await PDFDocument.load(originalBytes,{updateMetadata:false}),output=await PDFDocument.create(),copied=await output.copyPages(source,source.getPageIndices());copied.forEach(p=>output.addPage(p));const font=await output.embedFont(StandardFonts.HelveticaBold),noteFont=await output.embedFont(StandardFonts.Helvetica),markerLinks=[];
 for(let index=0;index<copied.length;index++){
  const page=copied[index],originalPage=await drawingDocument.getPage(index+1),viewport=originalPage.getViewport({scale:1}),radius=Math.max(7,Math.min(13,Math.min(viewport.width,viewport.height)*.016));
  snapshot.doors.filter(d=>d.page===index+1).forEach(d=>{
   const [x,y]=viewport.convertToPdfPoint(d.x*viewport.width,d.y*viewport.height),[lx,ly]=viewport.convertToPdfPoint((Number.isFinite(d.labelX)?d.labelX:d.x+.075)*viewport.width,(Number.isFinite(d.labelY)?d.labelY:d.y-.045)*viewport.height),color=REPORT_COLORS[displayStatus(d)].rgb,statusColor=rgb(...color.map(n=>n/255));
   const serial=String(d.serialNumber||'').replace(/^0+(?=\d)/,'')||String(d.id||'').replace(/^D/,'');const label=[snapshot.project?.facilityNo?.trim(),serial].filter(Boolean).join(' · ');const safeLabel=String(label).replace(/[^\x20-\x7e\u00a0-\u00ff]/g,'?');const size=safeLabel.length>18?11.8:13.4,w=font.widthOfTextAtSize(safeLabel,size),boxW=Math.max(40,w+14),boxH=size+8.5,angle=page.getRotation().angle,rad=angle*Math.PI/180,cos=Math.cos(rad),sin=Math.sin(rad),dx=x-lx,dy=y-ly,dist=Math.max(.001,Math.hypot(dx,dy)),ux=dx/dist,uy=dy/dist,localUx=cos*ux+sin*uy,localUy=-sin*ux+cos*uy,halfW=boxW/2,halfH=boxH/2,txEdge=Math.min(Math.abs(localUx)>.0001?halfW/Math.abs(localUx):Infinity,Math.abs(localUy)>.0001?halfH/Math.abs(localUy):Infinity),edgeX=lx+ux*(txEdge+1.5),edgeY=ly+uy*(txEdge+1.5),endX=x-ux*2,endY=y-uy*2;
   page.drawLine({start:{x:edgeX,y:edgeY},end:{x:endX,y:endY},thickness:1.05,color:statusColor,opacity:.9});
   const head=5,wing=2.8,px=-uy,py=ux;page.drawLine({start:{x,y},end:{x:x-ux*head+px*wing,y:y-uy*head+py*wing},thickness:1.05,color:statusColor});page.drawLine({start:{x,y},end:{x:x-ux*head-px*wing,y:y-uy*head-py*wing},thickness:1.05,color:statusColor});
   page.drawCircle({x,y,size:2.2,color:statusColor,borderColor:rgb(1,1,1),borderWidth:.7});
   const boxX=lx-cos*halfW+sin*halfH,boxY=ly-sin*halfW-cos*halfH;page.drawRectangle({x:boxX,y:boxY,width:boxW,height:boxH,color:statusColor,borderColor:rgb(1,1,1),borderWidth:1,rotate:degrees(angle)});
   const textLocalX=-w/2,textLocalY=-size/3;page.drawText(safeLabel,{x:lx+textLocalX*cos-textLocalY*sin,y:ly+textLocalX*sin+textLocalY*cos,size,font,color:rgb(1,1,1),rotate:degrees(angle)});
   markerLinks.push({pageIndex:index,doorKey:d.uid||d.id,x:lx,y:ly,radius:Math.max(boxW,boxH)/2+5});
  });
  (snapshot.textNotes||[]).filter(n=>n.page===index+1&&n.text).forEach(n=>{
   const [x,y]=viewport.convertToPdfPoint(n.x*viewport.width,n.y*viewport.height),safe=String(n.text).replace(/[^\x20-\x7e\u00a0-\u00ff]/g,'?').slice(0,120),size=8.2,maxWidth=Math.min(150,viewport.width*.28);
   const lines=[];let line='';
   safe.split(/\s+/).forEach(word=>{const trial=line?line+' '+word:word;if(noteFont.widthOfTextAtSize(trial,size)<=maxWidth)line=trial;else{if(line)lines.push(line);line=word}});if(line)lines.push(line);
   const shown=lines.slice(0,3),padding=4,lineH=size+2,width=Math.max(34,...shown.map(t=>noteFont.widthOfTextAtSize(t,size)))+padding*2,height=shown.length*lineH+padding*2;
   const bx=Math.min(viewport.width-width-3,x+10),by=Math.max(3,y-height-10);
   page.drawLine({start:{x,y},end:{x:bx,y:by+height/2},thickness:1,color:rgb(.1,.25,.34)});
   page.drawCircle({x,y,size:2.4,color:rgb(.1,.25,.34)});
   page.drawRectangle({x:bx,y:by,width,height,color:rgb(1,1,.91),borderColor:rgb(.1,.25,.34),borderWidth:.8,opacity:.96});
   shown.forEach((t,i)=>page.drawText(t,{x:bx+padding,y:by+height-padding-size-i*lineH,size,font:noteFont,color:rgb(.05,.12,.16)}));
  });
 }
 const report=buildServiceReportDoc(snapshot,true),protocolPageMap=report.__doorProtocolPages||{},backLinks=report.__doorBackLinks||[],reportPdf=await PDFDocument.load(report.output('arraybuffer'));const reportPages=await output.copyPages(reportPdf,reportPdf.getPageIndices());reportPages.forEach(p=>output.addPage(p));
 function addInternalPdfLink(sourcePage,targetPage,rect){
  const destination=output.context.obj([targetPage.ref,PDFName.of('Fit')]);const linkRef=output.context.register(output.context.obj({Type:'Annot',Subtype:'Link',Rect:rect,Border:[0,0,0],Dest:destination}));
  const existing=sourcePage.node.get(PDFName.of('Annots'));
  if(existing){const annots=sourcePage.node.lookup(PDFName.of('Annots'),PDFArray);annots.push(linkRef)}
  else sourcePage.node.set(PDFName.of('Annots'),output.context.obj([linkRef]));
 }
 markerLinks.forEach(({pageIndex,doorKey,x,y,radius})=>{
  const reportPageNo=protocolPageMap[doorKey];if(!reportPageNo)return;
  const targetIndex=source.getPageCount()+reportPageNo-1,targetPage=output.getPage(targetIndex),sourcePage=output.getPage(pageIndex),hit=Math.max(12,radius*1.8);
  addInternalPdfLink(sourcePage,targetPage,[x-hit,y-hit,x+hit,y+hit]);
 });
 backLinks.forEach(({pageNo,drawingPage,rect})=>{
  if(!pageNo||!drawingPage||!Array.isArray(rect))return;
  const sourceIndex=source.getPageCount()+pageNo-1,targetIndex=drawingPage-1;
  if(sourceIndex<0||sourceIndex>=output.getPageCount()||targetIndex<0||targetIndex>=source.getPageCount())return;
  const sourcePage=output.getPage(sourceIndex),targetPage=output.getPage(targetIndex),size=sourcePage.getSize(),sx=size.width/210,sy=size.height/297;
  const [mx,my,mw,mh]=rect,pdfRect=[mx*sx,size.height-(my+mh)*sy,(mx+mw)*sx,size.height-my*sy];
  addInternalPdfLink(sourcePage,targetPage,pdfRect);
 });
 const state={app:'dorrservice',version:3,exportedAt:new Date().toISOString(),...snapshot};
 const dataRef=output.context.register(output.context.flateStream(new TextEncoder().encode(JSON.stringify(state))));const drawingRef=output.context.register(output.context.flateStream(originalBytes));
 output.catalog.set(PDFName.of('DorrserviceWork'),output.context.register(output.context.obj({Version:3,Data:dataRef,Drawing:drawingRef})));
 output.setTitle('Dörrservice – '+(snapshot.project.projectName||snapshot.project.facilityNo||'Service'));output.setSubject('Ritning, anmärkningsöversikt och provningsprotokoll. Arbets-PDF för Dörrservice 2.');output.setCreator('Dörrservice 2.0');
 return output.save();
}
$('exportBtn').onclick=async()=>{
 if(exporting||wrap.getAttribute('aria-busy')==='true')return;
 if(!pdf)return notice('Öppna en ritning först.');exporting=true;document.body.classList.add('exporting');$('file').disabled=true;$('exportBtn').disabled=true;persist();notice('Skapar arbets-PDF och kundrapport…');
 try{const bytes=await createWorkPdf(),url=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'})),a=document.createElement('a');const object=(project.facilityNo||project.projectName||'objekt').replace(/[^a-zA-Z0-9åäöÅÄÖ_-]/g,'-');a.href=url;a.download='dorrservice-'+object+'-'+(project.inspectionDate||new Date().toISOString().slice(0,10))+'.pdf';a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);notice('Arbets-PDF skapad. Spara den till Filer; samma fil kan öppnas nästa service.')}
 catch(error){notice(error.message||'Kunde inte skapa arbets-PDF.',true)}finally{exporting=false;document.body.classList.remove('exporting');$('file').disabled=false;$('exportBtn').disabled=!pdf}
};
createProblemPdf=function(){if(!doors.some(hasRecordedDoorProblem))throw new Error('Inga registrerade anmärkningar.');return buildServiceReportDoc(structuredClone({doors,project,logoData}),false)};
updateCompactUI();

function doorDrawingLabel(d){const serial=String(d.serialNumber||'').replace(/^0+(?=\d)/,'')||String(d.id||'').replace(/^D/,'');const model=(d.modelCode||d.model||'').trim();const object=(project.facilityNo||'').trim();return [object,model,serial].filter(Boolean).join(' · ')}
const baseDraw=draw;draw=function(){baseDraw();const items=doors.filter(d=>d.page===page);Array.from(markers.querySelectorAll('.marker')).forEach((element,index)=>{const d=items[index];if(!d)return;const label=doorDrawingLabel(d);element.textContent=label;element.title='Dörr '+label;element.setAttribute('aria-label','Dörr '+label);element.className='marker markerTag '+displayStatus(d)+' '+(d.x<.18?'arrowLeft':'arrowRight')})};

let keyboardBaseline=Math.round(window.visualViewport?.height||window.innerHeight),keyboardTimer=null;
function editableElement(){return document.activeElement?.matches?.('input,textarea,select,[contenteditable=true]')?document.activeElement:null}
function syncMobileViewport(force=false){
 const vv=window.visualViewport,current=Math.round(vv?.height||window.innerHeight),editing=!!editableElement();
 if(!editing||force)keyboardBaseline=Math.max(current,Math.round(window.innerHeight||current));
 const keyboardHeight=editing?Math.max(0,keyboardBaseline-current):0,open=editing&&keyboardHeight>110;
 document.body.classList.toggle('keyboard-open',open);
 document.documentElement.style.setProperty('--keyboard-height',keyboardHeight+'px');
 if(!open||force)document.documentElement.style.setProperty('--app-height',current+'px');
}
function keepEditorVisible(el){
 if(!el)return;const vv=window.visualViewport,rect=el.getBoundingClientRect(),top=(vv?.offsetTop||0)+12,bottom=(vv?.offsetTop||0)+(vv?.height||window.innerHeight)-18;
 if(rect.bottom>bottom||rect.top<top)el.scrollIntoView({block:'center',behavior:'smooth'});
}
document.addEventListener('focusin',e=>{
 if(!e.target.matches?.('input,textarea,select,[contenteditable=true]'))return;
 keyboardBaseline=Math.round(window.visualViewport?.height||window.innerHeight);
 clearTimeout(keyboardTimer);keyboardTimer=setTimeout(()=>{syncMobileViewport(false);keepEditorVisible(e.target)},320);
});
document.addEventListener('focusout',()=>{
 clearTimeout(keyboardTimer);keyboardTimer=setTimeout(()=>{document.body.classList.remove('keyboard-open');syncMobileViewport(true)},220);
});
window.visualViewport?.addEventListener('resize',()=>syncMobileViewport(false));
window.addEventListener('resize',()=>{if(!editableElement())syncMobileViewport(true)});
window.addEventListener('orientationchange',()=>setTimeout(()=>syncMobileViewport(true),350));
syncMobileViewport(true);

let deferredInstallPrompt=null;
const installPanel=$('installAppPanel'),installBtn=$('installAppBtn'),installText=$('installAppText');
const isStandalone=window.matchMedia('(display-mode: standalone)').matches||window.navigator.standalone===true;
const isiOS=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
function refreshInstallUI(){
 if(!installPanel)return;
 if(isStandalone){installPanel.hidden=true;return}
 const mobileLike=matchMedia('(max-width: 900px)').matches||navigator.maxTouchPoints>0;
 installPanel.hidden=!mobileLike;
 if(isiOS){installText.textContent='På iPhone: öppna i Safari, tryck Dela och välj Lägg till på hemskärmen.';installBtn.textContent='Visa hur';installBtn.hidden=false}
 else if(deferredInstallPrompt){installText.textContent='Installera Dörrservice på hemskärmen för helskärmsläge och enklare användning.';installBtn.textContent='Installera app';installBtn.hidden=false}
 else{installText.textContent='Öppna webbläsarens meny och välj Installera app eller Lägg till på hemskärmen.';installBtn.textContent='Installationshjälp';installBtn.hidden=false}
}
window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferredInstallPrompt=e;refreshInstallUI()});
window.addEventListener('appinstalled',()=>{deferredInstallPrompt=null;if(installPanel)installPanel.hidden=true});
if(installBtn)installBtn.onclick=async()=>{
 if(deferredInstallPrompt){deferredInstallPrompt.prompt();await deferredInstallPrompt.userChoice;deferredInstallPrompt=null;refreshInstallUI();return}
 alert(isiOS?'iPhone: öppna sidan i Safari → tryck Dela → Lägg till på hemskärmen → Lägg till.':'Öppna webbläsarens meny och välj Installera app eller Lägg till på hemskärmen.')
};
refreshInstallUI();

let customerPreviewTimer=null,customerPreviewToken=0,customerPreviewPdf=null;
function customerPreviewDoor(){
 const source=cur()||doors[0];
 if(source)return structuredClone(source);
 const checks={};CHECKS.forEach(([n])=>checks[n]={result:'',note:''});
 return {uid:'preview',id:'D1',serialNumber:'1',page:1,x:.5,y:.5,model:'',machineId:'',location:'',ao:'',nextDate:'',signature:'',status:'untested',notes:'',checks,remediationDate:'',remediationSignature:''};
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
  const available=Math.max(320,(holder.clientWidth||760)-22),displayScale=Math.min(1.55,available/base.width),pixelRatio=Math.min(Math.max(2.5,(window.devicePixelRatio||1)*1.6),4),cssGap=14,renderGap=Math.round(cssGap*pixelRatio);
  const cssW=Math.round(base.width*displayScale),cssH=Math.round(base.height*displayScale),renderW=Math.ceil(cssW*pixelRatio),renderH=Math.ceil(cssH*pixelRatio),pageCount=preview.numPages-firstProtocolPage+1;
  canvas.width=renderW;canvas.height=renderH*pageCount+renderGap*Math.max(0,pageCount-1);canvas.style.width=cssW+'px';canvas.style.height=(cssH*pageCount+cssGap*Math.max(0,pageCount-1))+'px';
  const out=canvas.getContext('2d');out.imageSmoothingEnabled=true;out.imageSmoothingQuality='high';out.clearRect(0,0,canvas.width,canvas.height);
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


/* Offline wording assistance. No network requests or automatic diagnosis. */
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
function doorWordingSentence(problem,frequency,action){
 const sentence=s=>s.trim().replace(/[.!?]+$/,'')+'.';
 return [problem?sentence(problem+(frequency?' '+frequency:'')):'',action?sentence(action):''].filter(Boolean).join(' ');
}
function openDoorWording({title,original,choices,apply}){
 const dialog=document.createElement('dialog');dialog.className='doorWordingDialog';dialog.setAttribute('aria-labelledby','doorWordingTitle');
 const h=document.createElement('h2');h.id='doorWordingTitle';h.textContent='Hjälp med formulering';
 const context=document.createElement('p');context.textContent=title;
 const help=document.createElement('p');help.textContent='Fungerar utan internet. Välj det du har observerat och granska förslaget. Befintlig text ersätts först när du väljer Använd texten.';
 const old=document.createElement('p');old.className='doorWordingOriginal';old.textContent='Din text: '+(original||'Ingen text ännu.');
 const field=(caption,element)=>{const l=document.createElement('label');l.append(document.createTextNode(caption),element);return l};
 const select=(items,empty)=>{const el=document.createElement('select');for(const [value,label] of [['',empty],...items.map(x=>[x,x])]){const o=document.createElement('option');o.value=value;o.textContent=label;el.appendChild(o)}return el};
 const problem=select([...new Set(choices)],'Välj beskrivning…');
 const frequency=select(['ibland','vid varje manövrering','under sista delen av stängningen'],'Ingen uppgift om när');
 const action=select(['Justering av dörrbladet krävs','Justering av gångjärnen krävs','Justering av låsblecket krävs','Fortsatt felsökning krävs'],'Ingen åtgärd angiven');
 const preview=document.createElement('textarea');preview.rows=4;preview.value=original;preview.id='doorWordingPreview';
 const status=document.createElement('p');status.setAttribute('role','status');
 const make=document.createElement('button');make.type='button';make.textContent='Skapa förslag';
 make.onclick=()=>{if(!problem.value){status.textContent='Välj en beskrivning. Du kan också redigera texten direkt nedan.';return}preview.value=doorWordingSentence(problem.value,frequency.value,action.value);status.textContent='Förslaget är klart. Kontrollera att texten stämmer.'};
 const buttons=document.createElement('div');buttons.className='doorWordingActions';
 const use=document.createElement('button');use.type='button';use.className='primary';use.textContent='Använd texten';
 use.onclick=()=>{if(!preview.value.trim()){status.textContent='Skriv eller skapa ett förslag först.';return}apply(preview.value.trim());dialog.close()};
 const cancel=document.createElement('button');cancel.type='button';cancel.textContent='Avbryt';cancel.onclick=()=>dialog.close();
 buttons.append(cancel,use);
 dialog.append(h,context,help,old,field('Beskrivning',problem),field('När händer det?',frequency),field('Behov av åtgärd – välj bara om det är bedömt',action),make,field('Förslag – kan redigeras',preview),status,buttons);
 const previous=document.activeElement;
 dialog.addEventListener('close',()=>{dialog.remove();if(previous?.isConnected)previous.focus()},{once:true});
 document.body.appendChild(dialog);dialog.showModal();problem.focus();
}
const generalWording=document.createElement('button');generalWording.type='button';generalWording.className='doorWordingButton';generalWording.textContent='Hjälp med formulering';
$('notes').parentElement.insertAdjacentElement('afterend',generalWording);
generalWording.onclick=()=>{const d=cur();if(!d)return;openDoorWording({title:'Allmän anmärkning',original:$('notes').value,choices:DOOR_WORDING,apply:text=>{if(cur()?.uid!==d.uid)return;$('notes').value=text;$('notes').dispatchEvent(new Event('input',{bubbles:true}))}})};
