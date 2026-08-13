@echo off
chcp 65001 >nul
echo.
echo ==============================================
echo    TEFA DKV - Auto Push Database ke Supabase
echo ==============================================
echo.
echo Pastikan Anda sudah login ke akun Supabase Anda.
echo Nanti akan diminta Access Token (atau terbuka di browser).
echo.
echo [1/3] Mendownload CLI dan Login ke Supabase...
call npx supabase login

echo.
echo [2/3] Menghubungkan ke Project TEFA DKV (lkxzjggzeswuocirazhc)...
call npx supabase link --project-ref lkxzjggzeswuocirazhc

echo.
echo [3/3] Push Migrasi Khusus Fix Avatar...
node push_fix.mjs

echo.
echo ==============================================
echo    SUCCESS! Proses selesai!
echo ==============================================
echo.
pause
