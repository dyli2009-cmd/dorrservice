/* SmartMatch TEST v36.27 – local PDF resume across full browser reload.
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
   const r=indexedDB.open(dbName,1);
   r.onupgradeneeded=()=>{if(!r.result.objectStoreNames.contains('files'))r.result.createObjectStore('files',{keyPath:'id'})};
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
  app.save?.();rememberView();
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
 window.addEventListener('pagehide',rememberView);
 window.SmartMatchSession={cachePdf:()=>writeFile().catch(err=>{console.warn('[SmartMatch] Tillfällig PDF-cache ej tillgänglig',err);return false})};
 void restore();
})();