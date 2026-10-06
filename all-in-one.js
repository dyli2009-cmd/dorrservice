/* Allt-i-ett protocol selection 2.4.135 */
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
 const dialog=document.getElementById('allProtocolDialog'),
  apply=document.getElementById('allProtocolApply'),
  message=document.getElementById('allProtocolMessage'),
  file=document.getElementById('securityFile');
 if(!dialog||!apply||!file)return;

 let active=new Set();

 function itemTypes(){
  try{return new Set((typeof items!=='undefined'&&Array.isArray(items)?items:[]).map(o=>o?.type).filter(x=>TYPES.includes(x)))}
  catch(_){return new Set()}
 }
 function write(){try{localStorage.setItem(KEY,JSON.stringify([...active]))}catch(_){}}
 function refresh(){
  document.querySelectorAll('.allInOneProtocolTools [data-add]').forEach(button=>{
   button.hidden=!active.has(button.dataset.add)
  });
  if(message)message.textContent=active.size?'Valt: '+[...active].map(x=>names[x]).join(' · '):'Välj minst ett protokoll.';
 }
 function openPicker(){
  active=new Set();
  write();
  dialog.querySelectorAll('input[type=checkbox][value]').forEach(cb=>cb.checked=false);
  refresh();
  if(!dialog.open)dialog.showModal()
 }
 function applyPicker(){
  const chosen=new Set([...dialog.querySelectorAll('input[type=checkbox][value]:checked')].map(x=>x.value).filter(x=>TYPES.includes(x)));
  if(!chosen.size){if(message)message.textContent='Välj minst ett protokoll först.';return}
  active=chosen;
  write();
  refresh();
  dialog.close();
  setTimeout(()=>file.click(),40)
 }

 apply.onclick=applyPicker;
 dialog.addEventListener('cancel',e=>e.preventDefault());

 // A previously saved work PDF is opened through the same normal PDF choice.
 // Its actual protocol types are added automatically after the file is read.
 if(file.onchange){
  const original=file.onchange;
  file.onchange=async function(e){
   const result=await original.call(this,e);
   const found=itemTypes();
   if(found.size){found.forEach(x=>active.add(x));write();refresh()}
   return result
  }
 }

 refresh();
 window.AllInOneProtocols={
  get:()=>[...active],
  set:types=>{active=new Set((types||[]).filter(x=>TYPES.includes(x)));write();refresh()}
 };

 setTimeout(openPicker,60);
})();