(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const els = {
    drawingFile:$('pfDrawingFile'), protocolFile:$('pfProtocolFile'),
    fileName:$('pfFileName'), protocolFileName:$('pfProtocolFileName'), state:$('pfState'),
    objectCount:$('pfObjectCount'), doneCount:$('pfDoneCount'), totalProgress:$('pfTotalProgress'),
    prev:$('pfPrev'), next:$('pfNext'), pageInfo:$('pfPageInfo'), zoomOut:$('pfZoomOut'), zoomIn:$('pfZoomIn'), panMode:$('pfPanMode'),
    rescan:$('pfRescan'), wrap:$('pfViewerWrap'), stage:$('pfStage'), canvas:$('pfCanvas'), markers:$('pfMarkers'),
    empty:$('pfEmpty'), groups:$('pfGroups'), focusCurrent:$('pfFocusCurrent'), side:$('pfSide'), sideToggle:$('pfSideToggle'),
    protocol:$('pfProtocol'), protocolType:$('pfProtocolType'), protocolTitle:$('pfProtocolTitle'),
    protocolPosition:$('pfProtocolPosition'), protocolPercent:$('pfProtocolPercent'), protocolBar:$('pfProtocolBar'),
    matchedText:$('pfMatchedProtocolText'), protocolCanvas:$('pfProtocolCanvas'),
    protocolDocument:$('pfProtocolDocument'), protocolStage:$('pfProtocolStage'), protocolHotspots:$('pfProtocolHotspots'),
    protocolMissing:$('pfProtocolMissing'), cardZoomOut:$('pfCardZoomOut'), cardZoomIn:$('pfCardZoomIn'), cardZoomInfo:$('pfCardZoomInfo'),
    closeProtocol:$('pfCloseProtocol'), backToDrawing:$('pfBackToDrawing')
  };

  if (!window.pdfjsLib || !window.PDFLib) {
    if (els.state) els.state.textContent = 'PDF-biblioteket kunde inte laddas.';
    return;
  }
  pdfjsLib.GlobalWorkerOptions.workerSrc='vendor/pdf.worker.min.js';

  const ctx=els.canvas.getContext('2d');
  const protocolCtx=els.protocolCanvas.getContext('2d');
  const CHECK_POINTS=['Daglåsning','Nattlåsning','Dörrstängning','Larm / passer','Dörrfunktion','Larmfunktion','Brandfunktion'];

  let drawingPdf=null, protocolPdf=null, drawingBytes=null, protocolBytes=null;
  let drawingKey='', currentPage=1, scale=1.15, objects=[], protocolPages={}, protocolPageTexts={}, protocolDefsByCode={}, selectedId=null, restoreView=null;
  let cardScale=1, cardPage=0;
  let drawingZoomBusy=false,drawingZoomQueued=null;
  let panMode=true, highlightedId=null;

  function hashText(text){
    let h=2166136261;
    for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)}
    return (h>>>0).toString(36);
  }
  function storageKey(){return 'tillsyno-project-flow-v2:'+drawingKey}
  function loadSaved(){
    if(!drawingKey)return {};
    try{return JSON.parse(localStorage.getItem(storageKey())||'{}')}catch(_){return {}}
  }
  function saveAll(){
    if(!drawingKey)return;
    const payload={version:2,updatedAt:new Date().toISOString(),objects:{}};
    objects.forEach(o=>payload.objects[o.id]={checks:o.checks||[],cardMarks:o.cardMarks||{},progress:o.progress||0});
    try{localStorage.setItem(storageKey(),JSON.stringify(payload))}catch(_){}
  }

  const PROJECT_DB_NAME='tillsyno-project-flow-files';
  const PROJECT_DB_STORE='projectFiles';
  function openProjectDb(){
    return new Promise((resolve,reject)=>{
      const req=indexedDB.open(PROJECT_DB_NAME,1);
      req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(PROJECT_DB_STORE))req.result.createObjectStore(PROJECT_DB_STORE,{keyPath:'key'})};
      req.onsuccess=()=>resolve(req.result);
      req.onerror=()=>reject(req.error||new Error('Kunde inte öppna lokal projektlagring'));
    });
  }
  async function saveProtocolForProject(file,bytes){
    if(!drawingKey||!file||!bytes)return;
    const db=await openProjectDb();
    const data=bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength);
    await new Promise((resolve,reject)=>{
      const tx=db.transaction(PROJECT_DB_STORE,'readwrite');
      tx.objectStore(PROJECT_DB_STORE).put({
        key:drawingKey,
        name:file.name||'Dörrkort.pdf',
        type:file.type||'application/pdf',
        lastModified:file.lastModified||Date.now(),
        data
      });
      tx.oncomplete=resolve;
      tx.onerror=()=>reject(tx.error||new Error('Kunde inte spara dörrkortsfilen'));
    });
    db.close();
  }
  async function loadProtocolForProject(){
    if(!drawingKey)return null;
    const db=await openProjectDb();
    const record=await new Promise((resolve,reject)=>{
      const tx=db.transaction(PROJECT_DB_STORE,'readonly');
      const req=tx.objectStore(PROJECT_DB_STORE).get(drawingKey);
      req.onsuccess=()=>resolve(req.result||null);
      req.onerror=()=>reject(req.error||new Error('Kunde inte läsa kopplad dörrkortsfil'));
    });
    db.close();
    return record;
  }
  function normalizeCode(value){
    const text=String(value||'').toUpperCase().trim();
    const exact=text.match(/^([A-ZÅÄÖ]{1,8})\s*[- ]?\s*(\d{1,4}[A-Z]?)$/);
    if(exact)return exact[1]+exact[2];
    const embedded=text.match(/\b([A-ZÅÄÖ]{1,8})\s*[- ]?\s*(\d{1,4}[A-Z]?)\b/);
    return embedded?embedded[1]+embedded[2]:'';
  }
  function codeRegex(code){
    const m=String(code||'').toUpperCase().match(/^([A-ZÅÄÖ]+)(\d+)([A-Z]?)$/);
    if(!m)return null;
    const gap='[^A-ZÅÄÖ0-9]*';
    const spread=value=>String(value||'').split('').join(gap);
    const body=spread(m[1])+gap+spread(m[2])+(m[3]?gap+spread(m[3]):'');
    return new RegExp('(^|[^A-ZÅÄÖ0-9])'+body+'($|[^A-ZÅÄÖ0-9])','i');
  }

  function rebuildProtocolMap(){
    protocolPages={};
    const codes=[...new Set(objects.map(o=>o.code))];
    const pageEntries=Object.entries(protocolPageTexts).map(([pageNo,text])=>({
      pageNo:Number(pageNo),
      text:String(text||''),
      normalized:String(text||'').toUpperCase().replace(/[^A-ZÅÄÖ0-9]+/g,'')
    }));
    codes.forEach(code=>{
      const normalizedCode=String(code||'').toUpperCase().replace(/[^A-ZÅÄÖ0-9]+/g,'');
      const rx=codeRegex(code);
      if(!normalizedCode)return;
      // Door-card pages use headings such as "GS 5" while drawing stamps use "GS5".
      // Prefer the heading at the beginning/top of the extracted page text, then fall back
      // to the older tolerant regex match.
      let match=pageEntries.find(p=>p.normalized.startsWith(normalizedCode));
      if(!match && rx)match=pageEntries.find(p=>rx.test(p.text));
      if(match)protocolPages[code]=match.pageNo;
    });
  }
  function objectProgress(o){
    const def=protocolDefsByCode[o.code];
    if(def&&def.cells&&def.cells.length){
      const marks=o.cardMarks||{};
      const done=def.cells.filter(cell=>!!marks[cell.key]).length;
      return Math.round(done/def.cells.length*100);
    }
    const done=(o.checks||[]).filter(Boolean).length;
    return Math.round(done/CHECK_POINTS.length*100);
  }
  function refreshObjectProgress(){
    objects.forEach(o=>o.progress=objectProgress(o));
    saveAll();
    renderGroups();
    updateSummary();
  }
  function progressLabel(p){return p===0?'Ej kontrollerad':p===100?'Klar':p+'% klart'}
  function decodePdfText(obj){
    try{
      if(obj && typeof obj.decodeText==='function')return obj.decodeText();
      if(obj && typeof obj.asString==='function')return obj.asString();
    }catch(_){}
    return String(obj||'');
  }

  async function extractStampObjects(data){
    const {PDFDocument,PDFName,PDFDict,PDFArray,PDFNumber}=window.PDFLib;
    const doc=await PDFDocument.load(data.slice(),{ignoreEncryption:true,updateMetadata:false});
    const found=[];
    doc.getPages().forEach((page,index)=>{
      const annots=page.node.Annots();
      if(!annots)return;
      for(let i=0;i<annots.size();i++){
        let dict=null;
        try{dict=annots.lookup(i,PDFDict)}catch(_){}
        if(!dict)continue;
        const subtype=decodePdfText(dict.get(PDFName.of('Subtype'))).replace('/','');
        if(subtype!=='Stamp')continue;
        const code=normalizeCode(decodePdfText(dict.get(PDFName.of('Subj'))));
        if(!code)continue;
        let rectArr=null;
        try{rectArr=dict.lookup(PDFName.of('Rect'),PDFArray)}catch(_){}
        if(!rectArr || rectArr.size()<4)continue;
        const rect=[];
        for(let n=0;n<4;n++){
          let num=null;
          try{num=rectArr.lookup(n,PDFNumber)}catch(_){}
          rect.push(num&&typeof num.asNumber==='function'?num.asNumber():Number(decodePdfText(rectArr.get(n))));
        }
        if(rect.every(Number.isFinite))found.push({page:index+1,code,rect});
      }
    });
    return found;
  }

  async function fallbackTextObjects(){
    // Reservmetod endast när PDF-stämplar saknas. Vi söker efter samma projekt-ID-format,
    // men den normala vägen är alltid riktiga stämplar/annoteringar från projekteringen.
    const found=[];
    const rx=/\b[A-ZÅÄÖ]{1,8}\s*[- ]?\s*\d{1,4}[A-Z]?\b/g;
    for(let pageNo=1;pageNo<=drawingPdf.numPages;pageNo++){
      const page=await drawingPdf.getPage(pageNo);
      const viewport=page.getViewport({scale:1});
      const content=await page.getTextContent();
      content.items.forEach(item=>{
        rx.lastIndex=0;
        let m;
        while((m=rx.exec(String(item.str||'').toUpperCase()))){
          const code=normalizeCode(m[0]);
          if(!code)continue;
          const t=pdfjsLib.Util.transform(viewport.transform,item.transform);
          const x=t[4], y=t[5], w=Math.max(28,Math.abs(item.width||32)), h=Math.max(18,Math.abs(item.height||16));
          const p1=viewport.convertToPdfPoint(x,y), p2=viewport.convertToPdfPoint(x+w,y+h);
          found.push({page:pageNo,code,rect:[p1[0],p1[1],p2[0],p2[1]]});
        }
      });
    }
    return found;
  }

  const DOOR_CARD_SECTIONS=new Set(['DAGLÅSNING','NATTLÅSNING','DÖRRSTÄNGNING','LARM/PASSER','DÖRRFUNKTION','LARMFUNKTION','BRANDFUNKTION']);
  const FUNCTION_ROWS=new Set(['DÖRRFUNKTION','LARMFUNKTION','BRANDFUNKTION']);
  const DOOR_CARD_LABELS=[
    'Cylinder gångjärnssida','Cylinder anslagssida','Sensorlist gångjärnssida','Sensorlist anslagssida',
    'Dörrstängningsarm','Dörrautomatik','Armbågskontakt','Kabelöverföring','Cylinderbehör',
    'Utrymningsbehör','Dörrkoordinator','Magnetkontakt','Dörrcentral','Draghandtag','Öppnaknapp',
    'Dörrstängare','Klämfri bakkant','Brytskydd','Skyddsklass','Utrymningskrav','Återinrymning',
    'Brandkrav','Dörrtyp','Littera','Antal','Hängning','Låshus','Slutbleck','slutbleck','Trycke',
    'Kantregel','Kortläsare'
  ].sort((a,b)=>b.length-a.length);
  const NON_WORK_LABELS=new Set(['SKYDDSKLASS','UTRYMNINGSKRAV','ÅTERINRYMNING','BRANDKRAV','DÖRRTYP','LITTERA','ANTAL','HÄNGNING']);
  const CARD_COLUMNS=[
    {key:'mount',label:'Montering klar',x1:.612,x2:.687},
    {key:'commission',label:'Driftsättning klar',x1:.687,x2:.758},
    {key:'tested',label:'Provad',x1:.758,x2:.827}
  ];

  async function extractProtocolGeometry(pageNo){
    if(!protocolPdf||!pageNo)return {width:595,height:842,cells:[]};
    const page=await protocolPdf.getPage(pageNo);
    const viewport=page.getViewport({scale:1});
    const content=await page.getTextContent();
    const groups=[];
    for(const item of content.items){
      const text=String(item.str||'').trim();
      if(!text)continue;
      const t=pdfjsLib.Util.transform(viewport.transform,item.transform);
      const x=t[4],y=t[5];
      let row=groups.find(g=>Math.abs(g.y-y)<2.8);
      if(!row){row={y,items:[]};groups.push(row)}
      row.items.push({x,text});
    }
    groups.sort((a,b)=>a.y-b.y);
    const cells=[];
    for(const group of groups){
      group.items.sort((a,b)=>a.x-b.x);
      const line=group.items.map(i=>i.text).join(' ').replace(/\s+/g,' ').trim();
      const upper=line.toUpperCase();
      if(FUNCTION_ROWS.has(upper)){
        CARD_COLUMNS.forEach(col=>cells.push({key:upper+'|'+col.key,label:line,stage:col.label,y:group.y,x1:col.x1,x2:col.x2}));
        continue;
      }
      if(DOOR_CARD_SECTIONS.has(upper))continue;
      let label='';
      for(const candidate of DOOR_CARD_LABELS){
        if(upper.startsWith(candidate.toUpperCase()+' ')||upper===candidate.toUpperCase()){label=candidate;break}
      }
      if(!label||NON_WORK_LABELS.has(label.toUpperCase()))continue;
      const remainder=line.slice(label.length).trim();
      const hasAssignment=/\b(GS|DT|EL)\b/i.test(line);
      const hasValue=!!remainder&&remainder!=='-';
      if(!hasAssignment&&!hasValue)continue;
      const rowKey=(label+'@'+Math.round(group.y*10)).replace(/\s+/g,'_');
      CARD_COLUMNS.forEach(col=>cells.push({key:rowKey+'|'+col.key,label,stage:col.label,y:group.y,x1:col.x1,x2:col.x2}));
    }
    return {width:viewport.width,height:viewport.height,cells};
  }

  async function buildProtocolDefinitions(){
    protocolDefsByCode={};
    for(const [code,pageNo] of Object.entries(protocolPages)){
      protocolDefsByCode[code]=await extractProtocolGeometry(pageNo);
    }
    refreshObjectProgress();
  }

  async function renderInteractiveProtocol(pageNo,o,keepScale=false){
    if(!protocolPdf||!pageNo||!o)return;
    const page=await protocolPdf.getPage(pageNo);
    const base=page.getViewport({scale:1});
    if(!keepScale){
      const available=Math.max(280,(els.protocolDocument&&els.protocolDocument.clientWidth?els.protocolDocument.clientWidth:window.innerWidth)-24);
      cardScale=Math.max(.48,Math.min(2.2,available/base.width));
    }
    cardPage=pageNo;
    const viewport=page.getViewport({scale:cardScale});
    els.protocolCanvas.width=Math.ceil(viewport.width);
    els.protocolCanvas.height=Math.ceil(viewport.height);
    els.protocolCanvas.style.width=viewport.width+'px';
    els.protocolCanvas.style.height=viewport.height+'px';
    els.protocolStage.style.width=viewport.width+'px';
    els.protocolStage.style.height=viewport.height+'px';
    await page.render({canvasContext:protocolCtx,viewport}).promise;
    els.protocolHotspots.innerHTML='';
    const def=protocolDefsByCode[o.code]||await extractProtocolGeometry(pageNo);
    protocolDefsByCode[o.code]=def;
    const marks=o.cardMarks||(o.cardMarks={});
    def.cells.forEach(cell=>{
      const b=document.createElement('button');
      b.type='button';
      b.className='pfProtocolHotspot'+(marks[cell.key]?' active':'');
      b.style.left=(cell.x1*viewport.width)+'px';
      b.style.width=((cell.x2-cell.x1)*viewport.width)+'px';
      const h=Math.max(5,7.5*cardScale);
      b.style.top=(cell.y*cardScale-h*.72)+'px';
      b.style.height=h+'px';
      b.title=cell.label+' – '+cell.stage;
      b.setAttribute('aria-label',cell.label+', '+cell.stage);
      if(marks[cell.key])b.textContent='✓';
      b.addEventListener('click',async e=>{
        e.stopPropagation();
        marks[cell.key]=!marks[cell.key];
        if(!marks[cell.key])delete marks[cell.key];
        b.classList.toggle('active',!!marks[cell.key]);
        b.textContent=marks[cell.key]?'✓':'';
        o.progress=objectProgress(o);
        saveAll();
        updateProtocol(o);
        updateSummary();
        renderGroups();
        if(drawingPdf){
          const drawingPage=await drawingPdf.getPage(currentPage);
          renderMarkers(drawingPage.getViewport({scale}));
        }
      });
      els.protocolHotspots.appendChild(b);
    });
    if(els.cardZoomInfo)els.cardZoomInfo.textContent=Math.round(cardScale*100)+'%';
  }

  async function zoomProtocol(nextScale,clientX=null,clientY=null){
    const o=objects.find(x=>x.id===selectedId);
    if(!o||!cardPage)return;
    const wrap=els.protocolDocument;
    const old=cardScale;
    nextScale=Math.max(.42,Math.min(3.5,nextScale));
    if(Math.abs(nextScale-old)<.001)return;
    const rect=wrap.getBoundingClientRect();
    const localX=clientX==null?wrap.clientWidth/2:clientX-rect.left;
    const localY=clientY==null?wrap.clientHeight/2:clientY-rect.top;
    const docX=wrap.scrollLeft+localX,docY=wrap.scrollTop+localY,ratio=nextScale/old;
    cardScale=nextScale;
    await renderInteractiveProtocol(cardPage,o,true);
    wrap.scrollLeft=docX*ratio-localX;
    wrap.scrollTop=docY*ratio-localY;
  }

  async function scanProtocolPdf(){
    protocolPageTexts={};
    protocolPages={};
    if(!protocolPdf){updateState();return}
    els.state.textContent='Läser dörrkorten…';
    for(let pageNo=1;pageNo<=protocolPdf.numPages;pageNo++){
      const page=await protocolPdf.getPage(pageNo);
      const content=await page.getTextContent();
      protocolPageTexts[pageNo]=content.items.map(i=>String(i.str||'')).join(' ');
    }
    rebuildProtocolMap();
    await buildProtocolDefinitions();
    renderGroups();
    updateState();
    if(selectedId && els.protocol.open){
      const o=objects.find(x=>x.id===selectedId);
      if(o)await updateMatchedProtocol(o,true);
    }
  }

  async function scanDrawing(){
    if(!drawingPdf || !drawingBytes)return;
    els.state.textContent='Läser projektstämplarna i ritningen…';
    els.rescan.disabled=true;
    let raw=[];
    try{raw=await extractStampObjects(drawingBytes)}catch(err){console.warn('Stamp scan failed, fallback to text',err)}
    if(!raw.length)raw=await fallbackTextObjects();

    const saved=loadSaved(), counts={};
    raw.sort((a,b)=>a.page-b.page||a.rect[1]-b.rect[1]||a.rect[0]-b.rect[0]);
    objects=raw.map(o=>{
      counts[o.code]=(counts[o.code]||0)+1;
      const id=o.code+'@p'+o.page+'@'+o.rect.map(n=>Math.round(n)).join('_');
      const old=(saved.objects&&saved.objects[id])||{};
      const checks=Array.isArray(old.checks)?old.checks.slice(0,CHECK_POINTS.length):Array(CHECK_POINTS.length).fill(false);
      while(checks.length<CHECK_POINTS.length)checks.push(false);
      const cardMarks=old.cardMarks&&typeof old.cardMarks==='object'?old.cardMarks:{};
      const obj={...o,id,instance:counts[o.code],checks,cardMarks,progress:0};
      obj.progress=objectProgress(obj);
      return obj;
    });

    rebuildProtocolMap();
    if(protocolPdf)await buildProtocolDefinitions();
    saveAll();
    renderGroups();
    updateSummary();
    await renderPage(Math.min(currentPage,drawingPdf.numPages));
    els.rescan.disabled=false;
    updateState();
  }

  function updateState(){
    if(!drawingPdf){
      els.state.textContent='Öppna ritningen och dörrkorts-PDF:en för att börja.';
      return;
    }
    const codes=[...new Set(objects.map(o=>o.code))];
    const matched=codes.filter(c=>protocolPages[c]).length;
    if(!protocolPdf){
      els.state.textContent='Hittade '+objects.length+' projektpositioner. Ladda dörrkorts-PDF:en för automatisk koppling.';
      return;
    }
    els.state.textContent='Hittade '+objects.length+' projektpositioner. '+matched+' av '+codes.length+' ID-typer är matchade mot dörrkort.';
  }

  async function openDrawing(file){
    if(!file)return;
    drawingBytes=new Uint8Array(await file.arrayBuffer());
    drawingKey=hashText([file.name,file.size,file.lastModified].join('|'));
    els.fileName.textContent=file.name;
    els.state.textContent='Öppnar ritningen…';

    protocolPdf=null;
    protocolBytes=null;
    protocolPages={};
    protocolPageTexts={};
    protocolDefsByCode={};
    cardPage=0;
    selectedId=null;
    els.protocolFileName.textContent='Söker kopplat dörrkort…';

    drawingPdf=await pdfjsLib.getDocument({data:drawingBytes.slice()}).promise;
    currentPage=1;
    els.empty.hidden=true;
    await scanDrawing();

    try{
      const savedProtocol=await loadProtocolForProject();
      if(savedProtocol&&savedProtocol.data){
        protocolBytes=new Uint8Array(savedProtocol.data);
        protocolPdf=await pdfjsLib.getDocument({data:protocolBytes.slice()}).promise;
        els.protocolFileName.textContent=(savedProtocol.name||'Dörrkort.pdf')+' · kopplat till projektet';
        await scanProtocolPdf();
      }else{
        els.protocolFileName.textContent='Inget dörrkort kopplat till projektet';
        updateState();
      }
    }catch(err){
      console.warn('Kunde inte återställa dörrkortsfil',err);
      els.protocolFileName.textContent='Inget dörrkort kopplat till projektet';
      updateState();
    }
  }

  async function openProtocolFile(file){
    if(!file)return;
    protocolBytes=new Uint8Array(await file.arrayBuffer());
    els.protocolFileName.textContent=file.name+' · kopplas till projektet';
    els.state.textContent='Öppnar dörrkorten…';
    protocolPdf=await pdfjsLib.getDocument({data:protocolBytes.slice()}).promise;
    await scanProtocolPdf();
    try{
      await saveProtocolForProject(file,protocolBytes);
      els.protocolFileName.textContent=file.name+' · kopplat till projektet';
    }catch(err){
      console.warn('Kunde inte spara dörrkortsfilen lokalt',err);
      els.protocolFileName.textContent=file.name+' · laddat för denna session';
    }
  }

  async function renderPage(pageNo){
    if(!drawingPdf)return;
    currentPage=Math.max(1,Math.min(drawingPdf.numPages,pageNo));
    const page=await drawingPdf.getPage(currentPage);
    const viewport=page.getViewport({scale});
    els.canvas.width=Math.ceil(viewport.width);
    els.canvas.height=Math.ceil(viewport.height);
    els.canvas.style.width=viewport.width+'px';
    els.canvas.style.height=viewport.height+'px';
    els.stage.style.width=viewport.width+'px';
    els.stage.style.height=viewport.height+'px';
    await page.render({canvasContext:ctx,viewport}).promise;
    els.pageInfo.textContent=currentPage+' / '+drawingPdf.numPages;
    renderMarkers(viewport);
  }

  function rectOnViewport(rect,viewport){
    const converted=viewport.convertToViewportRectangle(rect);
    const left=Math.min(converted[0],converted[2]), top=Math.min(converted[1],converted[3]);
    const right=Math.max(converted[0],converted[2]), bottom=Math.max(converted[1],converted[3]);
    return {left,top,width:right-left,height:bottom-top};
  }

  function renderMarkers(viewport){
    els.markers.innerHTML='';
    objects.filter(o=>o.page===currentPage).forEach(o=>{
      const r=rectOnViewport(o.rect,viewport);
      const btn=document.createElement('button');
      btn.type='button';
      btn.className='pfMarkerHit';
      btn.dataset.id=o.id;
      btn.dataset.progress=String(o.progress);
      if(o.id===highlightedId)btn.classList.add('isSelected');
      const pad=8, width=Math.max(38,r.width+pad*2), height=Math.max(38,r.height+pad*2);
      btn.style.left=(r.left+r.width/2-width/2)+'px';
      btn.style.top=(r.top+r.height/2-height/2)+'px';
      btn.style.width=width+'px';
      btn.style.height=height+'px';
      btn.setAttribute('aria-label',o.code+', position '+o.instance+', '+progressLabel(o.progress));
      if(o.progress>0){
        const badge=document.createElement('span');
        badge.className='pfMarkerPct';
        badge.textContent=o.progress===100?'✓':o.progress+'%';
        btn.appendChild(badge);
      }
      btn.addEventListener('click',()=>{highlightedId=o.id;focusObject(o.id);openProtocol(o.id)});
      els.markers.appendChild(btn);
    });
  }

  function groupData(){
    const map={};
    objects.forEach(o=>(map[o.code]||(map[o.code]=[])).push(o));
    return Object.entries(map).sort((a,b)=>a[0].localeCompare(b[0],'sv',{numeric:true}));
  }

  function renderGroups(){
    if(!objects.length){els.groups.innerHTML='<p class="pfMuted">Inga projektpositioner hittades.</p>';return}
    els.groups.innerHTML='';
    groupData().forEach(([code,list])=>{
      const box=document.createElement('section');
      box.className='pfGroup';
      const avg=Math.round(list.reduce((s,o)=>s+o.progress,0)/list.length);
      const head=document.createElement('button');
      head.type='button';
      head.innerHTML='<b>'+code+'</b><span>'+list.length+' positioner · '+(protocolPages[code]?'dörrkort kopplat':'dörrkort saknas')+'</span>';
      box.appendChild(head);
      const items=document.createElement('div');
      items.className='pfGroupItems';
      list.forEach(o=>{
        const b=document.createElement('button');
        b.type='button';
        b.className='pfGroupItem';
        b.innerHTML='<span><strong>Position '+o.instance+'</strong><small>Sida '+o.page+' · '+progressLabel(o.progress)+'</small></span><b>'+o.progress+'%</b>';
        b.addEventListener('click',async()=>{
          await renderPage(o.page);
          focusObject(o.id);
          if(els.side&&matchMedia('(max-width:780px)').matches){
            els.side.classList.remove('isOpen');
            if(els.sideToggle){els.sideToggle.setAttribute('aria-expanded','false');els.sideToggle.textContent='Positioner'}
          }
          if(protocolPdf)openProtocol(o.id);
          else{
            els.state.textContent=o.code+' · Position '+o.instance+' markerad. Dörrkort ej kopplat ännu.';
            els.protocolFileName.textContent='Inget dörrkort kopplat till projektet';
          }
        });
        items.appendChild(b);
      });
      const avgLine=document.createElement('small');
      avgLine.className='pfGroupAvg';
      avgLine.textContent='Totalt '+avg+'%';
      box.append(items,avgLine);
      els.groups.appendChild(box);
    });
  }

  function focusObject(id){
    highlightedId=id;
    els.markers.querySelectorAll('.pfMarkerHit').forEach(m=>m.classList.toggle('isSelected',m.dataset.id===id));
    requestAnimationFrame(()=>{
      const marker=els.markers.querySelector('[data-id="'+CSS.escape(id)+'"]');
      if(marker)marker.scrollIntoView({block:'center',inline:'center',behavior:'smooth'});
    });
  }

  async function ensureProtocolLoaded(){
    if(protocolPdf)return true;
    try{
      const savedProtocol=await loadProtocolForProject();
      if(!savedProtocol||!savedProtocol.data)return false;
      protocolBytes=new Uint8Array(savedProtocol.data);
      protocolPdf=await pdfjsLib.getDocument({data:protocolBytes.slice()}).promise;
      els.protocolFileName.textContent=(savedProtocol.name||'Dörrkort.pdf')+' · kopplat till projektet';
      await scanProtocolPdf();
      return true;
    }catch(err){
      console.warn('Kunde inte återställa dörrkortsfil vid öppning',err);
      protocolPdf=null;
      return false;
    }
  }

  async function openProtocol(id){
    const o=objects.find(x=>x.id===id);
    if(!o)return;
    highlightedId=id;
    focusObject(id);
    const hasProtocol=await ensureProtocolLoaded();
    if(!hasProtocol){
      els.state.textContent=o.code+' · Position '+o.instance+' markerad. Koppla dörrkorts-PDF:en en gång så öppnas rätt dörrkort automatiskt.';
      els.protocolFileName.textContent='Inget dörrkort kopplat till projektet';
      return;
    }
    selectedId=id;
    restoreView={page:currentPage,left:els.wrap.scrollLeft,top:els.wrap.scrollTop,scale};
    const same=objects.filter(x=>x.code===o.code);
    els.protocolType.textContent='DÖRRKORT · '+o.code;
    els.protocolTitle.textContent=o.code+' · position '+o.instance;
    els.protocolPosition.textContent='Position '+o.instance+' av '+same.length+' · ritningssida '+o.page;
    updateProtocol(o);
    if(typeof els.protocol.showModal==='function')els.protocol.showModal();else els.protocol.setAttribute('open','');
    await updateMatchedProtocol(o);
  }

  async function updateMatchedProtocol(o){
    if(!protocolPdf){
      els.protocolMissing.hidden=false;
      els.protocolStage.hidden=true;
      els.protocolMissing.textContent='Ladda dörrkorts-PDF:en först för att öppna '+o.code+'.';
      els.matchedText.textContent=o.code+' – dörrkorts-PDF inte laddad';
      cardPage=0;
      return;
    }
    let p=protocolPages[o.code];
    if(!p){
      rebuildProtocolMap();
      p=protocolPages[o.code];
    }
    if(!p){
      els.protocolMissing.hidden=false;
      els.protocolStage.hidden=true;
      els.protocolMissing.textContent=o.code+' hittades inte i den laddade dörrkorts-PDF:en.';
      els.matchedText.textContent=o.code+' – ingen matchning hittad';
      cardPage=0;
      return;
    }
    els.protocolMissing.hidden=true;
    els.protocolStage.hidden=false;
    els.matchedText.textContent=o.code+' · original dörrkort · sida '+p;
    await renderInteractiveProtocol(p,o,false);
  }

  function updateProtocol(o){
    els.protocolPercent.textContent=o.progress+'%';
    els.protocolBar.style.width=o.progress+'%';
  }

  async function closeProtocol(restore=true){
    if(els.protocol.open)els.protocol.close();
    if(restore&&restoreView&&drawingPdf){
      const needsRender=currentPage!==restoreView.page||Math.abs(scale-restoreView.scale)>.001;
      scale=restoreView.scale;
      if(needsRender)await renderPage(restoreView.page);
      requestAnimationFrame(()=>{
        els.wrap.scrollLeft=restoreView.left;
        els.wrap.scrollTop=restoreView.top;
      });
    }
  }

  function updateSummary(){
    els.objectCount.textContent=objects.length;
    const done=objects.filter(o=>o.progress===100).length;
    els.doneCount.textContent=done;
    const avg=objects.length?Math.round(objects.reduce((s,o)=>s+o.progress,0)/objects.length):0;
    els.totalProgress.textContent=avg+'%';
  }

  async function zoomTo(nextScale,clientX=null,clientY=null){
    if(!drawingPdf)return;
    nextScale=Math.max(.35,Math.min(4,nextScale));
    drawingZoomQueued={nextScale,clientX,clientY};
    if(drawingZoomBusy)return;
    drawingZoomBusy=true;
    try{
      while(drawingZoomQueued){
        const req=drawingZoomQueued;
        drawingZoomQueued=null;
        const oldScale=scale;
        if(Math.abs(req.nextScale-oldScale)<.001)continue;
        const rect=els.wrap.getBoundingClientRect();
        const localX=req.clientX==null?els.wrap.clientWidth/2:req.clientX-rect.left;
        const localY=req.clientY==null?els.wrap.clientHeight/2:req.clientY-rect.top;
        const docX=els.wrap.scrollLeft+localX;
        const docY=els.wrap.scrollTop+localY;
        const ratio=req.nextScale/oldScale;
        scale=req.nextScale;
        await renderPage(currentPage);
        els.wrap.scrollLeft=docX*ratio-localX;
        els.wrap.scrollTop=docY*ratio-localY;
      }
    }finally{
      drawingZoomBusy=false;
    }
  }

  els.drawingFile.addEventListener('click',e=>{ e.currentTarget.value=''; });
  els.drawingFile.addEventListener('change',e=>{
    const file=e.target.files&&e.target.files[0];
    if(!file)return;
    openDrawing(file).catch(err=>{
      console.error(err);
      els.state.textContent='Kunde inte öppna ritningen: '+err.message;
      if(els.rescan)els.rescan.disabled=false;
    });
  });
  els.protocolFile.addEventListener('click',e=>{ e.currentTarget.value=''; });
  els.protocolFile.addEventListener('change',e=>{
    const file=e.target.files&&e.target.files[0];
    if(!file)return;
    openProtocolFile(file).catch(err=>{
      console.error(err);
      els.state.textContent='Kunde inte öppna dörrkorten: '+err.message;
    });
  });
  els.prev.addEventListener('click',()=>renderPage(currentPage-1));
  els.next.addEventListener('click',()=>renderPage(currentPage+1));
  els.zoomOut.addEventListener('click',()=>zoomTo((drawingZoomQueued?drawingZoomQueued.nextScale:scale)-.18));
  els.zoomIn.addEventListener('click',()=>zoomTo((drawingZoomQueued?drawingZoomQueued.nextScale:scale)+.18));
  if(els.panMode){
    els.wrap.classList.add('isPanMode');
    els.panMode.addEventListener('click',()=>{
      panMode=!panMode;
      els.panMode.classList.toggle('active',panMode);
      els.panMode.setAttribute('aria-pressed',panMode?'true':'false');
      els.wrap.classList.toggle('isPanMode',panMode);
    });
  }
  if(els.sideToggle&&els.side){
    els.sideToggle.addEventListener('click',()=>{
      const open=els.side.classList.toggle('isOpen');
      els.sideToggle.setAttribute('aria-expanded',open?'true':'false');
      els.sideToggle.textContent=open?'Stäng positioner':'Positioner';
    });
  }
  els.rescan.addEventListener('click',()=>scanDrawing().catch(err=>{
    console.error(err);els.state.textContent='Analysen misslyckades: '+err.message;els.rescan.disabled=false;
  }));
  els.closeProtocol.addEventListener('click',()=>closeProtocol(true));
  els.backToDrawing.addEventListener('click',()=>closeProtocol(true));
  if(els.cardZoomOut)els.cardZoomOut.addEventListener('click',()=>zoomProtocol(cardScale-.14));
  if(els.cardZoomIn)els.cardZoomIn.addEventListener('click',()=>zoomProtocol(cardScale+.14));
  els.focusCurrent.addEventListener('click',()=>drawingPdf&&renderPage(currentPage));

  if(els.protocolDocument)els.protocolDocument.addEventListener('wheel',e=>{
    if(!cardPage)return;
    e.preventDefault();
    zoomProtocol(cardScale*(e.deltaY<0?1.12:.89),e.clientX,e.clientY);
  },{passive:false});

  els.wrap.addEventListener('wheel',e=>{
    if(!drawingPdf)return;
    e.preventDefault();
    const factor=e.deltaY<0?1.10:.91;
    const base=drawingZoomQueued?drawingZoomQueued.nextScale:scale;
    zoomTo(base*factor,e.clientX,e.clientY);
  },{passive:false});

  let cardPinching=false,cardPinchStartDistance=0,cardPinchStartScale=1,cardPinchFrame=0,cardPinchTarget=1,cardPinchCenter=null;
  function cardTouchDistance(a,b){return Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY)}
  if(els.protocolDocument){
    els.protocolDocument.addEventListener('touchstart',e=>{
      if(e.touches.length!==2||!cardPage)return;
      cardPinching=true;
      cardPinchStartDistance=cardTouchDistance(e.touches[0],e.touches[1]);
      cardPinchStartScale=cardScale;
      cardPinchCenter={x:(e.touches[0].clientX+e.touches[1].clientX)/2,y:(e.touches[0].clientY+e.touches[1].clientY)/2};
    },{passive:true});
    els.protocolDocument.addEventListener('touchmove',e=>{
      if(!cardPinching||e.touches.length!==2||!cardPage)return;
      e.preventDefault();
      const distance=cardTouchDistance(e.touches[0],e.touches[1]);
      cardPinchTarget=cardPinchStartScale*(distance/Math.max(1,cardPinchStartDistance));
      cardPinchCenter={x:(e.touches[0].clientX+e.touches[1].clientX)/2,y:(e.touches[0].clientY+e.touches[1].clientY)/2};
      if(!cardPinchFrame)cardPinchFrame=requestAnimationFrame(async()=>{
        cardPinchFrame=0;
        await zoomProtocol(cardPinchTarget,cardPinchCenter.x,cardPinchCenter.y);
      });
    },{passive:false});
    els.protocolDocument.addEventListener('touchend',e=>{
      if(e.touches.length<2)cardPinching=false;
    },{passive:true});
  }

  let mousePanning=false,panPointerId=null,panStartX=0,panStartY=0,panStartLeft=0,panStartTop=0;
  els.wrap.addEventListener('pointerdown',e=>{
    if(!drawingPdf||!panMode||e.pointerType!=='mouse'||e.button!==0)return;
    if(e.target.closest&&e.target.closest('button,a,input,label'))return;
    mousePanning=true;
    panPointerId=e.pointerId;
    panStartX=e.clientX;
    panStartY=e.clientY;
    panStartLeft=els.wrap.scrollLeft;
    panStartTop=els.wrap.scrollTop;
    els.wrap.classList.add('isPanning');
    try{els.wrap.setPointerCapture(e.pointerId)}catch(_){}
    e.preventDefault();
  });
  els.wrap.addEventListener('pointermove',e=>{
    if(!mousePanning||e.pointerId!==panPointerId)return;
    els.wrap.scrollLeft=panStartLeft-(e.clientX-panStartX);
    els.wrap.scrollTop=panStartTop-(e.clientY-panStartY);
    e.preventDefault();
  });
  function stopMousePan(e){
    if(!mousePanning)return;
    if(e&&panPointerId!==null&&e.pointerId!==panPointerId)return;
    mousePanning=false;
    els.wrap.classList.remove('isPanning');
    try{if(e)els.wrap.releasePointerCapture(e.pointerId)}catch(_){}
    panPointerId=null;
  }
  els.wrap.addEventListener('pointerup',stopMousePan);
  els.wrap.addEventListener('pointercancel',stopMousePan);
  els.wrap.addEventListener('lostpointercapture',()=>stopMousePan());

  let touchStartX=0,touchStartY=0,pinchStartDistance=0,pinchStartScale=scale,pinching=false,pinchCenter=null,pinchFrame=0,pinchTarget=scale;
  function touchDistance(a,b){return Math.hypot(a.clientX-b.clientX,a.clientY-b.clientY)}
  els.wrap.addEventListener('touchstart',e=>{
    if(e.touches.length===2){
      pinching=true;
      pinchStartDistance=touchDistance(e.touches[0],e.touches[1]);
      pinchStartScale=scale;
      pinchCenter={x:(e.touches[0].clientX+e.touches[1].clientX)/2,y:(e.touches[0].clientY+e.touches[1].clientY)/2};
    }else if(e.touches.length===1&&!pinching){
      touchStartX=e.touches[0].clientX;touchStartY=e.touches[0].clientY;
    }
  },{passive:true});
  els.wrap.addEventListener('touchmove',e=>{
    if(!drawingPdf||e.touches.length!==2||!pinching)return;
    e.preventDefault();
    const d=touchDistance(e.touches[0],e.touches[1]);
    pinchTarget=pinchStartScale*(d/Math.max(1,pinchStartDistance));
    pinchCenter={x:(e.touches[0].clientX+e.touches[1].clientX)/2,y:(e.touches[0].clientY+e.touches[1].clientY)/2};
    const preview=Math.max(.35,Math.min(4,pinchTarget))/Math.max(.001,scale);
    els.stage.classList.add('isGesturePreview');
    els.stage.style.transform='scale('+preview+')';
    if(!pinchFrame)pinchFrame=requestAnimationFrame(()=>{pinchFrame=0});
  },{passive:false});
  els.wrap.addEventListener('touchend',e=>{
    if(pinching){
      if(e.touches.length<2){
        pinching=false;
        els.stage.classList.remove('isGesturePreview');
        els.stage.style.transform='';
        const target=pinchTarget,center=pinchCenter;
        zoomTo(target,center&&center.x,center&&center.y);
      }
      return;
    }
    if(!drawingPdf||!e.changedTouches.length)return;
    const dx=e.changedTouches[0].clientX-touchStartX,dy=e.changedTouches[0].clientY-touchStartY;
    if(Math.abs(dx)>90&&Math.abs(dx)>Math.abs(dy)*1.5){dx<0?renderPage(currentPage+1):renderPage(currentPage-1)}
  },{passive:true});
})();