const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'drawing-tools.html'),'utf8');
const js=fs.readFileSync(path.join(root,'drawing-tools.js'),'utf8');
const transfer=fs.readFileSync(path.join(root,'drawing-transfer.js'),'utf8');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const security=fs.readFileSync(path.join(root,'security.html'),'utf8');

assert(index.includes('Ritningsverktyg'),'Home must expose Drawing Tools');
assert(html.includes('id="removeText"')&&html.includes('id="removePage"'),'Drawing Tools must expose cleanup and page removal');
assert(js.includes('whiteOutText'),'Drawing Tools must support text cleanup');
assert(js.includes('embedJpg'),'Drawing Tools must flatten/optimize pages');
assert(js.includes('DoorServiceDrawingTransfer.putPdf'),'Drawing Tools must transfer the cleaned PDF');
assert(transfer.includes("indexedDB.open('doorservice-drawing-transfer-v1'"),'Transfer must use IndexedDB for large PDFs');
assert(index.includes('drawing-transfer.js?v=2.4.29'),'Door Automation must accept Drawing Tools transfer');
assert(security.includes('drawing-transfer.js?v=2.4.29'),'Security Service must accept Drawing Tools transfer');
assert(html.includes('Öppna i Dörrautomatik')&&html.includes('Öppna i Säkerhetsservice'),'Drawing Tools must route to both service modes');
console.log('Drawing Tools regression checks passed.');

assert(html.includes('id="aggressiveClean"'),'Aggressive cleanup control must exist');
assert(html.includes('id="eraseMode"'),'Manual area eraser must exist');
assert(html.includes('id="removeColors"'),'Colored-mark cleanup must exist');
assert(js.includes('stripColoredMarks'),'Drawing Tools must remove colored marks when requested');
assert(js.includes('applyManualMasks'),'Manual erased areas must be applied to output');
assert(js.includes("addEventListener('pointerdown'"),'Area eraser must support direct pointer dragging');
console.log('Aggressive cleanup regression checks passed.');
