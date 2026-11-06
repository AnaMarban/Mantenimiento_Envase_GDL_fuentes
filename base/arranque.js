(function(){
  var KEYS=["programa","fallas","dynamix"];
  var MODS=JSON.parse(document.getElementById("eco-mods").textContent);
  var RESET=':root{color-scheme:light;box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}html{scroll-padding-top:env(safe-area-inset-top,0px)}body{margin:0;padding:0;font:14px -apple-system,BlinkMacSystemFont,sans-serif;background:#fff;color:#000}img{max-width:100%}[hidden]:not([hidden=until-found i]){display:none!important}';
  var HEAD='<title>CEMEX GDL Mantenimiento Envase</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n<link rel="preconnect" href="https://fonts.googleapis.com">\n<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Semi+Condensed:wght@500;600;700&family=Source+Sans+3:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap">\n';
  var LIBS='<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js"><\/script>\n<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"><\/script>\n';
  function pick(){
    var h=(location.hash||"").slice(1);if(KEYS.indexOf(h)>=0)return h;
    try{var s=localStorage.getItem("eco.mod");if(KEYS.indexOf(s)>=0)return s}catch(e){}
    return "programa";
  }
  var cur=pick();
  try{localStorage.setItem("eco.mod",cur)}catch(e){}
  var links=document.querySelectorAll("#eco-bar [data-m]");
  for(var i=0;i<links.length;i++){
    (function(a){
      if(a.getAttribute("data-m")===cur)a.setAttribute("aria-current","page");
      a.addEventListener("click",function(ev){
        ev.preventDefault();var k=a.getAttribute("data-m");if(k===cur)return;
        try{localStorage.setItem("eco.mod",k)}catch(e){}
        try{history.replaceState(null,"","#"+k)}catch(e){}
        location.reload();
      });
    })(links[i]);
  }
  /* Cada programa se guarda a sí mismo; aquí se arma la página completa con los tres. */
  window.ECO={cur:cur,wrap:function(k,frag){
    MODS[k]=frag.replace(/<script src="https:\/\/cdnjs\.cloudflare\.com\/[^"]*"><\/script>\n?/g,"");
    var bar=document.getElementById("eco-bar").cloneNode(true);
    var cs=bar.querySelectorAll("[aria-current]");for(var j=0;j<cs.length;j++)cs[j].removeAttribute("aria-current");
    return '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>'+RESET+'</style></head><body>'+HEAD
      +document.getElementById("eco-css").outerHTML+"\n"+bar.outerHTML+"\n"+LIBS
      +'<script type="application/json" id="eco-mods">'+JSON.stringify(MODS).replace(/</g,"\\u003c")+'<\/script>\n'
      +document.getElementById("eco-boot").outerHTML+'</body></html>';
  }};
  /* Datos compartidos en el sitio web (función /api/datos). En Claude no se usa. */
  var API="/api/datos",enClaude=!!(window.claude&&window.claude.use);
  function clave(){try{return localStorage.getItem("eco.clave")||""}catch(e){return ""}}
  window.ECO.nube=enClaude||location.protocol==="file:"?null:{
    activo:false,
    clave:clave,
    leer:function(k){var self=this;return fetch(API+"?k="+k,{cache:"no-store"}).then(function(r){if(!r.ok)return undefined;self.activo=true;mostrarAcc();return r.json()}).catch(function(){return undefined})},
    guardar:function(k,obj){return fetch(API+"?k="+k,{method:"PUT",headers:{"content-type":"application/json","x-clave":clave()},body:JSON.stringify(obj)}).then(function(r){if(r.status===401||r.status===403){var e=new Error("clave");e.code="clave";throw e}if(!r.ok){var e2=new Error("error");e2.code="error";throw e2}return true})}
  };
  function mostrarAcc(){var b=document.getElementById("eco-acc");if(!b)return;b.hidden=false;b.textContent=clave()?"Cerrar sesión":"Iniciar sesión"}
  document.addEventListener("DOMContentLoaded",function(){
    var b=document.getElementById("eco-acc"),d=document.getElementById("eco-dlg");if(!b||!d)return;
    b.onclick=function(){if(clave()){try{localStorage.removeItem("eco.clave")}catch(e){}location.reload();return}d.hidden=false;document.getElementById("eco-pw").focus()};
    document.getElementById("eco-x").onclick=function(){d.hidden=true};
    document.getElementById("eco-form").onsubmit=function(ev){ev.preventDefault();var v=document.getElementById("eco-pw").value;
      fetch(API+"?check=1",{headers:{"x-clave":v},cache:"no-store"}).then(function(r){if(r.ok){try{localStorage.setItem("eco.clave",v)}catch(e){}location.reload()}else document.getElementById("eco-err").textContent="Clave incorrecta"}).catch(function(){document.getElementById("eco-err").textContent="Sin conexión"})};
  });
  document.write(MODS[cur]);
})();
