@echo off
echo ==============================================
echo  TEFA DKV - Auto Commit & Push to GitHub
echo ==============================================
set PATH=C:\Program Files\Git\cmd;%PATH%
git add .
set /p msg="Masukkan pesan commit (atau tekan Enter): "
if "%msg%"=="" set msg=update project & auto deploy
git commit -m "%msg%"
git push origin main
echo ==============================================
echo  Selesai! Vercel akan otomatis men-deploy.
echo ==============================================
pause
