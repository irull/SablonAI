@echo off
cd /d "%~dp0"
if not exist node_modules (
  call npm install
  if errorlevel 1 goto gagal
)
echo.
echo SablonAI - buka http://127.0.0.1:3000 di browser.
echo Mode demo bisa dipakai tanpa API key.
echo Tekan Ctrl+C di jendela ini untuk berhenti.
echo.
call npm run dev
if errorlevel 1 goto gagal
exit /b 0
:gagal
echo Aplikasi belum bisa dijalankan. Salin pesan error untuk pemeriksaan.
pause
exit /b 1
