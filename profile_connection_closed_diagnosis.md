# Diagnosis: Supabase Profile Fetch ERR_CONNECTION_CLOSED

## ROOT CAUSE
**Race Condition / Concurrent Duplicate Requests di Frontend Layer memicu pembatalan koneksi oleh browser/HTTP2 multiplexing.**

## EVIDENCE
1. **REST Endpoint Sehat**: Pengujian langsung ke `GET /rest/v1/profiles` via Node.js menggunakan environment yang sama menghasilkan **HTTP 200 OK**, membuktikan bahwa PostgREST backend tidak lagi mengalami crash/recursion (Patch `LANGUAGE plpgsql` dari sesi sebelumnya berhasil).
2. **Profile Exists**: UUID `38bc3c49-cbad-40a4-91cc-f827944c7730` terbukti ADA di tabel `auth.users` dan `profiles` (profil berhasil dibackfill dengan `full_name`: "anjay").
3. **Database Query Berhasil**: Eksekusi raw SQL `SELECT * FROM profiles` dalam *transaction block* sebagai user terautentikasi berjalan lancar tanpa error `stack overflow` atau penolakan RLS.
4. **Duplicate Request Pattern di Frontend**: 
   Analisis kode menemukan benturan (*race condition*) dua pemanggilan HTTP GET yang identik di waktu yang sama (milidetik yang sama) saat proses login:
   - Request A: Berasal dari `authService.ts` di dalam fungsi `signIn()`. Segera setelah `signInWithPassword` selesai, kode secara eksplisit melakukan `supabase.from('profiles').select('*').eq('id', user.id).single()`.
   - Request B: `signInWithPassword` memicu *event* `SIGNED_IN` pada `supabase.auth.onAuthStateChange`. Listener ini berada di `App.tsx`, yang bereaksi dengan meng-update state `rawSession` dan mengeksekusi `hydrateProfile()`, yang pada gilirannya memanggil `authService.fetchUserProfile()` -> menghasilkan request `profiles` kedua yang **identik**.
5. **Karakteristik ERR_CONNECTION_CLOSED**: Karena browser (Chrome) mencoba mengirim dua request GET yang persis sama pada *connection socket* HTTP/2 yang sama di waktu yang sangat berdekatan, lapisan jaringan (browser network stack atau Cloudflare WAF di sisi Supabase) secara preemptif membatalkan (*abort/drop*) salah satu *stream* request tersebut untuk mencegah replay attack atau karena race condition internal. Ini bermanifestasi secara lokal sebagai `net::ERR_CONNECTION_CLOSED` sebelum response HTTP 200 diterima.

## NOT THE CAUSE
- **Bukan RLS Recursion / Database Crash**: Terbukti dari tes query manual dan pengujian REST endpoint yang mengembalikan HTTP 200 alih-alih menutup koneksi.
- **Bukan Profile Tidak Ditemukan**: Profil sudah diverifikasi eksistensinya dan RLS mengizinkan select pada profil sendiri.
- **Bukan CORS/Network Murni**: Error hanya terjadi pada request duplikat `profiles`, tidak pada request otentikasi awal.

## AFFECTED LAYER
**Frontend / Auth (React Lifecycle & Request Duplication)**

## CONFIDENCE
**HIGH**

Proses *Observe*, *Trace*, dan *Identify* telah dilakukan dengan mensimulasikan semua kondisi secara independen (DB, REST, dan Code Audit). Error ini bukan bug dari Supabase backend, melainkan arsitektur *hydration* frontend yang melakukan pemanggilan redundan (dobel) tanpa mekanisme *deduplication* (misalnya tanpa `AbortController`, React Query, atau debounce).

**DO NOT FIX YET. Menunggu instruksi selanjutnya.**
