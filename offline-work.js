/* Drawing bytes in IndexedDB; work data keeps its existing per-drawing storage. */
(()=>{
 let dbPromise;
 function database(){return dbPromise||(dbPromise=new Promise((resolve,reject)=>{const request=indexedDB.open('tillsyno-offline-work',1);request.onupgradeneeded=()=>request.result.createObjectStore('drawings',{keyPath:'id'});request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)}))}
 async function remember(scope,key,name,bytes){
  const db=await database(),record={id:scope+':'+key,scope,key,name,bytes:bytes.slice(),types:window.AllInOneProtocols?.get?.()||[],updatedAt:Date.now()};
  await new Promise((resolve,reject)=>{const tx=db.transaction('drawings','readwrite');tx.objectStore('drawings').put(record);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error)});
  window.dispatchEvent(new Event('tillsyno-drawing-saved'));
 }
 async function recent(scope){const db=await database();return new Promise((resolve,reject)=>{const req=db.transaction('drawings').objectStore('drawings').getAll();req.onsuccess=()=>resolve(req.result.filter(r=>r.scope===scope).sort((a,b)=>b.updatedAt-a.updatedAt)[0]||null);req.onerror=()=>reject(req.error)})}
 window.TillsynoOfflineWork={remember,recent};
 async function init(){
  const file=document.getElementById('securityFile'),empty=document.getElementById('secEmpty');if(!file||!empty)return;
  const scope=document.body.classList.contains('allInOneApp')?'doorservice-all-in-one':'security-service',picker=document.getElementById('allProtocolDialog'),hosts=[empty];if(picker)hosts.push(picker.querySelector('.allProtocolChoices'));
  const buttons=hosts.filter(Boolean).map(host=>{const b=document.createElement('button');b.type='button';b.className='filebtn';b.hidden=true;b.style.cssText='margin:10px 0;max-width:100%';host.appendChild(b);return b});
  const refresh=async()=>{try{const record=await recent(scope);for(const button of buttons){button.hidden=!record;if(!record)continue;button.textContent='Fortsätt med sparad ritning';button.title=record.name;button.onclick=async()=>{
   button.disabled=true;
   try{const latest=await recent(scope);if(!latest)return;
    if(picker){let types=latest.types;try{const saved=JSON.parse(localStorage.getItem(scope+':'+latest.key)||'null');types=[...new Set([...types,...(saved?.items||[]).map(o=>o.type)])]}catch(_){}window.AllInOneProtocols?.set?.(types);picker.close()}
    const pdf=new File([latest.bytes],latest.name||'sparad-ritning.pdf',{type:'application/pdf'});await file.onchange({target:{files:[pdf],value:''},currentTarget:file});
   }finally{button.disabled=false}
  }}}catch(_){}};
  window.addEventListener('tillsyno-drawing-saved',refresh);await refresh();
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
