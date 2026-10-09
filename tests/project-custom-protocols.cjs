const {chromium}=require('playwright');
const {PDFDocument,StandardFonts,PDFName}=require('../vendor/pdf-lib.min.js');
const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');const http=require('node:http');
const root=path.join(__dirname,'..');
const server=http.createServer((req,res)=>{
 const pathname=new URL(req.url,'http://localhost').pathname.replace(/^\/tillsyno\//,'');const file=path.resolve(root,pathname||'index.html');
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end()}
 try{res.setHeader('Content-Type',({'.js':'application/javascript','.css':'text/css','.html':'text/html','.webmanifest':'application/manifest+json'})[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file))}catch(_){res.writeHead(404);res.end()}
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const url='http://127.0.0.1:'+server.address().port+'/tillsyno/project-workspace.html';
 const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH,args:['--no-sandbox']});
 try{
  const pdf=await PDFDocument.create(),font=await pdf.embedFont(StandardFonts.Helvetica),p=pdf.addPage([600,800]);
  const text=(text,x,y)=>p.drawText(text,{x,y,size:16,font});
  text('GZ-01',70,700);text('GZ-02',210,700);text('GZ',330,700);text('03',352,700);text('14-18',70,600);text('GZ-04 GZ-05',70,500);text('XGZ-06',70,400);text('114-18',210,400);
  pdf.addPage([600,800]).drawText('GZ-01',{x:70,y:700,size:16,font});const bytes=Buffer.from(await pdf.save());
  let portable=null;
  for(const mobile of [false,true]){
   const context=await browser.newContext({viewport:mobile?{width:390,height:844}:{width:1366,height:900},isMobile:mobile,hasTouch:mobile,acceptDownloads:true});await context.addInitScript(()=>{window.showSaveFilePicker=undefined;window.showOpenFilePicker=undefined;Object.defineProperty(navigator,'share',{value:undefined,configurable:true})});const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(url);await page.waitForFunction(()=>window.TillsynoCustomProtocols&&navigator.serviceWorker.controller&&document.querySelector('#tillsynoOfflineStatus')?.dataset.ready==='true');
   await page.locator('#pcStart').click();await page.locator('#pcOpenOld').click();
   const addRule=async(code,mode,title,points)=>{await page.locator('#pcNewRule').click();await page.locator('#pcCode').fill(code);await page.locator('#pcMatchMode').selectOption(mode);await page.locator('#pcTitle').fill(title);await page.locator('#pcPoints').fill(points);await page.locator('#pcRuleForm button[type=submit]').click()};
   await addRule('GZ','prefix','Egenkontroll GZ','1.1 Infästning\n1.2 Funktionsprov');
   await addRule('14-18','exact','Egenkontroll eget nummer','1.1 Kontroll av lås');
   assert.equal(await page.locator('.pcRule').count(),2);await page.locator('#pcClose').click();
   await page.locator('#pwFile').setInputFiles({name:'egna-koder.pdf',mimeType:'application/pdf',buffer:bytes});
   await page.waitForFunction(()=>document.querySelectorAll('.pcCandidate').length===7);
   assert.equal(await page.locator('#pcCreate').isDisabled(),true,'review required before creating protocols');
   if(process.env.PROJECT_QA_DIR)await page.screenshot({path:path.join(process.env.PROJECT_QA_DIR,(mobile?'mobile':'desktop')+'-matches.png')});
   await page.locator('#pcScanScope').selectOption('pages');await page.locator('#pcPages').fill('99');await page.locator('#pcScan').click();await page.waitForFunction(()=>document.querySelector('#pcMessage').textContent.includes('Sidnumren'));
   await page.locator('#pcPages').fill('1');await page.locator('#pcScan').click();await page.waitForFunction(()=>document.querySelectorAll('.pcCandidate').length===6);
   const codes=await page.locator('.pcCandidate strong').allTextContents();assert(!codes.some(t=>t.includes('XGZ')||t.includes('114')),'literal token boundaries');
   await page.locator('#pcSelectAll').click();await page.locator('#pcCreate').click();
   await page.waitForFunction(()=>document.querySelectorAll('.pcMarker').length===6);
   assert.equal(await page.locator('.pcObject').count(),6);assert.equal(await page.locator('#pwPositionCount').textContent(),'6');
   await page.locator('.pcMarker').first().click();
   await page.locator('.pcChoices [data-status=ok]').first().click();await page.locator('.pcChoices [data-status=remark]').nth(1).click();
   await page.locator('.pcPointNote').nth(1).fill('Behöver justeras');await page.locator('#pcTechnician').fill('Avdyl');await page.locator('#pcSignature').fill('AA');await page.locator('#pcNewPoint').fill('1.3 Extra kontroll');await page.locator('#pcAddPoint button').click();
   assert.equal(await page.locator('.pcCheck').count(),3);assert.equal(await page.locator('#pcProgress').textContent(),'33%');
   await page.locator('#pcNotes').fill('Egen notering');await page.locator('#pcSignature').click();
   const protoDownload=page.waitForEvent('download');await page.locator('#pcExport').click();const proto=await PDFDocument.load(fs.readFileSync(await(await protoDownload).path()));assert(proto.getPageCount()>0);
   if(process.env.PROJECT_QA_DIR)await page.screenshot({path:path.join(process.env.PROJECT_QA_DIR,(mobile?'mobile':'desktop')+'-protocol.png')});
   await page.locator('#pcBack').click();
   await page.locator('#pcOpen').click();await page.locator('#pcOpenOld').click();await page.locator('#pcScan').click();await page.waitForFunction(()=>document.querySelector('#pcMessage').textContent.includes('Inga nya träffar'));await page.locator('#pcClose').click();
   const download=page.waitForEvent('download');await page.locator('#pwSaveProject').click();await page.locator('#pwSavePortable').click();portable=fs.readFileSync(await(await download).path());
   const saved=await PDFDocument.load(portable),data=JSON.parse(saved.catalog.get(PDFName.of('TillsynoProjectData')).decodeText());
   assert.equal(data.customProtocols.objects.length,6);assert.equal(data.customProtocols.rules.length,2);assert.equal(data.customProtocols.objects[0].points[1].note,'Behöver justeras');assert.equal(data.customProtocols.objects[0].signature,'AA');
   await context.setOffline(true);await page.reload();
   await page.locator('#pwFile').setInputFiles({name:'egna-koder.pdf',mimeType:'application/pdf',buffer:bytes});await page.waitForFunction(()=>document.querySelectorAll('.pcObject').length===6);
   await page.locator('.pcObject').first().click();await page.waitForFunction(()=>document.querySelector('#pcProtocol').open);assert.equal(await page.locator('#pcProgress').textContent(),'33%');assert.equal(await page.locator('#pcNotes').inputValue(),'Egen notering');
   await page.locator('.pcChoices [data-status=ok]').nth(1).click();await page.locator('.pcChoices [data-status=na]').nth(2).click();assert.equal(await page.locator('#pcProgress').textContent(),'100%');
   await page.locator('#pcBack').click();assert.equal(await page.locator('.pcMarker[data-progress="100"]').count(),1);
   assert.equal(await page.locator('#pwDoneCount').textContent(),'1');
   const offlineSave=page.waitForEvent('download');await page.locator('#pwSaveProject').click();await page.locator('#pwSavePortable').click();
   const offlineDoc=await PDFDocument.load(fs.readFileSync(await(await offlineSave).path()));const offlineData=JSON.parse(offlineDoc.catalog.get(PDFName.of('TillsynoProjectData')).decodeText());assert.equal(offlineData.customProtocols.objects[0].points[2].status,'na');
   const nextPdf=await PDFDocument.create(),nextFont=await nextPdf.embedFont(StandardFonts.Helvetica);nextPdf.addPage([600,800]).drawText('GZ-99',{x:70,y:700,size:16,font:nextFont});
   await page.reload();await page.locator('#pwFile').setInputFiles({name:'ny-offline.pdf',mimeType:'application/pdf',buffer:Buffer.from(await nextPdf.save())});await page.waitForFunction(()=>document.querySelectorAll('.pcCandidate').length===1);await page.locator('#pcSelectAll').click();await page.locator('#pcCreate').click();await page.waitForFunction(()=>document.querySelectorAll('.pcMarker').length===1);assert((await page.locator('.pcObject').textContent()).includes('GZ-99'));
   assert.deepEqual(errors,[]);await context.close();console.log('PASS '+(mobile?'mobile':'desktop')+': own templates, exact/prefix matching, review, clickable protocols, portable PDF, offline recovery, new PDF matching, edits and export');
  }
  // Import on a fresh device: no local templates or project status required.
  const fresh=await browser.newContext();const page=await fresh.newPage();await page.goto(url);await page.locator('#pwFile').setInputFiles({name:'projekt-sparat.pdf',mimeType:'application/pdf',buffer:portable});await page.waitForFunction(()=>document.querySelectorAll('.pcObject').length===6);await page.locator('.pcObject').first().click();await page.waitForFunction(()=>document.querySelector('#pcProtocol').open);assert.equal(await page.locator('#pcProgress').textContent(),'33%');assert.equal(await page.locator('#pcTechnician').inputValue(),'Avdyl');await page.locator('#pcBack').click();await page.locator('#pcOpen').click();await page.locator('#pcOpenOld').click();assert.equal(await page.locator('.pcRule').count(),2);await fresh.close();console.log('PASS fresh device: rules and protocol state restored from project PDF');
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve))}
})().catch(error=>{console.error(error);server.close();process.exitCode=1});
