@echo off
chcp 65001 >nul
echo.
echo  ==============================================
echo     TEFA DKV - Auto Deploy to Vercel
echo  ==============================================
echo.

:: Set folder project
set PROJECT_DIR=E:\web\TEFA-DKV-main

:: Pindah ke folder project
cd /d "%PROJECT_DIR%"
echo  Folder: %CD%
echo.

:: Set Git path
set PATH=%PATH%;C:\Program Files\Git\cmd

:: Add semua perubahan
echo  [1/4] Adding files...
git add .

:: Commit
echo.
echo  [2/4] Commiting...
set /p msg="  Masukkan pesan commit: "
if "%msg%"=="" set msg=update project
git commit -m "%msg%"

:: Pull dari remote
echo.
echo  [3/4] Pulling from GitHub...
git pull origin main --no-edit

:: Push ke remote
echo.
echo  [4/4] Pushing to GitHub...
git push origin main

echo.
echo  ==============================================
echo     SUCCESS! Vercel auto-deploy trigger!
echo  ==============================================
echo.
pause
