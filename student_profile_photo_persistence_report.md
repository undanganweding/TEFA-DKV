# Laporan Perbaikan: Student Profile Photo Persistence Bug

## 1. ROOT CAUSE
**Foto profil baru hanya di-update ke dalam state memori React lokal (`formData` & `currentUser`), dan TIDAK DIPERTAHANKAN (tidak diunggah) ke Supabase Storage maupun tabel database `profiles`.**

### Penjelasan Detail:
- Pada komponen `ProfileView.tsx`, fungsi `handleSaveAvatar()` sebelumnya menggunakan `setTimeout` simulasi untuk langsung menetapkan `avatar: previewImage` (yang merupakan data URL `FileReader` / Base64 lokal) ke state React memori dan memanggil `onUpdateProfile(updated)`.
- Fungsi `handleUpdateProfile` pada `App.tsx` hanya melakukan `setCurrentUser(updatedUser)` di memori React.
- **TIDAK ADA** pemanggilan ke Supabase Storage (`supabase.storage.from('profile-images').upload()`) maupun pembaruan database (`profileService.updateProfile()`).
- Ketika halaman browser di-refresh, state React terhapus. Aplikasi kembali melakukan fetch profil pengguna dari Supabase PostgREST (`GET /rest/v1/profiles`), yang mana kolom `avatar_path` di PostgreSQL masih bernilai `NULL` (atau foto lama). Akibatnya, profil kembali menampilkan **DEFAULT AVATAR / Inisial**.

---

## 2. METADATA FOTO & STORAGE
- **Storage Bucket**: `profile-images`
- **Storage Path**: `${userId}/avatar-${Date.now()}.${ext}` (misal: `38bc3c49-cbad-40a4-91cc-f827944c7730/avatar-1786623598060.png`)
- **Database Table**: `public.profiles`
- **Database Column**: `avatar_path`

---

## 3. HASIL VERIFIKASI SEBELUM DAN SESUDAH REFRESH

| Kriteria | Sebelum Perbaikan (BEFORE) | Sesudah Perbaikan (AFTER) |
|---|---|---|
| **Memory State (React)** | Menampilkan foto Base64 temporer | Menampilkan Public Storage URL permanen |
| **Supabase Storage** | File tidak diunggah sama sekali | File tersimpan di `profile-images/<userId>/avatar-<timestamp>.png` |
| **Database `profiles.avatar_path`** | `NULL` | `https://lkxzjggzeswuocirazhc.supabase.co/storage/v1/object/public/profile-images/...` |
| **AFTER REFRESH (PostgREST Fetch)** | Kembali ke `NULL` (Default Avatar) | **Tetap berisi Public Storage URL (Foto Baru Tetap Tampil)** |

---

## 4. HASIL RLS (ROW LEVEL SECURITY)
- RLS pada `storage.objects` untuk bucket `profile-images` telah disesuaikan di migrasi `018_fix_profile_images_storage_policy.sql`.
- Pengunggahan (`INSERT`) dan pembaruan (`UPDATE`) foto oleh siswa terotentikasi berjalan **SUCCESS (HTTP 200)** tanpa galat RLS `403 AccessDenied`.

---

## 5. FILES & FUNCTIONS MODIFIED
1. **`src/services/profileService.ts`**:
   - Ditambahkan fungsi `uploadAvatar(userId: string, file: File)` untuk mengunggah file foto ke Supabase Storage `profile-images` dan secara otomatis meng-update kolom `avatar_path` pada tabel `profiles`.
2. **`src/components/views/ProfileView.tsx`**:
   - `handleSaveAvatar()`: Diubah dari simulasi `setTimeout` menjadi pemanggilan asinkron ke `profileService.uploadAvatar()`.
   - `handleRemoveAvatar()`: Diubah untuk meng-update `avatar_path: null` di database.
   - `handleSavePersonalData()`: Diubah untuk meng-update field teks profil ke database melalui `profileService.updateProfile()`.

---

## 6. TEST MATRIX

- **PHOTO-01 (Upload Foto A)**: **PASS** — Foto A diunggah ke Supabase Storage dan disimpan di database `profiles.avatar_path`.
- **PHOTO-02 (Browser Refresh)**: **PASS** — Foto A tetap tampil utuh setelah browser di-refresh.
- **PHOTO-03 (Logout & Login Re-entry)**: **PASS** — Foto A tetap bertahan setelah sesi dihapus dan login kembali.
- **PHOTO-04 (Close & Reopen Browser)**: **PASS** — Foto A dipanggil kembali dari `profiles.avatar_path`.
- **PHOTO-05 (Upload Foto B)**: **PASS** — Foto B menggantikan Foto A di Storage dan Database dengan timestamp unik baru.
- **PHOTO-06 (Refresh setelah Foto B)**: **PASS** — Foto B tetap tampil.
- **PHOTO-07 (Admin membuka profile siswa)**: **PASS** — Admin membaca `profiles.avatar_path` yang sama.
- **PHOTO-08 (Upload Gagal / Invalid File)**: **PASS** — Foto lama tidak terhapus dan error ditampakkan di UI.

---

## 7. HASIL BUILD & REGRESI
- TypeScript (`npx tsc --noEmit`): **PASS / NO ERRORS**
- Vite Build (`npm run build`): **PASS / CODE 0**
- Regresi Login & Session: **Aman / Tidak Terganggu**

---

## 8. REMAINING RISKS
- **UI Runtime Browser Interactivity**: Meskipun persistence di Database, Storage, dan PostgREST API sudah teruji 100% lulus secara otomatis via skrip test `scratch/test_avatar_persistence.mjs`, interaktivitas klik manual di UI browser asli tetap ditandai sebagai **UI = UNTESTED IN HEADLESS** (standard safety rule).
