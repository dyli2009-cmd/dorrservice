/* Allt-i-ett protocol selection 2.4.132 */
(()=>{
 'use strict';
 const KEY='doorservice-all-in-one-active-protocols';
 const TYPES=['automation','alarm','lock','access'];
 const names={automation:'Dörrautomatik',alarm:'Inbrottslarm',lock:'Lås & Dörrmiljö',access:'Passer'};
 const dialog=document.getElementById('allProtocolDialog'),picker=document.getElementById('allProtocolPicker'),
  close=document.getElementById('allProtocolClose'),cancel=document.getElementById('allProtocolCancel'),
  apply=document.getElementById('allProtocolApply'),message=document.getElementById('allProtocolMessage'),
  file=document.getElementById('securityFile');
 if(!dialog||!picker)return;

 function read(){
  try{const a=JSON.parse(localStorage.getItem(KEY)||'[]');return new Set(Array.isArray(a)?a.filter(x=>TYPES.includes(x)):[])}
  catch(_){return new Set()}
 }
 let active=read();

 function itemTypes(){
  try{return new Set((typeof items!=='undefined'&&Array.isArray(items)?items:[]).map(o=>o?.type).filter(x=>TYPES.includes(x)))}
  catch(_){return new Set()}
 }
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
  if(message)message.textContent=count?'Aktiva: '+[...active].map(x=>names[x]).join(' · '):'Inga protokoll valda ännu.';
 }
 function openPicker(){
  syncChecks();refresh();
  if(!dialog.open)dialog.showModal()
 }
 function closePicker(){if(dialog.open)dialog.close()}
 function applyPicker(){
  const chosen=new Set([...dialog.querySelectorAll('input[type=checkbox][value]:checked')].map(x=>x.value).filter(x=>TYPES.includes(x)));
  if(!chosen.size){if(message)message.textContent='Välj minst ett protokoll att arbeta med.';return}
  active=chosen;write();refresh();closePicker();
  const hint=document.getElementById('secHint');
  if(hint&&document.body.classList.contains('secHasPdf')){
   hint.textContent='Aktiva protokoll: '+[...active].map(x=>names[x]).join(' · ')+'. Välj en knapp nedan och markera på ritningen.';
   hint.hidden=false
  }
 }
 picker.onclick=openPicker;close.onclick=closePicker;cancel.onclick=closePicker;apply.onclick=applyPicker;
 dialog.addEventListener('cancel',e=>{e.preventDefault();closePicker()});

 // Keep protocol types found in an opened Allt-i-ett work file active automatically.
 if(file&&file.onchange){
  const original=file.onchange;
  file.onchange=async function(e){
   const result=await original.call(this,e);
   const found=itemTypes();
   if(found.size){found.forEach(x=>active.add(x));write();refresh()}
   if(document.body.classList.contains('secHasPdf')&&!active.size)setTimeout(openPicker,80);
   return result
  }
 }

 refresh();
 window.AllInOneProtocols={
  get:()=>[...active],
  choose:openPicker,
  set:types=>{active=new Set((types||[]).filter(x=>TYPES.includes(x)));write();refresh()}
 };
})();
