(()=>{
'use strict';
pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
const $=id=>document.getElementById(id);
let pdf=null,sourceBytes=null,fileName='ritning.pdf',page=1,keep=[],undo=[],renderTask=null,lastOutput=null,uploadedSize=0,drawingSourceSize=0;
let manualMasks={},eraseActive=false,dragStart=null;
let selectPagesMode=false,selectedPages=new Set(),workSourceKind='';
const QUALITY={
 light:{maxPixels:3500000,maxSide:3200,jpeg:.78,label:'Lätt'},
 balanced:{maxPixels:7000000,maxSide:4200,jpeg:.86,label:'Balans'},
 clear:{maxPixels:12000000,maxSide:5200,jpeg:.91,label:'Tydlig'}
};
function message(text,error=false){$('toolMessage').textContent=text;$('toolMessage').classList.toggle('error',!!error)}
function formatBytes(n){if(!Number.isFinite(n))return'';if(n<1024)return Math.max(1,Math.round(n))+' B';if(n<1024*1024)return Math.max(1,Math.round(n/1024))+' KB';return(n/1024/1024).toFixed(2)+' MB'}
function sizeVerdict(reduction){
 if(reduction>=.5)return'Stor förbättring';
 if(reduction>=.2)return'Bra minskning';
 if(reduction>=.05)return'Liten minskning';
 if(reduction>-.05)return'Nästan oförändrad';
 return'Filen blev större';
}
function updateSizeComparison(outputSize=null,q=null){
 if(!uploadedSize)return;
 $('sizeCompare').hidden=false;$('sizeOriginal').textContent=formatBytes(uploadedSize);
 if(!Number.isFinite(outputSize)){
  $('sizeNew').textContent='–';$('sizeSaved').textContent='–';$('sizePercent').textContent='–';$('sizeVerdict').textContent='Räkna om';
  $('sizeCompare').dataset.state='dirty';
  $('sizeDetail').textContent=(workSourceKind?('Originalritningen i '+workSourceKind+'-filen är '+formatBytes(drawingSourceSize)+'. '):'')+'Tryck “Testa optimering” för att mäta den nya filen med nuvarande inställningar.';
  return;
 }
 const diff=uploadedSize-outputSize,reduction=diff/uploadedSize,percent=Math.round(reduction*100),verdict=sizeVerdict(reduction);
 $('sizeNew').textContent=formatBytes(outputSize);$('sizeSaved').textContent=(diff>=0?'−':'+')+formatBytes(Math.abs(diff));$('sizePercent').textContent=(percent>0?'−':percent<0?'+':'')+Math.abs(percent)+' %';$('sizeVerdict').textContent=verdict;$('sizeCompare').dataset.state=reduction<0?'worse':reduction>=.2?'good':'neutral';
 $('sizeDetail').textContent='Mätt på '+keptPages().length+' sidor · kvalitet '+(q?.label||'–')+'.'+(workSourceKind?' Jämförelsen är mot hela den uppladdade arbets-PDF-filen.':'');
}
function cleanName(name){return String(name||'ritning.pdf').replace(/\.pdf$/i,'').replace(/[^a-zA-Z0-9åäöÅÄÖ_-]+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'')||'ritning'}
function keptPages(){return keep.map((v,i)=>v?i+1:null).filter(Boolean)}
function pushUndo(){undo.push(keep.slice());if(undo.length>20)undo.shift();$('undoPage').disabled=false}
async function inspectKnownWorkPdf(bytes){
 if(!window.PDFLib)return null;
 const {PDFDocument,PDFName,PDFDict,PDFRawStream,decodePDFRawStream}=PDFLib;
 try{
  const doc=await PDFDocument.load(bytes,{updateMetadata:false,ignoreEncryption:true});
  for(const spec of [
   {name:'DorrserviceWork',kind:'Dörrautomatik'},
   {name:'SecurityServiceWork',kind:'Säkerhetsservice'}
  ]){
   const ref=doc.catalog.get(PDFName.of(spec.name));if(!ref)continue;
   const metadata=doc.context.lookup(ref);if(!(metadata instanceof PDFDict))continue;
   const drawing=metadata.lookup(PDFName.of('Drawing'),PDFRawStream);if(!drawing)continue;
   const drawingBytes=decodePDFRawStream(drawing).decode().slice();
   const original=await PDFDocument.load(drawingBytes,{updateMetadata:false,ignoreEncryption:true});
   if(!original.getPageCount())continue;
   return {drawingBytes,kind:spec.kind,pageCount:original.getPageCount()};
  }
 }catch(error){console.warn('Djup PDF-kontroll kunde inte läsa arbetsdata',error)}
 return null;
}
function masksFor(pageNo){return manualMasks[pageNo]||(manualMasks[pageNo]=[])}
function updateEraseButtons(){
 const count=(manualMasks[page]||[]).length;
 $('undoErase').disabled=!count;$('clearErases').disabled=!count;
 $('eraseMode').classList.toggle('active',eraseActive);
 $('eraseMode').setAttribute('aria-pressed',String(eraseActive));
 $('eraseMode').textContent=eraseActive?'Radera område: PÅ':'Radera område';
 $('previewWrap').classList.toggle('eraseMode',eraseActive);
}
function updateBulkControls(){
 $('selectPages').classList.toggle('active',selectPagesMode);
 $('selectPages').setAttribute('aria-pressed',String(selectPagesMode));
 $('selectPages').textContent=selectPagesMode?'Välj flera sidor: PÅ':'Välj flera sidor';
 $('bulkPageActions').hidden=!selectPagesMode;
}
function renderPageList(){
 const box=$('pageList');box.replaceChildren();
 keep.forEach((yes,i)=>{
  const no=i+1,b=document.createElement('button');b.type='button';b.textContent=no;
  b.className=(no===page?'active ':'')+(yes?'':'removed')+(selectedPages.has(no)?' selected':'');
  b.onclick=()=>{
   if(selectPagesMode){
    selectedPages.has(no)?selectedPages.delete(no):selectedPages.add(no);
    renderPageList();return;
   }
   page=no;renderPageList();updateEraseButtons();renderPreview()
  };
  box.appendChild(b)
 });
 $('removePage').textContent=keep[page-1]?'Ta bort aktuell sida':'Återställ aktuell sida';
 $('pageInfo').textContent='Sida '+page+' / '+keep.length;
 const mc=(manualMasks[page]||[]).length;$('pageState').textContent=(keep[page-1]?'Tas med':'Tas bort')+(mc?' · '+mc+' manuella raderingar':'')+(selectPagesMode&&selectedPages.size?' · '+selectedPages.size+' valda':'');
 $('prevPage').disabled=page<=1;$('nextPage').disabled=page>=keep.length;
 updateBulkControls();
}
function previewScale(vp){const wrap=$('previewWrap'),maxW=Math.max(260,wrap.clientWidth-20),maxH=Math.max(330,Math.min(900,wrap.clientHeight||700)-20);return Math.max(.2,Math.min(1.6,maxW/vp.width,maxH/vp.height))}
function stripColoredMarks(ctx,w,h){
 if(!$('removeColors').checked)return;
 const img=ctx.getImageData(0,0,w,h),d=img.data;
 for(let i=0;i<d.length;i+=4){
  const r=d[i],g=d[i+1],b=d[i+2],max=Math.max(r,g,b),min=Math.min(r,g,b),chroma=max-min;
  if(chroma>24&&min<238){d[i]=255;d[i+1]=255;d[i+2]=255}
 }
 ctx.putImageData(img,0,0);
}
async function whiteOutText(ctx,p,viewport){
 if(!$('removeText').checked)return;
 const text=await p.getTextContent();
 ctx.save();ctx.fillStyle='#fff';
 for(const item of text.items||[]){
  if(!item?.str?.trim())continue;
  const tx=pdfjsLib.Util.transform(viewport.transform,item.transform),baseX=tx[4],baseY=tx[5];
  let ux=tx[0],uy=tx[1],uLen=Math.hypot(ux,uy);if(uLen<.001){ux=1;uy=0;uLen=1}else{ux/=uLen;uy/=uLen}
  const nx=-uy,ny=ux,w=Math.max(3,(Number(item.width)||0)*viewport.scale),h=Math.max(3,Math.hypot(tx[2],tx[3]),uLen*.8),pad=Math.max(2,h*.2),halfH=h*.72+pad;
  const ax=baseX-ux*pad-nx*halfH,ay=baseY-uy*pad-ny*halfH,bx=baseX+ux*(w+pad)-nx*halfH,by=baseY+uy*(w+pad)-ny*halfH,cx=baseX+ux*(w+pad)+nx*halfH,cy=baseY+uy*(w+pad)+ny*halfH,dx=baseX-ux*pad+nx*halfH,dy=baseY-uy*pad+ny*halfH;
  ctx.beginPath();ctx.moveTo(ax,ay);ctx.lineTo(bx,by);ctx.lineTo(cx,cy);ctx.lineTo(dx,dy);ctx.closePath();ctx.fill();
 }
 ctx.restore();
}
function applyManualMasks(ctx,pageNo){
 const masks=manualMasks[pageNo]||[];if(!masks.length)return;
 ctx.save();ctx.fillStyle='#fff';
 for(const m of masks)ctx.fillRect(m.x*ctx.canvas.width,m.y*ctx.canvas.height,m.w*ctx.canvas.width,m.h*ctx.canvas.height);
 ctx.restore();
}
async function cleanCanvas(ctx,p,viewport,pageNo){
 stripColoredMarks(ctx,ctx.canvas.width,ctx.canvas.height);
 await whiteOutText(ctx,p,viewport);
 applyManualMasks(ctx,pageNo);
}
async function renderPreview(){
 if(!pdf)return;
 if(renderTask)try{renderTask.cancel()}catch(_){}
 try{
  const p=await pdf.getPage(page),base=p.getViewport({scale:1}),scale=previewScale(base),dpr=Math.min(window.devicePixelRatio||1,2),vp=p.getViewport({scale:scale*dpr}),css=p.getViewport({scale}),cv=$('previewCanvas');
  cv.width=Math.ceil(vp.width);cv.height=Math.ceil(vp.height);cv.style.width=css.width+'px';cv.style.height=css.height+'px';
  const stage=$('canvasStage');stage.style.width=css.width+'px';stage.style.height=css.height+'px';
  const ctx=cv.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,cv.width,cv.height);
  renderTask=p.render({canvasContext:ctx,viewport:vp,annotationMode:$('removeAnnotations').checked?(pdfjsLib.AnnotationMode?.DISABLE??0):(pdfjsLib.AnnotationMode?.ENABLE??1)});
  await renderTask.promise;await cleanCanvas(ctx,p,vp,page);
  if(!keep[page-1]){ctx.save();ctx.fillStyle='#ffffffcc';ctx.fillRect(0,0,cv.width,cv.height);ctx.fillStyle='#8c3035';ctx.font=Math.max(22,cv.width*.035)+'px sans-serif';ctx.textAlign='center';ctx.fillText('SIDAN TAS BORT',cv.width/2,cv.height/2);ctx.restore()}
  renderPageList();updateEraseButtons();
 }catch(e){if(e?.name!=='RenderingCancelledException'){console.error(e);message('Kunde inte visa sidan.',true)}}
}
async function loadFile(file){
 if(!file)return;
 try{
  message('Läser PDF-strukturen…');
  const uploadedBytes=new Uint8Array(await file.arrayBuffer()),embedded=await inspectKnownWorkPdf(uploadedBytes),drawingBytes=embedded?.drawingBytes||uploadedBytes,candidate=await pdfjsLib.getDocument({data:drawingBytes.slice()}).promise;await candidate.getPage(1);
  if(pdf)try{await pdf.destroy()}catch(_){}
  pdf=candidate;sourceBytes=drawingBytes;uploadedSize=uploadedBytes.byteLength;drawingSourceSize=drawingBytes.byteLength;fileName=file.name||'ritning.pdf';workSourceKind=embedded?.kind||'';page=1;keep=Array(pdf.numPages).fill(true);undo=[];manualMasks={};eraseActive=false;dragStart=null;selectPagesMode=false;selectedPages=new Set();lastOutput=null;
  $('undoPage').disabled=true;$('workspace').hidden=false;$('outputActions').hidden=false;$('resultCard').hidden=true;
  if(embedded){
   $('deepCleanInfo').hidden=false;$('deepCleanTitle').textContent=embedded.kind+' arbets-PDF upptäckt';
   $('deepCleanText').textContent='Originalritningen har plockats ut direkt ur filen. Gamla servicepilar, etiketter, protokollsidor och inbäddad arbetsdata används inte i den nya ritningen.';
  }else{
   $('deepCleanInfo').hidden=false;$('deepCleanTitle').textContent='Vanlig PDF';
   $('deepCleanText').textContent='Den nya arbetskopian byggs om från synligt ritningsinnehåll. JavaScript, formulär, länkar, actions, bilagor och annan interaktiv PDF-data följer inte med.';
  }
  renderPageList();updateEraseButtons();updateSizeComparison();await renderPreview();
  message((embedded?'Originalritningen hittades och återställdes. ':'Ritningen är klar. ')+pdf.numPages+' sidor · '+formatBytes(uploadedBytes.byteLength)+'. Originalfilen ändras inte.');
 }catch(e){console.error(e);message('Kunde inte öppna PDF-filen.',true)}
}
function rasterScale(base,q){
 const byPixels=Math.sqrt(q.maxPixels/Math.max(1,base.width*base.height)),bySide=q.maxSide/Math.max(base.width,base.height);
 return Math.max(.65,Math.min(3,byPixels,bySide));
}
async function buildOutput(){
 if(!pdf)return null;const pages=keptPages();if(!pages.length){message('Minst en sida måste vara kvar.',true);return null}
 const q=QUALITY[$('quality').value]||QUALITY.balanced,{PDFDocument}=PDFLib,out=await PDFDocument.create();
 message('Optimerar 0 / '+pages.length+' sidor…');
 for(let n=0;n<pages.length;n++){
  const pageNo=pages[n],p=await pdf.getPage(pageNo),base=p.getViewport({scale:1}),scale=rasterScale(base,q),vp=p.getViewport({scale}),cv=document.createElement('canvas');cv.width=Math.ceil(vp.width);cv.height=Math.ceil(vp.height);
  const ctx=cv.getContext('2d',{alpha:false});ctx.fillStyle='#fff';ctx.fillRect(0,0,cv.width,cv.height);
  const task=p.render({canvasContext:ctx,viewport:vp,annotationMode:$('removeAnnotations').checked?(pdfjsLib.AnnotationMode?.DISABLE??0):(pdfjsLib.AnnotationMode?.ENABLE??1)});await task.promise;await cleanCanvas(ctx,p,vp,pageNo);
  const blob=await new Promise((resolve,reject)=>cv.toBlob(b=>b?resolve(b):reject(new Error('Kunde inte skapa bild')),'image/jpeg',q.jpeg)),jpg=await out.embedJpg(await blob.arrayBuffer()),op=out.addPage([base.width,base.height]);op.drawImage(jpg,{x:0,y:0,width:base.width,height:base.height});cv.width=cv.height=1;
  message('Optimerar '+(n+1)+' / '+pages.length+' sidor…');
 }
 out.setTitle('Rensad arbetsritning');out.setCreator('Dörrservice Ritningsverktyg');out.setSubject('Optimerad arbetskopia. Originalfilen är oförändrad.');
 const bytes=await out.save(),name=cleanName(fileName)+'-rensad.pdf',blob=new Blob([bytes],{type:'application/pdf'});
 lastOutput={blob,name,bytes};$('resultCard').hidden=false;$('resultInfo').textContent=pages.length+' sidor · '+formatBytes(bytes.length)+' · '+q.label;updateSizeComparison(bytes.length,q);
 message('Arbetskopian är klar.');return lastOutput;
}
async function output(){return lastOutput||await buildOutput()}
function invalidate(){lastOutput=null;$('resultCard').hidden=true;updateSizeComparison()}
function pointerPos(e){
 const cv=$('previewCanvas'),r=cv.getBoundingClientRect();return{x:Math.max(0,Math.min(r.width,e.clientX-r.left)),y:Math.max(0,Math.min(r.height,e.clientY-r.top)),w:r.width,h:r.height}
}
function showDragBox(a,b){
 const box=$('eraseBox'),x=Math.min(a.x,b.x),y=Math.min(a.y,b.y),w=Math.abs(a.x-b.x),h=Math.abs(a.y-b.y);
 box.hidden=false;box.style.left=x+'px';box.style.top=y+'px';box.style.width=w+'px';box.style.height=h+'px';
}
function finishDrag(e){
 if(!dragStart)return;const end=pointerPos(e),start=dragStart;dragStart=null;$('eraseBox').hidden=true;
 const x=Math.min(start.x,end.x),y=Math.min(start.y,end.y),w=Math.abs(start.x-end.x),h=Math.abs(start.y-end.y);
 if(w<5||h<5)return;
 masksFor(page).push({x:x/end.w,y:y/end.h,w:w/end.w,h:h/end.h});invalidate();renderPreview();message('Området är raderat på sida '+page+'.');
}
$('toolFile').onchange=e=>{const f=e.target.files?.[0];loadFile(f);e.target.value=''};
$('prevPage').onclick=()=>{if(page>1){page--;renderPageList();updateEraseButtons();renderPreview()}};
$('nextPage').onclick=()=>{if(page<keep.length){page++;renderPageList();updateEraseButtons();renderPreview()}};
$('removePage').onclick=()=>{if(!pdf)return;if(keep[page-1]&&keptPages().length===1)return message('Du kan inte ta bort den sista sidan.',true);pushUndo();keep[page-1]=!keep[page-1];invalidate();renderPageList();renderPreview();message(keep[page-1]?'Sidan återställd.':'Sidan tas inte med i arbetskopian.')};
$('selectPages').onclick=()=>{selectPagesMode=!selectPagesMode;if(!selectPagesMode)selectedPages.clear();renderPageList();message(selectPagesMode?'Klicka på alla sidor du vill välja. Tryck sedan “Ta bort valda”.':'Flervalsläget är avstängt.')};
$('selectAllPages').onclick=()=>{selectedPages=new Set(keep.map((_,i)=>i+1));renderPageList()};
$('clearPageSelection').onclick=()=>{selectedPages.clear();renderPageList()};
$('removeSelectedPages').onclick=()=>{
 if(!selectedPages.size)return message('Välj först vilka sidor som ska tas bort.',true);
 const currentlyKept=keptPages(),toRemove=currentlyKept.filter(n=>selectedPages.has(n));
 if(currentlyKept.length-toRemove.length<1)return message('Du måste lämna minst en sida kvar.',true);
 pushUndo();toRemove.forEach(n=>keep[n-1]=false);selectedPages.clear();selectPagesMode=false;invalidate();renderPageList();renderPreview();message(toRemove.length+' sidor tas bort från arbetskopian.');
};
$('undoPage').onclick=()=>{if(!undo.length)return;keep=undo.pop();$('undoPage').disabled=!undo.length;invalidate();renderPageList();renderPreview();message('Senaste sidändringen ångrades.')};
$('removeText').onchange=()=>{invalidate();renderPreview()};
$('removeAnnotations').onchange=()=>{invalidate();renderPreview()};
$('removeColors').onchange=()=>{invalidate();renderPreview()};
$('quality').onchange=()=>invalidate();
$('aggressiveClean').onclick=()=>{$('removeText').checked=true;$('removeAnnotations').checked=true;$('removeColors').checked=true;invalidate();renderPreview();message('Aggressiv rensning är på. Kontrollera förhandsvisningen innan du sparar.')};
$('eraseMode').onclick=()=>{eraseActive=!eraseActive;dragStart=null;$('eraseBox').hidden=true;updateEraseButtons();message(eraseActive?'Dra en ruta direkt över det du vill ta bort.':'Manuell radering avstängd.')};
$('undoErase').onclick=()=>{const masks=masksFor(page);if(!masks.length)return;masks.pop();invalidate();updateEraseButtons();renderPreview();message('Senaste manuella raderingen ångrades.')};
$('clearErases').onclick=()=>{if(!masksFor(page).length)return;manualMasks[page]=[];invalidate();updateEraseButtons();renderPreview();message('Manuella raderingar på sida '+page+' är borttagna.')};
const cv=$('previewCanvas');
cv.addEventListener('pointerdown',e=>{if(!eraseActive||!pdf)return;e.preventDefault();cv.setPointerCapture?.(e.pointerId);dragStart=pointerPos(e);showDragBox(dragStart,dragStart)});
cv.addEventListener('pointermove',e=>{if(!eraseActive||!dragStart)return;e.preventDefault();showDragBox(dragStart,pointerPos(e))});
cv.addEventListener('pointerup',e=>{if(!eraseActive||!dragStart)return;e.preventDefault();finishDrag(e)});
cv.addEventListener('pointercancel',()=>{dragStart=null;$('eraseBox').hidden=true});
$('analyzeSize').onclick=async()=>{try{$('analyzeSize').disabled=true;await buildOutput()}catch(e){console.error(e);message(e.message||'Kunde inte mäta filstorleken.',true)}finally{$('analyzeSize').disabled=false}};
$('savePdf').onclick=async()=>{try{const r=await output();if(!r)return;const url=URL.createObjectURL(r.blob),a=document.createElement('a');a.href=url;a.download=r.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000)}catch(e){console.error(e);message(e.message||'Kunde inte skapa PDF.',true)}};
async function openIn(target){
 try{const r=await output();if(!r)return;await window.DoorServiceDrawingTransfer.putPdf(r.blob,r.name);location.href=target+'?drawingTool=1'}catch(e){console.error(e);message('Kunde inte skicka arbetskopian vidare.',true)}
}
$('openDoor').onclick=()=>openIn('./');
$('openSecurity').onclick=()=>openIn('security.html');
window.addEventListener('resize',()=>{if(pdf)renderPreview()});
})();