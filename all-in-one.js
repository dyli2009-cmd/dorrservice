/* Allt-i-ett protocol selection 2.4.134 */
(()=>{
 'use strict';
 const KEY='doorservice-all-in-one-active-protocols';
 const TYPES=['automation','automation_selfcheck','alarm','lock','access','fire_panel','fire_detector','fire_door'];
 const names={
  automation:'Checklista revision dörrautomatik',
  automation_selfcheck:'Egenkontroll dörrautomatik',
  alarm:'Inbrottslarm',lock:'Lås & Dörrmiljö',access:'Passer',
  fire_panel:'Brandcentral',fire_detector:'Branddetektorer',fire_door:'Branddörr / dörrhållning'
 };
 const dialog=document.getElementById('allProtocolDialog'),picker=document.getElementById('allProtocolPicker'),
  close=document.getElementById('allProtocolClose'),cancel=document.getElementById('allProtocolCancel'),
  apply=document.getElementById('allProtocolApply'),openWork=document.getElementById('allProtocolOpenWork'),
  message=document.getElementById('allProtocolMessage'),file=document.getElementById('securityFile');
 if(!dialog||!picker)return;

 function read(){
  try{const a=JSON.parse(localStorage.getItem(KEY)||'[]');return new Set(Array.isArray(a)?a.filter(x=>TYPES.includes(x)):[])}
  catch(_){return new Set()}
 }
 // A fresh Allt-i-ett session always starts with an explicit work choice.
 let active=new Set();
 let initialGate=true;

 function itemTypes(){
  try{return new Set((typeof items!=='undefined'&&Array.isArray(items)?items:[]).map(o=>o?.type).filter(x=>TYPES.includes(x)))}
  catch(_){return new Set()}
 }
 function hasPdf(){return document.body.classList.contains('secHasPdf')}
 function write(){try{localStorage.setItem(KEY,JSON.stringify([...active]))}catch(_){}}
 function syncChecks(){
  dialog.querySelectorAll('input[type=checkbox][value]').forEach(cb=>cb.checked=active.has(cb.value))
 }
 function refresh(){
  document.querySelectorAll('.allInOneProtocolTools [data-add]').forEach(button=>{
   button.hidden=!active.has(button.dataset.add)
  });
  const count=active.size;
  picker.textContent=count?'Välj protokoll · '+count:'Välj protokoll';
  picker.title=count?[...active].map(x=>names[x]).join(' · '):'Välj protokoll för arbetet';
  if(message)message.textContent=count?'Valt: '+[...active].map(x=>names[x]).join(' · '):'Välj minst ett arbetsområde innan du öppnar en ny ritning.';
 }
 function setDialogMode(initial){
  dialog.dataset.initial=initial?'true':'false';
  if(cancel)cancel.textContent=initial?'Tillbaka':'Avbryt';
  if(apply)apply.textContent=initial?'Fortsätt till PDF':'Använd valda protokoll';
  if(openWork)openWork.hidden=!initial;
 }
 function openPicker(initial=false){
  if(initial&&!hasPdf()){active=new Set();write()}
  initialGate=initial&&!hasPdf();
  setDialogMode(initialGate);
  syncChecks();refresh();
  if(!dialog.open)dialog.showModal()
 }
 function closePicker(){
  if(!dialog.open)return;
  const goHome=initialGate&&!hasPdf();
  dialog.close();
  initialGate=false;
  if(goHome)location.href='./';
 }
 function applyPicker(){
  const chosen=new Set([...dialog.querySelectorAll('input[type=checkbox][value]:checked')].map(x=>x.value).filter(x=>TYPES.includes(x)));
  if(!chosen.size){if(message)message.textContent='Välj minst ett arbetsområde först.';return}
  active=chosen;write();refresh();
  const shouldOpenFile=!hasPdf();
  dialog.close();initialGate=false;
  if(shouldOpenFile){
   setTimeout(()=>file?.click(),40);
   return;
  }
  const hint=document.getElementById('secHint');
  if(hint){
   hint.textContent='Aktiva protokoll: '+[...active].map(x=>names[x]).join(' · ')+'. Välj en knapp nedan och markera på ritningen.';
   hint.hidden=false
  }
 }
 function openExistingWork(){
  active=new Set();write();refresh();
  dialog.close();initialGate=false;
  setTimeout(()=>file?.click(),40)
 }

 picker.onclick=()=>openPicker(false);
 close.onclick=closePicker;
 cancel.onclick=closePicker;
 apply.onclick=applyPicker;
 if(openWork)openWork.onclick=openExistingWork;
 dialog.addEventListener('cancel',e=>{e.preventDefault();closePicker()});

 // After a saved work PDF opens, activate the protocol types actually found in that file.
 if(file&&file.onchange){
  const original=file.onchange;
  file.onchange=async function(e){
   const result=await original.call(this,e);
   const found=itemTypes();
   if(found.size){found.forEach(x=>active.add(x));write();refresh()}
   if(hasPdf()&&!active.size)setTimeout(()=>openPicker(false),80);
   return result
  }
 }

 refresh();
 window.AllInOneProtocols={
  get:()=>[...active],
  choose:()=>openPicker(false),
  set:types=>{active=new Set((types||[]).filter(x=>TYPES.includes(x)));write();refresh()}
 };

 // Allt-i-ett always begins by choosing the work scope before opening a new PDF.
 setTimeout(()=>openPicker(true),60);
})();