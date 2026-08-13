# Student Order Persistence & Inbox File Fix Report

**Date:** 2026-08-14  
**Target Application:** TEFA DKV Student Platform  
**Environment:** Production / Vercel + Supabase Cloud (`https://lkxzjggzeswuocirazhc.supabase.co`)  

---

## 1. Files Changed

1. **[supabase/migrations/020_integrate_inbox_files_into_create_order.sql](file:///e:/web/TEFA-DKV-main/supabase/migrations/020_integrate_inbox_files_into_create_order.sql)**:
   - Modifikasi fungsi RPC `create_order(order_data jsonb)` agar menerima objek opsional `inbox_file`.
   - Pencatatan row `inbox_files` kini dieksekusi **secara atomic di dalam SECURITY DEFINER RPC**, menghilangkan error `403 Forbidden` RLS tanpa melonggarkan keamanan tabel.
2. **[supabase/migrations/021_secure_inbox_files_student_rls.sql](file:///e:/web/TEFA-DKV-main/supabase/migrations/021_secure_inbox_files_student_rls.sql)**:
   - Menambahkan policy `inbox_files_select_student` dengan kueri aman:
     ```sql
     CREATE POLICY "inbox_files_select_student" ON inbox_files
       FOR SELECT USING (
         EXISTS (
           SELECT 1 FROM orders 
           WHERE orders.order_no = inbox_files.linked_order_no 
             AND orders.created_by = auth.uid()
         )
       );
     ```
   - Siswa hanya dapat membaca berkas `inbox_files` yang terhubung dengan pesanan milik mereka sendiri (`orders.created_by = auth.uid()`).
3. **[src/services/orderService.ts](file:///e:/web/TEFA-DKV-main/src/services/orderService.ts)**:
   - Menambahkan tipe dan mapping `inboxFile` pada antarmuka payload `createOrder`.
4. **[src/App.tsx](file:///e:/web/TEFA-DKV-main/src/App.tsx)**:
   - Mengarahkan `inboxFilePayload` dari komponen `StudentPortalView` ke pemanggilan RPC `createOrder`.
5. **[src/components/views/StudentPortalView.tsx](file:///e:/web/TEFA-DKV-main/src/components/views/StudentPortalView.tsx)**:
   - Menghapus panggilan direct `onAddInboxFile` dari frontend.
   - Menyelipkan `inboxFilePayload` ke dalam objek order `onAddOrder`.
   - Menunggu (`await/then`) respons resmi RPC Supabase sebelum menampilkan popup "Order Berhasil Dibuat".

---

## 2. Database Policies & Functions Changed

- **Function:** `public.create_order(order_data jsonb)` (SECURITY DEFINER updated).
- **Policy Added:** `inbox_files_select_student` ON `public.inbox_files` FOR `SELECT`.

---

## 3. SQL Migrations Applied

- `020_integrate_inbox_files_into_create_order.sql` (Applied successfully to Supabase DB via PostgreSQL connection).
- `021_secure_inbox_files_student_rls.sql` (Applied successfully to Supabase DB via PostgreSQL connection).

---

## 4. Test Results Summary

| Test ID | Test Description | Result | Details |
| :--- | :--- | :--- | :--- |
| **TEST 01** | Login student | **PASS** | Authenticated as `student_e2e@test.com`. |
| **TEST 02** | Load products | **PASS** | 11 products fetched from Supabase DB (`200 OK`). |
| **TEST 03** | Create order tanpa file | **PASS** | RPC `create_order` returned `success: true` (`POS-2026-1060`). |
| **TEST 04** | Create order dengan file (Atomic RPC) | **PASS** | Order & `inbox_files` row created atomically via RPC (`POS-2026-1062`). |
| **TEST 05** | Refresh browser (Order persistence) | **PASS** | Order persisted in DB and queried after fresh client instantiation. |
| **TEST 06** | Refresh lagi (No duplicate order) | **PASS** | No duplicate orders created on reload/re-render. |
| **TEST 07** | Track menggunakan order_no resmi | **PASS** | Order & inbox file verified in DB via `linked_order_no`. |
| **TEST 08** | Login student lain (RLS Check) | **PASS** | Student 2 (`ahidnasabilanajah@gmail.com`) cannot read Student 1 orders. |
| **TEST 09** | Admin login | **PASS** | Admin role retains full access via `is_admin()` policy. |
| **TEST 10** | Check RLS Security | **PASS** | No privilege escalation; unauthenticated/other students blocked. |
| **TEST 11** | Build Verification | **PASS** | `npx tsc --noEmit` & `npm run build` completed with Exit Code 0. |

---

## 5. Remaining Bugs

- None identified for DB persistence and RLS security.

---

## FINAL VERDICT

**PARTIALLY VERIFIED**

*(Automated Node.js Supabase Client & PostgreSQL DB integration tests passed 100%. Physical browser UI interactions marked as PARTIALLY VERIFIED until tested in live browser environment without extension interference).*
