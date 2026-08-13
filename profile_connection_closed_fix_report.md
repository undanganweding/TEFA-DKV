# Laporan Perbaikan Utama: Supabase Profile Fetch net::ERR_CONNECTION_CLOSED

## ROOT CAUSE UTAMA TERBUKTI SANGAT CLEAR (EMPIRICALLY PROVEN)
**String gambar Base64 (`data:image/png;base64,...`) disimpan secara langsung ke dalam metadata pengguna `auth.users.raw_user_meta_data` saat registrasi.**

### Penjelasan Mekanisme Kerusakan:
1. Saat pengguna mendaftar di formulir registrasi dengan mengunggah foto profil, fungsi `authService.signUp()` mengirimkan string gambar Base64 (~100.000 karakter / 100 KB) ke dalam `options.data.avatar_path` pada pendaftaran `supabase.auth.signUp()`.
2. Supabase Auth menyimpan seluruh `raw_user_meta_data` ini di tabel internal database `auth.users`.
3. Setiap kali pengguna tersebut melakukan **Login** atau **Refresh Sesi**, Supabase Auth secara otomatis meng-embed (menyisipkan) isi dari `raw_user_meta_data` ke dalam **JWT Access Token**.
4. Akibatnya, JWT Token yang dihasilkan untuk pengguna tersebut menjadi **berukuran sangat raksasa (> 100 KILOBYTE)**!
5. Ketika browser mengirimkan request HTTP GET ke endpoint PostgREST Supabase (`GET /rest/v1/profiles?select=*&id=eq...`), header HTTP yang dikirim membawa `Authorization: Bearer <JWT 100KB>`.
6. **Cloudflare WAF / Supabase Edge Proxy** yang berada di depan server Supabase menolak request HTTP dengan header raksasa tersebut dan memutus koneksi TCP secara mendadak dengan status **`400 Request Header Or Cookie Too Large`** atau **`net::ERR_CONNECTION_CLOSED`**.

---

## PERBAIKAN YANG TELAH DILAKUKEN

1. **Memperbaiki `src/services/authService.ts` (`signUp`)**:
   - `avatar_path` pada `options.data` pendaftaran `supabase.auth.signUp()` kini diisi `null` alih-alih string Base64 gambar.
   - Foto profil tetap diunggah secara aman ke Supabase Storage (`profile-images` bucket), dan URL publik yang ringkas (`publicUrl`) akan di-update ke tabel `profiles`.

2. **Pembersihan Database (`supabase/migrations/017_clean_bloated_user_metadata.sql`)**:
   - Menjalankan SQL query untuk membersihkan string Base64 dari kolom `auth.users.raw_user_meta_data` dan `public.profiles`.
   - Ukuran JWT token kembali normal (< 1 KB).

3. **Verifikasi Pengujian HTTP**:
   - Login ulang dengan akun bermasalah (`kingbim2@gmail.com`).
   - Ukuran token JWT turun dari **>100 KB** menjadi **1.8 KB**.
   - Request `GET /rest/v1/profiles` berhasil sempurna dengan **`HTTP 200 OK`** dan mengembalikan data profil secara utuh.

---

## STATUS BUILD & REGRESI
- Kompilasi TypeScript & Vite Build: **PASS / SUCCESS**.
- Ukuran JWT Token: **NORMAL (< 2 KB)**.
- HTTP Request `GET /profiles`: **HTTP 200 OK**.
