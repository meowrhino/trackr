#!/usr/bin/env bash
# Genera dist/ con SOLO el sitio estático (sin .git, TODO/, deck/, docs ni config).
# Usado por Cloudflare Workers Build (build command: `bash build.sh`) y en local.
set -e
rm -rf dist && mkdir -p dist
for item in index.html customer-journey.html deck css js journey vendor examples analytics navicon.png og-image.png manifest.json sw.js icon-192.png icon-512.png robots.txt sitemap.xml; do
  [ -e "$item" ] && cp -R "$item" dist/
done
# Bump del cache name del service worker por release (sha de git o timestamp) -> activate() purga el cache viejo
if [ -f dist/sw.js ]; then
  VER="$(git rev-parse --short HEAD 2>/dev/null || date +%s)"
  sed -i.bak "s/trackr-v1/trackr-$VER/" dist/sw.js && rm -f dist/sw.js.bak
fi
echo "dist/ listo: $(find dist -type f | wc -l) archivos"
