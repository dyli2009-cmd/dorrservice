const {chromium}=require('playwright');
const {PDFDocument}=require('pdf-lib');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
(async()=>{
 const pdf=await PDFDocument.create();pdf.addPage([2000,3000]);pdf.addPage([1000,1500]);const bytes=Buffer.from(await pdf.save());
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
 for(const view of [
  {file:'index.html',input:'file',canvas:'pdfCanvas',viewer:'viewerWrap',zoom:'zoomIn',info:'zoomInfo',next:'next',page:'pageInfo'},
  {file:'project-workspace.html',input:'pwFile',canvas:'pwCanvas',viewer:'pwViewer',zoom:'pwZoomIn',info:'pwZoomInfo',next:'pwNext',page:'pwPageInfo'},
  {file:'project-flow.html',input:'pfDrawingFile',canvas:'pfCanvas',viewer:'pfViewerWrap',zoom:'pfZoomIn',info:null,next:'pfNext',page:'pfPageInfo'},
  {file:'all-in-one.html',input:'securityFile',canvas:'secCanvas',viewer:'secViewer',zoom:'secZoomIn',info:'secZoom',next:'secNext',page:'secPage'}
 ].filter(view=>!process.env.DRAWING_VIEWS||process.env.DRAWING_VIEWS.split(',').includes(view.file))){
  const context=await browser.newContext({viewport:{width:1000,height:800},hasTouch:true,serviceWorkers:'block'}),page=await context.newPage(),errors=[];
  page.setDefaultTimeout(120000);page.on('pageerror',e=>{errors.push(e.message);console.log('BROWSER ERROR',e.message)});page.on('console',m=>{if(m.type()==='error')console.log('CONSOLE',m.text())});
  await page.addInitScript(()=>{
   window.drawingCommits={};const draw=CanvasRenderingContext2D.prototype.drawImage;
   CanvasRenderingContext2D.prototype.drawImage=function(...args){if(this.canvas.id)window.drawingCommits[this.canvas.id]=(window.drawingCommits[this.canvas.id]||0)+1;return draw.apply(this,args)};
  });
  await page.route('https://cdnjs.cloudflare.com/**',r=>r.fulfill({contentType:'application/javascript',body:fs.readFileSync(path.join(process.env.PDFJS_DIR||'/tmp',new URL(r.request().url()).pathname.split('/').pop()))}));
  await page.route('https://drawing.test/**',r=>{const file=new URL(r.request().url()).pathname.slice(1);return r.fulfill({contentType:file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':'text/html',body:fs.readFileSync(path.join(root,file))})});
  await page.goto('https://drawing.test/'+view.file,{waitUntil:'domcontentloaded'});
  if(view.file==='index.html')await page.evaluate(()=>enterDoorService());
  const upload={name:'large.pdf',mimeType:'application/pdf',buffer:bytes};
  if(view.file==='all-in-one.html'){
   const group=page.locator('#allProtocolDialog .allProtocolGroup').filter({has:page.locator('input[value="alarm"]')});
   await group.locator('summary').click();await group.locator('input[value="alarm"]').check();
   const chooserPromise=page.waitForEvent('filechooser');await page.locator('#allProtocolApply').click();
   const chooser=await chooserPromise;await chooser.setFiles(upload);
  }else await page.locator('#'+view.input).setInputFiles(upload);
  await page.waitForFunction(id=>document.getElementById(id).textContent.includes('1 / 2'),view.page,{timeout:120000}).catch(async e=>{console.log('IMPORT STATE',await page.locator('body').innerText());throw e});
  await page.waitForTimeout(300);
  // Rapid zoom requests must leave the final requested scale, with bounded raster memory.
  for(let i=0;i<16;i++)await page.locator('#'+view.zoom).evaluate(b=>b.click());
  await page.waitForFunction(({id,canvas,minWidth})=>(!id||parseInt(document.getElementById(id).textContent)>=300)&&document.getElementById(canvas).getBoundingClientRect().width>=minWidth,{id:view.info,canvas:view.canvas,minWidth:['pdfCanvas','secCanvas'].includes(view.canvas)?2000:6000},{timeout:120000});
  await page.waitForTimeout(300);
  const size=await page.locator('#'+view.canvas).evaluate(c=>({width:c.width,height:c.height}));
  assert(size.width*size.height<=4005000,'Zoom raster must remain approximately 4 megapixels');assert(Math.max(size.width,size.height)<=4096);
  const commits=await page.evaluate(id=>window.drawingCommits[id],view.canvas);
  await page.locator('#'+view.zoom).evaluate(b=>b.click());await page.waitForTimeout(300);
  assert.equal(await page.evaluate(id=>window.drawingCommits[id],view.canvas),commits,'Capped zoom must reuse existing PDF pixels');
  const viewer=page.locator('#'+view.viewer),box=await viewer.boundingBox();
  await viewer.evaluate(v=>{v.scrollLeft=300;v.scrollTop=300});
  await page.mouse.move(box.x+100,box.y+100);await page.mouse.down();await page.mouse.move(box.x+160,box.y+160,{steps:6});await page.mouse.up();
  const offset=await viewer.evaluate(v=>({left:v.scrollLeft,top:v.scrollTop}));assert(offset.left<300&&offset.top<300,'Dragging must pan the drawing');
  assert.equal(await page.evaluate(id=>window.drawingCommits[id],view.canvas),commits,'Panning must not render the PDF again');
  // A pinch previews the existing canvas instead of rendering on each touch move.
  const beforePinch=await page.evaluate(id=>window.drawingCommits[id],view.canvas);
  await viewer.evaluate(v=>{
   const r=v.getBoundingClientRect();
   const point=(id,x,y)=>new Touch({identifier:id,target:v,clientX:r.left+x,clientY:r.top+y});
   const start=[point(1,80,120),point(2,180,120)];
   v.dispatchEvent(new TouchEvent('touchstart',{bubbles:true,cancelable:true,touches:start}));
   const move=[point(1,90,120),point(2,170,120)];
   v.dispatchEvent(new TouchEvent('touchmove',{bubbles:true,cancelable:true,touches:move}));
  });
  assert.equal(await page.evaluate(id=>window.drawingCommits[id],view.canvas),beforePinch,'Pinch movement must reuse existing pixels');
  await viewer.evaluate(v=>v.dispatchEvent(new TouchEvent('touchend',{bubbles:true,cancelable:true,touches:[],changedTouches:[]})));
  await page.waitForTimeout(300);
  await page.locator('#'+view.next).click();await page.waitForFunction(id=>document.getElementById(id).textContent.includes('2 / 2'),view.page);
  assert((await page.evaluate(id=>window.drawingCommits[id],view.canvas))>commits,'Changing page must replace PDF pixels');
  assert.deepEqual(errors,[]);console.log('PASS '+view.file+': rapid zoom, bounded raster, pixel reuse, drag panning, page change and pinch preview');await context.close();
 }
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
