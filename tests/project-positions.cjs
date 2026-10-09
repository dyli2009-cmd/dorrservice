// Browser regression test for the simplified project positions (v2.4.265).
// Run: CHROMIUM_PATH=/path/to/chromium node tests/project-positions.cjs
const {chromium}=require('playwright');
const {PDFDocument,StandardFonts}=require('../vendor/pdf-lib.min.js');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const root=path.resolve(__dirname,'..');
const server=http.createServer((req,res)=>{
 const raw=new URL(req.url,'http://127.0.0.1').pathname.replace(/^\/tillsyno\//,'');
 const file=path.resolve(root,raw||'index.html');
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end()}
 try{res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.html':'text/html'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file))}
 catch(_){res.writeHead(404);res.end()}
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const url='http://127.0.0.1:'+server.address().port+'/tillsyno/';
 const pdf=await PDFDocument.create(),font=await pdf.embedFont(StandardFonts.Helvetica);
 const first=pdf.addPage([600,800]);first.drawText('DA',{x:80,y:700,font,size:14,color:{type:'RGB',red:1,green:0,blue:0}});
 first.drawText('DA',{x:260,y:600,font,size:14});first.drawText('DARA',{x:80,y:500,font,size:14});
 const second=pdf.addPage([600,800]);second.drawText('DA',{x:80,y:700,font,size:14});
 const bytes=Buffer.from(await pdf.save());
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']});
 try{
  for(const mobile of [false,true]){
   const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1280,height:850},isMobile:mobile,hasTouch:mobile,acceptDownloads:true});
   await context.addInitScript(()=>{window.showSaveFilePicker=undefined;window.showOpenFilePicker=undefined;Object.defineProperty(navigator,'share',{configurable:true,value:undefined})});
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(url+'project-workspace.html');await page.locator('#pwFile').setInputFiles({name:'projekt-DA.pdf',mimeType:'application/pdf',buffer:bytes});
   await page.waitForFunction(()=>document.querySelectorAll('.pcPositionSuggestion').length===2);
   assert.equal(await page.locator('.pcPositionSuggestion').count(),2,'only standalone DA, not DARA, has a click target');
   await page.locator('.pcPositionSuggestion').first().click();
   assert.equal(await page.locator('.pcObject').count(),1,'click DA creates one position');
   await page.locator('#pcOpen').click();
   assert(await page.locator('#pcPositionDialog').evaluate(e=>e.open),'simple dialog is the default');
   await page.locator('#pcFindPositions').click();
   await page.waitForFunction(()=>document.querySelectorAll('.pcObject').length===3);
   assert.equal(await page.locator('.pcObject').count(),3,'scan all pages adds the two remaining DA positions');
   await page.locator('#pcOpen').click();await page.locator('#pcFindPositions').click();
   assert.equal(await page.locator('.pcObject').count(),3,'scan does not duplicate existing positions');
   await page.locator('.pcObject').first().click();
   await page.locator('#pcAssignPositionTemplate').selectOption('automation_selfcheck');
   assert(await page.locator('.pcCheck').count()>0,'existing template can be assigned after creation');
   assert(!await page.locator('#pcPreview').isHidden(),'customer template becomes available');
   await page.locator('#pcPositionName').fill('DA-1');await page.locator('#pcPositionName').dispatchEvent('change');
   assert((await page.locator('#pcIdentity').textContent()).includes('DA-1'),'position name is editable');
   await page.locator('.pcChoices [data-status=ok]').first().click();
   await page.locator('#pcBack').click();
   const dl=page.waitForEvent('download');await page.locator('#pwSaveProject').click();await page.locator('#pwSavePortable').click();
   const saved=Buffer.from(fs.readFileSync(await(await dl).path()));
   await page.locator('#pwFile').setInputFiles({name:'projekt-DA-sparat.pdf',mimeType:'application/pdf',buffer:saved});
   await page.waitForFunction(()=>document.querySelectorAll('.pcObject').length===3);
   await page.locator('.pcObject').first().click();
   assert.equal(await page.locator('#pcAssignPositionTemplate').inputValue(),'automation_selfcheck','selected checklist survives project reload');
   assert.equal(await page.locator('.pcChoices [data-status=ok].active').count(),1,'saved check status survives project reload');
   assert.deepEqual(errors,[],'no browser JS errors');
   await context.close();
  }
  console.log('PASS desktop + mobile: click DA, scan, dedupe, edit, assign checklist, persist and reopen');
 }finally{await browser.close();server.close()}
})().catch(error=>{console.error(error);server.close();process.exitCode=1});