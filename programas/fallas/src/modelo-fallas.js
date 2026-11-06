/* ==== Modelo: eventos crudos -> fallas, cortes, producción ==== */
const ES={"VALORE PESO NOMINALE NON AMMESSO":"Valor de peso nominal no admitido","OFFSET TRACKING SCADUTO":"Offset tracking caducado","CALIBRAZIONE DINAMICA: DIFETTO MARCIA NASTRO":"Calibración dinámica: falla en marcha de la banda","CALIBRAZIONE DINAMICA: VELOCITΑ NASTRO FUORI LIMITE":"Calibración dinámica: velocidad de banda fuera de límite","CALIBRAZIONE DINAMICA: VELOCITÀ NASTRO FUORI LIMITE":"Calibración dinámica: velocidad de banda fuera de límite","CALIBRAZIONE DINAMICA: DIFETTO CADENZAMENTO SACCHI":"Calibración dinámica: falla en la cadencia de sacos","CALIBRAZIONE DINAMICA: DIFETTO OFFSET TRACK":"Calibración dinámica: falla de offset track","DIFETTO VALUTAZIONE CALIBRAZIONE DINAMICA":"Falla al evaluar la calibración dinámica","CALIBRAZIONE DINAMICA: DIFETTO CAMPIONAMENTO":"Calibración dinámica: falla de muestreo","SCRITTURA TEMPO WARM UP NELL'INDICATORE FALLITA":"Falló la escritura del tiempo de calentamiento en el indicador","INDICATORE SIGILLATO. IMPOSSIBILE RIPRISTINARE RISOLUZIONE DISPLAY":"Indicador sellado: no se puede restablecer la resolución del display","PESO MEDIO PRE-IMBALLAGGI TROPPO BASSO":"Peso medio de preempaque demasiado bajo","PRE-RISCALDAMENTO":"Precalentamiento","RICETTA NON VALIDA":"Receta no válida","OFFSET TRACKING FUORI LIMITE":"Offset tracking fuera de límite","VALORE RISOLUZIONE PESO VISUALIZZATO NON VALIDO":"Valor de resolución de peso mostrado no válido","OSTRUZIONE FOTOCELLULA USCITA SACCO":"Obstrucción fotocelda de salida de saco","DIFETTO FOTOCELLULA USCITA SACCO":"Falla fotocelda de salida de saco","DIFETTO FOTOCELLULA INGRESSO SACCO":"Falla fotocelda de entrada de saco","VELOCITΑ' NASTRO TRASPORTATORE NON CORRETTA":"Velocidad de banda transportadora incorrecta","VELOCITA' NASTRO TRASPORTATORE NON CORRETTA":"Velocidad de banda transportadora incorrecta","OSTRUZIONE FOTOCELLULA INGRESSO SACCO":"Obstrucción fotocelda de entrada de saco","DIFETTO CAMPIONAMENTO PESO":"Falla de muestreo de peso","ALLARME DICO EWU040":"Alarma DICO EWU040","BILANCIA NON CALIBRATA":"Báscula no calibrada","INTENTO DE CARGA FALLITO":"Intento de carga fallido","SACO ROTO POR FAVOR QUITARLO":"Saco roto (retirarlo)","FALTA DE AIRE. POR FAVOR CONTROLAR":"Falta de aire (revisar)","MÓDULO SLOT1 NO CORRECTO":"Módulo SLOT1 no correcto","VENTODIGIT NO PRESENTE":"Ventodigit no presente","VENTOCHECK NO PRESENTE":"Ventocheck no presente","MÓDULO DE PESAJE NO RESPONDE":"Módulo de pesaje no responde","FUERA DEL LÍMITE INFERIOR":"Fuera del límite inferior","DEFECTO DISPOSITIVO DE DETECCIÓN SACO":"Falla en dispositivo de detección de saco","TÉRMICO ACTIVADO":"Térmico activado","BALANZA EN SOBRECARGA":"Balanza en sobrecarga","OBSTRUCCIÓN CINTAS ENTRADA BALANZA":"Obstrucción en bandas de entrada a la báscula","EXCESIVO DESCARTE SACOS":"Excesivo descarte de sacos","DICO 908A NO PRESENTE":"DICO 908A no presente","DICO 908D NO PRESENTE":"DICO 908D no presente","DICO EWU040 NO PRESENTE":"DICO EWU040 no presente"};
const GRUPOS=["Saco roto","Carga fallida","Pesaje fuera de rango","Detección de saco","Aire / térmico","Electrónica / módulos","Fotoceldas / obstrucción","Báscula de control"];
const ALRE=/^L1(?: ((?:EWU|VCK) \d+))? - (\d+)\)? ?(.*)$/;
const TCODE={"ALARM ON":0,"ALARM OFF":1,"ALARM ACK":2};
function evType(t,d){if(t in TCODE)return TCODE[t];if(/^Communication error/i.test(d))return 3;if(/^Communication established/i.test(d))return 4;return 5}
function capit(s){s=s.toLowerCase();return s.charAt(0).toUpperCase()+s.slice(1)}
function normAlarm(d){const m=d.match(ALRE);if(!m)return null;const ewu=m[1]||"",eq=ewu?ewu.replace(/^EWU/,"Boquilla"):"Línea",cod=+m[2],txt=(m[3]||"").trim();
  const es=ES[txt]||(txt?capit(txt):`Alarma ${cod} (sin texto)`);return {eq,ewu,cod,txt,es,grp:grupo(ewu||eq,cod,txt)}}
