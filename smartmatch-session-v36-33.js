/* SmartMatch TEST v36.33 – local PDF resume across full browser reload.
   PDF bytes stay in IndexedDB on the user's device; never sent to a server. */
(()=>{
 'use strict';
 const app=window.SmartMatchAppBridge;
 if(!app)return;
 const sessionFile='smartmatch-active-pdf-session:v1',sessionView='smartmatch-active-view-session:v1';
 const dbName='smartmatch-local-pdf-resume';
 function dbOpen(){
  return new Promise((resolve,reject)=>{
   if(!window.indexedDB){reject(new Error('IndexedDB är inte tillgängligt'));return}
   const r=indexedDB.open(dbName,2);
   r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains('files'))r.result.createObjectStore('files',{keyPath:'id'});if(!r.result.objectStoreNames.contains('drafts'))r.result.createObjectStore('drafts',{keyPath:'id'})};
   r.onsuccess=()=>resolve(r.result);
   r.onerror=()=>reject(r.error||new Error('Lokal fillagring kunde inte öppnas'));
   r.onblocked=()=>reject(new Error('Lokal fillagring är blockerad'));
  });
 }
 async function writeFile(){
  const bytes=app.getOriginalPdfBytes?.(),view=app.getLocalView?.();
  if(!bytes?.length||!view?.fileKey)return false;
  const db=await dbOpen();
  try{
   await new Promise((ok,fail)=>{
    const tx=db.transaction('files','readwrite');
    tx.objectStore('files').put({id:'active',hash:view.fileKey,
     name:document.getElementById('pwFileName')?.title||'Projekt.pdf',
     blob:new Blob([bytes],{type:'application/pdf'})});
    tx.oncomplete=ok;tx.onerror=()=>fail(tx.error||new Error('PDF kunde inte sparas'));
    tx.onabort=()=>fail(tx.error||new Error('PDF-lagring avbruten'));
   });
  }finally{db.close()}
  try{sessionStorage.setItem(sessionFile,view.fileKey)}catch(_){return false}
  return true;
 }
 async function readFile(){
  const db=await dbOpen();
  try{return await new Promise((ok,fail)=>{
   const tx=db.transaction('files','readonly'),r=tx.objectStore('files').get('active');
   r.onsuccess=()=>ok(r.result||null);
   r.onerror=()=>fail(r.error||new Error('PDF kan inte läsas'));
   tx.onabort=()=>fail(tx.error||new Error('PDF läsning avbruten'));
  })}finally{db.close()}
 }
 // PDF is authoritative. This independent draft is recovered only with user confirmation.
 let pendingDraft=null,draftTimer=null,draftChain=Promise.resolve();
 function reportStatus(message,state='local'){
  const element=document.getElementById('pwDraftStatus');if(!element)return;
  element.hidden=!message;element.textContent=message||'';element.dataset.state=state;
 }
 async function draftTransaction(mode,operation){
  const db=await dbOpen();
  try{
   return await new Promise((resolve,reject)=>{
    const tx=db.transaction('drafts',mode),request=operation(tx.objectStore('drafts'));
    let value=null;
    if(request){request.onsuccess=()=>{value=request.result};request.onerror=()=>reject(request.error||new Error('Lokalt utkast kunde inte läsas'))}
    tx.oncomplete=()=>resolve(value);
    tx.onerror=()=>reject(tx.error||new Error('Lokal sparning misslyckades'));
    tx.onabort=()=>reject(tx.error||new Error('Lokal sparning avbröts'));
   });
  }finally{db.close()}
 }
 async function writePendingDraft(){
  if(draftTimer){clearTimeout(draftTimer);draftTimer=null}
  if(!pendingDraft)return draftChain;
  const current=pendingDraft;pendingDraft=null;
  const task=draftChain.then(()=>draftTransaction('readwrite',store=>store.put(current)));
  draftChain=task.catch(()=>{});
  try{
   await task;
   if(!pendingDraft)reportStatus('✓ Arbete sparat på enheten · spara PDF för delning.','local');
  }catch(err){
   console.error('[SmartMatch] Autosparning misslyckades',err);
   reportStatus('Autosparning misslyckades – spara projekt-PDF nu.','error');
  }
  if(pendingDraft)return writePendingDraft();
  return true;
 }
 function queueDraft({hash,baseRevision,payload}){
  if(!hash||!payload)return;
  pendingDraft={id:hash,baseRevision:Number(baseRevision)||0,payload,updatedAt:Date.now()};
  reportStatus('Sparar arbete lokalt…','local');
  if(draftTimer)clearTimeout(draftTimer);
  draftTimer=setTimeout(()=>{void writePendingDraft()},700);
 }
 async function offerDraftRestore(hash,baseRevision){
  if(!hash)return null;
  await writePendingDraft();
  let candidate;
  try{candidate=await draftTransaction('readonly',store=>store.get(hash))}
  catch(err){console.warn('[SmartMatch] Lokalt arbetsutkast kan inte läsas',err);return null}
  if(!candidate?.payload||candidate.id!==hash||Number(candidate.baseRevision)!==(Number(baseRevision)||0))return null;
  const time=new Date(candidate.updatedAt||Date.now()).toLocaleString('sv-SE');
  return window.confirm('Lokalt autosparat arbete hittades ('+time+'). Detta är ändringar som kan saknas i PDF-filen. Återställ dem? Välj Avbryt för att öppna endast PDF-versionen.')?candidate.payload:null;
 }
 async function markPdfSaved(hash){
  if(!hash)return;
  if(pendingDraft?.id===hash)pendingDraft=null;
  if(draftTimer){clearTimeout(draftTimer);draftTimer=null}
  await draftChain;
  try{await draftTransaction('readwrite',store=>store.delete(hash))}
  catch(err){console.warn('[SmartMatch] Kunde inte rensa lokal arbetskopia',err)}
  reportStatus('✓ Sparat i projekt-PDF','local');
 }

 function rememberView(){
  const view=app.getLocalView?.();
  if(!view?.fileKey)return;
  try{sessionStorage.setItem(sessionView,JSON.stringify(view))}catch(_){}
 }
 async function restore(){
  let hash='';
  try{hash=sessionStorage.getItem(sessionFile)||''}catch(_){}
  if(!hash)return;
  try{
   const item=await readFile();
   if(!item?.blob||item.hash!==hash)throw new Error('Ingen PDF för den här sessionen');
   let view=null;try{view=JSON.parse(sessionStorage.getItem(sessionView)||'null')}catch(_){}
   await app.openCachedPdf(new File([item.blob],item.name||'Projekt.pdf',{type:'application/pdf'}),view);
  }catch(err){
   console.warn('[SmartMatch] Återställning av aktiv PDF misslyckades',err);
   try{sessionStorage.removeItem(sessionFile)}catch(_){}
   const msg=document.getElementById('pwState');if(msg)msg.textContent='Öppna ritningen igen. Dina tidigare sparade egenkontroller läses in från projektets lokala sparning.';
  }
 }
 async function refresh(){
  const button=document.getElementById('pwRefreshBuild');
  if(!app.getPdf?.()){window.location.reload();return}
  if(app.hasUnsavedChanges?.()&&!window.confirm('Du har ändringar som ännu inte är exporterade som projekt-PDF. Ett lokalt utkast autosparas först. Uppdatera och återställ det när du öppnar projektet igen?'))return;
  await writePendingDraft();
  rememberView();
  if(button)button.disabled=true;
  try{
   if(await writeFile()){window.location.reload();return}
   throw new Error('Lokal återöppning stöds inte');
  }catch(err){
   console.warn('[SmartMatch] Lokal omladdning kunde inte användas',err);
   app.redraw?.();
   const msg=document.getElementById('pwState');
   if(msg)msg.textContent='Översikten uppdaterad. Din ritning är kvar. Spara en projekt-PDF innan du laddar om webbläsaren.';
  }finally{if(button)button.disabled=false}
 }
 const button=document.getElementById('pwRefreshBuild');
 if(button)button.addEventListener('click',()=>void refresh());
 window.addEventListener('pagehide',()=>{rememberView();void writePendingDraft()});
 window.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')void writePendingDraft()});
 window.SmartMatchSession={cachePdf:()=>writeFile().catch(err=>{console.warn('[SmartMatch] Tillfällig PDF-cache ej tillgänglig',err);return false}),queueDraft,flushDraft:writePendingDraft,offerDraftRestore,markPdfSaved,reportStatus};
 void restore();
})();