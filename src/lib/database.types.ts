/**
 * Database type definitions for Supabase.
 * These types mirror the PostgreSQL schema and provide type safety for all Supabase operations.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          role: 'Admin' | 'Student';
          status: 'Pending' | 'Active' | 'Rejected';
          school_class: string | null;
          phone: string | null;
          address: string | null;
          avatar_path: string | null;
          nis: string | null;
          major: string | null;
          whatsapp: string | null;
          position: string | null;
          nip: string | null;
          employee_id: string | null;
          reject_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          role: 'Admin' | 'Student';
          status?: 'Pending' | 'Active' | 'Rejected';
          school_class?: string | null;
          phone?: string | null;
          address?: string | null;
          avatar_path?: string | null;
          nis?: string | null;
          major?: string | null;
          whatsapp?: string | null;
          position?: string | null;
          nip?: string | null;
          employee_id?: string | null;
          reject_reason?: string | null;
        };
        Update: {
          full_name?: string;
          role?: 'Admin' | 'Student';
          status?: 'Pending' | 'Active' | 'Rejected';
          school_class?: string | null;
          phone?: string | null;
          address?: string | null;
          avatar_path?: string | null;
          nis?: string | null;
          major?: string | null;
          whatsapp?: string | null;
          position?: string | null;
          nip?: string | null;
          employee_id?: string | null;
          reject_reason?: string | null;
        };
      };
      products: {
        Row: {
          id: string;
          code: string;
          name: string;
          category: string;
          unit: string;
          base_price: number;
          cost_price: number;
          image: string | null;
          description: string | null;
          visibility: boolean;
          is_archived: boolean;
          is_custom_dimension: boolean;
          min_qty: number;
          stock: number | null;
          show_in_customer_platform: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          category: string;
          unit: string;
          base_price?: number;
          cost_price?: number;
          image?: string | null;
          description?: string | null;
          visibility?: boolean;
          is_archived?: boolean;
          is_custom_dimension?: boolean;
          min_qty?: number;
          stock?: number | null;
          show_in_customer_platform?: boolean;
        };
        Update: {
          code?: string;
          name?: string;
          category?: string;
          unit?: string;
          base_price?: number;
          cost_price?: number;
          image?: string | null;
          description?: string | null;
          visibility?: boolean;
          is_archived?: boolean;
          is_custom_dimension?: boolean;
          min_qty?: number;
          stock?: number | null;
          show_in_customer_platform?: boolean;
        };
      };
      product_recipes: {
        Row: {
          product_id: string;
          material_id: string;
          qty_required: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          product_id: string;
          material_id: string;
          qty_required: number;
        };
        Update: {
          qty_required?: number;
        };
      };
      product_variants: {
        Row: {
          id: string;
          product_id: string;
          name: string;
          code: string | null;
          unit: string;
          base_price: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          product_id: string;
          name: string;
          code?: string | null;
          unit?: string;
          base_price?: number;
          is_active?: boolean;
        };
        Update: {
          name?: string;
          code?: string | null;
          unit?: string;
          base_price?: number;
          is_active?: boolean;
        };
      };
      materials: {
        Row: {
          id: string;
          code: string;
          name: string;
          category: string;
          current_stock: number;
          min_stock: number;
          unit: string;
          unit_price: number;
          cost_price: number;
          selling_ref_price: number | null;
          supplier: string | null;
          location: string | null;
          status: 'Aman' | 'Menipis' | 'Kritis';
          last_restocked: string | null;
          image: string | null;
          is_archived: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          category: string;
          current_stock?: number;
          min_stock?: number;
          unit: string;
          unit_price?: number;
          cost_price?: number;
          selling_ref_price?: number | null;
          supplier?: string | null;
          location?: string | null;
          status?: 'Aman' | 'Menipis' | 'Kritis';
          last_restocked?: string | null;
          image?: string | null;
          is_archived?: boolean;
        };
        Update: {
          code?: string;
          name?: string;
          category?: string;
          current_stock?: number;
          min_stock?: number;
          unit?: string;
          unit_price?: number;
          cost_price?: number;
          selling_ref_price?: number | null;
          supplier?: string | null;
          location?: string | null;
          status?: 'Aman' | 'Menipis' | 'Kritis';
          last_restocked?: string | null;
          image?: string | null;
          is_archived?: boolean;
        };
      };
      inventory_assets: {
        Row: {
          id: string;
          asset_code: string;
          name: string;
          category: string;
          brand: string | null;
          model: string | null;
          serial_number: string | null;
          specifications: string | null;
          condition: string;
          location: string | null;
          status: string;
          purchase_date: string | null;
          purchase_price: number | null;
          last_maintenance: string | null;
          pic_name: string | null;
          image_path: string | null;
          notes: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          is_archived: boolean;
        };
        Insert: {
          id?: string;
          asset_code: string;
          name: string;
          category: string;
          brand?: string | null;
          model?: string | null;
          serial_number?: string | null;
          specifications?: string | null;
          condition?: string;
          location?: string | null;
          status?: string;
          purchase_date?: string | null;
          purchase_price?: number | null;
          last_maintenance?: string | null;
          pic_name?: string | null;
          image_path?: string | null;
          notes?: string | null;
          created_by?: string | null;
          is_archived?: boolean;
        };
        Update: {
          asset_code?: string;
          name?: string;
          category?: string;
          brand?: string | null;
          model?: string | null;
          serial_number?: string | null;
          specifications?: string | null;
          condition?: string;
          location?: string | null;
          status?: string;
          purchase_date?: string | null;
          purchase_price?: number | null;
          last_maintenance?: string | null;
          pic_name?: string | null;
          image_path?: string | null;
          notes?: string | null;
          is_archived?: boolean;
        };
      };
      orders: {
        Row: {
          id: string;
          order_no: string;
          idempotency_key: string | null;
          created_by: string | null;
          guest_access_token: string;
          customer_name: string;
          customer_phone: string | null;
          customer_email: string | null;
          institution: string | null;
          order_date: string;
          due_date: string | null;
          status: string;
          payment_status: string;
          payment_method: string | null;
          subtotal: number;
          discount: number;
          tax_amount: number;
          total_amount: number;
          total_hpp: number;
          paid_amount: number;
          balance_due: number;
          refunded_amount: number;
          stock_deducted: boolean;
          operator_name: string | null;
          priority: string;
          notes: string | null;
          design_notes: string | null;
          finishing_notes: string | null;
          is_archived: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          order_no: string;
          idempotency_key?: string | null;
          created_by?: string | null;
          guest_access_token?: string;
          customer_name: string;
          customer_phone?: string | null;
          customer_email?: string | null;
          institution?: string | null;
          order_date?: string;
          due_date?: string | null;
          status: string;
          payment_status: string;
          payment_method?: string | null;
          subtotal?: number;
          discount?: number;
          tax_amount?: number;
          total_amount?: number;
          total_hpp?: number;
          paid_amount?: number;
          balance_due?: number;
          refunded_amount?: number;
          stock_deducted?: boolean;
          operator_name?: string | null;
          priority?: string;
          notes?: string | null;
          design_notes?: string | null;
          finishing_notes?: string | null;
          is_archived?: boolean;
        };
        Update: {
          order_no?: string;
          created_by?: string | null;
          customer_name?: string;
          customer_phone?: string | null;
          customer_email?: string | null;
          institution?: string | null;
          order_date?: string;
          due_date?: string | null;
          status?: string;
          payment_status?: string;
          payment_method?: string | null;
          subtotal?: number;
          discount?: number;
          tax_amount?: number;
          total_amount?: number;
          total_hpp?: number;
          paid_amount?: number;
          balance_due?: number;
          refunded_amount?: number;
          stock_deducted?: boolean;
          operator_name?: string | null;
          priority?: string;
          notes?: string | null;
          design_notes?: string | null;
          finishing_notes?: string | null;
          is_archived?: boolean;
        };
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          product_id: string | null;
          product_name: string;
          unit_price: number;
          cost_price: number;
          qty: number;
          unit: string;
          length_meters: number | null;
          width_meters: number | null;
          calculated_area: number | null;
          total_price: number;
          notes: string | null;
          is_custom_order: boolean;
          custom_description: string | null;
          file_url: string | null;
          file_name: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          product_id?: string | null;
          product_name: string;
          unit_price: number;
          cost_price?: number;
          qty: number;
          unit?: string;
          length_meters?: number | null;
          width_meters?: number | null;
          calculated_area?: number | null;
          total_price: number;
          notes?: string | null;
          is_custom_order?: boolean;
          custom_description?: string | null;
          file_url?: string | null;
          file_name?: string | null;
        };
        Update: {
          product_name?: string;
          unit_price?: number;
          cost_price?: number;
          qty?: number;
          total_price?: number;
          notes?: string | null;
        };
      };
      order_status_history: {
        Row: {
          id: string;
          order_id: string;
          status: string;
          timestamp: string;
          updated_by: string;
          note: string | null;
        };
        Insert: {
          id?: string;
          order_id: string;
          status: string;
          updated_by: string;
          note?: string | null;
        };
        Update: {};
      };
      payments: {
        Row: {
          id: string;
          order_id: string;
          amount: number;
          payment_method: string;
          payment_date: string;
          reference: string | null;
          created_by: string | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          order_id: string;
          amount: number;
          payment_method: string;
          reference?: string | null;
          created_by?: string | null;
          notes?: string | null;
        };
        Update: {};
      };
      refunds: {
        Row: {
          id: string;
          order_id: string;
          payment_id: string | null;
          amount: number;
          reason: string;
          refund_date: string;
          created_by: string | null;
          reference: string | null;
          status: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          payment_id?: string | null;
          amount: number;
          reason: string;
          created_by?: string | null;
          reference?: string | null;
          status?: string;
        };
        Update: {
          status?: string;
        };
      };
      finance_transactions: {
        Row: {
          id: string;
          trans_no: string;
          date: string;
          type: 'Pemasukan' | 'Pengeluaran';
          amount: number;
          cogs_amount: number;
          profit_amount: number;
          ref_order_no: string | null;
          payment_id: string | null;
          refund_id: string | null;
          category: string;
          description: string | null;
          payment_method: string | null;
          operator: string | null;
          status: string;
          is_archived: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          trans_no: string;
          date?: string;
          type: 'Pemasukan' | 'Pengeluaran';
          amount: number;
          cogs_amount?: number;
          profit_amount?: number;
          ref_order_no?: string | null;
          payment_id?: string | null;
          refund_id?: string | null;
          category: string;
          description?: string | null;
          payment_method?: string | null;
          operator?: string | null;
          status?: string;
          is_archived?: boolean;
        };
        Update: {
          is_archived?: boolean;
        };
      };
      stock_movements: {
        Row: {
          id: string;
          material_id: string;
          material_name: string;
          type: string;
          quantity: number;
          before_stock: number;
          after_stock: number;
          reference_type: string | null;
          reference_id: string | null;
          unit: string;
          unit_cost: number;
          total_value: number;
          supplier: string | null;
          notes: string | null;
          created_by: string | null;
          operator: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          material_id: string;
          material_name: string;
          type: string;
          quantity: number;
          before_stock: number;
          after_stock: number;
          reference_type?: string | null;
          reference_id?: string | null;
          unit: string;
          unit_cost?: number;
          total_value?: number;
          supplier?: string | null;
          notes?: string | null;
          created_by?: string | null;
          operator?: string | null;
        };
        Update: {};
      };
      annual_procurements: {
        Row: {
          id: string;
          year: string;
          category: string;
          title: string;
          target_item: string;
          qty: number;
          estimated_unit_price: number;
          budget: number;
          actual_cost: number | null;
          status: string;
          priority: string;
          justification: string | null;
          requested_by: string | null;
          created_by: string | null;
          created_at: string;
          updated_at: string;
          is_archived: boolean;
        };
        Insert: {
          id?: string;
          year: string;
          category: string;
          title: string;
          target_item: string;
          qty?: number;
          estimated_unit_price: number;
          budget: number;
          actual_cost?: number | null;
          status: string;
          priority: string;
          justification?: string | null;
          requested_by?: string | null;
          created_by?: string | null;
          is_archived?: boolean;
        };
        Update: {
          year?: string;
          category?: string;
          title?: string;
          target_item?: string;
          qty?: number;
          estimated_unit_price?: number;
          budget?: number;
          actual_cost?: number | null;
          status?: string;
          priority?: string;
          justification?: string | null;
          requested_by?: string | null;
          is_archived?: boolean;
        };
      };
      inbox_files: {
        Row: {
          id: string;
          upload_date: string;
          customer_name: string;
          class_grade: string;
          major: string | null;
          phone: string;
          service_type: string;
          print_size: string | null;
          qty: number;
          notes: string | null;
          file_name: string;
          file_type: string;
          file_size: string;
          preview_url: string | null;
          storage_path: string | null;
          folder_path: string;
          status: string;
          linked_order_no: string | null;
          is_archived: boolean;
          archived_at: string | null;
          archived_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          upload_date?: string;
          customer_name: string;
          class_grade: string;
          major?: string | null;
          phone: string;
          service_type: string;
          print_size?: string | null;
          qty?: number;
          notes?: string | null;
          file_name: string;
          file_type: string;
          file_size: string;
          preview_url?: string | null;
          storage_path?: string | null;
          folder_path: string;
          status?: string;
          linked_order_no?: string | null;
          is_archived?: boolean;
        };
        Update: {
          status?: string;
          linked_order_no?: string | null;
          is_archived?: boolean;
          archived_at?: string | null;
          archived_by?: string | null;
        };
      };
      files: {
        Row: {
          id: string;
          owner_id: string | null;
          order_id: string | null;
          file_type: string;
          file_name: string;
          storage_path: string;
          mime_type: string | null;
          file_size: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          owner_id?: string | null;
          order_id?: string | null;
          file_type: string;
          file_name: string;
          storage_path: string;
          mime_type?: string | null;
          file_size?: number | null;
        };
        Update: {};
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          type: string;
          reference_type: string | null;
          reference_id: string | null;
          is_read: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          message: string;
          type: string;
          reference_type?: string | null;
          reference_id?: string | null;
          is_read?: boolean;
        };
        Update: {
          is_read?: boolean;
        };
      };
      activity_logs: {
        Row: {
          id: string;
          actor_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string;
          description: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          actor_id?: string | null;
          action: string;
          entity_type: string;
          entity_id: string;
          description?: string | null;
          metadata?: Json | null;
        };
        Update: {};
      };
      customer_files: {
        Row: {
          id: string;
          customer_name: string;
          phone: string;
          email: string | null;
          category: string;
          total_orders_count: number;
          folder_path: string;
          last_updated: string;
          is_archived: boolean;
          archived_at: string | null;
          archived_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_name: string;
          phone: string;
          email?: string | null;
          category: string;
          total_orders_count?: number;
          folder_path: string;
          last_updated?: string;
          is_archived?: boolean;
        };
        Update: {
          customer_name?: string;
          phone?: string;
          email?: string | null;
          category?: string;
          total_orders_count?: number;
          folder_path?: string;
          last_updated?: string;
          is_archived?: boolean;
          archived_at?: string | null;
          archived_by?: string | null;
        };
      };
      customer_file_items: {
        Row: {
          id: string;
          customer_file_id: string;
          file_name: string;
          file_size: string;
          file_type: string;
          upload_date: string;
          order_no: string | null;
          download_url: string | null;
          thumbnail_url: string | null;
        };
        Insert: {
          id?: string;
          customer_file_id: string;
          file_name: string;
          file_size: string;
          file_type: string;
          upload_date: string;
          order_no?: string | null;
          download_url?: string | null;
          thumbnail_url?: string | null;
        };
        Update: {};
      };
    };
    Functions: {
      create_order: {
        Args: { order_data: Json };
        Returns: Json;
      };
      create_guest_order: {
        Args: { order_data: Json };
        Returns: Json;
      };
      record_payment: {
        Args: {
          p_order_id: string;
          p_amount: number;
          p_method: string;
          p_reference: string | null;
          p_notes: string | null;
          p_operator: string;
        };
        Returns: Json;
      };
      process_refund: {
        Args: {
          p_order_id: string;
          p_amount: number;
          p_reason: string;
          p_payment_id: string | null;
          p_operator: string;
        };
        Returns: Json;
      };
      process_order_to_production: {
        Args: { p_order_id: string; p_operator: string };
        Returns: Json;
      };
      cancel_order: {
        Args: { p_order_id: string; p_operator: string };
        Returns: Json;
      };
      update_order_status: {
        Args: { p_order_id: string; p_new_status: string; p_operator: string; p_note: string | null };
        Returns: Json;
      };
    };
  };
}
