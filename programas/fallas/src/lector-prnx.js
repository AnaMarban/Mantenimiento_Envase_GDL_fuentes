/* ==== Lector de reportes .prnx de Ventolink (DevExpress XtraReports: XML comprimido con gzip) ==== */
function pxDec(s){return s==null?s:s.replace(/&#x([0-9a-f]+);/gi,(_,h)=>String.fromCharCode(parseInt(h,16))).replace(/&#(\d+);/g,(_,d)=>String.fromCharCode(+d))
  .replace(/&quot;/g,'"').replace(/&apos;/g,"'").replace(/&lt;/g,"<").replace(/&gt;/g,">").replace(/&amp;/g,"&")}
/* Recorre las etiquetas de texto del reporte: {x,y,t(texto),v(valor),ty(tipo .NET)} en el orden del archivo */
function pxBricks(xml){
  const out=[],re=/<Item\d+\s([^>]*?)\/?>/g;let m;
  while((m=re.exec(xml))){const a=m[1];if(a.indexOf('BrickType="Label"')<0)continue;
    const at={};a.replace(/([\w:]+)="([^"]*)"/g,(_,k,v)=>{at[k]=v;return""});if(!at.Rect)continue;
    const r=at.Rect.split(",").map(Number);out.push({x:r[0],y:r[1],t:pxDec(at.Text),v:at.TextValue!==undefined?pxDec(at.TextValue):undefined,ty:at.TextValue_type})}
  return out}
const PX_NORM=s=>String(s||"").replace(/\s+/g," ").trim();
/* Convierte un reporte en filas usando los encabezados de columna (misma x) */
function pxParse(xml){
  const B=pxBricks(xml),hdr=new Map(),fechas=[];let titulo="";
  B.forEach(b=>{if(!b.t)return;const t=PX_NORM(b.t);
    if(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(t)){if(!fechas.includes(t))fechas.push(t);return}
    if(b.ty!==undefined)return;
    if(/VENTOLINK/i.test(t)){titulo=titulo||t;return}
    if(b.y===0&&t!=="xtraReport1"&&!/^[\d.\- :]+$/.test(t)&&t!=="All")hdr.set(Math.round(b.x),t)});
  const cols=new Set(hdr.values());
  const kind=cols.has("Clase Peso")?"vcheck":cols.has("Tot Evacuados")?"efic":(cols.has("Tot Sacos")&&cols.has("Fecha"))?"prod":null;
  const rows=[];let g=[],gy=null;
  const flush=()=>{if(!g.length)return;const r={};g.forEach(b=>{const k=hdr.get(Math.round(b.x));if(!k)return;
      let v=b.ty==="System.DBNull"?null:b.v;if(v!=null&&/Int(16|32|64)$/.test(b.ty))v=parseInt(v,10);else if(v!=null&&/(Single|Double|Decimal)$/.test(b.ty))v=parseFloat(v);else if(typeof v==="string")v=v.trim();r[k]=v});
    if(Object.keys(r).length)rows.push(r);g=[]};
  B.forEach(b=>{if(b.ty===undefined)return;if(gy===null||Math.abs(b.y-gy)<.5){g.push(b);gy=b.y}else{flush();g=[b];gy=b.y}});flush();
  const pd=s=>{const m=s&&s.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})/);return m?Date.UTC(+m[1],+m[2]-1,+m[3],+m[4],+m[5]):null};
  return {kind,titulo,desde:pd(fechas[0]),hasta:pd(fechas[1])||null,rows}}
/* Producción por turno (xtraReport1) -> mismas filas que el PDF de estadísticas */
function pxProd(p){return p.rows.filter(r=>/^\d{4}-\d{2}-\d{2}$/.test(r["Fecha"]||"")&&Number.isInteger(r["Turno T"]))
  .map(r=>({linea:r["Línea"]??1,receta:+r["Receta"]||0,fecha:r["Fecha"],turno:r["Turno T"],sacos:r["Tot Sacos"]||0,peso:r["Tot Peso (kg)"]||0,medio:r["Peso Medio (kg)"]||0}))}
/* "Turno Día" de Eficiencia y Ventocheck es el día de la semana (1 = domingo … 7 = sábado) dentro del periodo del reporte.
   El turno 3 empieza ese día a las 23:00; se guarda con el día en que termina, igual que en el resto del tablero. */
function pxDia(desde,code,t){if(desde==null)return null;const d0=new Date(desde);const base=Date.UTC(d0.getUTCFullYear(),d0.getUTCMonth(),d0.getUTCDate());
  for(let i=0;i<7;i++){const d=base+i*864e5;if(new Date(d).getUTCDay()+1===code)return new Date(d+(t===3?864e5:0)).toISOString().slice(0,10)}return null}
/* pesos: clave "AAAA-MM-DD|turno|boquilla" -> [evacuados, kg, min, max, c1..c5] (c = sacos de Ventocheck por rango) */
function pxPesos(efic,vcheck){
  const out={},get=k=>out[k]||(out[k]=[null,null,null,null,null,null,null,null,null]);
  if(efic)efic.rows.forEach(r=>{if(!Number.isInteger(r["Boca"])||!Number.isInteger(r["Turno Día"]))return;const dia=pxDia(efic.desde,r["Turno Día"],r["Turno T"]);if(!dia)return;
    const x=get(dia+"|"+r["Turno T"]+"|"+r["Boca"]);x[0]=(x[0]||0)+(r["Tot Evacuados"]||0);x[1]=(x[1]||0)+(r["Tot Peso (kg)"]||0);
    if(r["Peso Min. (kg)"]!=null&&r["Peso Min. (kg)"]>0)x[2]=x[2]==null?r["Peso Min. (kg)"]:Math.min(x[2],r["Peso Min. (kg)"]);if(r["Peso Max (kg)"]!=null)x[3]=x[3]==null?r["Peso Max (kg)"]:Math.max(x[3],r["Peso Max (kg)"])});
  if(vcheck){const mx=new Map();vcheck.rows.forEach(r=>{const c=r["Clase Peso"],b=r["Boca"];if(!Number.isInteger(b)||b<1||!(c>=1&&c<=5)||!Number.isInteger(r["Turno Día"]))return;
      const dia=pxDia(vcheck.desde,r["Turno Día"],r["Turno T"]);if(!dia)return;const k=dia+"|"+r["Turno T"]+"|"+b+"|"+c;mx.set(k,Math.max(mx.get(k)||0,r["Tot Sacos Pesados"]||0))});
    /* las filas de Ventocheck son acumuladas dentro del turno: se toma el valor final */
    mx.forEach((n,k)=>{const p=k.split("|");const x=get(p[0]+"|"+p[1]+"|"+p[2]);x[3+(+p[3])]=(x[3+(+p[3])]||0)+n})}
  Object.values(out).forEach(x=>{if(x[1]!=null)x[1]=Math.round(x[1]*100)/100});
  return out}
if(typeof module!=="undefined")module.exports={pxParse,pxProd,pxPesos,pxDia};
