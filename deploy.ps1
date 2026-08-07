# TEFA-DKV Auto Deploy Script
# Usage: .\deploy.ps1 "commit message"

param(
    [Parameter(Position=0)]
    [string]$CommitMessage = "Auto deploy $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  TEFA-DKV Auto Deploy Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check Git
Write-Host "[1/5] Checking Git..." -ForegroundColor Yellow
$gitCmd = Get-Command git -ErrorAction SilentlyContinue
if (-not $gitCmd) {
    Write-Host "Git not found! Please install Git first:" -ForegroundColor Red
    Write-Host "  winget install Git.Git" -ForegroundColor Yellow
    exit 1
}
Write-Host "  Git found: $(git --version)" -ForegroundColor Green

# Check Vercel
Write-Host "[2/5] Checking Vercel CLI..." -ForegroundColor Yellow
$vercelCmd = Get-Command vercel -ErrorAction SilentlyContinue
if (-not $vercelCmd) {
    Write-Host "Vercel CLI not found! Installing..." -ForegroundColor Yellow
    npm install -g vercel
}
Write-Host "  Vercel CLI ready" -ForegroundColor Green

# Git Add & Commit
Write-Host "[3/5] Git add & commit..." -ForegroundColor Yellow
git add -A
git commit -m $CommitMessage
Write-Host "  Committed!" -ForegroundColor Green

# Git Push
Write-Host "[4/5] Git push to origin..." -ForegroundColor Yellow
git push origin main
Write-Host "  Pushed!" -ForegroundColor Green

# Vercel Deploy
Write-Host "[5/5] Deploying to Vercel..." -ForegroundColor Yellow
vercel --prod
Write-Host ""

Write-Host "========================================" -ForegroundColor Green
Write-Host "  Deploy Complete!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
