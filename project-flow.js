(() => {
  'use strict';

  const $ = id => document.getElementById(id);
  const els = {
    drawingFile:$('pfDrawingFile'), protocolFile:$('pfProtocolFile'),
    fileName:$('pfFileName'), protocolFileName:$('pfProtocolFileName'), state:$('pfState'),
    objectCount:$('pfObjectCount'), doneCount:$('pfDoneCount'), totalProgress:$('pfTotalProgress'),
    prev:$('pfPrev'), next:$('pfNext'), pageInfo:$('pfPageInfo'), zoomOut:$('pfZoomOut'), zoomIn:$('pfZoomIn'),
    rescan:$('pfRescan'), wrap:$('pfViewerWrap'), stage:$('pfStage'), canvas:$('pfCanvas'), markers:$('pfMarkers'),
    empty:$('pfEmpty'), groups:$('pfGroups'), focusCurrent:$('pfFocusCurrent'),
    protocol:$('pfProtocol'), protocolType:$('pfProtocolType'), protocolTitle:$('pfProtocolTitle'),
    protocolPosition:$('pfProtocolPosition'), protocolPercent:$('pfProtocolPercent'), protocolBar:$('pfProtocolBar'),
    matched:$('pfMatchedProtocol'), matchedText:$('pfMatchedProtocolText'), showProtocolPage:$('pfShowProtocolPage'),
    protocolPreview:$('pfProtocolPreview'), protocolCanvas:$('pfProtocolCanvas'),
    drawingPage:$('pfDrawingPage'), doorCardStatus:$('pfDoorCardStatus'),
    templateName:$('pfTemplateName'), checks:$('pfChecks'), closeProtocol:$('pfCloseProtocol'),
    backToDrawing:$('pfBackToDrawing')
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
  let drawingKey='', currentPage=1, scale=1.15, objects=[], protocolPages={}, protocolPageTexts={}, selectedId=null, restoreView=null;
  let previewVisible=true;

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
    objects.forEach(o=>payload.objects[o.id]={checks:o.checks||[],progress:o.progress||0});
    try{localStorage.setItem(storageKey(),JSON.stringify(payload))}catch(_){}
  }
  function normalizeCode(value){
    const text=String(value||'').toUpperCase().trim();
    const exact=text.match(/^([A-ZÅÄÖ]{1,8})\s*[- ]?\s*(\d{1,4}[A-Z]?)$/);
    if(exact)return exact[1]+exact[2];
    const embedded=text.match(/\b([A-ZÅÄÖ]{1,8})\s*[- ]?\s*(\d{1,4}[A-Z]?)\b/);
    return embedded?embedded[1]+embedded[2]:'';
  }
  function codeRegex(code){
    const m=String(code||'').match(/^([A-ZÅÄÖ]+)(\d+[A-Z]?)$/);
    if(!m)return null;
    return new RegExp('\\b'+m[1]+'\\s*[- ]?\\s*'+m[2]+'\\b','i');
  }

  function rebuildProtocolMap(){
    protocolPages={};
    const codes=[...new Set(objects.map(o=>o.code))];
    codes.forEach(code=>{
      const rx=codeRegex(code);
      if(!rx)return;
      for(const [pageNo,text] of Object.entries(protocolPageTexts)){
        if(rx.test(text)){protocolPages[code]=Number(pageNo);break}
      }
    });
  }
  function objectProgress(o){
    const done=(o.checks||[]).filter(Boolean).length;
    return Math.round(done/CHECK_POINTS.length*100);
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
      const obj={...o,id,instance:counts[o.code],checks,progress:0};
      obj.progress=objectProgress(obj);
      return obj;
    });

    rebuildProtocolMap();
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
    drawingPdf=await pdfjsLib.getDocument({data:drawingBytes.slice()}).promise;
    currentPage=1;
    els.empty.hidden=true;
    await scanDrawing();
  }

  async function openProtocolFile(file){
    if(!file)return;
    protocolBytes=new Uint8Array(await file.arrayBuffer());
    els.protocolFileName.textContent=file.name;
    els.state.textContent='Öppnar dörrkorten…';
    protocolPdf=await pdfjsLib.getDocument({data:protocolBytes.slice()}).promise;
    await scanProtocolPdf();
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
      btn.addEventListener('click',()=>openProtocol(o.id));
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
        b.addEventListener('click',async()=>{await renderPage(o.page);focusObject(o.id);openProtocol(o.id)});
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
    requestAnimationFrame(()=>{
      const marker=els.markers.querySelector('[data-id="'+CSS.escape(id)+'"]');
      if(marker)marker.scrollIntoView({block:'center',inline:'center',behavior:'smooth'});
    });
  }

  async function openProtocol(id){
    const o=objects.find(x=>x.id===id);
    if(!o)return;
    selectedId=id;
    restoreView={page:currentPage,left:els.wrap.scrollLeft,top:els.wrap.scrollTop};
    const same=objects.filter(x=>x.code===o.code);
    els.protocolType.textContent='DÖRRKORT · '+o.code;
    els.protocolTitle.textContent=o.code+' · position '+o.instance;
    els.protocolPosition.textContent='Position '+o.instance+' av '+same.length+' · ritningssida '+o.page;
    els.drawingPage.textContent='Sida '+o.page;
    els.templateName.textContent=o.code;
    els.checks.innerHTML='';

    CHECK_POINTS.forEach((label,index)=>{
      const row=document.createElement('label');
      row.className='pfCheck';
      const cb=document.createElement('input');
      cb.type='checkbox';
      cb.checked=!!o.checks[index];
      cb.addEventListener('change',async()=>{
        o.checks[index]=cb.checked;
        o.progress=objectProgress(o);
        saveAll();updateProtocol(o);updateSummary();renderGroups();
        const page=await drawingPdf.getPage(currentPage);
        renderMarkers(page.getViewport({scale}));
      });
      const span=document.createElement('span');
      span.textContent=label;
      row.append(cb,span);
      els.checks.appendChild(row);
    });

    updateProtocol(o);
    if(typeof els.protocol.showModal==='function')els.protocol.showModal();else els.protocol.setAttribute('open','');
    await updateMatchedProtocol(o,true);
  }

  async function updateMatchedProtocol(o,forceRender=false){
    const p=protocolPages[o.code];
    els.matched.hidden=!p;
    els.protocolPreview.hidden=!p || !previewVisible;
    if(!p){
      els.doorCardStatus.textContent='Saknas';
      return;
    }
    els.doorCardStatus.textContent=o.code+' · sida '+p;
    els.matchedText.textContent=o.code+' är automatiskt kopplat till dörrkort sida '+p;
    els.showProtocolPage.dataset.page=String(p);
    els.showProtocolPage.textContent=previewVisible?'Dölj dörrkort':'Visa dörrkort';
    if(previewVisible && (forceRender || !els.protocolPreview.hidden))await renderProtocolPreview(p);
  }

  async function renderProtocolPreview(pageNo){
    if(!protocolPdf || !pageNo)return;
    const page=await protocolPdf.getPage(pageNo);
    const base=page.getViewport({scale:1});
    const target=Math.min(1.35,Math.max(.72,520/base.width));
    const viewport=page.getViewport({scale:target});
    els.protocolCanvas.width=Math.ceil(viewport.width);
    els.protocolCanvas.height=Math.ceil(viewport.height);
    els.protocolCanvas.style.width='100%';
    els.protocolCanvas.style.height='auto';
    await page.render({canvasContext:protocolCtx,viewport}).promise;
  }

  function updateProtocol(o){
    els.protocolPercent.textContent=o.progress+'%';
    els.protocolBar.style.width=o.progress+'%';
  }

  async function closeProtocol(restore=true){
    if(els.protocol.open)els.protocol.close();
    if(restore&&restoreView&&drawingPdf){
      if(currentPage!==restoreView.page)await renderPage(restoreView.page);
      requestAnimationFrame(()=>{
        els.wrap.scrollLeft=restoreView.left;
        els.wrap.scrollTop=restoreView.top;
        focusObject(selectedId);
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

  els.drawingFile.addEventListener('change',e=>openDrawing(e.target.files&&e.target.files[0]).catch(err=>{
    console.error(err);els.state.textContent='Kunde inte öppna ritningen: '+err.message;els.rescan.disabled=false;
  }));
  els.protocolFile.addEventListener('change',e=>openProtocolFile(e.target.files&&e.target.files[0]).catch(err=>{
    console.error(err);els.state.textContent='Kunde inte öppna dörrkorten: '+err.message;
  }));
  els.prev.addEventListener('click',()=>renderPage(currentPage-1));
  els.next.addEventListener('click',()=>renderPage(currentPage+1));
  els.zoomOut.addEventListener('click',()=>{scale=Math.max(.55,scale-.15);renderPage(currentPage)});
  els.zoomIn.addEventListener('click',()=>{scale=Math.min(2.8,scale+.15);renderPage(currentPage)});
  els.rescan.addEventListener('click',()=>scanDrawing().catch(err=>{
    console.error(err);els.state.textContent='Analysen misslyckades: '+err.message;els.rescan.disabled=false;
  }));
  els.closeProtocol.addEventListener('click',()=>closeProtocol(true));
  els.backToDrawing.addEventListener('click',()=>closeProtocol(true));
  els.showProtocolPage.addEventListener('click',async()=>{
    const o=objects.find(x=>x.id===selectedId);
    if(!o)return;
    previewVisible=!previewVisible;
    await updateMatchedProtocol(o,true);
  });
  els.focusCurrent.addEventListener('click',()=>drawingPdf&&renderPage(currentPage));

  let touchStartX=0,touchStartY=0;
  els.wrap.addEventListener('touchstart',e=>{
    if(e.touches.length===1){touchStartX=e.touches[0].clientX;touchStartY=e.touches[0].clientY}
  },{passive:true});
  els.wrap.addEventListener('touchend',e=>{
    if(!drawingPdf||!e.changedTouches.length)return;
    const dx=e.changedTouches[0].clientX-touchStartX,dy=e.changedTouches[0].clientY-touchStartY;
    if(Math.abs(dx)>90&&Math.abs(dx)>Math.abs(dy)*1.5){dx<0?renderPage(currentPage+1):renderPage(currentPage-1)}
  },{passive:true});
})();