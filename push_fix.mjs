import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const migrationsDir = path.join(process.cwd(), 'supabase', 'migrations');
const tempDir = path.join(process.cwd(), 'supabase', 'migrations_temp');

console.log('==============================================');
console.log(' TEFA DKV - Auto Push Single Migration');
console.log('==============================================\n');

try {
  // 1. Buat folder temp
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
  }

  // 2. Pindahkan semua file KECUALI 019 ke temp
  const files = fs.readdirSync(migrationsDir);
  const filesToMove = files.filter(f => f.endsWith('.sql') && !f.startsWith('019'));
  
  console.log(`Mengamankan ${filesToMove.length} file migrasi lama untuk sementara...`);
  for (const file of filesToMove) {
    fs.renameSync(path.join(migrationsDir, file), path.join(tempDir, file));
  }

  // 3. Jalankan db push (sekarang hanya ada 019)
  console.log('\nMemproses push file 019_fix_avatar_read.sql ke Supabase...\n');
  try {
    execSync('npx supabase db push', { stdio: 'inherit' });
    console.log('\n[SUCCESS] Berhasil push fix avatar ke database!');
  } catch (error) {
    console.log('\n[ERROR] Gagal saat push ke Supabase. Pastikan Anda sudah login.');
  }

  // 4. Kembalikan file
  console.log('\nMengembalikan file migrasi ke tempat semula...');
  const tempFiles = fs.readdirSync(tempDir);
  for (const file of tempFiles) {
    fs.renameSync(path.join(tempDir, file), path.join(migrationsDir, file));
  }

  // 5. Hapus folder temp
  fs.rmdirSync(tempDir);
  console.log('Selesai!\n');

} catch (err) {
  console.error('\nTerjadi kesalahan:', err);
  // Coba kembalikan file jika error
  if (fs.existsSync(tempDir)) {
    try {
      const tempFiles = fs.readdirSync(tempDir);
      for (const file of tempFiles) {
        fs.renameSync(path.join(tempDir, file), path.join(migrationsDir, file));
      }
      fs.rmdirSync(tempDir);
    } catch (e) {
      console.error('Gagal mengembalikan file. Harap cek folder supabase/migrations_temp.');
    }
  }
}
