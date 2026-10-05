/* Editable drawing symbols, separate from service doors and protocols. */
window.DrawingDoorSymbols=(()=>{
 const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
 function geometry(s,width,height){
  const size=s.size*Math.min(width,height),h=size/2,a=s.angle*Math.PI/180,c=Math.cos(a),sn=Math.sin(a),flip=s.flip?-1:1;
  const point=(x,y)=>({x:s.x*width+c*x*flip-sn*y,y:s.y*height+sn*x*flip+c*y});
  const p0=point(-h,h),p1=point(-h,-h),p2=point(h,h),k=.5522847498307936;
  const c1=point(-h+k*size,-h),c2=point(h,h-k*size);
  const xy=p=>p.x.toFixed(4)+' '+p.y.toFixed(4);
  return {path:`M ${xy(p0)} L ${xy(p1)} M ${xy(p1)} C ${xy(c1)} ${xy(c2)} ${xy(p2)}`,corners:[point(-h,-h),point(h,-h),point(h,h),point(-h,h)],handle:point(h,-h)};
 }
 function constrain(s,width,height){
  s.size=clamp(s.size,.015,.45);const a=s.angle*Math.PI/180,extent=s.size*Math.min(width,height)*(Math.abs(Math.cos(a))+Math.abs(Math.sin(a)))/2;
  s.x=clamp(s.x,extent/width,1-extent/width);s.y=clamp(s.y,extent/height,1-extent/height);return s;
 }
 function create({onChange,onPlaceMode,message}){
  const $=id=>document.getElementById(id),svg=$('doorSymbolOverlay'),ns='http://www.w3.org/2000/svg';
  let symbols=[],history=[],selected=null,placing=false,drag=null,page=1,width=595,height=842,enabled=false;
  const current=()=>symbols.find(s=>s.id===selected);
  const checkpoint=()=>{history.push(structuredClone(symbols));if(history.length>30)history.shift()};
  const changed=()=>{onChange();render()};
  const element=(name,attrs={})=>{const e=document.createElementNS(ns,name);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,String(v)));return e};
  function mode(value){placing=!!value&&enabled;$('addDrawingDoor').classList.toggle('active',placing);$('addDrawingDoor').setAttribute('aria-pressed',String(placing));svg.classList.toggle('placing',placing);if(placing)onPlaceMode();}
  function render(){
   svg.replaceChildren();svg.setAttribute('viewBox',`0 0 ${width} ${height}`);svg.hidden=!enabled;
   const scale=svg.getBoundingClientRect().width/width||1;
   for(const s of symbols.filter(s=>s.page===page)){
    const g=geometry(s,width,height),group=element('g',{'data-door-symbol':s.id,tabindex:'0',role:'button','aria-label':'Dörrsymbol. Dra för att flytta. Använd piltangenter för finjustering.','aria-pressed':s.id===selected});
    const hit=element('polygon',{points:g.corners.map(p=>p.x+','+p.y).join(' '),fill:'transparent',stroke:s.id===selected?'#14769c':'transparent','stroke-width':1.3,'vector-effect':'non-scaling-stroke','stroke-dasharray':'4 3',class:'doorSymbolHit'});
    group.append(hit,element('path',{d:g.path,fill:'none',stroke:'#172b36','stroke-width':1,'vector-effect':'non-scaling-stroke','pointer-events':'none'}));
    group.addEventListener('pointerdown',e=>start(e,s,'move'));
    group.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;e.preventDefault();checkpoint();selected=s.id;const step=(e.shiftKey?10:1)/scale;s.x+=(e.key==='ArrowRight'?step:e.key==='ArrowLeft'?-step:0)/width;s.y+=(e.key==='ArrowDown'?step:e.key==='ArrowUp'?-step:0)/height;constrain(s,width,height);changed();svg.querySelector(`[data-door-symbol="${s.id}"]`)?.focus()});
    svg.appendChild(group);
    if(s.id===selected){const handle=element('circle',{cx:g.handle.x,cy:g.handle.y,r:16/scale,fill:'transparent',class:'doorSymbolResize','aria-label':'Ändra dörrstorlek'});handle.addEventListener('pointerdown',e=>start(e,s,'size'));svg.append(handle,element('circle',{cx:g.handle.x,cy:g.handle.y,r:5/scale,fill:'#14769c',stroke:'#fff','stroke-width':1.5,'vector-effect':'non-scaling-stroke','pointer-events':'none'}));}
   }
   const s=current();$('drawingDoorEditor').hidden=!s||s.page!==page;$('undoDrawingDoor').disabled=!history.length;$('addDrawingDoor').disabled=!enabled;
   if(s){$('drawingDoorSize').value=String(Math.round(s.size*1000));$('drawingDoorAngle').value=String(s.angle);$('drawingDoorSizeValue').textContent=Math.round(s.size*100)+' %';$('drawingDoorAngleValue').textContent=s.angle+'°';$('flipDrawingDoor').setAttribute('aria-pressed',String(s.flip));}
   $('drawingDoorCount').textContent=symbols.filter(s=>s.page===page).length+' dörrsymboler på sidan';
  }
  function position(e){const r=svg.getBoundingClientRect();return{x:(e.clientX-r.left)*width/r.width,y:(e.clientY-r.top)*height/r.height}}
  function start(e,s,kind){if(!enabled||placing||e.button!==0)return;e.preventDefault();e.stopPropagation();checkpoint();selected=s.id;const p=position(e);drag={id:e.pointerId,s,kind,p,initial:{...s},distance:Math.hypot(p.x-s.x*width,p.y-s.y*height)};svg.setPointerCapture?.(e.pointerId);render()}
  svg.addEventListener('pointerdown',e=>{if(!placing||!enabled||e.button!==0)return;e.preventDefault();checkpoint();const p=position(e),s=constrain({id:crypto.randomUUID(),page,x:p.x/width,y:p.y/height,size:.10,angle:0,flip:false},width,height);symbols.push(s);selected=s.id;mode(false);changed();message('Dörrsymbol tillagd. Dra för att flytta, eller dra i det blå hörnet för att ändra storlek.');});
  svg.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;e.preventDefault();const p=position(e),{s,initial}=drag;if(drag.kind==='move'){s.x=initial.x+(p.x-drag.p.x)/width;s.y=initial.y+(p.y-drag.p.y)/height}else{s.size=initial.size*Math.hypot(p.x-initial.x*width,p.y-initial.y*height)/Math.max(1,drag.distance)}constrain(s,width,height);onChange();render()});
  svg.addEventListener('pointerup',e=>{if(drag&&e.pointerId===drag.id){drag=null;svg.releasePointerCapture?.(e.pointerId);render()}});
  svg.addEventListener('pointercancel',()=>{if(drag){symbols=history.pop()||symbols;drag=null;changed()}});
  function update(fn){const s=current();if(!s)return;checkpoint();fn(s);constrain(s,width,height);changed()}
  $('addDrawingDoor').onclick=()=>{mode(!placing);message(placing?'Tryck på ritningen där dörren ska placeras.':'Placering av dörrsymbol avstängd.')};
  $('undoDrawingDoor').onclick=()=>{if(!history.length)return;symbols=history.pop();selected=null;drag=null;mode(false);changed()};
  $('drawingDoorSmaller').onclick=()=>update(s=>s.size*=.9);$('drawingDoorLarger').onclick=()=>update(s=>s.size*=1.1);
  for(const [id,key,factor] of [['drawingDoorSize','size',.001],['drawingDoorAngle','angle',1]]){
   $(id).oninput=()=>{const s=current();if(!s)return;if(!$(id).dataset.editing){checkpoint();$(id).dataset.editing='1'}s[key]=Number($(id).value)*factor;constrain(s,width,height);changed()};
   $(id).onchange=$(id).onblur=()=>delete $(id).dataset.editing;
  }
  $('rotateDrawingDoor').onclick=()=>update(s=>s.angle=(s.angle+90)%360);
  $('flipDrawingDoor').onclick=()=>update(s=>s.flip=!s.flip);
  $('deleteDrawingDoor').onclick=()=>{if(!current())return;checkpoint();symbols=symbols.filter(s=>s.id!==selected);selected=null;changed()};
  return {
   reset(){symbols=[];history=[];selected=null;drag=null;enabled=false;mode(false);render()},
   stopPlacing(){mode(false)},
   deselect(){selected=null;mode(false);render()},
   viewport(p,w,h,active=true){if(page!==p){selected=null;drag=null;mode(false)}page=p;width=w;height=h;enabled=active;if(!active)mode(false);render()},
   snapshot:()=>structuredClone(symbols),
   drawToPdf(pdfPage,pageNo,w,h,snapshot=symbols){for(const s of snapshot.filter(s=>s.page===pageNo))pdfPage.drawSvgPath(geometry(s,w,h).path,{x:0,y:h,borderColor:PDFLib.rgb(.09,.17,.21),borderWidth:1});}
  };
 }
 return {create,geometry,constrain};
})();
