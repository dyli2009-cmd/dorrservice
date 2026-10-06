const CACHE='dorrservice-2.4.124';
const CORE=['./','./index.html','./style.css','./app.js','./reports.js','./v2.js','./session-history.js','./ui-text-scale.js','./manifest.webmanifest','./icon-180.png','./icon-192.png','./icon-512.png','./security.html','./security.css','./security.js','./drawing-tools.html','./drawing-tools.css','./drawing-tools.js','./drawing-door-symbols.js','./drawing-transfer.js','./drawing-annotations.js'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('dorrservice-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET')return;
 const url=new URL(event.request.url);
 if(event.request.mode==='navigate'){
  event.respondWith(fetch(event.request,{cache:'no-store'}).then(response=>{const copy=response.clone();caches.open(CACHE).then(cache=>cache.put('./index.html',copy));return response}).catch(()=>caches.match('./index.html')));
  return;
 }
 if(url.origin===self.location.origin){
  event.respondWith(fetch(event.request,{cache:'no-store'}).then(response=>{if(response&&response.ok)caches.open(CACHE).then(cache=>cache.put(event.request,response.clone()));return response}).catch(()=>caches.match(event.request)));
  return;
 }
 event.respondWith(caches.match(event.request,{ignoreSearch:true}).then(cached=>cached||fetch(event.request).then(response=>{if(response&&(response.ok||response.type==='opaque'))caches.open(CACHE).then(cache=>cache.put(event.request,response.clone()));return response})));
});


