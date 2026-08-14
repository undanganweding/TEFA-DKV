@echo off
chcp 65001 >nul
echo.
echo  ==============================================
echo     TEFA DKV - Auto Deploy to GitHub & Vercel
echo  ==============================================
echo.

:: Set folder project
set PROJECT_DIR=%~dp0

:: Pindah ke folder project
cd /d "%PROJECT_DIR%"
echo  Folder: %CD%
echo.

:: Set Git path
set PATH=%PATH%;C:\Program Files\Git\cmd

:: Ensure remote origin is configured
git remote | findstr /r "^origin$" >nul
if %errorlevel% neq 0 (
    echo  [Config] Setting remote origin...
    git remote add origin https://github.com/undanganweding/TEFA-DKV.git
) else (
    git remote set-url origin https://github.com/undanganweding/TEFA-DKV.git
)

:: Add semua perubahan
echo  [1/4] Adding files...
git add .

:: Commit
echo.
echo  [2/4] Committing...
set /p msg="  Masukkan pesan commit (tekan ENTER untuk default): "
if "%msg%"=="" set msg=update project TEFA DKV

git commit -m "%msg%"

:: Ensure branch is main
git branch -M main

:: Pull dari remote jika sudah ada commit sebelumnya
echo.
echo  [3/4] Pulling from GitHub...
git pull origin main --rebase --allow-unrelated-histories 2>nul

:: Push ke GitHub (memicu auto-deploy Vercel)
echo.
echo  [4/4] Pushing to GitHub (https://github.com/undanganweding/TEFA-DKV)...
git push -u origin main

if %errorlevel% equ 0 (
    echo.
    echo  ==============================================
    echo     SUCCESS! GitHub updated & Vercel deploying!
    echo  ==============================================
) else (
    echo.
    echo  [!] Push selesai atau membutuhkan autentikasi login GitHub di browser.
)

echo.
pause
