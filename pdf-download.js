(function(){
'use strict';
const W=1440,H=1112;
const FONT='Arial, Helvetica, sans-serif';
const el=(id)=>document.getElementById(id);
function load(url){return new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=()=>reject(new Error('Could not load visual: '+url));i.src=url;});}
function drawImg(ctx,im,x,y,w,h){const scale=Math.min(w/im.width,h/im.height);const iw=im.width*scale,ih=im.height*scale;ctx.drawImage(im,x+(w-iw)/2,y+(h-ih)/2,iw,ih);}
function fitText(ctx,str,x,y,maxWidth,fontSize,lineHeight,maxLines=20){ctx.font=fontSize+'px '+FONT;const words=String(str).split(/\s+/);let line='',n=0;for(let w of words){if(ctx.measureText(line+' '+w).width>maxWidth&&line){ctx.fillText(line,x,y+n*lineHeight);n++;line=w;if(n>=maxLines)break;}else line=line?line+' '+w:w}if(n<maxLines)ctx.fillText(line,x,y+n*lineHeight);return y+Math.min(n+1,maxLines)*lineHeight;}
function basePage(title,p,logo,label){const c=document.createElement('canvas');c.width=W;c.height=H;const ctx=c.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,W,H);ctx.fillStyle='#043b26';ctx.fillRect(0,0,W,130);if(logo)drawImg(ctx,logo,48,14,285,98);ctx.fillStyle='#fff';ctx.font='700 31px '+FONT;ctx.textAlign='right';ctx.fillText('NJ GREEN DASH',1385,65);ctx.font='18px '+FONT;ctx.fillText('CONSULTANT LUCIAN DEMARCO',1385,95);ctx.textAlign='left';ctx.fillStyle='#09291b';ctx.font='700 35px '+FONT;fitText(ctx,title,55,192,1300,35,42,2);ctx.fillStyle='#15713d';ctx.font='bold 18px '+FONT;ctx.fillText('CONCEPT '+String(p.id).padStart(2,'0')+'   •   '+p.type+'   •   '+p.sf+' SF',55,250);ctx.fillStyle='#eaf0e8';ctx.fillRect(0,1037,W,75);ctx.fillStyle='#234a32';ctx.font='15px '+FONT;ctx.fillText('NDA / CONFIDENTIALITY POLICY: No actual client names, locations or documents without express written consent.',48,1065);ctx.fillText('ILLUSTRATIVE CONCEPT — NOT FOR PERMIT OR CONSTRUCTION USE    |    NJGreenDash.com    |    (732) 556-7388',48,1093);return {canvas:c,ctx};}
function decorateText(ctx,title,text,y,height=140){ctx.fillStyle='#eff5ed';ctx.fillRect(55,y-28,1320,height);ctx.fillStyle='#0e613b';ctx.font='bold 23px '+FONT;ctx.fillText(title,78,y+6);ctx.fillStyle='#173928';return fitText(ctx,text,80,y+41,1260,21,30,4);}
async function makePages(p,s){
 const logo=await load('assets/brand/nj-green-dash-logo.jpg');
 const iid=String(p.id).padStart(2,'0');
 const asset=(name)=>'assets/concepts/'+iid+'-'+name+'.svg';
 const ext=p.id<=10?'assets/generated/home-tile-'+iid+'.jpg':asset('exterior');
 const interior=p.type==='Cultivation'?'assets/generated/interior-feature-01.jpg':p.type==='Manufacturing'||p.type==='Distribution'?'assets/generated/interior-feature-03.jpg':'assets/generated/interior-feature-02.jpg';
 const views=[['EXTERIOR CONCEPT',ext,'Exterior expression and surrounding landscape are illustrative and site conditions require verification.'],['INTERIOR FIT-OUT CONCEPT',interior,'Representative interior atmosphere and use only; not a real completed facility.'],['INTERIOR OPERATIONS DIAGRAM',asset('interior'),'Conceptual operational interior relationships.'],['LANDSCAPE AND SITE ORGANIZATION',asset('site'),s.site],['3D FUNCTIONAL ORGANIZATION',asset('axon'),'Diagrammatic block layout, not measured 3D construction documentation.'],['SCHEMATIC FLOOR PLAN',asset('plan'),'Conceptual functional zoning only; not a measured or code-reviewed plan.'],['CONCEPT ELEVATIONS',asset('elevations'),'Illustrative facade massing; not measured CAD elevations.']];
 const pages=[];{
 const {canvas,ctx}=basePage('PROJECT CONCEPT PACKAGE',p,logo);
 ctx.fillStyle='#143925';ctx.font='700 37px '+FONT;fitText(ctx,p.name,60,312,1310,37,50,2);
 ctx.fillStyle='#2f5a44';fitText(ctx,p.description,60,418,1300,24,34,4);
 decorateText(ctx,'CONCEPT BRIEF',s.story,575,160);
 decorateText(ctx,'PROJECT STATUS',s.status,783,140);
 pages.push(canvas);}
 {const {canvas,ctx}=basePage('CONSULTING STORY & LESSONS',p,logo);let y=314;
 const items=[['PROJECT STORY',s.story],['DEVELOPMENT HURDLE',s.challenge],['ILLUSTRATIVE RESPONSE',s.approach],['HIGH POINT',s.high],['LIMITATION / LOW POINT',s.low],['LICENSING GATE — NOT CLEARED',s.licensing],['KEY TAKEAWAY',s.takeaway]];
 for(let idx=0;idx<items.length;idx++){let [t,v]=items[idx];ctx.fillStyle=idx%2===0?'#f0f6ef':'#fafcf9';ctx.fillRect(55,y-22,1320,93);ctx.fillStyle='#0b603a';ctx.font='bold 19px '+FONT;ctx.fillText(t,75,y+3);ctx.fillStyle='#1b3025';fitText(ctx,v,75,y+31,1270,17,22,2);y+=101}pages.push(canvas);}
 for(const [title,src,caption] of views){let im=await load(src);const {canvas,ctx}=basePage(title,p,logo);ctx.fillStyle='#edf3ec';ctx.fillRect(55,285,1330,650);drawImg(ctx,im,62,294,1316,628);ctx.fillStyle='#294533';ctx.font='19px '+FONT;fitText(ctx,caption,70,980,1260,19,26,2);pages.push(canvas);}
 return pages;
}
function pdfBytes(canvases){
 const encoder=new TextEncoder();let objects=[],ids=canvases.map((_,i)=>4+i*3);
 objects[0]=encoder.encode('<< /Type /Catalog /Pages 2 0 R >>');
 objects[1]=encoder.encode('<< /Type /Pages /Kids ['+ids.map(n=>n+' 0 R').join(' ')+'] /Count '+ids.length+' >>');
 objects[2]=encoder.encode('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
 for(let i=0;i<canvases.length;i++){
  const page=4+i*3,img=page+1,contents=page+2;
  objects[page-1]=encoder.encode('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 792 612] /Resources << /Font << /F1 3 0 R >> /XObject << /I0 '+img+' 0 R >> >> /Contents '+contents+' 0 R >>');
  const jpeg=atob(canvases[i].toDataURL('image/jpeg',.83).split(',')[1]);const bytes=Uint8Array.from(jpeg,c=>c.charCodeAt(0));
  const prefix=encoder.encode('<< /Type /XObject /Subtype /Image /Width '+W+' /Height '+H+' /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length '+bytes.length+' >>\nstream\n');
  const suffix=encoder.encode('\nendstream');
  const merged=new Uint8Array(prefix.length+bytes.length+suffix.length);merged.set(prefix,0);merged.set(bytes,prefix.length);merged.set(suffix,prefix.length+bytes.length);
  objects[img-1]=merged;
  const cont='q\n792 0 0 612 0 0 cm\n/I0 Do\nQ';
  objects[contents-1]=encoder.encode('<< /Length '+cont.length+' >>\nstream\n'+cont+'\nendstream');
 }
 const segments=[encoder.encode('%PDF-1.4\n')];let offset=segments[0].length,ofs=[0];
 for(let i=0;i<objects.length;i++){const s=encoder.encode((i+1)+' 0 obj\n'),e=encoder.encode('\nendobj\n');ofs.push(offset);segments.push(s,objects[i],e);offset+=s.length+objects[i].length+e.length}
 const xoff=offset;let xref='xref\n0 '+(objects.length+1)+'\n0000000000 65535 f \n';for(let i=1;i<ofs.length;i++)xref+=String(ofs[i]).padStart(10,'0')+' 00000 n \n';xref+='trailer\n<< /Size '+(objects.length+1)+' /Root 1 0 R >>\nstartxref\n'+xoff+'\n%%EOF';segments.push(encoder.encode(xref));
 return new Blob(segments,{type:'application/pdf'});
}
window.NJGD_DOWNLOAD_PDF=async function(p,s,button){
 if(!p||!s)return;
 const old=button?.textContent;if(button){button.disabled=true;button.textContent='Preparing PDF…';}
 try{
  const pages=await makePages(p,s);const blob=pdfBytes(pages);
  const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='NJGreenDash_Concept_'+String(p.id).padStart(2,'0')+'_'+p.name.replace(/[^a-z0-9]+/gi,'_')+'.pdf';a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);
 }catch(e){alert('Could not prepare PDF: '+e.message);console.error(e);}
 finally{if(button){button.disabled=false;button.textContent=old;}}
};
})();