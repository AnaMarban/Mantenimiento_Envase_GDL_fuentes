/* ==== Parser Ventolink (compartido) ==== */
function vlLines(items){ // items: {s,x,y} y hacia abajo
  const L=[];items.filter(i=>i.s.trim()).sort((a,b)=>a.y-b.y||a.x-b.x).forEach(i=>{
    const l=L.find(l=>Math.abs(l.y-i.y)<3);if(l)l.it.push(i);else L.push({y:i.y,it:[i]})});
  L.forEach(l=>l.it.sort((a,b)=>a.x-b.x));return L.sort((a,b)=>a.y-b.y)}
const VL_DT=/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/;
function vlKind(pages){const t=pages.slice(0,1).flatMap(p=>p.items.map(i=>i.s)).join(" ");
  if(/Historical Log Report/i.test(t))return"log";if(/Estad.sticas de producci.n/i.test(t))return"prod";return null}
function vlParseLog(pages){
  const out=[];
  pages.forEach((p,pi)=>{
    const L=vlLines(p.items);
    const hi=L.findIndex(l=>l.it.some(i=>/Date\/Time/.test(i.s)));if(hi<0)return;
    const H=L[hi].it;
    const xOf=re=>{const i=H.find(i=>re.test(i.s));return i?i.x:null};
    const xDesc=xOf(/^Event Description/)??xOf(/^Event$/), xType=H.filter(i=>/^Event( Type)?$/.test(i.s.trim())||/^Event Type/.test(i.s)).map(i=>i.x).filter(x=>x>(xDesc??0)+50)[0], xUser=xOf(/^User/);
    const body=L.slice(hi+1).filter(l=>!l.it.some(i=>/^Pag\.?/.test(i.s.trim())));
    const anchors=[];
    body.forEach(l=>{
      const txt=l.it.map(i=>i.s).join(" ").trim();const m=txt.match(VL_DT);
      const seg=(a,b)=>l.it.filter(i=>i.x>=a-2&&i.x<b-2).map(i=>i.s).join(" ").replace(/\s+/g," ").trim();
      if(m){
        let d=seg(xDesc,xType);
        anchors.push({y:l.y,ts:Date.UTC(+m[3],+m[2]-1,+m[1],+m[4],+m[5],+m[6]),parts:[[l.y,d]],t:seg(xType,xUser??1e9),pg:pi+1});
      }else l._c=true;
    });
    body.filter(l=>l._c).forEach(l=>{if(!anchors.length)return;
      let a=anchors[0],best=1e9;anchors.forEach(x=>{const d=Math.abs(x.y-l.y);if(d<best){best=d;a=x}});
      a.parts.push([l.y,l.it.filter(i=>i.x<xType-2).map(i=>i.s).join(" ").replace(/\s+/g," ").trim()])});
    anchors.forEach(a=>out.push({ts:a.ts,d:a.parts.sort((x,y)=>x[0]-y[0]).map(x=>x[1]).filter(Boolean).join(" ").replace(/\s+/g," ").trim(),t:a.t,pg:a.pg}));
  });
  return out}
function vlParseProd(pages){
  const out=[];
  pages.forEach(p=>vlLines(p.items).forEach(l=>{
    const t=l.it.map(i=>i.s).join(" ").replace(/\s+/g," ").trim();
    const m=t.match(/^(\d+) (\d+) (\d{4}-\d{2}-\d{2}) (\d) (\d+) ([\d.]+) ([\d.]+)$/);
    if(m)out.push({linea:+m[1],receta:+m[2],fecha:m[3],turno:+m[4],sacos:+m[5],peso:+m[6],medio:+m[7]})}));
  return out}
async function vlExtract(pdf,onProg){
  const pages=[];
  for(let n=1;n<=pdf.numPages;n++){const pg=await pdf.getPage(n);const vp=pg.getViewport({scale:1});const tc=await pg.getTextContent();
    pages.push({items:tc.items.filter(i=>"str"in i).map(i=>({s:i.str,x:i.transform[4],y:vp.height-i.transform[5]}))});onProg&&onProg(n,pdf.numPages)}
  return pages}
if(typeof module!=="undefined")module.exports={vlParseLog,vlParseProd,vlExtract,vlKind};
