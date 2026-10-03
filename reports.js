const REPORT_COLORS={ok:{rgb:[35,131,84],light:[229,244,234]},action:{rgb:[170,102,0],light:[255,242,216]},fail:{rgb:[179,48,57],light:[252,229,231]},untested:{rgb:[97,117,131],light:[235,241,244]}};
function buildServiceReportDoc(snapshot,includeProtocols){
 const {project:p,doors:ds,logoData:logo}=snapshot,doc=new jspdf.jsPDF('p','mm','a4');
 const left=12,width=186,bottom=277,line=4;let y=0;
 const sorted=ds.slice().sort((a,b)=>a.page-b.page||a.id.localeCompare(b.id,'sv',{numeric:true}));
 const status=d=>d.status==='fail'?'fail':hasDoorProblem(d)?'action':d.status==='ok'?'ok':'untested';
 const label=d=>({ok:'Godkänd',action:d.status==='action'?'Åtgärd krävs':'Anmärkningar',fail:'Ej godkänd',untested:'Ej kontrollerad'})[status(d)];
 function text(value,x,y,size=9,bold=false,color=[32,52,64]){doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(size);doc.setTextColor(...color);doc.text(String(value||'-'),x,y)}
 function header(title,subtitle){
  doc.setFillColor(19,43,56);doc.rect(0,0,210,24,'F');text(title,left,11,15,true,[255,255,255]);text(subtitle,left,18,8,false,[198,216,226]);
  if(logo){try{const image=doc.getImageProperties(logo),scale=Math.min(26/image.width,13/image.height);doc.addImage(logo,171,5,image.width*scale,image.height*scale)}catch(e){}}
  y=32;doc.setDrawColor(204,215,223);doc.setLineWidth(.2);
 }
 function field(label,value,x,y,w){doc.setFillColor(243,247,249);doc.rect(x,y,w,13,'F');text(label,x+2,y+4,6.5,true,[89,110,123]);doc.setFontSize(8);doc.setFont('helvetica','normal');doc.setTextColor(32,52,64);doc.text(doc.splitTextToSize(String(value||'-'),w-4).slice(0,2),x+2,y+8.5)}
 function projectFields(){[['OBJEKT',p.projectName||p.facilityNo],['OBJEKTNUMMER',p.facilityNo],['ORDER',p.projectOrder]].forEach(([l,v],i)=>field(l,v,left+i*62,y,60));y+=16;[['DATUM',p.inspectionDate],['TEKNIKER',p.technician||p.company],['SIGNATUR',p.serviceSignature]].forEach(([l,v],i)=>field(l,v,left+i*62,y,60));y+=17}
 function overviewHeader(){header('ANMÄRKNINGSÖVERSIKT','Dörrautomatik · kundrapport');projectFields();text(ds.length+' dörrar · '+ds.filter(hasDoorProblem).length+' med anmärkningar · '+ds.filter(d=>completedChecks(d)<CHECKS.length||d.status==='untested').length+' ej klara',left,y,9,true);y+=8;let x=left;[['Godkänd','ok'],['Åtgärd krävs','action'],['Ej godkänd','fail'],['Ej kontrollerad','untested']].forEach(([title,key])=>{doc.setFillColor(...REPORT_COLORS[key].rgb);doc.circle(x+1,y-1,1.3,'F');text(title,x+4,y,7,false);x+=46});y+=8;text('Markeringarna på ritningen visar dörrens löpnummer.',left,y,7,false,[89,110,123]);y+=7;tableHead()}
 const widths=[33,115,38];
 function tableHead(){let x=left;['Dörr / placering','Anmärkning','Åtgärdat / signatur'].forEach((title,i)=>{doc.setFillColor(232,239,244);doc.rect(x,y,widths[i],9,'F');doc.rect(x,y,widths[i],9);text(title,x+2,y+5.5,7.5,true);x+=widths[i]});y+=9}
 function overviewPage(){doc.addPage();overviewHeader()}
 overviewHeader();const problems=sorted.filter(hasDoorProblem);
 if(!problems.length){doc.setFillColor(235,244,239);doc.rect(left,y,width,16,'F');text('Inga anmärkningar registrerade vid detta besök.',left+3,y+7,10,true,[29,112,71]);text('Se protokollen för vilka kontrollpunkter som är genomförda.',left+3,y+12,8);y+=20}
 problems.forEach(d=>{
  const issues=doorProblems(d).map(([n,t])=>n+' '+t+' – '+(d.checks[n].note?.trim()||'Fel markerat, beskrivning saknas.'));
  if(!issues.length)issues.push(label(d));if(d.notes?.trim())issues.push('Allmän anmärkning: '+d.notes.trim());
  doc.setFont('helvetica','normal');doc.setFontSize(8);
  const columns=[d.id+'\n'+(d.location||'')+'\n'+label(d),issues.join('\n'),[d.remediationDate,d.remediationSignature].filter(Boolean).join('\n')].map((value,i)=>doc.splitTextToSize(value,widths[i]-5));
  let offset=0,total=Math.max(...columns.map(c=>c.length),1);
  while(offset<total){
   const capacity=Math.floor((bottom-y-5)/line);if(capacity<1||bottom-y<12){overviewPage();continue}
   const count=Math.min(capacity,total-offset),height=Math.max(12,count*line+5),color=REPORT_COLORS[status(d)];let x=left;
   columns.forEach((lines,i)=>{doc.setFillColor(...(i===0?color.light:[255,255,255]));doc.rect(x,y,widths[i],height,'F');doc.rect(x,y,widths[i],height);const chunk=i===0&&offset>=lines.length?lines.slice(0,count):lines.slice(offset,offset+count);if(chunk.length){doc.setFont('helvetica',i===0?'bold':'normal');doc.setFontSize(8);doc.setTextColor(...(i===0?color.rgb:[32,52,64]));doc.text(chunk,x+2.5,y+4.5,{lineHeightFactor:line/(8*.3528)})}x+=widths[i]});y+=height;offset+=count;
   if(offset<total)overviewPage();
  }
 });
 if(includeProtocols)sorted.forEach(d=>{
  function cell(label,value,x,yy,w,h=9,bold=false){
   doc.setDrawColor(55,55,55);doc.setLineWidth(.18);doc.rect(x,yy,w,h);
   text(label,x+1.5,yy+3,5.8,true,[50,50,50]);
   if(value){doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(7.2);doc.setTextColor(25,25,25);doc.text(doc.splitTextToSize(String(value),w-3).slice(0,1),x+1.5,yy+7)}
  }
  function protocolTop(){
   doc.setDrawColor(55,55,55);doc.setLineWidth(.22);doc.rect(left,10,width,20);
   if(logo){try{const im=doc.getImageProperties(logo),boxX=left,boxY=10,boxW=58,boxH=20,pad=3,maxW=boxW-pad*2,maxH=boxH-pad*2,sc=Math.min(maxW/im.width,maxH/im.height),imgW=im.width*sc,imgH=im.height*sc,imgX=boxX+(boxW-imgW)/2,imgY=boxY+(boxH-imgH)/2;doc.addImage(logo,imgX,imgY,imgW,imgH)}catch(e){}}
   doc.line(left+58,10,left+58,30);doc.setFont('helvetica','bold');doc.setFontSize(12);doc.setTextColor(25,25,25);doc.text('Egenkontroll Dörrautomatik Slagdörr',left+58+(width-58)/2,21,{align:'center'});
   y=38;
   cell('Bokat besök datum:',p.inspectionDate,left,y,93);cell('Nästa provning datum:',d.nextDate||p.projectNextDate,left+93,y,93);y+=9;
   cell('ANLÄGGNING:',p.projectName,left,y,28,true);cell('Anläggningsnummer:',p.facilityNo,left+28,y,65);cell('BESTÄLLARE:',p.customer,left+93,y,27,true);cell('Avtalsnummer:','',left+120,y,66);y+=9;
   cell('Företag:',p.company,left,y,93);cell('Företag:','',left+93,y,93);y+=9;
   cell('Kontaktman på objektet:',p.contact,left,y,93);cell('Kontaktperson:',p.contact,left+93,y,93);y+=9;
   cell('Telefonnummer:',p.phone,left,y,93);cell('Telefonnummer:','',left+93,y,93);y+=9;
   cell('Adress:','',left,y,93);cell('Adress:','',left+93,y,93);y+=9;
   cell('Postnummer / Postadress:','',left,y,93);cell('Postnummer / Postadress:','',left+93,y,93);y+=9;
   cell('Id nummermaskin:',d.machineId||d.id,left,y,49);cell('Placering/Dörrlittra:',d.location,left+49,y,92);cell('Ao nummer:',d.ao||p.projectOrder,left+141,y,45);y+=11;
  }
  function checkHeader(){
   const ws=[10,99,15,25,27,10],titles=['Nr:','Benämning Kontroll','Ingår ej','Klart utan\nAnmärkning','Klart med\nAnmärkning','Signatur'];let x=left;
   titles.forEach((t,i)=>{doc.setFillColor(244,244,244);doc.rect(x,y,ws[i],11,'FD');doc.setFont('helvetica','bold');doc.setFontSize(i>1?6.3:7);doc.setTextColor(25,25,25);doc.text(t.split('\\n'),x+1.3,y+4,{lineHeightFactor:1.05});x+=ws[i]});y+=11;
  }
  doc.addPage();protocolTop();checkHeader();
  const ws=[10,99,15,25,27,10];
  CHECKS.forEach(([n,title])=>{
   const c=d.checks[n]||{},h=8;if(y+h>252){doc.addPage();protocolTop();checkHeader()}
   let x=left;const vals=[n,title,c.result==='na'?'X':'',c.result==='ok'?'X':'',c.result==='remark'?'X':c.result==='remark'?'X':'',p.serviceSignature||d.signature||''];
   vals.forEach((v,i)=>{if(i===3&&c.result==='ok')doc.setFillColor(...REPORT_COLORS.ok.light);else if(i===4&&c.result==='remark')doc.setFillColor(...REPORT_COLORS.fail.light);else if(i===2&&c.result==='na')doc.setFillColor(238,238,238);else doc.setFillColor(255,255,255);doc.rect(x,y,ws[i],h,'FD');doc.setFont('helvetica',i===0?'bold':'normal');doc.setFontSize(i===1?6.8:7);doc.setTextColor(25,25,25);if(i===1)doc.text(doc.splitTextToSize(String(v||''),ws[i]-3).slice(0,2),x+1.5,y+3.2,{lineHeightFactor:1});else doc.text(String(v||''),x+ws[i]/2,y+5,{align:'center'});x+=ws[i]});y+=h;
  });
  y+=6;doc.setFillColor(247,247,247);doc.rect(left,y,width,8,'FD');text('Allmän Info:',left+2,y+5.3,7.5,true,[55,55,55]);y+=8;
  const notes=[...doorProblems(d).map(([n,t])=>n+' '+t+' – '+(d.checks[n].note?.trim()||'Beskrivning saknas.')),d.notes].filter(Boolean).join('\n');
  const lines=doc.splitTextToSize(notes||'',width-5);const boxH=Math.max(32,Math.min(48,lines.length*4+8));doc.rect(left,y,width,boxH);for(let ly=y+8;ly<y+boxH;ly+=8){doc.setDrawColor(180,180,180);doc.line(left,ly,left+width,ly)}if(lines.length){doc.setFont('helvetica','normal');doc.setFontSize(7.5);doc.setTextColor(30,30,30);doc.text(lines.slice(0,9),left+2,y+5,{lineHeightFactor:1.35})}
 });
 const pages=doc.getNumberOfPages();for(let i=1;i<=pages;i++){doc.setPage(i);doc.setDrawColor(204,215,223);doc.line(left,284,198,284);text([p.company,p.projectName||p.facilityNo].filter(Boolean).join(' · ')||'Dörrservice',left,289,7,false,[89,110,123]);text('Sida '+i+' av '+pages,177,289,7,false,[89,110,123])}
 return doc;
}
