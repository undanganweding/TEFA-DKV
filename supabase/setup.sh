#!/bin/bash
# Auto-sync Supabase credentials ke .env.local
# Run: ./setup-supabase.sh

echo "========================================"
echo "  TEFA DKV Supabase Auto-Setup"
echo "========================================"
echo ""

# Cek apakah supabase CLI terinstall
if ! command -v supabase &> /dev/null; then
    echo "⚠️  Supabase CLI belum terinstall."
    echo "   Install dulu: npm install -g supabase"
    echo ""
fi

# Baca credentials dari CLI atau prompt manual
echo "📋 Buka dashboard Supabase kamu di browser:"
echo "   https://supabase.com/dashboard/project/lkxzjggzeswoirazhc"
echo ""
echo "📌 Buka Project Settings → API"
echo ""

read -p "🌐 Masukkan Project URL (contoh: https://xxxx.supabase.co): " SUPABASE_URL
read -p "🔑 Masukkan Anon/Public Key: " SUPABASE_KEY

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
    echo "❌ URL atau Key kosong. Setup dibatalkan."
    exit 1
fi

# Tulis ke .env.local
cat > .env.local << EOF
VITE_SUPABASE_URL=$SUPABASE_URL
VITE_SUPABASE_ANON_KEY=$SUPABASE_KEY
EOF

echo ""
echo "✅ Credentials disimpan ke .env.local"
echo ""
echo "📝 Schema SQL siap dijalankan:"
echo "   Buka SQL Editor di dashboard Supabase"
echo "   Paste isi supabase/schema.sql"
echo "   Klik Run"
echo ""
echo "📝 Seed Data siap dijalankan:"
echo "   Paste isi supabase/seed.sql"
echo "   Klik Run"
echo ""
echo "========================================"
