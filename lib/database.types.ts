export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      authorised_users: {
        Row: {
          created_at: string
          email: string
          id: string
          name: string
          owner_customer_id: string
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          name: string
          owner_customer_id: string
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          name?: string
          owner_customer_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "authorised_users_owner_customer_id_fkey"
            columns: ["owner_customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bills: {
        Row: {
          amount_paid: number
          created_at: string
          customer_id: string
          due_date: string | null
          id: string
          package_id: string
          paid_at: string | null
          status: string
          total: number
        }
        Insert: {
          amount_paid?: number
          created_at?: string
          customer_id: string
          due_date?: string | null
          id?: string
          package_id: string
          paid_at?: string | null
          status?: string
          total?: number
        }
        Update: {
          amount_paid?: number
          created_at?: string
          customer_id?: string
          due_date?: string | null
          id?: string
          package_id?: string
          paid_at?: string | null
          status?: string
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "bills_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bills_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: true
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      hosted_payment_events: {
        Row: {
          created_at: string
          provider_reference: string
          transaction_id: string | null
        }
        Insert: {
          created_at?: string
          provider_reference: string
          transaction_id?: string | null
        }
        Update: {
          created_at?: string
          provider_reference?: string
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "hosted_payment_events_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_files: {
        Row: {
          id: string
          invoice_id: string
          mime_type: string
          name: string
          size: number
          storage_path: string
          uploaded_at: string
        }
        Insert: {
          id?: string
          invoice_id: string
          mime_type: string
          name: string
          size: number
          storage_path: string
          uploaded_at?: string
        }
        Update: {
          id?: string
          invoice_id?: string
          mime_type?: string
          name?: string
          size?: number
          storage_path?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_files_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_status_history: {
        Row: {
          actor_id: string | null
          at: string
          id: string
          invoice_id: string
          note: string | null
          status: string
        }
        Insert: {
          actor_id?: string | null
          at?: string
          id?: string
          invoice_id: string
          note?: string | null
          status: string
        }
        Update: {
          actor_id?: string | null
          at?: string
          id?: string
          invoice_id?: string
          note?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_status_history_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_status_history_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          currency: string | null
          customer_id: string
          has_unreviewed_changes: boolean
          id: string
          merchant: string | null
          package_id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_at: string
          updated_at: string
          value: number | null
        }
        Insert: {
          currency?: string | null
          customer_id: string
          has_unreviewed_changes?: boolean
          id?: string
          merchant?: string | null
          package_id: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          updated_at?: string
          value?: number | null
        }
        Update: {
          currency?: string | null
          customer_id?: string
          has_unreviewed_changes?: boolean
          id?: string
          merchant?: string | null
          package_id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string
          updated_at?: string
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_package_id_fkey"
            columns: ["package_id"]
            isOneToOne: true
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      line_items: {
        Row: {
          amount: number
          bill_id: string
          created_at: string
          created_by: string | null
          id: string
          label: string
        }
        Insert: {
          amount: number
          bill_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          label: string
        }
        Update: {
          amount?: number
          bill_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          label?: string
        }
        Relationships: [
          {
            foreignKeyName: "line_items_bill_id_fkey"
            columns: ["bill_id"]
            isOneToOne: false
            referencedRelation: "bills"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "line_items_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          created_at: string
          customer_id: string
          id: string
          read: boolean
          title: string
        }
        Insert: {
          body: string
          created_at?: string
          customer_id: string
          id?: string
          read?: boolean
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          customer_id?: string
          id?: string
          read?: boolean
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      packages: {
        Row: {
          created_at: string
          customer_id: string
          date_received: string
          description: string
          id: string
          invoice_required: boolean
          merchant: string
          status: string
          tracking_number: string
          updated_at: string
          weight_lb: number
        }
        Insert: {
          created_at?: string
          customer_id: string
          date_received: string
          description: string
          id?: string
          invoice_required?: boolean
          merchant: string
          status?: string
          tracking_number: string
          updated_at?: string
          weight_lb: number
        }
        Update: {
          created_at?: string
          customer_id?: string
          date_received?: string
          description?: string
          id?: string
          invoice_required?: boolean
          merchant?: string
          status?: string
          tracking_number?: string
          updated_at?: string
          weight_lb?: number
        }
        Relationships: [
          {
            foreignKeyName: "packages_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pre_alerts: {
        Row: {
          created_at: string
          customer_id: string
          description: string | null
          expected_weight_lb: number | null
          id: string
          matched_package_id: string | null
          merchant: string
          status: string
          tracking_number: string
        }
        Insert: {
          created_at?: string
          customer_id: string
          description?: string | null
          expected_weight_lb?: number | null
          id?: string
          matched_package_id?: string | null
          merchant: string
          status?: string
          tracking_number: string
        }
        Update: {
          created_at?: string
          customer_id?: string
          description?: string | null
          expected_weight_lb?: number | null
          id?: string
          matched_package_id?: string | null
          merchant?: string
          status?: string
          tracking_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "pre_alerts_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pre_alerts_matched_package_id_fkey"
            columns: ["matched_package_id"]
            isOneToOne: false
            referencedRelation: "packages"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_code: string | null
          created_at: string
          deleted_at: string | null
          email: string
          first_name: string
          id: string
          is_active: boolean
          last_name: string
          phone: string | null
          role: string
          updated_at: string
          wallet_balance: number
        }
        Insert: {
          account_code?: string | null
          created_at?: string
          deleted_at?: string | null
          email: string
          first_name: string
          id: string
          is_active?: boolean
          last_name: string
          phone?: string | null
          role?: string
          updated_at?: string
          wallet_balance?: number
        }
        Update: {
          account_code?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string
          first_name?: string
          id?: string
          is_active?: boolean
          last_name?: string
          phone?: string | null
          role?: string
          updated_at?: string
          wallet_balance?: number
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          auto_schedule_enabled: boolean
          enabled: boolean
          id: number
          scope: string
          selected_theme_id: string
        }
        Insert: {
          auto_schedule_enabled?: boolean
          enabled?: boolean
          id?: number
          scope?: string
          selected_theme_id?: string
        }
        Update: {
          auto_schedule_enabled?: boolean
          enabled?: boolean
          id?: number
          scope?: string
          selected_theme_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          created_by: string | null
          customer_id: string
          description: string
          id: string
          reference: string | null
          type: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          created_by?: string | null
          customer_id: string
          description: string
          id?: string
          reference?: string | null
          type: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          created_by?: string | null
          customer_id?: string
          description?: string
          id?: string
          reference?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_adjust_wallet: {
        Args: {
          p_amount: number
          p_customer_id: string
          p_description: string
          p_type: string
        }
        Returns: {
          amount: number
          balance_after: number
          created_at: string
          created_by: string | null
          customer_id: string
          description: string
          id: string
          reference: string | null
          type: string
        }
        SetofOptions: {
          from: "*"
          to: "transactions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_confirm_bill_payment: {
        Args: { p_bill_id: string }
        Returns: {
          amount: number
          balance_after: number
          created_at: string
          created_by: string | null
          customer_id: string
          description: string
          id: string
          reference: string | null
          type: string
        }
        SetofOptions: {
          from: "*"
          to: "transactions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      admin_set_role: {
        Args: { new_role: string; target_id: string }
        Returns: undefined
      }
      confirm_hosted_bill_payment: {
        Args: {
          p_amount: number
          p_bill_id: string
          p_provider_reference: string
        }
        Returns: {
          amount: number
          balance_after: number
          created_at: string
          created_by: string | null
          customer_id: string
          description: string
          id: string
          reference: string | null
          type: string
        }
        SetofOptions: {
          from: "*"
          to: "transactions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      confirm_hosted_wallet_topup: {
        Args: {
          p_amount: number
          p_customer_id: string
          p_provider_reference: string
        }
        Returns: {
          amount: number
          balance_after: number
          created_at: string
          created_by: string | null
          customer_id: string
          description: string
          id: string
          reference: string | null
          type: string
        }
        SetofOptions: {
          from: "*"
          to: "transactions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      mark_bill_pending_branch: {
        Args: { p_bill_id: string }
        Returns: undefined
      }
      mark_bills_pending_branch: {
        Args: { p_bill_ids: string[] }
        Returns: undefined
      }
      pay_bill_from_wallet: {
        Args: { p_bill_id: string }
        Returns: {
          amount: number
          balance_after: number
          created_at: string
          created_by: string | null
          customer_id: string
          description: string
          id: string
          reference: string | null
          type: string
        }
        SetofOptions: {
          from: "*"
          to: "transactions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      pay_bills_from_wallet: {
        Args: { p_bill_ids: string[] }
        Returns: {
          amount: number
          balance_after: number
          created_at: string
          created_by: string | null
          customer_id: string
          description: string
          id: string
          reference: string | null
          type: string
        }[]
        SetofOptions: {
          from: "*"
          to: "transactions"
          isOneToOne: false
          isSetofReturn: true
        }
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
