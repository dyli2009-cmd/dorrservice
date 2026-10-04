(()=>{
'use strict';
const cfg=()=>window.DOORSERVICE_CLOUD_CONFIG||{};
let targetInputId=null,googleToken=null;

function status(text,error=false){
 const el=document.getElementById('appMessage')||document.getElementById('securityMessage');
 if(el){el.textContent=text;el.classList.toggle('error',!!error)}
}
function configured(value){return typeof value==='string'&&value.trim().length>5}
function providerConfigured(name){
 const c=cfg();
 if(name==='onedrive')return configured(c.onedrive?.clientId);
 if(name==='google')return configured(c.googleDrive?.clientId)&&configured(c.googleDrive?.apiKey)&&configured(c.googleDrive?.appId);
 if(name==='dropbox')return configured(c.dropbox?.appKey);
 return true;
}
function providerMessage(name){
 const names={onedrive:'OneDrive',google:'Google Drive',dropbox:'Dropbox'};
 status(names[name]+' är förberett men behöver kopplas med app-ID/nyckel i cloud-config.js.',true);
}
function loadScript(src,id,attrs={}){
 return new Promise((resolve,reject)=>{
  const existing=document.getElementById(id);
  if(existing){
   if(existing.dataset.loaded==='true')return resolve();
   existing.addEventListener('load',()=>resolve(),{once:true});
   existing.addEventListener('error',()=>reject(new Error('Kunde inte ladda '+id)),{once:true});
   return;
  }
  const s=document.createElement('script');s.id=id;
  Object.entries(attrs).forEach(([k,v])=>s.setAttribute(k,v));
  s.src=src;s.async=true;
  s.onload=()=>{s.dataset.loaded='true';resolve()};
  s.onerror=()=>reject(new Error('Kunde inte ladda '+id));
  document.head.appendChild(s);
 });
}
async function responseToFile(response,name){
 if(!response.ok)throw new Error('Kunde inte hämta PDF-filen ('+response.status+').');
 const blob=await response.blob();
 const type=blob.type||'application/pdf';
 if(type&&!type.includes('pdf')&&!String(name||'').toLowerCase().endsWith('.pdf'))throw new Error('Den valda filen är inte en PDF.');
 return new File([blob],name||'ritning.pdf',{type:'application/pdf',lastModified:Date.now()});
}
async function handoff(file,source){
 const fn=window.DoorServiceOpenPdfFile||window.SecurityServiceOpenPdfFile;
 if(typeof fn!=='function')throw new Error('PDF-inläsningen är inte redo ännu.');
 status('Laddar '+source+'-fil…');
 await fn(file,{source});
}
function dialog(){
 let d=document.getElementById('cloudFileDialog');
 if(d)return d;
 d=document.createElement('dialog');d.id='cloudFileDialog';d.className='cloudFileDialog';
 d.innerHTML='<div class="cloudFileHead"><div><strong>Öppna PDF</strong><small>Välj var ritningen ligger</small></div><button type="button" data-cloud-close aria-label="Stäng">×</button></div>'+
 '<div class="cloudFileSources">'+
 '<button type="button" data-cloud-source="device"><b>Enhetens filer</b><span>Telefon, dator, iCloud eller annan filplats</span></button>'+
 '<button type="button" data-cloud-source="onedrive"><b>OneDrive</b><span>Microsoft 365 / OneDrive</span></button>'+
 '<button type="button" data-cloud-source="google"><b>Google Drive</b><span>Välj PDF från Google Drive</span></button>'+
 '<button type="button" data-cloud-source="dropbox"><b>Dropbox</b><span>Välj PDF från Dropbox</span></button>'+
 '</div><p class="cloudFileNote">Endast den PDF du väljer hämtas in i Dörrservice.</p>';
 document.body.appendChild(d);
 d.querySelector('[data-cloud-close]').onclick=()=>d.close();
 d.addEventListener('click',e=>{if(e.target===d)d.close()});
 d.querySelectorAll('[data-cloud-source]').forEach(btn=>btn.onclick=async()=>{
  const provider=btn.dataset.cloudSource;
  if(provider!=='device'&&!providerConfigured(provider)){providerMessage(provider);return}
  d.close();
  try{
   if(provider==='device')document.getElementById(targetInputId)?.click();
   if(provider==='onedrive')await openOneDrive();
   if(provider==='google')await openGoogleDrive();
   if(provider==='dropbox')await openDropbox();
  }catch(err){console.error(err);status(err.message||'Kunde inte öppna filkällan.',true)}
 });
 return d;
}
function openMenu(inputId){
 targetInputId=inputId;
 const d=dialog();
 d.querySelectorAll('[data-cloud-source]').forEach(btn=>{
  const p=btn.dataset.cloudSource;
  btn.classList.toggle('needsSetup',p!=='device'&&!providerConfigured(p));
  const hint=btn.querySelector('span');
  if(p!=='device'&&!providerConfigured(p))hint.textContent='Behöver app-ID/nyckel för att aktiveras';
 });
 d.showModal();
}
async function openDropbox(){
 const appKey=cfg().dropbox.appKey.trim();
 await loadScript('https://www.dropbox.com/static/api/2/dropins.js','dropboxjs',{'data-app-key':appKey});
 if(!window.Dropbox?.choose)throw new Error('Dropbox-väljaren kunde inte startas.');
 window.Dropbox.choose({
  success:async files=>{
   try{
    const item=files?.[0];if(!item) return;
    const file=await responseToFile(await fetch(item.link),item.name||'dropbox.pdf');
    await handoff(file,'Dropbox');
   }catch(err){console.error(err);status(err.message||'Kunde inte läsa Dropbox-filen.',true)}
  },
  cancel:()=>{},
  linkType:'direct',
  multiselect:false,
  extensions:['.pdf'],
  folderselect:false
 });
}
async function openOneDrive(){
 const clientId=cfg().onedrive.clientId.trim();
 await loadScript('https://js.live.net/v7.2/OneDrive.js','onedrivePickerSdk');
 if(!window.OneDrive?.open)throw new Error('OneDrive-väljaren kunde inte startas.');
 window.OneDrive.open({
  clientId,
  action:'download',
  multiSelect:false,
  openInNewWindow:true,
  advanced:{filter:'.pdf'},
  success:async response=>{
   try{
    const item=response?.value?.[0];if(!item) return;
    const url=item['@microsoft.graph.downloadUrl'];if(!url)throw new Error('OneDrive returnerade ingen nedladdningslänk.');
    const file=await responseToFile(await fetch(url),item.name||'onedrive.pdf');
    await handoff(file,'OneDrive');
   }catch(err){console.error(err);status(err.message||'Kunde inte läsa OneDrive-filen.',true)}
  },
  cancel:()=>{},
  error:error=>{console.error(error);status('Kunde inte öppna OneDrive.',true)}
 });
}
async function openGoogleDrive(){
 const g=cfg().googleDrive;
 await Promise.all([
  loadScript('https://apis.google.com/js/api.js','googleApiSdk'),
  loadScript('https://accounts.google.com/gsi/client','googleIdentitySdk')
 ]);
 if(!window.gapi||!window.google?.accounts?.oauth2)throw new Error('Google Drive-väljaren kunde inte startas.');
 await new Promise((resolve,reject)=>window.gapi.load('picker',{callback:resolve,onerror:()=>reject(new Error('Google Picker kunde inte laddas.'))}));
 const token=await new Promise((resolve,reject)=>{
  const client=window.google.accounts.oauth2.initTokenClient({
   client_id:g.clientId.trim(),
   scope:'https://www.googleapis.com/auth/drive.readonly',
   callback:resp=>resp?.error?reject(new Error(resp.error_description||resp.error)):resolve(resp.access_token)
  });
  client.requestAccessToken({prompt:googleToken?'':'consent'});
 });
 googleToken=token;
 await new Promise((resolve,reject)=>{
  const view=new window.google.picker.View(window.google.picker.ViewId.DOCS);
  view.setMimeTypes('application/pdf');
  const picker=new window.google.picker.PickerBuilder()
   .setDeveloperKey(g.apiKey.trim())
   .setAppId(g.appId.trim())
   .setOAuthToken(token)
   .setOrigin(location.protocol+'//'+location.host)
   .addView(view)
   .setCallback(async data=>{
    if(data.action===window.google.picker.Action.CANCEL){resolve();return}
    if(data.action!==window.google.picker.Action.PICKED)return;
    try{
     const doc=data[window.google.picker.Response.DOCUMENTS]?.[0];
     const id=doc?.[window.google.picker.Document.ID],name=doc?.[window.google.picker.Document.NAME]||'google-drive.pdf';
     if(!id)throw new Error('Google Drive returnerade inget fil-ID.');
     const res=await fetch('https://www.googleapis.com/drive/v3/files/'+encodeURIComponent(id)+'?alt=media',{
      headers:{Authorization:'Bearer '+token}
     });
     const file=await responseToFile(res,name);
     await handoff(file,'Google Drive');resolve();
    }catch(err){reject(err)}
   }).build();
  picker.setVisible(true);
 });
}
document.addEventListener('click',e=>{
 const trigger=e.target.closest('[data-cloud-file-open]');
 if(!trigger)return;
 e.preventDefault();openMenu(trigger.dataset.fileInput);
});
window.DoorServiceCloudFiles={open:openMenu};
})();
