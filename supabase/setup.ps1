# TEFA DKV - Supabase Auto-Setup
# Buka dashboard Supabase → Project Settings → API

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TEFA DKV Supabase Auto-Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check project ref from .env.local
$envFile = ".env.local"
if (Test-Path $envFile) {
    $envContent = Get-Content $envFile -Raw
    if ($envContent -match "VITE_SUPABASE_URL=https://(.*)\.supabase\.co") {
        $projectRef = $Matches[1]
        Write-Host "📦 Project Supabase Terdeteksi: $projectRef" -ForegroundColor Green
    }
}

# Step 1: Instructions
Write-Host ""
Write-Host "📋 Buka dashboard Supabase:" -ForegroundColor Yellow
Write-Host "   https://supabase.com/dashboard" -ForegroundColor White
Write-Host ""
Write-Host "📋 LANGKAH-LANGKAH SETUP:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Buka dashboard Supabase → SQL Editor" -ForegroundColor Yellow
Write-Host ""
Write-Host "2. Klik 'New Query' dan paste script berikut:" -ForegroundColor White
Write-Host "   → supabase\schema.sql (Klik kanan → Open with Code)" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Klik 'Run' untuk membuat semua tabel" -ForegroundColor White
Write-Host ""
Write-Host "4. Buat query baru, paste dan jalankan:" -ForegroundColor White
Write-Host "   → supabase\seed.sql" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Klik 'Run' untuk import data sample" -ForegroundColor White
Write-Host ""
Write-Host "6. Buka Project Settings → Authentication → Site URL:" -ForegroundColor Yellow
Write-Host "   http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "7. Di bagian Redirect URLs, tambahkan:" -ForegroundColor Yellow
Write-Host "   http://localhost:5173/*" -ForegroundColor Gray
Write-Host "   http://localhost:5173" -ForegroundColor Gray
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SETELAH TABEL DIBUAT, JALANKAN APP:" -ForegroundColor Green
Write-Host "   npm run dev" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 TIPS:" -ForegroundColor Cyan
Write-Host "   - Pastikan .env.local sudah ada dengan credentials Supabase" -ForegroundColor Gray
Write-Host "   - Buka DevTools (F12) → Console untuk melihat status koneksi" -ForegroundColor Gray
Write-Host "   - Indicator hijau = Connected, kuning = Using Local Data" -ForegroundColor Gray
Write-Host ""
