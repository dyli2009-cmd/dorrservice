/* In-memory history only. Persisted work data remains in each app's existing storage. */
window.ServiceSessionHistory=function({scope,capture,restore,changed,limit=30}){
 let scopeValue=scope(),current=capture(),past=[],future=[],lastGroup=null,replaying=false;
 const signature=s=>JSON.stringify(s.data);
 function notify(){changed({undo:past.length,redo:future.length})}
 function reset(){scopeValue=scope();current=capture();past=[];future=[];lastGroup=null;notify()}
 function record(group=null){
  if(replaying)return;
  if(scope()!==scopeValue){reset();return}
  const next=capture();if(signature(next)===signature(current)){current.selected=next.selected;return}
  if(!group||group!==lastGroup||future.length){past.push(current);if(past.length>limit)past.shift()}
  current=next;future=[];lastGroup=group;notify();
 }
 function move(from,to){
  if(scope()!==scopeValue){reset();return false}
  record();
  if(!from.length)return false;
  const next=from.pop();to.push(current);const previous=current;current=next;lastGroup=null;replaying=true;
  try{restore(JSON.parse(JSON.stringify(next)))}catch(error){current=previous;from.push(next);to.pop();throw error}
  finally{replaying=false;notify()}
  return true;
 }
 notify();
 return {record,reset,endGroup(){lastGroup=null},undo:()=>move(past,future),redo:()=>move(future,past)};
};
window.installServiceHistory=function({scope,capture,restore,wrapSave,blocked}){
 const bar=document.createElement('div');bar.className='sessionHistoryBar';bar.setAttribute('role','group');bar.setAttribute('aria-label','Ångra ändringar');
 const undo=document.createElement('button'),redo=document.createElement('button');
 undo.type=redo.type='button';undo.textContent='↶ Ångra';redo.textContent='↷ Gör om';
 const status=document.createElement('span');status.setAttribute('role','status');
 const drawingButton=document.getElementById('changeDrawingBtn')||document.getElementById('secChangeDrawing');
 bar.append(undo,redo);if(drawingButton)bar.appendChild(drawingButton);bar.appendChild(status);document.querySelector('header.appHeader').insertAdjacentElement('afterend',bar);
 let inputGroup=null;
 const history=ServiceSessionHistory({scope,capture,restore,changed:counts=>{undo.disabled=!counts.undo;redo.disabled=!counts.redo;undo.title=counts.undo+' ändringar att ångra';redo.title=counts.redo+' ändringar att göra om'}});
 document.addEventListener('input',event=>{
  const el=event.target;
  inputGroup=event.isTrusted&&(el.tagName==='TEXTAREA'||el.tagName==='INPUT'&&['text','search','number','tel','email',''].includes(el.type))?el:null;
  queueMicrotask(()=>{inputGroup=null});
 },true);
 document.addEventListener('focusout',()=>history.endGroup(),true);
 wrapSave(()=>history.record(inputGroup));
 function step(direction){
  if(blocked?.()){status.textContent='Vänta tills pågående laddning eller export är klar.';return}
  const done=history[direction]();status.textContent=done?(direction==='undo'?'Ändringen ångrades.':'Ändringen gjordes om.'):'Inga fler ändringar.';
 }
 undo.onclick=()=>step('undo');redo.onclick=()=>step('redo');
 return history;
};
