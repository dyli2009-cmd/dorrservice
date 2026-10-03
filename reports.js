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
  function protocolHeader(continued=false){header('PROVNINGSPROTOKOLL',d.id+(continued?' · fortsättning':'')+' · '+(d.model||'Dörrautomatik'));projectFields();const col=REPORT_COLORS[status(d)];doc.setFillColor(...col.light);doc.rect(left,y,width,9,'F');text(label(d)+' · '+completedChecks(d)+' av '+CHECKS.length+' punkter kontrollerade',left+3,y+6,9,true,col.rgb);y+=13;}
  function next(){doc.addPage();protocolHeader(true)}
  doc.addPage();protocolHeader();[['MÄRKNING',d.id],['PLACERING',d.location||'Sida '+d.page],['MODELL / KOD',(d.model||'-')+(d.modelCode?' / '+d.modelCode:'')]].forEach(([l,v],i)=>field(l,v,left+i*62,y,60));y+=16;
  [['MASKIN-ID',d.machineId],['LÖPNUMMER',d.serialNumber],['ORDER / AO',d.ao||p.projectOrder]].forEach(([l,v],i)=>field(l,v,left+i*62,y,60));y+=17;
  function checkHead(){doc.setFillColor(232,239,244);doc.rect(left,y,width,8,'F');text('Nr',left+2,y+5,7.5,true);text('Kontrollpunkt',left+15,y+5,7.5,true);text('Resultat',left+147,y+5,7.5,true);y+=8}
  checkHead();
  CHECKS.forEach(([n,title])=>{
   const c=d.checks[n]||{},key=c.result==='remark'?'fail':c.result==='ok'?'ok':'untested',result={ok:'OK',remark:'Fel',na:'Ej tillämplig'}[c.result]||'Ej kontrollerad';doc.setFontSize(8);doc.setFont('helvetica','normal');const lines=doc.splitTextToSize(title,126),height=Math.max(7,lines.length*3.4+3);
   if(y+height>bottom){next();checkHead()}
   doc.setFillColor(...(c.result==='remark'?REPORT_COLORS.fail.light:[255,255,255]));doc.rect(left,y,width,height,'F');doc.line(left,y+height,left+width,y+height);text(n,left+2,y+4.5,7.5);doc.setFontSize(8);doc.setTextColor(32,52,64);doc.text(lines,left+15,y+4.5,{lineHeightFactor:1.2});text(result,left+147,y+4.5,7.5,true,REPORT_COLORS[key].rgb);y+=height;
  });
  function paragraph(title,value){
   if(!value)return;if(y+13>bottom)next();y+=6;text(title,left,y,9,true);y+=5;doc.setFontSize(8.5);doc.setFont('helvetica','normal');const lines=doc.splitTextToSize(value,width-4);let offset=0;
   while(offset<lines.length){let count=Math.floor((bottom-y)/4);if(count<1){next();count=Math.floor((bottom-y)/4)}doc.setFontSize(8.5);doc.setFont('helvetica','normal');doc.setTextColor(32,52,64);doc.text(lines.slice(offset,offset+count),left,y,{lineHeightFactor:4/(8.5*.3528)});const taken=Math.min(count,lines.length-offset);y+=taken*4;offset+=taken;if(offset<lines.length)next()}
  }
  paragraph('ANMÄRKNINGAR',doorProblems(d).map(([n,t])=>n+' '+t+' – '+(d.checks[n].note?.trim()||'Beskrivning saknas.')).join('\n'));
  paragraph('ALLMÄN ANMÄRKNING',d.notes||'');paragraph('ÅTGÄRDAT', [d.remediationDate,d.remediationSignature].filter(Boolean).join(' · '));
  paragraph('NÄSTA PROVNING',d.nextDate||p.projectNextDate||'');
 });
 const pages=doc.getNumberOfPages();for(let i=1;i<=pages;i++){doc.setPage(i);doc.setDrawColor(204,215,223);doc.line(left,284,198,284);text([p.company,p.projectName||p.facilityNo].filter(Boolean).join(' · ')||'Dörrservice',left,289,7,false,[89,110,123]);text('Sida '+i+' av '+pages,177,289,7,false,[89,110,123])}
 return doc;
}
