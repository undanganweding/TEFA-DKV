-- ==========================================================
-- MIGRATION 021: SECURE RLS POLICIES FOR INBOX_FILES
-- ==========================================================
-- Allows authenticated students to SELECT inbox_files linked to 
-- their own orders (orders.created_by = auth.uid()), preserving strict RLS
-- ==========================================================

CREATE POLICY "inbox_files_select_student" ON inbox_files
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders 
      WHERE orders.order_no = inbox_files.linked_order_no 
        AND orders.created_by = auth.uid()
    )
  );
