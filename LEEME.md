# CEMEX GDL · Mantenimiento Envase

Página con tres programas y menú arriba: **Programa de Mantenimiento**, **Reporte de Fallas Envase** y **Reportes Dynamix**.

## Publicarla en Netlify con datos compartidos
Para que lo que se carga o se aprueba lo vean todos, el sitio guarda los datos en Netlify (función `netlify/functions/datos.mjs` + Netlify Blobs). Eso solo funciona si el sitio se publica desde GitHub; arrastrar la carpeta a Netlify publica la página, pero sin guardar.

1. **GitHub:** crea un repositorio nuevo (privado) y sube todo el contenido de esta carpeta (arrastra los archivos y carpetas en “Add file → Upload files”).
2. **Netlify:** en el sitio *mantenimientocemex* → *Site configuration → Build & deploy → Link repository* → elige el repositorio. Netlify toma la configuración de `netlify.toml` (no hay que escribir comando de build).
3. **Clave de edición:** *Site configuration → Environment variables → Add a variable* → nombre `CLAVE_EDICION`, valor: la clave que quieras. Luego *Deploys → Trigger deploy*.
4. Abre el sitio, toca **Iniciar sesión** (arriba a la derecha) y escribe la clave.

Quien no inicia sesión ve todo en modo consulta: sin botones de cargar, aprobar ni capturar avisos. Con sesión iniciada se carga Ventolink y Dynamix, se ordena y aprueba el programa y se capturan avisos; al guardar, lo ven todos.

## Cómo se modifica
1. Cambia lo que necesites en `base/` o en `programas/`.
2. Ejecuta `python construir.py` → genera `sitio/index.html`.
3. Sube los cambios a GitHub; Netlify publica solo. Los datos cargados no se pierden al publicar una versión nueva.

## Estructura
```
sitio/index.html             página completa (se genera)
construir.py                 junta todo en sitio/index.html
netlify.toml, package.json   configuración de Netlify
netlify/functions/datos.mjs  guarda y entrega los datos (/api/datos)
base/
  encabezado.html            logo, "Planta Guadalajara", menú e inicio de sesión
  estilos.css                estilos de esa barra
  arranque.js                carga el programa elegido y lee/guarda los datos del sitio
  logo-cemex.png
programas/
  programa/src/app.html      Programa de Mantenimiento
  programa/datos/seed.json   data = programa de la semana · cat = equipos SAP (IH08 Envase)
  fallas/src/*               Reporte de Fallas Envase y lectores de Ventolink (PDF y .prnx)
  fallas/datos/datos.json    historial de alarmas, producción y peso por boquilla
  dynamix/dynamix.html       Reportes Dynamix
  dynamix/datos/semanas.json semanas cargadas del bot
```
Los archivos de `datos/` son el punto de partida. Una vez que se guarda algo en el sitio, manda lo guardado en Netlify.

## Dónde cambiar cosas comunes
- **Colores y tipografía:** bloque `:root{...}` al inicio del `app.html` de cada programa.
- **Textos y pestañas:** busca el texto en el `app.html` del programa.
- **Menú:** `base/encabezado.html` (enlaces con `data-m`) y la lista `KEYS` en `base/arranque.js`.
- **Logo:** reemplaza `base/logo-cemex.png`.
- **Clasificación de fallas por área y recomendaciones:** `AREAS`, `areaDef` y `RECS` en `programas/fallas/src/app.html`.
- **Prioridades y máximo de 10 actividades:** `prioSap` y `cap` en `programas/programa/src/app.html`.
