#!/usr/bin/env bash
# Script runner portal berita CALON JENAZAH di Linux VPS
set -e

echo "========================================================"
echo "      MENJALANKAN PORTAL BERITA CALON JENAZAH (LINUX)   "
echo "========================================================"

if [ ! -f "client/dist/index.html" ]; then
    echo "Mengompilasi frontend React..."
    npm --prefix client run build
fi

export NODE_ENV=production
export PORT=${PORT:-5000}

echo "Server aktif di http://localhost:$PORT"
node server/index.js
