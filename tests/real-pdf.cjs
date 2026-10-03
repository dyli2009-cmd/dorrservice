const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
function drawing(){
 const content='0.5 w 100 100 800 1300 re S 100 700 m 900 700 l S 500 100 m 500 1400 l S';
 const objects=['<< /Type /Catalog /Pages 2 0 R >>','<< /Type /Pages /Kids [3 0 R 5 0 R] /Count 2 >>','<< /Type /Page /Parent 2 0 R /MediaBox [0 0 1000 1500] /Resources << >> /Contents 4 0 R >>',`<< /Length ${content.length} >>\nstream\n${content}\nendstream`,'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 1000 1500] /Resources << >> /Contents 4 0 R >>'];
 let text='%PDF-1.4\n',offsets=[0];objects.forEach((object,i)=>{offsets.push(text.length);text+=`${i+1} 0 obj\n${object}\nendobj\n`});const start=text.length;text+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`+offsets.slice(1).map(offset=>String(offset).padStart(10,'0')+' 00000 n \n').join('')+`trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${start}\n%%EOF`;return Buffer.from(text);
}
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:390,height:844},isMobile:true,hasTouch:true});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://cdnjs.cloudflare.com/**',route=>{const name=new URL(route.request().url()).pathname.split('/').pop();return route.fulfill({contentType:'application/javascript',body:name.startsWith('pdf.')?fs.readFileSync(path.join(process.env.PDFJS_DIR||'/tmp',name)):'window.jspdf={};'})});
  await page.route('https://dorrservice.test/**',route=>{const pathname=new URL(route.request().url()).pathname;const file=pathname==='/'?'index.html':pathname.slice(1);return route.fulfill({contentType:file.endsWith('.js')?'application/javascript':file.endsWith('.css')?'text/css':'text/html',body:fs.readFileSync(path.join(__dirname,'..',file))})});
  await page.goto('https://dorrservice.test/');
  await page.locator('#file').setInputFiles({name:'test-ritning.pdf',mimeType:'application/pdf',buffer:drawing()});
  await page.waitForFunction(()=>document.querySelector('#pageInfo').textContent==='Sida 1 / 2');
  await page.locator('#mobileAdd').tap();await page.locator('#markers').tap({position:{x:160,y:180}});
  await page.locator('#closeProtocol').tap();
  await page.evaluate(async()=>{setZoom(8);await renderQueue});
  assert.equal(await page.locator('#zoomInfo').textContent(),'800%');
  assert(await page.locator('#pdfCanvas').evaluate(el=>el.width*el.height<4010000));
  await page.locator('#mobileFit').tap();await page.waitForFunction(()=>document.querySelector('#zoomInfo').textContent==='100%');
  await page.locator('#next').tap();await page.waitForFunction(()=>document.querySelector('#pageInfo').textContent==='Sida 2 / 2');
  await page.locator('#prev').tap();await page.waitForFunction(()=>document.querySelector('#pageInfo').textContent==='Sida 1 / 2');
  assert.equal(await page.locator('.marker').count(),1);assert.deepEqual(errors,[]);
  await page.screenshot({path:path.join(__dirname,'..','mobile-preview.png')});
  console.log('PASS: real PDF.js two-page drawing, mobile placement, 8x bounded zoom, fit, page navigation');
 }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
