const REPORT_COLORS={ok:{rgb:[35,131,84],light:[229,244,234]},action:{rgb:[170,102,0],light:[255,242,216]},fail:{rgb:[179,48,57],light:[252,229,231]},untested:{rgb:[97,117,131],light:[235,241,244]}};
function buildServiceReportDoc(snapshot,includeProtocols){
 const {project:p,doors:ds,logoData:logo}=snapshot,doc=new jspdf.jsPDF('p','mm','a4');
 const left=12,width=186,bottom=277,line=4;let y=0;
 const sorted=ds.slice().sort((a,b)=>a.page-b.page||a.id.localeCompare(b.id,'sv',{numeric:true}));
 const status=d=>isDoorRemediated(d)?'ok':d.status==='fail'?'fail':hasDoorProblem(d)?'action':d.status==='ok'?'ok':'untested';
 const label=d=>isDoorRemediated(d)?'Åtgärdad':({ok:'Godkänd',action:d.status==='action'?'Åtgärd krävs':'Anmärkningar',fail:'Ej godkänd',untested:'Ej kontrollerad'})[status(d)];
 function text(value,x,y,size=9,bold=false,color=[32,52,64]){doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(size);doc.setTextColor(...color);doc.text(String(value||'-'),x,y)}
 function header(title,subtitle){
  doc.setFillColor(255,255,255);doc.setDrawColor(55,55,55);doc.setLineWidth(.22);doc.rect(left,8,width,18,'FD');doc.line(left+58,8,left+58,26);
  if(logo){try{const image=doc.getImageProperties(logo),pad=2.5,scale=Math.min((58-pad*2)/image.width,(18-pad*2)/image.height),iw=image.width*scale,ih=image.height*scale;doc.addImage(logo,left+(58-iw)/2,8+(18-ih)/2,iw,ih)}catch(e){}}
  else text('DORRSERVICE',left+29,18,7,true,[25,25,25]);
  text(title,left+58+(width-58)/2,16.2,9.6,true,[25,25,25]);text(subtitle,left+58+(width-58)/2,21.4,6.8,false,[70,82,90]);
  y=32;doc.setDrawColor(204,215,223);doc.setLineWidth(.2);
 }
 function field(label,value,x,y,w){doc.setFillColor(243,247,249);doc.rect(x,y,w,13,'F');text(label,x+2,y+4,6.5,true,[89,110,123]);doc.setFontSize(8);doc.setFont('helvetica','normal');doc.setTextColor(32,52,64);doc.text(doc.splitTextToSize(String(value||'-'),w-4).slice(0,2),x+2,y+8.5)}
 function projectFields(){[['OBJEKT',p.projectName||p.facilityNo],['OBJEKTNUMMER',p.facilityNo],['ORDER',p.projectOrder]].forEach(([l,v],i)=>field(l,v,left+i*62,y,60));y+=16;[['DATUM',p.inspectionDate],['TEKNIKER',p.technician||p.company],['SIGNATUR',p.serviceSignature]].forEach(([l,v],i)=>field(l,v,left+i*62,y,60));y+=17}
 function overviewHeader(){
  header('ANMÄRKNINGSÖVERSIKT','DÖRRAUTOMATIK · KUNDRAPPORT');projectFields();
  const open=ds.filter(hasDoorProblem).length,done=ds.filter(isDoorRemediated).length,ready=ds.filter(d=>status(d)==='ok').length;
  const stats=[['TOTALT',ds.length,[243,247,249],[45,69,82]],['ÖPPNA FEL',open,[255,242,216],REPORT_COLORS.action.rgb],['ÅTGÄRDADE',done,[229,244,234],REPORT_COLORS.ok.rgb],['KLARA',ready,[229,244,234],REPORT_COLORS.ok.rgb]];
  const gap=2,boxW=(width-gap*3)/4;
  stats.forEach(([title,value,bg,fg],i)=>{const x=left+i*(boxW+gap);doc.setFillColor(...bg);doc.setDrawColor(214,224,230);doc.roundedRect(x,y,boxW,12,1.5,1.5,'FD');text(title,x+2.5,y+4,5.8,true,[89,110,123]);text(value,x+boxW-3,y+8.4,11,true,fg,{align:'right'})});
  y+=16;let x=left;[['Godkänd/åtgärdad','ok'],['Åtgärd krävs','action'],['Ej godkänd','fail'],['Ej kontrollerad','untested']].forEach(([title,key])=>{doc.setFillColor(...REPORT_COLORS[key].rgb);doc.circle(x+1,y-1,1.3,'F');text(title,x+4,y,6.6,false);x+=46});y+=7;text('Ej godkänd prioriteras först. Åtgärdade anmärkningar ligger kvar som historik.',left,y,6.5,false,[89,110,123]);y+=6;tableHead()
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
   columns.forEach((lines,i)=>{doc.setFillColor(...(i===0?color.light:[255,255,255]));doc.rect(x,y,widths[i],height,'F');doc.rect(x,y,widths[i],height);const chunk=i===0&&offset>=lines.length?lines.slice(0,count):lines.slice(offset,offset+count);if(chunk.length){doc.setFont('helvetica',i===0?'bold':'normal');doc.setFontSize(8);doc.setTextColor(...(i===0?color.rgb:[32,52,64]));doc.text(chunk,x+2.5,y+4.5,{lineHeightFactor:line/(8*.3528)})}x+=widths[i]});y+=height;offset+=count;
   if(offset<total)overviewPage();
  }
 });
 if(includeProtocols)sorted.forEach(d=>{
  function cell(label,value,x,yy,w,h=7,bold=false){
   doc.setDrawColor(25,25,25);doc.setLineWidth(.18);doc.rect(x,yy,w,h);
   const labelText=String(label||'');doc.setFont('helvetica','bold');doc.setFontSize(6.2);doc.setTextColor(0,0,0);
   const labelW=Math.min(w-6,doc.getTextWidth(labelText)+2);
   doc.text(labelText,x+1.5,yy+h/2+1);
   if(value!==undefined&&value!==null&&String(value)!==''){doc.setFont('helvetica',bold?'bold':'normal');doc.setFontSize(6.8);doc.setTextColor(0,0,0);doc.text(doc.splitTextToSize(String(value),Math.max(5,w-labelW-3)).slice(0,1),x+1.5+labelW,yy+h/2+1)}
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
   doc.setFont('helvetica','bold');doc.setFontSize(8.2);doc.setTextColor(25,25,25);doc.text('SERVICE',left+1.5,34.5);
   y=39;
   cell('Bokat besök datum:',p.inspectionDate,left,y,93);cell('Nästa provning datum:',d.nextDate||p.projectNextDate,left+93,y,93);y+=7;
   cell('ANLÄGGNING:',[p.projectName,'| Anläggningsnummer:',p.facilityNo].filter(Boolean).join(' '),left,y,93,7,true);
   cell('BESTÄLLARE:',[p.customer,'| Avtalsnummer:',p.agreementNo].filter(Boolean).join(' '),left+93,y,93,7,true);y+=7;
   cell('Företag:',p.company,left,y,93);cell('Företag:',p.customer,left+93,y,93);y+=7;
   cell('Kontaktman på objektet:',p.companyContact,left,y,93);cell('Kontaktperson:',p.contact,left+93,y,93);y+=7;
   cell('Telefonnummer:',p.companyPhone,left,y,93);cell('Telefonnummer:',p.phone,left+93,y,93);y+=7;
   cell('Adress:',p.companyAddress,left,y,93);cell('Adress:',p.address,left+93,y,93);y+=7;
   cell('Postnummer / Postadress:',[p.companyPostalCode,p.companyPostalCity].filter(Boolean).join(' '),left,y,93);cell('Postnummer / Postadress:',[p.postalCode,p.postalCity].filter(Boolean).join(' '),left+93,y,93);y+=7;
   cell('Id nummermaskin:',d.machineId||d.id,left,y,62,8);cell('Placering/Dörrlittra:',d.location,left+62,y,62,8);cell('Ao nummer:',d.ao||p.projectOrder,left+124,y,62,8);y+=8;
  }
  function checkHeader(){
   const ws=[10,99,15,25,27,10],titles=['Nr:','Benämning Kontroll','Ingår ej','Klart utan\nAnmärkning','Klart med\nAnmärkning','Signatur'];let x=left;
   titles.forEach((t,i)=>{
    doc.setFillColor(244,244,244);doc.setDrawColor(0,0,0);doc.setLineWidth(.18);doc.rect(x,y,ws[i],9,'FD');doc.setFont('helvetica','bold');doc.setFontSize(i>1?5.8:6.5);doc.setTextColor(0,0,0);
    const lines=t.split('\\n');
    if(i===1)doc.text(lines,x+2,y+5.5,{lineHeightFactor:1});
    else doc.text(lines,x+ws[i]/2,y+3.4,{align:'center',lineHeightFactor:1});
    x+=ws[i]
   });y+=9;
  }
  doc.addPage();doc.__doorProtocolPages=doc.__doorProtocolPages||{};doc.__doorProtocolPages[d.uid||d.id]=doc.getNumberOfPages();backToDrawingButton();protocolTop();checkHeader();
  const ws=[10,99,15,25,27,10];
  CHECKS.forEach(([n,title])=>{
   const c=d.checks[n]||{},h=7.7;let x=left;
   const vals=[n,title,c.result==='na'?'–':'','',c.result==='remark'?'X':'',p.serviceSignature||d.signature||''];
   vals.forEach((v,i)=>{
    doc.setFillColor(255,255,255);doc.setDrawColor(0,0,0);doc.setLineWidth(.18);doc.rect(x,y,ws[i],h,'FD');doc.setTextColor(0,0,0);
    if(i===1){
      doc.setFont('helvetica','normal');doc.setFontSize(7);
      const lines=doc.splitTextToSize(String(v||''),ws[i]-3.5).slice(0,2),step=2.65,startY=y+h/2-((lines.length-1)*step)/2+.85;
      doc.text(lines,x+1.7,startY,{lineHeightFactor:1});
    }else if(i===2&&c.result==='na'){
      const cx=x+ws[i]/2,cy=y+h/2;doc.setDrawColor(0,0,0);doc.setLineCap('round');doc.setLineWidth(.9);doc.line(cx-3.0,cy,cx+3.0,cy);doc.setLineCap('butt');
    }else if(i===3&&c.result==='ok'){
      const cx=x+ws[i]/2,cy=y+h/2;doc.setDrawColor(0,0,0);doc.setLineCap('round');doc.setLineWidth(.75);doc.line(cx-2.4,cy-.1,cx-.8,cy+1.45);doc.line(cx-.8,cy+1.45,cx+2.4,cy-1.75);doc.setLineCap('butt');
    }else if(i===4&&c.result==='remark'){
      const cx=x+ws[i]/2,cy=y+h/2;doc.setDrawColor(0,0,0);doc.setLineCap('round');doc.setLineWidth(.75);doc.line(cx-2.15,cy-2.15,cx+2.15,cy+2.15);doc.line(cx+2.15,cy-2.15,cx-2.15,cy+2.15);doc.setLineCap('butt');
    }else{
      doc.setFont('helvetica',i===0?'bold':'normal');doc.setFontSize(6.6);doc.text(String(v||''),x+ws[i]/2,y+h/2+1.1,{align:'center'});
    }
    x+=ws[i]
   });y+=h;
  });
  function continuationTop(){
   doc.setDrawColor(55,55,55);doc.setLineWidth(.22);doc.rect(left,8,width,18);
   if(logo){try{const im=doc.getImageProperties(logo),boxX=left,boxY=8,boxW=58,boxH=18,pad=2.5,maxW=boxW-pad*2,maxH=boxH-pad*2,sc=Math.min(maxW/im.width,maxH/im.height),imgW=im.width*sc,imgH=im.height*sc,imgX=boxX+(boxW-imgW)/2,imgY=boxY+(boxH-imgH)/2;doc.addImage(logo,imgX,imgY,imgW,imgH)}catch(e){}}
   doc.line(left+58,8,left+58,26);doc.setTextColor(25,25,25);doc.setFont('helvetica','bold');doc.setFontSize(6.1);doc.text('Dokumentnr: 2519-1',left+61,11.7);doc.setFontSize(8.9);doc.text('CHECKLISTA REVISION AV DÖRRAUTOMATIK',left+58+(width-58)/2,17.3,{align:'center'});
   doc.setFont('helvetica','normal');doc.setFontSize(6.6);doc.text('Allmän Info - fortsättning',112,22.4,{align:'center'});
   y=31;cell('Id nummermaskin:',d.machineId||d.id,left,y,62,8);cell('Placering/Dörrlittra:',d.location,left+62,y,62,8);cell('Ao nummer:',d.ao||p.projectOrder,left+124,y,62,8);y+=12;
  }
  y+=4;doc.setFillColor(247,247,247);doc.setDrawColor(0,0,0);doc.setLineWidth(.18);doc.rect(left,y,width,6,'FD');text('Allmän Info:',left+2,y+4.2,7,true,[35,35,35]);y+=6;
  const remediationNote=isDoorRemediated(d)?'Åtgärdad '+d.remediationDate+' · Signatur: '+d.remediationSignature:'';
  const notes=[...doorProblems(d).map(([n,t])=>d.checks[n].note?.trim()||t),remediationNote,d.notes].filter(Boolean).join('\n');
  const lines=doc.splitTextToSize(notes||'',width-7),boxH=Math.min(30,Math.max(18,276-y)),lineH=3.2,firstMax=Math.max(1,Math.floor((boxH-5)/lineH));
  doc.setFillColor(255,255,255);doc.setDrawColor(0,0,0);doc.setLineWidth(.18);doc.rect(left,y,width,boxH,'FD');
  if(lines.length){
   doc.setFont('helvetica','normal');doc.setFontSize(6.8);doc.setTextColor(30,30,30);
   const firstChunk=lines.slice(0,firstMax);doc.text(firstChunk,left+3,y+5,{lineHeightFactor:1.15});let offset=firstChunk.length;
   while(offset<lines.length){
    doc.addPage();backToDrawingButton();continuationTop();
    doc.setFillColor(247,247,247);doc.setDrawColor(0,0,0);doc.setLineWidth(.18);doc.rect(left,y,width,6,'FD');text('Allmän Info - fortsättning:',left+2,y+4.2,7,true,[35,35,35]);y+=6;
    const contBoxH=276-y,contMax=Math.max(1,Math.floor((contBoxH-5)/lineH)),chunk=lines.slice(offset,offset+contMax);
    doc.setFillColor(255,255,255);doc.setDrawColor(0,0,0);doc.setLineWidth(.18);doc.rect(left,y,width,contBoxH,'FD');
    doc.setFont('helvetica','normal');doc.setFontSize(6.8);doc.setTextColor(30,30,30);doc.text(chunk,left+3,y+5,{lineHeightFactor:1.15});offset+=chunk.length;
   }
  }
 });
 const pages=doc.getNumberOfPages();for(let i=1;i<=pages;i++){doc.setPage(i);doc.setDrawColor(204,215,223);doc.line(left,284,198,284);text([p.company,p.projectName||p.facilityNo].filter(Boolean).join(' · ')||'Dörrservice',left,289,7,false,[89,110,123]);text('Sida '+i+' av '+pages,177,289,7,false,[89,110,123])}
 return doc;
}
