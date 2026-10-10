'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'..','project-workspace-smartmatch-v36-44.js'),'utf8');
const start=source.indexOf('function smartRemoveOldProgressStreams(');
const end=source.indexOf('\nfunction smartProgressLayer(',start);
assert.ok(start!==-1&&end>start,'status cleanup function found');
const text=source.slice(start,end);
class PDFArray{constructor(items){this.items=items}asArray(){return this.items}size(){return this.items.length}get(index){return this.items[index]}}
const PDFName={of:label=>label};
const cleanup=new Function('PDFLib',text+';return smartRemoveOldProgressStreams;')({PDFName,PDFArray});
const ctx={obj:values=>Array.isArray(values)?new PDFArray(values):values,lookup:x=>x};
const store=new Map();
const doc={context:ctx,catalog:{
 get:key=>store.get(key),
 set:(key,value)=>store.set(key,value)
}};
assert.equal(cleanup(doc,[]),0,'no previous status to delete');
assert.equal(store.get('SmartMatch36ProgressStreams').size(),0,'empty status index exists for first PDF export');
assert.equal(cleanup(doc,[]),0,'re-export of zero progress remains valid');
assert.equal(store.get('SmartMatch36ProgressStreams').size(),0,'empty index survives re-export');
// With existing progress streams, delete only the tagged content, not original content.
const ref=id=>({toString:()=>id});
const pageRef=ref('1 0 R'), oldStream=ref('2 0 R'), original=ref('3 0 R');
let contents=new PDFArray([original,oldStream]);
const page={ref:pageRef,node:{
 normalizedEntries:()=>({Contents:contents}),
 set:(key,value)=>{assert.equal(key,'Contents');contents=value}
}};
store.set('SmartMatch36ProgressStreams',new PDFArray([new PDFArray([pageRef,oldStream])]));
assert.equal(cleanup(doc,[page]),1,'old status content removed');
assert.deepEqual(contents.asArray().map(String),['3 0 R'],'original PDF content retained');
assert.equal(store.get('SmartMatch36ProgressStreams').size(),0,'status index cleared for new export');
console.log('OK: SmartMatch v36.44 first PDF export, repeat export, tagged status replacement');
