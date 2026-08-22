@echo off
title Menjalankan Aplikasi Presensi...
color 0A

echo ===================================================
echo      MEMULAI APLIKASI PRESENSI MIN 1 CIANJUR
echo ===================================================
echo.

:: Pindah ke direktori project (ganti jika path berbeda)
cd /d "%~dp0"

echo [1/3] Menyiapkan Server Database dan Backend...
start "Backend Server" cmd /c "npm start"

:: Tunggu 3 detik agar backend mulai jalan
timeout /t 3 /nobreak > nul

echo [2/3] Menyiapkan Tampilan Aplikasi (Frontend)...
start "Frontend Server" cmd /c "npm run dev"

:: Tunggu 3 detik agar Vite siap
timeout /t 3 /nobreak > nul

echo [3/3] Membuka Browser...
start http://localhost:5173

echo.
echo ===================================================
echo APLIKASI BERHASIL DIJALANKAN!
echo.
echo Biarkan dua jendela hitam (terminal) tetap terbuka 
echo selama Anda menggunakan aplikasi ini.
echo ===================================================
pause
