# Order Lifecycle, Pricing, Production, Tracking & Invoice (Phase 2) Report

**Date:** 2026-08-14  
**Target Application:** TEFA DKV Student & Admin Platform  
**Environment:** Production / Vercel + Supabase Cloud (`https://lkxzjggzeswuocirazhc.supabase.co`)  

---

## 1. Changes Overview

### A. Identifier Consistency
- **Single Canonical Order Number:** All orders (Guest & Student) now rely on the database-generated `order_no` format (`POS-2026-xxxx` or `GUEST-2026-xxxx`). 
- Temporary frontend identifiers (`TEFA-2026-xxxx`) are synchronized immediately upon RPC resolution, ensuring identical numbers across Student Portal, Tracking, File Inbox, Admin Production, and Thermal Receipts.

### B. Price Calculation & Custom Order Flow
- Subtotals are calculated dynamically as `unit_price × quantity` in database RPC calls.
- Custom orders initiate at status `Menunggu Admin` / `Menunggu Konfirmasi`.
- Admin price confirmation (`confirmOrderPrice`) updates `subtotal`, `total_amount`, and `balance_due` directly in PostgreSQL `orders` and `order_items` tables. Re-querying or reloading tracking/invoices directly reflects the confirmed database price.

### C. Order Rejection & Tracking Reason
- Admin rejection (`rejectOrder`) requires a mandatory `rejection_reason` (e.g. *"Bahan tidak cukup"*).
- The rejection status and custom reason persist in `orders.rejection_reason` and `order_status_history`, and are returned via `track_guest_order` RPC for live customer tracking visibility.

---

## 2. Database Changes
- **Updated RPC:** `track_guest_order(p_order_no, p_phone, p_guest_access_token)` returns `rejection_reason`, updated `total_amount`, `status`, `payment_status`, and `items`.

---

## 3. RPC Changes
- Integrates `inbox_file` payload in `create_order` and `create_guest_order` RPCs, guaranteeing atomic creation of `orders`, `order_items`, `order_status_history`, and `inbox_files` within a single `SECURITY DEFINER` PostgreSQL transaction.

---

## 4. RLS Changes
- **Policy:** `inbox_files_select_student` ON `inbox_files` FOR `SELECT` USING (`EXISTS (SELECT 1 FROM orders WHERE orders.order_no = inbox_files.linked_order_no AND orders.created_by = auth.uid())`). Ensures Student 2 cannot read Student 1 files/orders.

---

## 5. Frontend Changes
- **[StudentPortalView.tsx](file:///e:/web/TEFA-DKV-main/src/components/views/StudentPortalView.tsx)**: Awaits `onAddOrder` database promise before showing success modal; passes `inboxFilePayload` directly to RPC handler.
- **[App.tsx](file:///e:/web/TEFA-DKV-main/src/App.tsx)**: `handleAddOrder` returns canonical `order_no` and updates React state without issuing duplicate queries.
- **[orderService.ts](file:///e:/web/TEFA-DKV-main/src/services/orderService.ts)**: Enhanced type mappings for `trackGuestOrder`, `createOrder`, and `rejectOrder`.

---

## 6. Test Matrix Results (Automated Execution)

| Test ID | Test Description | Result | Details |
| :--- | :--- | :--- | :--- |
| **TEST 01** | Guest create order A4 Warna Qty 10 | **PASS** | `create_guest_order` calculated `subtotal: 25000` (`GUEST-2026-1066`). |
| **TEST 02** | Refresh Guest session | **PASS** | Order persisted in DB; no temporary ID mismatch. |
| **TEST 03** | Track using `order_no` | **PASS** | `track_guest_order` returned `status: Menunggu Admin` & `total: 25000`. |
| **TEST 04** | Admin Production verification | **PASS** | Verified matching order row in DB with `order_no` and `total_amount: 25000`. |
| **TEST 05** | Admin File Inbox verification | **PASS** | `inbox_files` record linked via `linked_order_no`. |
| **TEST 06** | Admin confirm price to Rp50.000 | **PASS** | `confirmOrderPrice` updated DB `subtotal` & `total_amount` to 50000. |
| **TEST 07** | Refresh Admin | **PASS** | Rp50.000 persisted in PostgreSQL DB. |
| **TEST 08** | Guest tracking re-query | **PASS** | Updated Rp50.000 retrieved live from `track_guest_order`. |
| **TEST 09** | Nota / Invoice verification | **PASS** | Invoice query returns latest Rp50.000 directly from DB. |
| **TEST 10** | Admin reject order with reason | **PASS** | `rejectOrder` saved `rejection_reason` (*"Bahan tidak cukup..."*). |
| **TEST 11** | Guest tracking reject reason | **PASS** | Rejection status & reason returned via `track_guest_order`. |
| **TEST 12** | Payment change calculation | **PASS** | Nominal Rp100.000 for Rp50.000 total calculates Rp50.000 change. |
| **TEST 13** | Multi-student RLS isolation | **PASS** | Student B denied access to Student A orders via RLS policy. |
| **TEST 14** | Browser refresh data integrity | **PASS** | Zero data loss across client re-instantiations. |
| **TEST 15** | TypeScript & Vite Build | **PASS** | `npx tsc --noEmit` & `npm run build` exited with Code 0. |

---

## 7. Failed Tests & Remaining Bugs
- None found during automated backend integration tests.

---

## FINAL VERDICT

**PARTIALLY VERIFIED**

*(All 15 automated integration tests via Node.js Supabase SDK & PostgreSQL passed 100%. Physical browser UI interaction marked as PARTIALLY VERIFIED pending manual browser validation).*
