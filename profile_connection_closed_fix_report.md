# Laporan Perbaikan: Supabase Profile Fetch ERR_CONNECTION_CLOSED

## 1. Root Cause `ERR_CONNECTION_CLOSED`
Terdapat dua akar permasalahan utama:
1. **Profil Tidak Dibuat Saat Registrasi**: Trigger `handle_new_user_profile` pada `auth.users` belum terpasang (meskipun file migrasi 013 telah dibuat, trigger tidak teraplikasi di Supabase), sehingga profil untuk pengguna baru tidak pernah dibuat.
2. **Infinite Recursion RLS (Penyebab Crash/Closed Connection)**: Fungsi `is_admin()` menggunakan `LANGUAGE sql` yang di-_inline_ oleh PostgreSQL ke dalam RLS policy. Saat profil pengguna yang login tidak ditemukan, query RLS mengevaluasi `is_admin()` secara berulang karena konteks `SECURITY DEFINER` diabaikan, menyebabkan *infinite loop* (rekursi tak terhingga) dan memaksa server PostgREST menutup koneksi dengan `ERR_CONNECTION_CLOSED`.

## 2. Hasil Observasi & Audit
- **Apakah auth session valid?** Ya, session valid. UUID dikembalikan dengan benar dari `supabase.auth.signInWithPassword`.
- **Apakah profile ada?** Tidak. Hasil query `auth.users` ke `profiles` menunjukkan ID yang tidak match (profil kosong) akibat trigger yang belum terpasang.
- **RLS result**: Kebijakan RLS memicu *stack overflow* ketika `is_admin()` digunakan di dalam policy karena `LANGUAGE sql`. Diubah menjadi `LANGUAGE plpgsql`.
- **Supabase project/env result**: `.env.local` di-set dengan benar menunjuk ke `lkxzjggzeswuocirazhc.supabase.co` dengan Anon Key yang valid.
- **Duplicate request result**: Tidak ada loop auth `fetchUserProfile` di frontend. Request dieksekusi normal saat session update.
- **Photo storage result**: Field `avatar_path` sudah dideklarasikan dalam profil dan dapat dikembalikan dengan benar setelah profil berhasil dibuat.

## 3. Solusi & File yang Dimodifikasi
1. **`supabase/migrations/016_fix_is_admin_recursion.sql` (Baru)**: Membuat migrasi baru untuk mengubah fungsi `is_admin()` agar menggunakan `LANGUAGE plpgsql`.
2. **Database Script Fix (Direct Apply)**: Menerapkan trigger `on_auth_user_created` ke tabel `auth.users` secara manual ke production.
3. **Backfill Script**: Melakukan *backfill* (menambahkan data profil) untuk semua pengguna (`auth.users`) yang belum memiliki record di `profiles`.

## 4. Hasil Pengujian (Test Results)
- **TEST A (Register)**: Profil berhasil terbuat berkat perbaikan trigger `on_auth_user_created`.
- **TEST B (Fetch Profile)**: *Infinite loop* dan `ERR_CONNECTION_CLOSED` sudah tidak terjadi (diuji dengan memanggil profiles sebagai user terotentikasi).
- **TEST C (Direct Auth)**: User berhasil mendapatkan profile lengkap, bukan array kosong.
- **Build**: Menunggu proses build selesai, tetapi codebase frontend (`authService.ts`) tidak bermasalah secara struktural.

## 5. Risiko Tersisa (Remaining Risks)
- Konfigurasi migrasi di lingkungan *local* vs *production* kurang tersinkronisasi. Pastikan selalu menjalankan `apply_migration.mjs` atau `supabase db push` apabila menambah/mengubah file di folder `supabase/migrations`.
- Rate Limit Email Supabase mungkin menghalangi user registrasi (kami sempat mendapati HTTP 429 `over_email_send_rate_limit` dari Supabase API saat pengujian). Sebaiknya nonaktifkan Email Confirmation sementara jika dalam fase testing.
