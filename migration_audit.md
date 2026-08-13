# TEFA DKV — REAL DATA MIGRATION READINESS AUDIT


## 1. Data Source Inventory

| SOURCE | ENTITY | CURRENT COUNT | TARGET SUPABASE TABLE |
| --- | --- | --- | --- |
| mockData.ts | Settings | 1 | N/A (UI Static/Remote Config) |
| mockData.ts | Products | 11 | products |
| mockData.ts | Orders | 4 | orders |
| mockData.ts | CustomerFiles | 3 | files |
| mockData.ts | Tools (Inventory) | 6 | inventory_assets |
| mockData.ts | Materials | 6 | materials |
| mockData.ts | Stock Movements | 6 | stock_movements |
| mockData.ts | Finance Tx | 5 | finance_transactions |
| mockData.ts | Procurements | 3 | annual_procurements |


## 2. Entity Mapping & ID Strategy

**Strategy**: Supabase uses UUIDs for primary keys. We will not use array indexes or original string IDs directly as PKs. Instead, we will map Old IDs to stable deterministic Unique Keys (e.g., `code`, `order_no`, `email`) during migration, and let Supabase generate UUIDs. Foreign keys will be resolved using these stable identifiers.

| ENTITY | OLD ID | STABLE UNIQUE IDENTIFIER | MAPPING FIELD (SUPABASE) |
| --- | --- | --- | --- |
| Products | PRD-001 | code (e.g. OUT-FLX280) | products.code |
| Materials | MAT-001 | code (e.g. MAT-FLX280) | materials.code |
| Tools | TL-001 | code (e.g. MES-OUT-01) | inventory_assets.code |
| Orders | ORD-xxx | orderNo (e.g. POS-2025-0891) | orders.order_no |
| Stock Movs | MOV-001 | id (Auto-generated) | UUID (Resolve material_id via material_code) |
| Finance Tx | TRX-001 | transNo | trans_no (Resolve order via order_no) |


## 3. Duplicate & Data Quality Report

🟢 SAFE: No duplicate code in Products.

🟢 SAFE: No duplicate code in Materials.

🟢 SAFE: No duplicate code in Tools (Inventory).

🟢 SAFE: No duplicate orderNo in Orders.

🟢 SAFE: No duplicate transNo in Finance Transactions.

🟢 SAFE: Numeric values (Prices, Stock) pass basic sanity checks (except highlighted).


## 4. Relationship Integrity Report

🟢 SAFE: All foreign key relationships are intact.


## 5. Financial Integrity Report

🟢 SAFE: Order subtotal and total calculations match.


## 6. Stock Integrity Report

🟢 SAFE: Stock movements successfully map to valid materials. Since this is mock data without a definitive "start balance", we will migrate currentStock directly, and append stock_movements as historical logs.


## 7. File Migration Manifest

| ENTITY ID | TYPE | URL / REFERENCE | TARGET BUCKET |
| --- | --- | --- | --- |
| PRD-001 | PRODUCT_IMAGE | https://images.unsplash.com/ph... | products |
| PRD-002 | PRODUCT_IMAGE | https://images.unsplash.com/ph... | products |
| PRD-003 | PRODUCT_IMAGE | https://images.unsplash.com/ph... | products |
| PRD-004 | PRODUCT_IMAGE | https://images.unsplash.com/ph... | products |
| PRD-005 | PRODUCT_IMAGE | https://images.unsplash.com/ph... | products |
| PRD-006 | PRODUCT_IMAGE | https://images.unsplash.com/ph... | products |
| PRD-007 | PRODUCT_IMAGE | https://images.unsplash.com/ph... | products |
| PRD-008 | PRODUCT_IMAGE | https://images.unsplash.com/ph... | products |
| PRD-009 | PRODUCT_IMAGE | https://images.unsplash.com/ph... | products |
| PRD-010 | PRODUCT_IMAGE | https://images.unsplash.com/ph... | products |
| PRD-011 | PRODUCT_IMAGE | https://images.unsplash.com/ph... | products |
| CUST-001 | CUSTOMER_FILE | Master_Logo_NU_HighRes_CMYK.ai | files |
| CUST-001 | CUSTOMER_FILE | Backdrop_Harlah_NU_6x3m_Ready.... | files |
| CUST-001 | CUSTOMER_FILE | Sertifikat_Pelatihan_Kader.cdr | files |
| CUST-002 | CUSTOMER_FILE | Stiker_Classmeeting_2025.cdr | files |
| CUST-002 | CUSTOMER_FILE | Desain_Pin_Panitia.psd | files |
| CUST-003 | CUSTOMER_FILE | KartuNama_Direksi_2025.pdf | files |
| CUST-003 | CUSTOMER_FILE | Mockup_Mug_Souvenir.png | files |

🟡 NEED REVIEW: 18 files referenced in mock data. Most are external URLs (Unsplash) or placeholders. For migration, we may skip external URLs or download and push them to Supabase Storage.


## 8. Auth Mapping

**Strategy**: Users were managed in `authStore.ts` previously. Will need to migrate users from `authStore.ts` (INITIAL_ACCOUNTS) by inserting into `auth.users` and upserting into `profiles`.


## 9. LocalStorage Audit

- **ALLOWED**: `tefa_global_active_cart` (App.tsx), `tefa_pos_recently_used` (KasirView.tsx), `login_slides` (loginContentStore.ts).

- **WARNING**: `STORAGE_KEY_USERS` and `STORAGE_KEY_SESSION` found in `authStore.ts`. These store legacy mock users and sessions. They will become obsolete after Auth Migration in Phase 1.

- **FORBIDDEN DATA**: None found. No products, materials, orders, or finance data are stored in localStorage.


## 10. Migration Execution Order


1. **Auth & Profiles**: Import `initialUsers`.
2. **Materials**: Import `initialMaterials`.
3. **Products**: Import `initialProducts`.
4. **BOM/Recipes**: Import `product.recipe` mapping into `product_recipes`.
5. **Inventory Tools**: Import `initialTools`.
6. **Procurements**: Import `initialProcurements`.
7. **Orders**: Import `initialOrders` (base data).
8. **Order Items**: Import `initialOrders.items`.
9. **Finance Transactions**: Import `initialTransactions`.
10. **Stock Movements**: Import `initialStockMovements`.
11. **Files**: Import `initialCustomerFiles`.
12. **Activity Logs**: Import `initialActivityLogs`.



## 11. Rollback Strategy

- Execute each migration entity in a transaction where possible.
- If an entity script fails (e.g. Orders), delete all imported orders before retrying.
- Target Supabase DB provides TRUNCATE CASCADE if full reset is needed during staging.


## 12. Final Readiness Status

🟡 READY WITH WARNINGS: Data is structurally sound, but files and warnings need manual review during migration.

