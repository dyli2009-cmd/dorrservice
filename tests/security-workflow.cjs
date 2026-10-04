const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const js=fs.readFileSync(path.join(root,'security.js'),'utf8');
const html=fs.readFileSync(path.join(root,'security.html'),'utf8');

assert(js.includes("PDFName.of('SecurityServiceWork')"),'Security work-PDF metadata must be embedded/read');
assert(js.includes("app:'security-service',version:2"),'Security work-PDF state version must exist');
assert(js.includes('inspectSecurityWorkPdf'),'Security work-PDF import must exist');
assert(js.includes("project.order='';project.date=new Date().toISOString().slice(0,10);project.technician='';project.signature=''"),'New service must reset visit-specific fields only');
assert(js.includes('previousIssues')&&js.includes('previousServiceDate'),'Previous service history must be preserved');
assert(html.includes('id="secNewServiceBtn"'),'New service button must exist');
assert(html.includes('id="secPreviousPanel"'),'Previous service panel must exist');

console.log('Security work-PDF / new-service regression checks passed.');
