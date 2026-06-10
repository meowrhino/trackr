#!/usr/bin/env bash
# Genera dist/ con SOLO el sitio estático (sin .git, TODO/, deck/, docs ni config).
# Usado por Cloudflare Workers Build (build command: `bash build.sh`) y en local.
set -e
rm -rf dist && mkdir -p dist
for item in index.html css js vendor examples analytics navicon.png og-image.png robots.txt sitemap.xml; do
  [ -e "$item" ] && cp -R "$item" dist/
done
echo "dist/ listo: $(find dist -type f | wc -l) archivos"
