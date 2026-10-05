const REPORT_COLORS={ok:{rgb:[35,131,84],light:[229,244,234]},action:{rgb:[170,102,0],light:[255,242,216]},fail:{rgb:[179,48,57],light:[252,229,231]},untested:{rgb:[97,117,131],light:[235,241,244]}};
function buildServiceReportDoc(snapshot,includeProtocols){
 const {project:p,doors:ds,logoData:logo}=snapshot,doc=new jspdf.jsPDF('p','mm','a4');
 const left=12,width=186,bottom=277,line=4;let y=0;
 const sorted=ds.slice().sort((a,b)=>a.page-b.page||a.id.localeCompare(b.id,'sv',{numeric:true}));
 const status=d=>isDoorRemediated(d)?'ok':d.status==='fail'?'fail':hasDoorProblem(d)?'action':d.status==='ok'?'ok':'untested';
 const label=d=>isDoorRemediated(d)?'Åtgärdad':({ok:'Godkänd',action:d.status==='action'?'Åtgärd krävs':'Anmärkningar',fail:'Ej godkänd',untested:'Ej kontrollerad'})[status(d)];
 function text(value,x,y,size=9,bold=false,color=[32,52,64],opts){doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(size);doc.setTextColor(...color);doc.text(String(value||'-'),x,y,opts||{})}
 function header(title,subtitle){
  doc.setFillColor(255,255,255);doc.setDrawColor(55,55,55);doc.setLineWidth(.22);doc.rect(left,8,width,18,'FD');doc.line(left+58,8,left+58,26);
  if(logo){try{const image=doc.getImageProperties(logo),pad=2.5,scale=Math.min((58-pad*2)/image.width,(18-pad*2)/image.height),iw=image.width*scale,ih=image.height*scale;doc.addImage(logo,left+(58-iw)/2,8+(18-ih)/2,iw,ih)}catch(e){}}
  text(title,left+58+(width-58)/2,16.2,9.6,true,[25,25,25],{align:'center'});text(subtitle,left+58+(width-58)/2,21.4,6.8,false,[70,82,90],{align:'center'});
  y=32;doc.setDrawColor(204,215,223);doc.setLineWidth(.2);
 }
 function field(label,value,x,yy,w,signature=false){
  doc.setFillColor(248,248,248);doc.setDrawColor(185,185,185);doc.setLineWidth(.22);doc.rect(x,yy,w,13,'FD');
  text(label,x+2,yy+4,6.6,true,[82,82,82]);
  doc.setFont('helvetica',signature?'italic':'normal');doc.setFontSize(signature?8.8:8.2);doc.setTextColor(...(signature?[70,125,165]:[25,25,25]));
  doc.text(doc.splitTextToSize(String(value||'-'),w-4).slice(0,2),x+2,yy+8.8,{lineHeightFactor:1.05});
 }
 function projectFields(){
  field('ANLÄGGNING',p.projectName||p.facilityNo,left,y,70);
  field('ANLÄGGNINGSNUMMER',p.facilityNo,left+70,y,50);
  field('ORDER',p.projectOrder,left+120,y,66);y+=15;
  field('DATUM',p.inspectionDate,left,y,42);
  field('NÄSTA PROVNING',p.projectNextDate,left+42,y,48);
  field('BESTÄLLARE',p.customer,left+90,y,48);
  field('SERVICEFÖRETAG',p.company,left+138,y,48);y+=17;
 }
 function overviewHeader(){
  header('ANMÄRKNINGSÖVERSIKT','DÖRRAUTOMATIK · KUNDRAPPORT');projectFields();
  const open=ds.filter(d=>status(d)==='action').length,failed=ds.filter(d=>status(d)==='fail').length,done=ds.filter(isDoorRemediated).length,ready=ds.filter(d=>d.status==='ok'&&!hasRecordedDoorProblem(d)).length,untested=ds.filter(d=>status(d)==='untested').length;
  const stats=[['TOTALT',ds.length,'Alla dörrar'],['KLARA',ready,'Godkända'],['ÅTGÄRDADE',done,'Klarmarkerade'],['ÖPPNA FEL',open,'Åtgärd krävs'],['EJ GODKÄNDA',failed,'Underkända'],['EJ KONTROLL.',untested,'Ej kontrollerade']];
  const boxW=width/6;
  stats.forEach(([title,value,meaning],i)=>{
   const x=left+i*boxW,fill=i%2?[250,250,250]:[244,244,244];
   doc.setFillColor(...fill);doc.setDrawColor(150,150,150);doc.setLineWidth(.3);doc.rect(x,y,boxW,16,'FD');
   text(title,x+boxW/2,y+4.6,6.5,true,[55,55,55],{align:'center'});
   text(value,x+boxW/2,y+10.3,11.3,true,[15,15,15],{align:'center'});
   text(meaning,x+boxW/2,y+14.1,5.2,false,[95,95,95],{align:'center'});
  });
  y+=18;text('Åtgärdade anmärkningar ligger kvar som historik.',left,y,6.0,false,[95,95,95]);y+=5;tableHead()
 }
 const widths=[33,115,38];
 function tableHead(){let x=left;['Dörr / placering','Anmärkning','Åtgärdat / signatur'].forEach((title,i)=>{doc.setFillColor(232,239,244);doc.rect(x,y,widths[i],9,'F');doc.rect(x,y,widths[i],9);text(title,x+2,y+5.5,7.5,true);x+=widths[i]});y+=9}
 function overviewPage(){doc.addPage();overviewHeader()}
 overviewHeader();const problems=sorted.filter(hasRecordedDoorProblem).sort((a,b)=>{const rank=d=>isDoorRemediated(d)?2:status(d)==='fail'?0:1;return rank(a)-rank(b)||a.page-b.page||a.id.localeCompare(b.id,'sv',{numeric:true})});
 if(!problems.length){doc.setFillColor(235,244,239);doc.rect(left,y,width,16,'F');text('Inga anmärkningar registrerade vid detta besök.',left+3,y+7,10,true,[29,112,71]);text('Se protokollen för vilka kontrollpunkter som är genomförda.',left+3,y+12,8);y+=20}
 problems.forEach(d=>{
  const issues=doorProblems(d).map(([n,t])=>d.checks[n].note?.trim()||t);
  if(!issues.length)issues.push(label(d));if(d.notes?.trim())issues.push('Allmän anmärkning: '+d.notes.trim());
  doc.setFont('helvetica','normal');doc.setFontSize(8);
  const remediation=isDoorRemediated(d)?['Åtgärdad: '+d.remediationDate,'Signatur: '+d.remediationSignature].join('\n'):[d.remediationDate,d.remediationSignature].filter(Boolean).join('\n');
  const columns=[d.id+'\nPlacering: '+(d.location||'-')+'\n'+label(d),issues.join('\n'),remediation].map((value,i)=>doc.splitTextToSize(value,widths[i]-5));
  let offset=0,total=Math.max(...columns.map(c=>c.length),1);
  while(offset<total){
   const capacity=Math.floor((bottom-y-5)/line);if(capacity<1||bottom-y<12){overviewPage();continue}
   const count=Math.min(capacity,total-offset),height=Math.max(12,count*line+5),color=REPORT_COLORS[status(d)];let x=left;
   columns.forEach((lines,i)=>{doc.setFillColor(...(i===0?[246,246,246]:[255,255,255]));doc.setDrawColor(145,145,145);doc.setLineWidth(.2);doc.rect(x,y,widths[i],height,'FD');const chunk=i===0&&offset>=lines.length?lines.slice(0,count):lines.slice(offset,offset+count);if(chunk.length){doc.setFont('helvetica',i===0?'bold':'normal');doc.setFontSize(8);doc.setTextColor(30,30,30);doc.text(chunk,x+2.5,y+4.5,{lineHeightFactor:line/(8*.3528)})}x+=widths[i]});y+=height;offset+=count;
   if(offset<total)overviewPage();
  }
 });
 if(includeProtocols)sorted.forEach(d=>{
  function cell(label,value,x,yy,w,h=7,bold=false,signature=false){
   doc.setFillColor(252,252,252);doc.setDrawColor(150,150,150);doc.setLineWidth(.2);doc.rect(x,yy,w,h,'FD');
   const labelText=String(label||'');doc.setFont('helvetica','bold');doc.setFontSize(5.9);doc.setTextColor(82,82,82);
   const labelW=Math.min(w-7,doc.getTextWidth(labelText)+2.2);doc.text(labelText,x+1.5,yy+h/2+1);
   if(value!==undefined&&value!==null&&String(value)!==''){
    doc.setFont('helvetica',signature?'italic':(bold?'bold':'normal'));doc.setFontSize(signature?7.2:6.7);doc.setTextColor(...(signature?[70,125,165]:[20,20,20]));
    doc.text(doc.splitTextToSize(String(value),Math.max(5,w-labelW-3)).slice(0,1),x+1.5+labelW,yy+h/2+1);
   }
  }
  function pdfCheckmark(cx,cy,size=8){
   doc.setFont('zapfdingbats','normal');doc.setFontSize(size);doc.setTextColor(20,20,20);
   doc.text(String.fromCharCode(51),cx,cy+size*.12,{align:'center'});
  }
  function backToDrawingButton(){
   const bx=188,by=19.1,bw=8,bh=5.8;
   doc.setFillColor(19,43,56);doc.setDrawColor(19,43,56);doc.setLineWidth(.18);doc.rect(bx,by,bw,bh,'FD');
   const cy=by+bh/2;doc.setDrawColor(255,255,255);doc.setLineWidth(.6);doc.setLineCap('round');
   doc.line(bx+2.1,cy,bx+5.9,cy);doc.line(bx+2.1,cy,bx+3.8,cy-1.35);doc.line(bx+2.1,cy,bx+3.8,cy+1.35);doc.setLineCap('butt');
   doc.__doorBackLinks=doc.__doorBackLinks||[];
   doc.__doorBackLinks.push({doorKey:d.uid||d.id,pageNo:doc.getNumberOfPages(),drawingPage:d.page,rect:[bx,by,bw,bh]});
  }
  function protocolTop(){
   doc.setDrawColor(55,55,55);doc.setLineWidth(.22);doc.rect(left,8,width,18);
   if(logo){try{const im=doc.getImageProperties(logo),boxX=left,boxY=8,boxW=58,boxH=18,pad=2.5,maxW=boxW-pad*2,maxH=boxH-pad*2,sc=Math.min(maxW/im.width,maxH/im.height),imgW=im.width*sc,imgH=im.height*sc,imgX=boxX+(boxW-imgW)/2,imgY=boxY+(boxH-imgH)/2;doc.addImage(logo,imgX,imgY,imgW,imgH)}catch(e){}}
   doc.line(left+58,8,left+58,26);doc.setTextColor(25,25,25);doc.setFont('helvetica','bold');doc.setFontSize(6.3);doc.text('Dokumentnr: 2519-1',left+61,12.4);doc.setFontSize(9.6);doc.text('CHECKLISTA REVISION AV DÖRRAUTOMATIK',left+58+(width-58)/2,18.7,{align:'center'});
   doc.setDrawColor(155,155,155);doc.setLineWidth(.22);doc.line(left,36.2,left+width,36.2);
   doc.setFillColor(255,255,255);doc.rect(left,31.8,28,7,'F');
   doc.setFont('helvetica','bold');doc.setFontSize(9.4);doc.setTextColor(25,25,25);doc.text('SERVICE',left+1.5,36.7);
   y=40;
   cell('Bokat datum:',p.inspectionDate,left,y,93);cell('Nästa provning:',p.projectNextDate,left+93,y,93);y+=7;
   cell('ANLÄGGNING:',p.projectName,left,y,93,7,true);cell('Anläggningsnr:',p.facilityNo,left+93,y,93,7,true);y+=7;
   cell('SERVICEFÖRETAG:',p.company,left,y,93,7,true);cell('BESTÄLLARE / KUND:',p.customer,left+93,y,93,7,true);y+=7;
   cell('Kontaktperson på objektet:',p.companyContact,left,y,93);cell('Kontaktperson:',p.contact,left+93,y,93);y+=7;
   cell('Telefon:',p.companyPhone,left,y,93);cell('Telefon:',p.phone,left+93,y,93);y+=7;
   cell('Adress:',p.companyAddress,left,y,93);cell('Adress:',p.address,left+93,y,93);y+=7;
   cell('Postnummer / Postadress:',[p.companyPostalCode,p.companyPostalCity].filter(Boolean).join(' '),left,y,93);cell('Postnummer / Postadress:',[p.postalCode,p.postalCity].filter(Boolean).join(' '),left+93,y,93);y+=7;
   cell('ID / märkning:',d.id,left,y,54,8,true);cell('Placering:',d.location,left+54,y,66,8);cell('AO nummer:',p.projectOrder,left+120,y,66,8,true);y+=8;
  }
  function checkHeader(){
   const ws=[9,91,16,24,28,18],titles=['Nr','Benämning / kontrollpunkt','Ingår ej','Klart utan\nanmärkning','Klart med\nanmärkning','Signatur'];let x=left;
   titles.forEach((t,i)=>{
    doc.setFillColor(...(i===1?[226,226,226]:[238,238,238]));doc.setDrawColor(120,120,120);doc.setLineWidth(.24);doc.rect(x,y,ws[i],10,'FD');
    doc.setFont('helvetica','bold');doc.setFontSize(i>1?5.9:6.6);doc.setTextColor(35,35,35);const lines=t.split('\n');
    if(i===1)doc.text(lines,x+2,y+6.1,{lineHeightFactor:1});
    else doc.text(lines,x+ws[i]/2,y+3.7,{align:'center',lineHeightFactor:1});
    x+=ws[i];
   });y+=10;
  }
  doc.addPage();doc.__doorProtocolPages=doc.__doorProtocolPages||{};doc.__doorProtocolPages[d.uid||d.id]=doc.getNumberOfPages();backToDrawingButton();protocolTop();checkHeader();
  const ws=[9,91,16,24,28,18],checks=doorChecks(d),notesReserve=29,rowH=Math.max(5.95,Math.min(7.1,(270-y-notesReserve)/Math.max(1,checks.length)));
  checks.forEach(([n,title])=>{
   const c=d.checks[n]||{},titleSize=rowH<6.7?5.7:6.15,step=rowH<6.7?2.05:2.25;doc.setFont('helvetica','normal');doc.setFontSize(titleSize);
   const titleLines=doc.splitTextToSize(String(title||''),ws[1]-3.8).slice(0,2);let x=left;
   const vals=[n,title,c.result==='na'?'–':'','',c.result==='remark'?'X':'',p.serviceSignature||d.signature||''];
   vals.forEach((v,i)=>{
    doc.setFillColor(...(i===1?[248,248,248]:[255,255,255]));doc.setDrawColor(145,145,145);doc.setLineWidth(.18);doc.rect(x,y,ws[i],rowH,'FD');doc.setTextColor(25,25,25);
    if(i===1){
      doc.setFont('helvetica','normal');doc.setFontSize(titleSize);const startY=y+rowH/2-((titleLines.length-1)*step)/2+.7;doc.text(titleLines,x+1.7,startY,{lineHeightFactor:1});
    }else if(i===2&&c.result==='na'){
      const cx=x+ws[i]/2,cy=y+rowH/2;doc.setDrawColor(45,45,45);doc.setLineWidth(.8);doc.line(cx-3,cy,cx+3,cy);
    }else if(i===3&&c.result==='ok'){
      const cx=x+ws[i]/2,cy=y+rowH/2;pdfCheckmark(cx,cy,8.2);
    }else if(i===4&&c.result==='remark'){
      const cx=x+ws[i]/2,cy=y+rowH/2;doc.setDrawColor(20,20,20);doc.setLineWidth(.7);doc.line(cx-2.1,cy-2.1,cx+2.1,cy+2.1);doc.line(cx+2.1,cy-2.1,cx-2.1,cy+2.1);
    }else if(i===5&&String(v||'')){
      doc.setFont('times','italic');doc.setFontSize(7.2);doc.setTextColor(55,112,165);doc.text(doc.splitTextToSize(String(v),ws[i]-2.5).slice(0,1),x+ws[i]/2,y+rowH/2+1.15,{align:'center'});
    }else{
      doc.setFont('helvetica',i===0?'bold':'normal');doc.setFontSize(6.2);doc.setTextColor(25,25,25);doc.text(String(v||''),x+ws[i]/2,y+rowH/2+1,{align:'center'});
    }
    x+=ws[i];
   });y+=rowH;
  });
  function continuationTop(section='Allmän Info - fortsättning'){
   doc.setDrawColor(55,55,55);doc.setLineWidth(.22);doc.rect(left,8,width,18);
   if(logo){try{const im=doc.getImageProperties(logo),boxX=left,boxY=8,boxW=58,boxH=18,pad=2.5,maxW=boxW-pad*2,maxH=boxH-pad*2,sc=Math.min(maxW/im.width,maxH/im.height),imgW=im.width*sc,imgH=im.height*sc,imgX=boxX+(boxW-imgW)/2,imgY=boxY+(boxH-imgH)/2;doc.addImage(logo,imgX,imgY,imgW,imgH)}catch(e){}}
   doc.line(left+58,8,left+58,26);doc.setTextColor(25,25,25);doc.setFont('helvetica','bold');doc.setFontSize(6.1);doc.text('Dokumentnr: 2519-1',left+61,11.7);doc.setFontSize(8.9);doc.text('CHECKLISTA REVISION AV DÖRRAUTOMATIK',left+58+(width-58)/2,17.3,{align:'center'});
   doc.setFont('helvetica','normal');doc.setFontSize(6.6);doc.text(section,112,22.4,{align:'center'});
   y=31;cell('Id nummermaskin:',d.id,left,y,62,8);cell('Placering/Dörrlittra:',d.location,left+62,y,62,8);cell('Ao nummer:',p.projectOrder,left+124,y,62,8);y+=12;
  }
  y+=3;doc.setFillColor(238,238,238);doc.setDrawColor(130,130,130);doc.setLineWidth(.2);doc.rect(left,y,width,6,'FD');text('ALLMÄN INFO / ANMÄRKNING',left+2,y+4.2,6.7,true,[55,55,55]);y+=6;
  const remediationNote=isDoorRemediated(d)?'Åtgärdad '+d.remediationDate+' · Signatur: '+d.remediationSignature:'';
  const notes=[...doorProblems(d).map(([n,t])=>d.checks[n].note?.trim()||t),remediationNote,d.notes].filter(Boolean).join('  ·  ');
  const boxH=Math.max(12,276-y);doc.setFillColor(255,255,255);doc.setDrawColor(145,145,145);doc.setLineWidth(.18);doc.rect(left,y,width,boxH,'FD');
  if(notes){
   let fs=6.8,lines=doc.splitTextToSize(notes,width-7),maxLines=Math.max(1,Math.floor((boxH-4)/2.8));
   while(lines.length>maxLines&&fs>5.2){fs-=.3;doc.setFontSize(fs);lines=doc.splitTextToSize(notes,width-7);maxLines=Math.max(1,Math.floor((boxH-4)/(fs*.42)))}
   if(lines.length>maxLines){lines=lines.slice(0,maxLines);lines[maxLines-1]=String(lines[maxLines-1]).replace(/\s*$/,'')+' …'}
   doc.setFont('helvetica','normal');doc.setFontSize(fs);doc.setTextColor(35,35,35);doc.text(lines,left+3,y+4.5,{lineHeightFactor:1.1});
  }
 });
 const pages=doc.getNumberOfPages();for(let i=1;i<=pages;i++){doc.setPage(i);doc.setDrawColor(204,215,223);doc.line(left,284,198,284);text([p.company,p.projectName||p.facilityNo].filter(Boolean).join(' · ')||'Dörrservice',left,289,7,false,[89,110,123]);text('Sida '+i+' av '+pages,177,289,7,false,[89,110,123])}
 return doc;
}

