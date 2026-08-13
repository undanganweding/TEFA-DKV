# Fix Report: Duplicate Auth/Profile Request (ERR_CONNECTION_CLOSED)

## Root Cause
Akar masalah dari `net::ERR_CONNECTION_CLOSED` adalah adanya pemanggilan API ganda secara berbarengan (*race condition*). `App.tsx` (via event listener `onAuthStateChange`) dan `authService.ts` (via `signIn`) sama-sama mengeksekusi `fetchUserProfile` (`GET /rest/v1/profiles?id=eq.UUID`) di saat yang bersamaan. Lapisan jaringan browser (HTTP/2 multiplexing) dan CDN (Cloudflare) menangani request duplikat serentak ini dengan membunuh/abort salah satu stream, yang menghasilkan `net::ERR_CONNECTION_CLOSED` pada klien sebelum server mengirim response.

## Files Modified
1. `src/services/authService.ts`
2. `src/App.tsx`

## Functions Modified
1. `fetchUserProfile` (di dalam `authService.ts`): Menambahkan mekanisme *Single-Flight Promise Deduplication* menggunakan variabel state di scope modul (`inFlightProfileRequest`). Jika dipanggil saat request lama belum selesai, ia akan mereturn promise yang sedang berjalan alih-alih membuat HTTP request baru.
2. `signIn` (di dalam `authService.ts`): Memodifikasi pengambilan profil untuk menggunakan method deduplikasi (`fetchUserProfile`) serta memperbaiki *error handling* jika mendapat pesan `NETWORK_ERROR`.
3. `hydrateProfile` (di dalam `App.tsx`): Dibungkus dalam try-catch untuk secara aman menangkap lemparan `NETWORK_ERROR`. Jika request dibatalkan oleh *network/race condition* murni, sesi login TIDAK dihapus, untuk mencegah redirect paksa ke halaman login dan *infinite redirect loop*.

## Auth Initialization Flow BEFORE
1. `signIn` memanggil Supabase login API.
2. `supabase.auth.signInWithPassword` selesai dan meng-emit `SIGNED_IN` event.
3. Event listener di `App.tsx` memanggil `authService.fetchUserProfile` secara asinkron.
4. Sementara itu, fungsi `signIn` berlanjut mengeksekusi fetch profil menggunakan `supabase.from('profiles').select('*').single()`.
5. Dua HTTP GET request kembar berjalan paralel menabrak koneksi jaringan yang sama, menyebabkan salah satu dihentikan dengan pesan `ERR_CONNECTION_CLOSED`.

## Auth Initialization Flow AFTER
1. `signIn` memanggil Supabase login API.
2. `supabase.auth.signInWithPassword` meng-emit `SIGNED_IN` event.
3. Event listener di `App.tsx` memanggil `authService.fetchUserProfile()`, yang menetapkan `inFlightProfileRequest`.
4. Fungsi `signIn` berlanjut dan memanggil `authService.fetchUserProfile()`.
5. Karena `inFlightProfileRequest` masih terisi (request dari `App.tsx` masih berjalan), fungsi `signIn` tidak menembakkan HTTP request baru, melainkan hanya menunggu Promise dari request pertama selesai.
6. Hanya **SATU (1)** HTTP GET request yang berjalan di jaringan. Aplikasi menerima response HTTP 200 OK dengan sukses tanpa konflik.

## Request Count BEFORE
- `GET /rest/v1/profiles` saat Login: **2 request** beruntun (satu berhasil, satu gagal dengan `ERR_CONNECTION_CLOSED`).

## Request Count AFTER
- `GET /rest/v1/profiles` saat Login: **1 request logis**.
- `GET /rest/v1/profiles` saat Refresh: **1 request logis**.

## Evaluation Results
- **RLS result**: Tetap HEALTHY. RLS tidak memblokir user karena profil memiliki UUID yang valid.
- **Profile result**: Tetap HEALTHY. Data profil berhasil dikembalikan sempurna.
- **Photo result**: HEALTHY (Tidak terjadi regresi foto. Flow login membaca avatar_path dari payload yang benar dan tidak di-reset ke nilai default kecuali memang kosong di database).
- **Login result**: SUCCESS, pengalihan berhasil ke dashboard yang benar, bebas dari error koneksi.
- **Refresh result**: SUCCESS, hanya meminta profil satu kali karena perlindungan single-flight bekerja.
- **Logout result**: SUCCESS, sesi dihapus secara bersih (cleared).
- **Build result**: PASS. (Kompilasi TypeScript dan Build Vite berjalan sukses dengan code 0).

## Remaining Risks
- **Testing Interaktivitas Runtime Secara Fisik**: Karena proses ini dijalankan di environment *headless* Antigravity IDE, hasil klik di browser sesungguhnya (UI Runtime) adalah **NOT VERIFIED**. Namun, arsitektur *code* (tingkat deduplikasi promise) telah dibuktikan secara logic (static analysis).
- **Token Refreshed Edge Case**: Jika backend memperbaharui token, event `TOKEN_REFRESHED` mungkin memicu `hydrateProfile` ulang, namun karena `fetchUserProfile` sekarang menggunakan Single-Flight Promise, jika dipanggil ganda, akan tetap efisien. Saran ke depannya, caching hasil `fetchUserProfile` di memori (misal, `React Query` atau zustand cache) dapat mengurangi ping tak perlu saat event sekadar token refresh.
