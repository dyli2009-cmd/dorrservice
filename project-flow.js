(() => {
  'use strict';
  if (!window.pdfjsLib) {
    document.getElementById('pfState').textContent = 'PDF-biblioteket kunde inte laddas.';
    return;
  }
  pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

  const $ = id => document.getElementById(id);
  const els = {
    file:$('pfFile'), fileName:$('pfFileName'), state:$('pfState'), objectCount:$('pfObjectCount'),
    doneCount:$('pfDoneCount'), totalProgress:$('pfTotalProgress'), prev:$('pfPrev'), next:$('pfNext'),
    pageInfo:$('pfPageInfo'), zoomOut:$('pfZoomOut'), zoomIn:$('pfZoomIn'), prefixes:$('pfPrefixes'),
    rescan:$('pfRescan'), wrap:$('pfViewerWrap'), stage:$('pfStage'), canvas:$('pfCanvas'), markers:$('pfMarkers'),
    empty:$('pfEmpty'), groups:$('pfGroups'), focusCurrent:$('pfFocusCurrent'), protocol:$('pfProtocol'),
    protocolType:$('pfProtocolType'), protocolTitle:$('pfProtocolTitle'), protocolPosition:$('pfProtocolPosition'),
    protocolPercent:$('pfProtocolPercent'), protocolBar:$('pfProtocolBar'), instanceId:$('pfInstanceId'),
    pdfPosition:$('pfPdfPosition'), templateName:$('pfTemplateName'), checks:$('pfChecks'),
    closeProtocol:$('pfCloseProtocol'), backToDrawing:$('pfBackToDrawing'), matched:$('pfMatchedProtocol'),
    matchedText:$('pfMatchedProtocolText'), showProtocolPage:$('pfShowProtocolPage')
  };

  const ctx = els.canvas.getContext('2d');
  let pdf=null, bytes=null, fileKey='', currentPage=1, scale=1.15, objects=[], protocolPages={}, selectedId=null;
  let restoreView=null;
  const TEMPLATE_POINTS = [
    'Kontrollpunkt 1','Kontrollpunkt 2','Kontrollpunkt 3','Kontrollpunkt 4','Kontrollpunkt 5',
    'Kontrollpunkt 6','Kontrollpunkt 7','Kontrollpunkt 8','Kontrollpunkt 9','Kontrollpunkt 10'
  ];

  function hashText(text){
    let h=2166136261;
    for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619)}
    return (h>>>0).toString(36);
  }
  function storageKey(){return 'tillsyno-project-flow:'+fileKey}
  function loadSaved(){
    if(!fileKey)return {};
    try{return JSON.parse(localStorage.getItem(storageKey())||'{}')}catch(_){return {}}
  }
  function saveAll(){
    if(!fileKey)return;
    const payload={version:1,updatedAt:new Date().toISOString(),prefixes:els.prefixes.value,objects:{}};
    objects.forEach(o=>payload.objects[o.id]={checks:o.checks||[],progress:o.progress||0});
    try{localStorage.setItem(storageKey(),JSON.stringify(payload))}catch(_){}
  }
  function prefixRegex(){
    const parts=String(els.prefixes.value||'GS').toUpperCase().split(/[,; ]+/).map(x=>x.replace(/[^A-ZÅÄÖ0-9]/g,'')).filter(Boolean);
    const safe=(parts.length?parts:['GS']).map(x=>x.replace(/[.*+?^$()|[\]\\]/g,'\\$&'));
    return new RegExp('\\b(?:'+safe.join('|')+')\\s*[- ]?\\s*\\d{1,3}[A-Z]?\\b','gi');
  }
  function normalizeCode(code){return String(code||'').toUpperCase().replace(/[\s-]+/g,'')}
  function objectProgress(o){
    const arr=Array.isArray(o.checks)?o.checks:[];
    const done=arr.filter(Boolean).length;
    return Math.round(done/TEMPLATE_POINTS.length*100);
  }
  function isProtocolish(text){
    return /(PROTOKOLL|KONTROLLPUNKT|EGENKONTROLL|RISKBEDÖMNING|SERVICEPROTOKOLL|CHECKLISTA)/i.test(text||'');
  }

  async function scanPdf(){
    if(!pdf)return;
    els.state.textContent='Analyserar ritningen…';
    els.rescan.disabled=true;
    const regex=prefixRegex(), drawingCandidates=[], protocolMap={};
    for(let pageNo=1;pageNo<=pdf.numPages;pageNo++){
      els.state.textContent='Analyserar sida '+pageNo+' av '+pdf.numPages+'…';
      const page=await pdf.getPage(pageNo), viewport=page.getViewport({scale:1});
      const content=await page.getTextContent();
      const pageText=content.items.map(i=>i.str||'').join(' ');
      const matches=[];
      const addMatches=(raw,item)=>{
        regex.lastIndex=0;
        let m;
        while((m=regex.exec(String(raw||'')))){
          const code=normalizeCode(m[0]);
          const t=pdfjsLib.Util.transform(viewport.transform,item.transform);
          const x=Math.max(0,Math.min(1,t[4]/viewport.width));
          const y=Math.max(0,Math.min(1,t[5]/viewport.height));
          if(!matches.some(v=>v.code===code&&Math.abs(v.x-x)<0.015&&Math.abs(v.y-y)<0.015)) matches.push({code,x,y});
        }
      };
      content.items.forEach((item,index)=>{
        addMatches(item.str,item);
        const next=content.items[index+1];
        if(next){
          const a=pdfjsLib.Util.transform(viewport.transform,item.transform);
          const b=pdfjsLib.Util.transform(viewport.transform,next.transform);
          const sameLine=Math.abs(a[5]-b[5])<Math.max(8,Math.abs(a[0])*1.4);
          if(sameLine)addMatches(String(item.str||'')+' '+String(next.str||''),item);
        }
      });
      if(isProtocolish(pageText)){
        matches.forEach(m=>{if(!protocolMap[m.code])protocolMap[m.code]=pageNo});
      }else if(matches.length){
        matches.forEach(m=>drawingCandidates.push({page:pageNo,code:m.code,x:m.x,y:m.y}));
      }
    }

    const saved=loadSaved(), counts={};
    drawingCandidates.sort((a,b)=>a.page-b.page||a.y-b.y||a.x-b.x);
    objects=drawingCandidates.map((o,index)=>{
      counts[o.code]=(counts[o.code]||0)+1;
      const id=o.code+'@p'+o.page+'@'+Math.round(o.x*10000)+'x'+Math.round(o.y*10000);
      const old=saved.objects&&saved.objects[id]||{};
      const checks=Array.isArray(old.checks)?old.checks.slice(0,TEMPLATE_POINTS.length):Array(TEMPLATE_POINTS.length).fill(false);
      while(checks.length<TEMPLATE_POINTS.length)checks.push(false);
      return {...o,id,instance:counts[o.code],checks,progress:0};
    });
    objects.forEach(o=>o.progress=objectProgress(o));
    protocolPages=protocolMap;
    saveAll();
    renderGroups();
    updateSummary();
    await renderPage(currentPage);
    els.state.textContent=objects.length
      ? 'Hittade '+objects.length+' positioner. Tryck på en markering för att öppna dess instans.'
      : 'Inga märkningar hittades med prefixet '+els.prefixes.value+'.';
    els.rescan.disabled=false;
  }

  async function openFile(file){
    if(!file)return;
    bytes=new Uint8Array(await file.arrayBuffer());
    fileKey=hashText([file.name,file.size,file.lastModified].join('|'));
    els.fileName.textContent=file.name;
    els.state.textContent='Öppnar PDF…';
    pdf=await pdfjsLib.getDocument({data:bytes.slice()}).promise;
    currentPage=1;
    els.empty.hidden=true;
    const saved=loadSaved();
    if(saved.prefixes)els.prefixes.value=saved.prefixes;
    await scanPdf();
  }

  async function renderPage(pageNo){
    if(!pdf)return;
    currentPage=Math.max(1,Math.min(pdf.numPages,pageNo));
    const page=await pdf.getPage(currentPage);
    const viewport=page.getViewport({scale});
    els.canvas.width=Math.ceil(viewport.width);
    els.canvas.height=Math.ceil(viewport.height);
    els.canvas.style.width=viewport.width+'px';
    els.canvas.style.height=viewport.height+'px';
    els.stage.style.width=viewport.width+'px';
    els.stage.style.height=viewport.height+'px';
    await page.render({canvasContext:ctx,viewport}).promise;
    els.pageInfo.textContent=currentPage+' / '+pdf.numPages;
    renderMarkers(viewport.width,viewport.height);
    highlightCurrentGroup();
  }

  function renderMarkers(width,height){
    els.markers.innerHTML='';
    objects.filter(o=>o.page===currentPage).forEach(o=>{
      const btn=document.createElement('button');
      btn.type='button';btn.className='pfMarker';btn.dataset.id=o.id;btn.dataset.progress=String(o.progress);
      btn.style.left=(o.x*width)+'px';btn.style.top=(o.y*height)+'px';
      const angle=Math.max(0,Math.min(360,o.progress*3.6));
      btn.style.setProperty('--marker-angle',angle+'deg');
      btn.style.setProperty('--marker-fill',o.progress===100?'#238354':'#116a99');
      btn.innerHTML='<span class="pfMarkerDot"></span><span class="pfMarkerPct">'+o.progress+'%</span><span class="pfMarkerLabel">'+o.code+' · '+o.instance+'</span>';
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
    if(!objects.length){els.groups.innerHTML='<p class="pfMuted">Inga objekt hittades.</p>';return}
    els.groups.innerHTML='';
    groupData().forEach(([code,list])=>{
      const box=document.createElement('section');box.className='pfGroup';box.dataset.code=code;
      const avg=Math.round(list.reduce((s,o)=>s+o.progress,0)/list.length);
      const head=document.createElement('button');head.type='button';
      head.innerHTML='<b>'+code+'</b><span>'+list.length+' positioner · '+avg+'%</span>';
      box.appendChild(head);
      const items=document.createElement('div');items.className='pfGroupItems';
      list.forEach(o=>{
        const b=document.createElement('button');b.type='button';b.className='pfGroupItem';
        b.innerHTML='<span><strong>Position '+o.instance+'</strong><small>Sida '+o.page+'</small></span><b>'+o.progress+'%</b>';
        b.addEventListener('click',async()=>{await renderPage(o.page);focusObject(o.id);openProtocol(o.id)});
        items.appendChild(b);
      });
      box.appendChild(items);els.groups.appendChild(box);
    });
    highlightCurrentGroup();
  }
  function highlightCurrentGroup(){
    els.groups.querySelectorAll('.pfGroupItem').forEach(x=>x.style.background='');
  }
  function focusObject(id){
    requestAnimationFrame(()=>{
      const marker=els.markers.querySelector('[data-id="'+CSS.escape(id)+'"]');
      if(marker) marker.scrollIntoView({block:'center',inline:'center',behavior:'smooth'});
    });
  }

  function openProtocol(id){
    const o=objects.find(x=>x.id===id);if(!o)return;
    selectedId=id;
    restoreView={page:currentPage,left:els.wrap.scrollLeft,top:els.wrap.scrollTop};
    const same=objects.filter(x=>x.code===o.code);
    els.protocolType.textContent=o.code+' · PROTOKOLLINSTANS';
    els.protocolTitle.textContent=o.code+' · position '+o.instance;
    els.protocolPosition.textContent='Position '+o.instance+' av '+same.length+' · ritningssida '+o.page;
    els.instanceId.textContent=o.id;
    els.pdfPosition.textContent='Sida '+o.page+' · '+Math.round(o.x*100)+'% / '+Math.round(o.y*100)+'%';
    els.templateName.textContent=o.code;
    els.checks.innerHTML='';
    TEMPLATE_POINTS.forEach((label,index)=>{
      const row=document.createElement('label');row.className='pfCheck';
      const cb=document.createElement('input');cb.type='checkbox';cb.checked=!!o.checks[index];
      cb.addEventListener('change',()=>{o.checks[index]=cb.checked;o.progress=objectProgress(o);saveAll();updateProtocol(o);updateSummary();renderGroups();renderMarkers(els.canvas.width,els.canvas.height)});
      const span=document.createElement('span');span.textContent=label;
      row.append(cb,span);els.checks.appendChild(row);
    });
    const p=protocolPages[o.code];
    els.matched.hidden=!p;
    if(p){els.matchedText.textContent=o.code+' hittades på protokollsida '+p;els.showProtocolPage.dataset.page=String(p)}
    updateProtocol(o);
    if(typeof els.protocol.showModal==='function')els.protocol.showModal();else els.protocol.setAttribute('open','');
  }

  function updateProtocol(o){
    els.protocolPercent.textContent=o.progress+'%';
    els.protocolBar.style.width=o.progress+'%';
  }
  async function closeProtocol(restore=true){
    if(els.protocol.open)els.protocol.close();
    if(restore&&restoreView&&pdf){
      if(currentPage!==restoreView.page)await renderPage(restoreView.page);
      requestAnimationFrame(()=>{els.wrap.scrollLeft=restoreView.left;els.wrap.scrollTop=restoreView.top;focusObject(selectedId)});
    }
  }
  function updateSummary(){
    els.objectCount.textContent=objects.length;
    const done=objects.filter(o=>o.progress===100).length;
    els.doneCount.textContent=done;
    const avg=objects.length?Math.round(objects.reduce((s,o)=>s+o.progress,0)/objects.length):0;
    els.totalProgress.textContent=avg+'%';
  }

  els.file.addEventListener('change',e=>openFile(e.target.files&&e.target.files[0]).catch(err=>{console.error(err);els.state.textContent='Kunde inte öppna PDF: '+err.message}));
  els.prev.addEventListener('click',()=>renderPage(currentPage-1));
  els.next.addEventListener('click',()=>renderPage(currentPage+1));
  els.zoomOut.addEventListener('click',()=>{scale=Math.max(.65,scale-.15);renderPage(currentPage)});
  els.zoomIn.addEventListener('click',()=>{scale=Math.min(2.5,scale+.15);renderPage(currentPage)});
  els.rescan.addEventListener('click',()=>scanPdf().catch(err=>{console.error(err);els.state.textContent='Analysen misslyckades: '+err.message;els.rescan.disabled=false}));
  els.closeProtocol.addEventListener('click',()=>closeProtocol(true));
  els.backToDrawing.addEventListener('click',()=>closeProtocol(true));
  els.showProtocolPage.addEventListener('click',async()=>{const page=Number(els.showProtocolPage.dataset.page||0);await closeProtocol(false);if(page)await renderPage(page)});
  els.focusCurrent.addEventListener('click',()=>renderPage(currentPage));

  let touchStartX=0,touchStartY=0;
  els.wrap.addEventListener('touchstart',e=>{if(e.touches.length===1){touchStartX=e.touches[0].clientX;touchStartY=e.touches[0].clientY}},{passive:true});
  els.wrap.addEventListener('touchend',e=>{
    if(!pdf||!e.changedTouches.length)return;
    const dx=e.changedTouches[0].clientX-touchStartX,dy=e.changedTouches[0].clientY-touchStartY;
    if(Math.abs(dx)>90&&Math.abs(dx)>Math.abs(dy)*1.5){dx<0?renderPage(currentPage+1):renderPage(currentPage-1)}
  },{passive:true});
})();