function grupo(eq,cod,txt){if(eq.startsWith("EWU")){if(cod===43)return"Saco roto";if(cod===44)return"Carga fallida";if(cod===59||cod===47)return"Pesaje fuera de rango";if(cod===51)return"Detección de saco";if(cod===14||cod===52)return"Aire / térmico";return"Electrónica / módulos"}
  if(eq.startsWith("VCK"))return"Electrónica / módulos";const u=txt.toUpperCase();if(u.includes("FOTOCEL")||u.includes("OBSTRUC")||u.includes("OSTRUZ"))return"Fotoceldas / obstrucción";return"Báscula de control"}
function turnoDe(ts){const d=new Date(ts),h=d.getUTCHours();const day=Date.UTC(d.getUTCFullYear(),d.getUTCMonth(),d.getUTCDate());
  if(h>=7&&h<15)return{t:1,dia:day};if(h>=15&&h<23)return{t:2,dia:day};return{t:3,dia:h>=23?day+864e5:day}}
const isoD=ms=>new Date(ms).toISOString().slice(0,10);
/* eventos: [{ts,d,t(code)}] en orden cronológico */
function buildModel(events,prodRows){
  const fallas=[],com=[],sys=[],open=new Map();let cur=null;
  events.forEach(e=>{
    if(e.t===0||e.t===1){const n=normAlarm(e.d);if(!n){sys.push(e);return}
      if(e.t===0){const f=Object.assign({i:e.ts,f:null},n);const tt=turnoDe(e.ts);f.turno=tt.t;f.dia=isoD(tt.dia);open.set(e.d,f);fallas.push(f)}
      else{const f=open.get(e.d);if(f){f.f=e.ts;open.delete(e.d)}}}
    else if(e.t===3){cur={i:e.ts,f:null};const tt=turnoDe(e.ts);cur.turno=tt.t;cur.dia=isoD(tt.dia);com.push(cur)}
    else if(e.t===4){if(cur&&cur.f===null)cur.f=e.ts}
    else if(e.t===5)sys.push(e);
  });
  fallas.forEach(f=>f.min=f.f!=null?(f.f-f.i)/6e4:null);com.forEach(c=>c.s=c.f!=null?(c.f-c.i)/1e3:null);
  const prod=(prodRows||[]).slice().sort((a,b)=>a.fecha<b.fecha?-1:a.fecha>b.fecha?1:a.turno-b.turno);
  return {fallas,com,sys,prod,n:events.length,desde:events.length?events[0].ts:null,hasta:events.length?events[events.length-1].ts:null}}
/* empaquetado por mes para guardar */
const MAXEV=9000;
function packMonths(events){ // events with ts,d,t -> {"YYYY-MM":[{...}]}
  const by={};events.forEach(e=>{const m=isoD(e.ts).slice(0,7);(by[m]=by[m]||[]).push(e)});return by}
function encodeMonth(mes,evs){const base=Date.UTC(+mes.slice(0,4),+mes.slice(5,7)-1,1);const dict=[],di=new Map();
  const ev=evs.map(e=>{let k=di.get(e.d);if(k===undefined){k=dict.length;dict.push(e.d);di.set(e.d,k)}return [Math.round((e.ts-base)/1e3),k,e.t]});
  return {mes,base,dict,ev}}
function decodeMonth(doc){return doc.ev.map(x=>({ts:doc.base+x[0]*1e3,d:doc.dict[x[1]],t:x[2]}))}
function mergeEvents(oldE,newE){ // multiconjunto: conserva el mayor conteo por clave
  const key=e=>e.ts+"|"+e.t+"|"+e.d;const cnt=new Map();oldE.forEach(e=>cnt.set(key(e),(cnt.get(key(e))||0)+1));
  const seen=new Map();let added=0;const out=oldE.slice();
  newE.forEach(e=>{const k=key(e);const s=(seen.get(k)||0)+1;seen.set(k,s);if(s>(cnt.get(k)||0)){out.push(e);added++}});
  out.forEach((e,i)=>e._o=e._o??i);out.sort((a,b)=>a.ts-b.ts||(a._o-b._o));out.forEach(e=>delete e._o);return {out,added}}
if(typeof module!=="undefined")module.exports={buildModel,packMonths,encodeMonth,decodeMonth,mergeEvents,evType,normAlarm,GRUPOS,turnoDe,isoD};
