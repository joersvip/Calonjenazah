@echo off
title CALON JENAZAH - Portal Berita Server
echo ========================================================
echo       MENJALANKAN PORTAL BERITA CALON JENAZAH
echo ========================================================
echo.
echo Memastikan build frontend produksi siap...
if not exist "client\dist\index.html" (
    echo Mengompilasi frontend React...
    call npm run build
)

echo.
echo Memulai server portal dan live tracker di port 5000...
echo Portal Web   : http://localhost:5000
echo Admin Portal : http://localhost:5000/#/admin
echo.
echo Tekan Ctrl+C untuk menghentikan server.
echo ========================================================
set NODE_ENV=production
node server/index.js
pause
