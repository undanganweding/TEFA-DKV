-- ==========================================================
-- TEFA DKV — ROW LEVEL SECURITY POLICIES
-- ==========================================================
-- Execute in Supabase Dashboard > SQL Editor
-- ==========================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE annual_procurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE inbox_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_file_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- ==========================================================
-- Helper function: check if current user is Admin
-- ==========================================================
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'Admin'
    AND status = 'Active'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ==========================================================
-- PROFILES
-- ==========================================================

-- Users can read their own profile
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Admin can read all profiles
CREATE POLICY "profiles_select_admin" ON profiles
  FOR SELECT USING (is_admin());

-- Users can update own profile (but not role or status)
CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM profiles WHERE id = auth.uid())
    AND status = (SELECT status FROM profiles WHERE id = auth.uid())
  );

-- Admin can update any profile
CREATE POLICY "profiles_update_admin" ON profiles
  FOR UPDATE USING (is_admin());

-- Allow insertion during signup (via service role or trigger)
CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Admin can delete profiles
CREATE POLICY "profiles_delete_admin" ON profiles
  FOR DELETE USING (is_admin());

-- ==========================================================
-- PRODUCTS
-- ==========================================================

-- Public: visible, non-archived products are readable by anyone authenticated
CREATE POLICY "products_select_visible" ON products
  FOR SELECT USING (
    (visibility = true AND is_archived = false)
    OR is_admin()
  );

-- Allow anonymous/guest to read visible products
CREATE POLICY "products_select_anon" ON products
  FOR SELECT USING (
    visibility = true AND is_archived = false
  );

-- Admin CRUD
CREATE POLICY "products_insert_admin" ON products
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "products_update_admin" ON products
  FOR UPDATE USING (is_admin());

CREATE POLICY "products_delete_admin" ON products
  FOR DELETE USING (is_admin());

-- ==========================================================
-- MATERIALS — Admin only
-- ==========================================================
CREATE POLICY "materials_select_admin" ON materials
  FOR SELECT USING (is_admin());

CREATE POLICY "materials_insert_admin" ON materials
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "materials_update_admin" ON materials
  FOR UPDATE USING (is_admin());

CREATE POLICY "materials_delete_admin" ON materials
  FOR DELETE USING (is_admin());

-- ==========================================================
-- PRODUCT_RECIPES — Admin only (read via product joins)
-- ==========================================================
CREATE POLICY "product_recipes_select_admin" ON product_recipes
  FOR SELECT USING (is_admin());

-- Allow authenticated users to read recipes (needed for BOM display)
CREATE POLICY "product_recipes_select_auth" ON product_recipes
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "product_recipes_insert_admin" ON product_recipes
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "product_recipes_update_admin" ON product_recipes
  FOR UPDATE USING (is_admin());

CREATE POLICY "product_recipes_delete_admin" ON product_recipes
  FOR DELETE USING (is_admin());

-- ==========================================================
-- INVENTORY ASSETS — Admin only
-- ==========================================================
CREATE POLICY "inventory_assets_all_admin" ON inventory_assets
  FOR ALL USING (is_admin());

-- ==========================================================
-- ORDERS
-- ==========================================================

-- Admin: full access
CREATE POLICY "orders_select_admin" ON orders
  FOR SELECT USING (is_admin());

CREATE POLICY "orders_insert_admin" ON orders
  FOR INSERT WITH CHECK (is_admin());

CREATE POLICY "orders_update_admin" ON orders
  FOR UPDATE USING (is_admin());

CREATE POLICY "orders_delete_admin" ON orders
  FOR DELETE USING (is_admin());

-- Student: own orders only
CREATE POLICY "orders_select_student" ON orders
  FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "orders_insert_student" ON orders
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Guest: access via guest_access_token (handled by RPC, not direct table access)
-- Anonymous users should NOT have direct table SELECT access

-- ==========================================================
-- ORDER ITEMS
-- ==========================================================

-- Admin: full access
CREATE POLICY "order_items_admin" ON order_items
  FOR ALL USING (is_admin());

-- Student: items of own orders
CREATE POLICY "order_items_student" ON order_items
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.created_by = auth.uid())
  );

CREATE POLICY "order_items_insert_student" ON order_items
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.created_by = auth.uid())
  );

-- ==========================================================
-- ORDER STATUS HISTORY
-- ==========================================================
CREATE POLICY "order_status_history_admin" ON order_status_history
  FOR ALL USING (is_admin());

CREATE POLICY "order_status_history_student" ON order_status_history
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_status_history.order_id AND orders.created_by = auth.uid())
  );

CREATE POLICY "order_status_history_insert_auth" ON order_status_history
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ==========================================================
-- PAYMENTS — Admin CRUD, Student/Guest read own
-- ==========================================================
CREATE POLICY "payments_admin" ON payments
  FOR ALL USING (is_admin());

CREATE POLICY "payments_select_student" ON payments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM orders WHERE orders.id = payments.order_id AND orders.created_by = auth.uid())
  );

-- ==========================================================
-- REFUNDS — Admin only
-- ==========================================================
CREATE POLICY "refunds_admin" ON refunds
  FOR ALL USING (is_admin());

-- ==========================================================
-- FINANCE_TRANSACTIONS — Admin only
-- ==========================================================
CREATE POLICY "finance_transactions_admin" ON finance_transactions
  FOR ALL USING (is_admin());

-- ==========================================================
-- STOCK_MOVEMENTS — Admin only
-- ==========================================================
CREATE POLICY "stock_movements_admin" ON stock_movements
  FOR ALL USING (is_admin());

-- ==========================================================
-- ANNUAL_PROCUREMENTS — Admin only
-- ==========================================================
CREATE POLICY "annual_procurements_admin" ON annual_procurements
  FOR ALL USING (is_admin());

-- ==========================================================
-- INBOX_FILES
-- ==========================================================
CREATE POLICY "inbox_files_admin" ON inbox_files
  FOR ALL USING (is_admin());

-- Allow anonymous insert (public upload)
CREATE POLICY "inbox_files_insert_anon" ON inbox_files
  FOR INSERT WITH CHECK (true);

-- ==========================================================
-- CUSTOMER_FILES — Admin only
-- ==========================================================
CREATE POLICY "customer_files_admin" ON customer_files
  FOR ALL USING (is_admin());

CREATE POLICY "customer_file_items_admin" ON customer_file_items
  FOR ALL USING (is_admin());

-- ==========================================================
-- FILES
-- ==========================================================
CREATE POLICY "files_admin" ON files
  FOR ALL USING (is_admin());

CREATE POLICY "files_owner" ON files
  FOR SELECT USING (auth.uid() = owner_id);

CREATE POLICY "files_insert_auth" ON files
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- ==========================================================
-- NOTIFICATIONS
-- ==========================================================
CREATE POLICY "notifications_own" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "notifications_update_own" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "notifications_insert_admin" ON notifications
  FOR INSERT WITH CHECK (is_admin() OR auth.uid() IS NOT NULL);

CREATE POLICY "notifications_admin" ON notifications
  FOR ALL USING (is_admin());

-- ==========================================================
-- ACTIVITY_LOGS — Admin read, system insert
-- ==========================================================
CREATE POLICY "activity_logs_select_admin" ON activity_logs
  FOR SELECT USING (is_admin());

CREATE POLICY "activity_logs_insert_auth" ON activity_logs
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
