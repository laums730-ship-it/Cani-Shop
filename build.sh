#!/bin/sh
# Comprime el código de la tienda (no toca las imágenes).
# Se edita SIEMPRE fuente/app.js y fuente/styles.css; este script genera app.js y styles.css (los que ve la gente).
cd "$(dirname "$0")"
PATH="$PATH:/opt/npm-tools/node_modules/.bin"
esbuild fuente/app.js --minify --target=es2019 --outfile=app.js --log-level=warning
esbuild fuente/styles.css --minify --outfile=styles.css --log-level=warning
ls -l app.js styles.css | awk '{print $5, $9}'
