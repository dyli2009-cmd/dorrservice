(()=>{
'use strict';
pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
const $=id=>document.getElementById(id);
let pdf=null,sourceBytes=null,fileName='ritning.pdf',page=1,keep=[],undo=[],renderTask=null,lastOutput=null;
const QUALITY={
 light:{maxPixels:3500000,maxSide:3200,jpeg:.78,label:'Lätt'},
 balanced:{maxPixels:7000000,maxSide:4200,jpeg:.86,label:'Balans'},
 clear:{maxPixels:12000000,maxSide:5200,jpeg:.91,label:'Tydlig'}
};
function message(text,error=false){$('toolMessage').textContent=text;$('toolMessage').classList.toggle('error',!!error)}
function formatBytes(n){if(!Number.isFinite(n))return'';if(n<1024*1024)return Math.max(1,Math.round(n/1024))+' KB';return(n/1024/1024).toFixed(1)+' MB'}
function cleanName(name){return String(name||'ritning.pdf').replace(/\.pdf$/i,'').replace(/[^a-zA-Z0-9åäöÅÄÖ_-]+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'')||'ritning'}
function keptPages(){return keep.map((v,i)=>v?i+1:null).filter(Boolean)}
function pushUndo(){undo.push(keep.slice());if(undo.length>20)undo.shift();$('undoPage').disabled=false}
function renderPageList(){
 const box=$('pageList');box.replaceChildren();
 keep.forEach((yes,i)=>{const b=document.createElement('button');b.type='button';b.textContent=i+1;b.className=(i+1===page?'active ':'')+(yes?'':'removed');b.onclick=()=>{page=i+1;renderPageList();renderPreview()};box.appendChild(b)});
 $('removePage').textContent=keep[page-1]?'Ta bort aktuell sida':'Återställ aktuell sida';
 $('pageInfo').textContent='Sida '+page+' / '+keep.length;
 $('pageState').textContent=keep[page-1]?'Tas med':'Tas bort';
 $('prevPage').disabled=page<=1;$('nextPage').disabled=page>=keep.length;
}
function previewScale(vp){const wrap=$('previewWrap'),maxW=Math.max(260,wrap.clientWidth-20),maxH=Math.max(330,Math.min(900,wrap.clientHeight||700)-20);return Math.max(.2,Math.min(1.6,maxW/vp.width,maxH/vp.height))}
async function whiteOutText(ctx,p,viewport){
 if(!$('removeText').checked)return;
 const text=await p.getTextContent();
 ctx.save();ctx.fillStyle='#fff';
 for(const item of text.items||[]){
  if(!item?.str?.trim())continue;
  const tx=pdfjsLib.Util.transform(viewport.transform,item.transform),fontH=Math.max(2,Math.hypot(tx[2],tx[3])),w=Math.max(2,(Number(item.width)||0)*viewport.scale),x=tx[4],y=tx[5]-fontH;
  const pad=Math.max(1,fontH*.1);ctx.fillRect(x-pad,y-pad,w+pad*2,fontH+pad*2);
 }
 ctx.restore();
}
async function renderPreview(){
 if(!pdf)return;
 if(renderTask)try{renderTask.cancel()}catch(_){}
 try{
  const p=await pdf.getPage(page),base=p.getViewport({scale:1}),scale=previewScale(base),dpr=Math.min(window.devicePixelRatio||1,2),vp=p.getViewport({scale:scale*dpr}),css=p.getViewport({scale}),cv=$('previewCanvas');
  cv.width=Math.ceil(vp.width);cv.height=Math.ceil(vp.height);cv.style.width=css.width+'px';cv.style.height=css.height+'px';
  const ctx=cv.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,cv.width,cv.height);
  renderTask=p.render({canvasContext:ctx,viewport:vp,annotationMode:$('removeAnnotations').checked?(pdfjsLib.AnnotationMode?.DISABLE??0):(pdfjsLib.AnnotationMode?.ENABLE??1)});
  await renderTask.promise;await whiteOutText(ctx,p,vp);
  if(!keep[page-1]){ctx.save();ctx.fillStyle='#ffffffcc';ctx.fillRect(0,0,cv.width,cv.height);ctx.fillStyle='#8c3035';ctx.font=Math.max(22,cv.width*.035)+'px sans-serif';ctx.textAlign='center';ctx.fillText('SIDAN TAS BORT',cv.width/2,cv.height/2);ctx.restore()}
 }catch(e){if(e?.name!=='RenderingCancelledException'){console.error(e);message('Kunde inte visa sidan.',true)}}
}
async function loadFile(file){
 if(!file)return;
 try{
  message('Laddar ritningen…');const bytes=new Uint8Array(await file.arrayBuffer()),candidate=await pdfjsLib.getDocument({data:bytes.slice()}).promise;await candidate.getPage(1);
  if(pdf)try{await pdf.destroy()}catch(_){}
  pdf=candidate;sourceBytes=bytes;fileName=file.name||'ritning.pdf';page=1;keep=Array(pdf.numPages).fill(true);undo=[];lastOutput=null;
  $('undoPage').disabled=true;$('workspace').hidden=false;$('outputActions').hidden=false;$('resultCard').hidden=true;renderPageList();await renderPreview();
  message('Ritningen är klar. '+pdf.numPages+' sidor · '+formatBytes(bytes.byteLength)+'. Originalfilen ändras inte.');
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
  const task=p.render({canvasContext:ctx,viewport:vp,annotationMode:$('removeAnnotations').checked?(pdfjsLib.AnnotationMode?.DISABLE??0):(pdfjsLib.AnnotationMode?.ENABLE??1)});await task.promise;await whiteOutText(ctx,p,vp);
  const blob=await new Promise((resolve,reject)=>cv.toBlob(b=>b?resolve(b):reject(new Error('Kunde inte skapa bild')),'image/jpeg',q.jpeg)),jpg=await out.embedJpg(await blob.arrayBuffer()),op=out.addPage([base.width,base.height]);op.drawImage(jpg,{x:0,y:0,width:base.width,height:base.height});cv.width=cv.height=1;
  message('Optimerar '+(n+1)+' / '+pages.length+' sidor…');
 }
 out.setTitle('Rensad arbetsritning');out.setCreator('Dörrservice Ritningsverktyg');out.setSubject('Optimerad arbetskopia. Originalfilen är oförändrad.');
 const bytes=await out.save(),name=cleanName(fileName)+'-rensad.pdf',blob=new Blob([bytes],{type:'application/pdf'});
 lastOutput={blob,name,bytes};$('resultCard').hidden=false;$('resultInfo').textContent=pages.length+' sidor · '+formatBytes(bytes.length)+' (original '+formatBytes(sourceBytes?.byteLength||0)+') · '+q.label;
 message('Arbetskopian är klar.');return lastOutput;
}
async function output(){return lastOutput||await buildOutput()}
$('toolFile').onchange=e=>{const f=e.target.files?.[0];loadFile(f);e.target.value=''};
$('prevPage').onclick=()=>{if(page>1){page--;renderPageList();renderPreview()}};
$('nextPage').onclick=()=>{if(page<keep.length){page++;renderPageList();renderPreview()}};
$('removePage').onclick=()=>{if(!pdf)return;if(keep[page-1]&&keptPages().length===1)return message('Du kan inte ta bort den sista sidan.',true);pushUndo();keep[page-1]=!keep[page-1];lastOutput=null;renderPageList();renderPreview();message(keep[page-1]?'Sidan återställd.':'Sidan tas inte med i arbetskopian.')};
$('undoPage').onclick=()=>{if(!undo.length)return;keep=undo.pop();$('undoPage').disabled=!undo.length;lastOutput=null;renderPageList();renderPreview();message('Senaste sidändringen ångrades.')};
$('removeText').onchange=()=>{lastOutput=null;renderPreview()};
$('removeAnnotations').onchange=()=>{lastOutput=null;renderPreview()};
$('quality').onchange=()=>{lastOutput=null;$('resultCard').hidden=true};
$('savePdf').onclick=async()=>{try{const r=await output();if(!r)return;const url=URL.createObjectURL(r.blob),a=document.createElement('a');a.href=url;a.download=r.name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000)}catch(e){console.error(e);message(e.message||'Kunde inte skapa PDF.',true)}};
async function openIn(target){
 try{const r=await output();if(!r)return;await window.DoorServiceDrawingTransfer.putPdf(r.blob,r.name);location.href=target+'?drawingTool=1'}catch(e){console.error(e);message('Kunde inte skicka arbetskopian vidare.',true)}
}
$('openDoor').onclick=()=>openIn('./');
$('openSecurity').onclick=()=>openIn('security.html');
window.addEventListener('resize',()=>{if(pdf)renderPreview()});
})();