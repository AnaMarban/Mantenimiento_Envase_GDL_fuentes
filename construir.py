"""Arma sitio/index.html (la página completa) a partir de base/ y programas/.
Uso:  python construir.py
"""
import json, re, base64, pathlib
R = pathlib.Path(__file__).parent
rd = lambda p: (R / p).read_text(encoding="utf-8")
J = lambda o: json.dumps(o, ensure_ascii=False, separators=(",", ":")).replace("<", "\\u003c")
cut = lambda t: t.split('if(typeof module!=="undefined")')[0]
sin_cdn = lambda t: re.sub(r'<script src="https://cdnjs\.cloudflare\.com/[^"]*"></script>\n?', "", t)

# Programa de Mantenimiento
seed = json.loads(rd("programas/programa/datos/seed.json"))
programa = rd("programas/programa/src/app.html").replace("/*@CAT@*/", J(seed["cat"])).replace("/*@DATA@*/", J(seed["data"]))

# Reporte de Fallas Envase
fallas = (rd("programas/fallas/src/app.html")
          .replace("/*@PARSER@*/", cut(rd("programas/fallas/src/parser-ventolink.js")))
          .replace("/*@MODEL@*/", cut(rd("programas/fallas/src/modelo-fallas.js")))
          .replace("/*@PRNX@*/", cut(rd("programas/fallas/src/lector-prnx.js")))
          .replace("/*@DATA@*/", J(json.loads(rd("programas/fallas/datos/datos.json")))))

# Reportes Dynamix
dynamix = rd("programas/dynamix/dynamix.html").replace("/*@DATA@*/", J(json.loads(rd("programas/dynamix/datos/semanas.json"))))

for nombre, t in (("programa", programa), ("fallas", fallas), ("dynamix", dynamix)):
    assert "/*@" not in t, f"Falta reemplazar un marcador en {nombre}"

MODS = {"programa": sin_cdn(programa), "fallas": sin_cdn(fallas), "dynamix": sin_cdn(dynamix)}
logo = "data:image/png;base64," + base64.b64encode((R / "base/logo-cemex.png").read_bytes()).decode()

RESET = (':root{color-scheme:light;box-sizing:border-box;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}'
         'html{scroll-padding-top:env(safe-area-inset-top,0px)}body{margin:0;padding:0;font:14px -apple-system,BlinkMacSystemFont,sans-serif;background:#fff;color:#000}'
         'img{max-width:100%}[hidden]:not([hidden=until-found i]){display:none!important}')
HEAD = ('<title>CEMEX GDL Mantenimiento Envase</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n'
        '<link rel="preconnect" href="https://fonts.googleapis.com">\n'
        '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Barlow+Semi+Condensed:wght@500;600;700&family=Source+Sans+3:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap">\n')
LIBS = ('<script src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js"></script>\n'
        '<script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>\n')

html = ('<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover">'
        f'<style>{RESET}</style></head><body>\n' + HEAD
        + '<style id="eco-css">\n' + rd("base/estilos.css") + '</style>\n'
        + rd("base/encabezado.html").replace("{{LOGO}}", logo)
        + LIBS
        + '<script type="application/json" id="eco-mods">' + json.dumps(MODS).replace("<", "\\u003c") + '</script>\n'
        + '<script id="eco-boot">\n' + rd("base/arranque.js") + '</script>\n\n</body></html>')
(R / "sitio").mkdir(exist_ok=True)
(R / "sitio" / "index.html").write_text(html, encoding="utf-8")
print("sitio/index.html listo:", round(len(html) / 1024), "KB")
