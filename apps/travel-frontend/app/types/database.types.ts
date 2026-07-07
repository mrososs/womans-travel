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
      bookings: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          notes: string | null
          phone: string | null
          room_type: string | null
          status: string
          travellers: number
          trip_date: string | null
          trip_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id?: string
          notes?: string | null
          phone?: string | null
          room_type?: string | null
          status?: string
          travellers?: number
          trip_date?: string | null
          trip_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string | null
          room_type?: string | null
          status?: string
          travellers?: number
          trip_date?: string | null
          trip_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bookings_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      cart_items: {
        Row: {
          created_at: string
          grad: string | null
          icon: string | null
          id: string
          item_id: string
          item_type: string
          quantity: number
          title: string | null
          unit_price: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          grad?: string | null
          icon?: string | null
          id?: string
          item_id: string
          item_type: string
          quantity?: number
          title?: string | null
          unit_price?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          grad?: string | null
          icon?: string | null
          id?: string
          item_id?: string
          item_type?: string
          quantity?: number
          title?: string | null
          unit_price?: number | null
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          icon: string
          id: string
          name_ar: string
          name_en: string
          sort: number
        }
        Insert: {
          icon: string
          id: string
          name_ar: string
          name_en: string
          sort?: number
        }
        Update: {
          icon?: string
          id?: string
          name_ar?: string
          name_en?: string
          sort?: number
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          phone?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string | null
        }
        Relationships: []
      }
      faqs: {
        Row: {
          answer_ar: string
          answer_en: string
          id: string
          question_ar: string
          question_en: string
          sort: number
        }
        Insert: {
          answer_ar: string
          answer_en: string
          id?: string
          question_ar: string
          question_en: string
          sort?: number
        }
        Update: {
          answer_ar?: string
          answer_en?: string
          id?: string
          question_ar?: string
          question_en?: string
          sort?: number
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          locale: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          locale?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          locale?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          id: string
          item_id: string
          item_type: string
          line_total: number
          order_id: string
          quantity: number
          title: string | null
          unit_price: number
        }
        Insert: {
          id?: string
          item_id: string
          item_type: string
          line_total?: number
          order_id: string
          quantity?: number
          title?: string | null
          unit_price?: number
        }
        Update: {
          id?: string
          item_id?: string
          item_type?: string
          line_total?: number
          order_id?: string
          quantity?: number
          title?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          currency: string
          id: string
          paid_at: string | null
          payment_provider: string | null
          payment_ref: string | null
          status: string
          subtotal: number
          total: number
          traveler_info: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          paid_at?: string | null
          payment_provider?: string | null
          payment_ref?: string | null
          status?: string
          subtotal?: number
          total?: number
          traveler_info?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string
          currency?: string
          id?: string
          paid_at?: string | null
          payment_provider?: string | null
          payment_ref?: string | null
          status?: string
          subtotal?: number
          total?: number
          traveler_info?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      packages: {
        Row: {
          cost_amount: number | null
          desc_ar: string
          desc_en: string
          grad: string
          icon: string
          id: string
          image_url: string | null
          kind: string
          price_amount: number | null
          price_ar: string | null
          price_en: string | null
          sort: number
          title_ar: string
          title_en: string
        }
        Insert: {
          cost_amount?: number | null
          desc_ar: string
          desc_en: string
          grad: string
          icon: string
          id: string
          image_url?: string | null
          kind: string
          price_amount?: number | null
          price_ar?: string | null
          price_en?: string | null
          sort?: number
          title_ar: string
          title_en: string
        }
        Update: {
          cost_amount?: number | null
          desc_ar?: string
          desc_en?: string
          grad?: string
          icon?: string
          id?: string
          image_url?: string | null
          kind?: string
          price_amount?: number | null
          price_ar?: string | null
          price_en?: string | null
          sort?: number
          title_ar?: string
          title_en?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          desc_ar: string
          desc_en: string
          grad: string
          icon: string
          id: string
          price_ar: string | null
          price_en: string | null
          sort: number
          title_ar: string
          title_en: string
        }
        Insert: {
          desc_ar: string
          desc_en: string
          grad: string
          icon: string
          id: string
          price_ar?: string | null
          price_en?: string | null
          sort?: number
          title_ar: string
          title_en: string
        }
        Update: {
          desc_ar?: string
          desc_en?: string
          grad?: string
          icon?: string
          id?: string
          price_ar?: string | null
          price_en?: string | null
          sort?: number
          title_ar?: string
          title_en?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          locale: string
          phone: string | null
          role: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          locale?: string
          phone?: string | null
          role?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          locale?: string
          phone?: string | null
          role?: string
          username?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          created_at: string
          grad: string
          icon: string
          id: string
          name_ar: string
          name_en: string
          rating: number
          text_ar: string
          text_en: string
          trip_ar: string
          trip_en: string
          trip_id: string | null
        }
        Insert: {
          created_at?: string
          grad: string
          icon: string
          id?: string
          name_ar: string
          name_en: string
          rating?: number
          text_ar: string
          text_en: string
          trip_ar: string
          trip_en: string
          trip_id?: string | null
        }
        Update: {
          created_at?: string
          grad?: string
          icon?: string
          id?: string
          name_ar?: string
          name_en?: string
          rating?: number
          text_ar?: string
          text_en?: string
          trip_ar?: string
          trip_en?: string
          trip_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          desc_ar: string
          desc_en: string
          icon: string
          id: string
          sort: number
          title_ar: string
          title_en: string
        }
        Insert: {
          desc_ar: string
          desc_en: string
          icon: string
          id: string
          sort?: number
          title_ar: string
          title_en: string
        }
        Update: {
          desc_ar?: string
          desc_en?: string
          icon?: string
          id?: string
          sort?: number
          title_ar?: string
          title_en?: string
        }
        Relationships: []
      }
      trips: {
        Row: {
          category_id: string | null
          cost_amount: number | null
          created_at: string
          dates_ar: string
          dates_en: string
          duration_ar: string
          duration_en: string
          featured: boolean
          grad: string
          icon: string
          id: string
          image_url: string | null
          kind: string
          price_amount: number | null
          price_ar: string
          price_en: string
          rating: number
          region_ar: string
          region_en: string
          reviews: number
          seats: number | null
          tier_key: string
          tier_variant: string
          title_ar: string
          title_en: string
        }
        Insert: {
          category_id?: string | null
          cost_amount?: number | null
          created_at?: string
          dates_ar: string
          dates_en: string
          duration_ar: string
          duration_en: string
          featured?: boolean
          grad: string
          icon: string
          id: string
          image_url?: string | null
          kind: string
          price_amount?: number | null
          price_ar: string
          price_en: string
          rating?: number
          region_ar: string
          region_en: string
          reviews?: number
          seats?: number | null
          tier_key: string
          tier_variant: string
          title_ar: string
          title_en: string
        }
        Update: {
          category_id?: string | null
          cost_amount?: number | null
          created_at?: string
          dates_ar?: string
          dates_en?: string
          duration_ar?: string
          duration_en?: string
          featured?: boolean
          grad?: string
          icon?: string
          id?: string
          image_url?: string | null
          kind?: string
          price_amount?: number | null
          price_ar?: string
          price_en?: string
          rating?: number
          region_ar?: string
          region_en?: string
          reviews?: number
          seats?: number | null
          tier_key?: string
          tier_variant?: string
          title_ar?: string
          title_en?: string
        }
        Relationships: [
          {
            foreignKeyName: "trips_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      wishlists: {
        Row: {
          created_at: string
          grad: string | null
          icon: string | null
          id: string
          item_id: string
          item_type: string
          price: string | null
          title: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          grad?: string | null
          icon?: string | null
          id?: string
          item_id: string
          item_type: string
          price?: string | null
          title?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          grad?: string | null
          icon?: string | null
          id?: string
          item_id?: string
          item_type?: string
          price?: string | null
          title?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_monthly_report: {
        Args: { months?: number }
        Returns: {
          buyers: number
          cost: number
          month: string
          orders_count: number
          package_units: number
          profit: number
          profit_pct: number
          revenue: number
        }[]
      }
      admin_overview: {
        Args: Record<PropertyKey, never>
        Returns: {
          cost: number
          profit: number
          profit_pct: number
          revenue: number
          total_buyers: number
          total_orders: number
          total_units: number
        }[]
      }
      get_secret: { Args: { p_name: string }; Returns: string }
      is_admin: { Args: Record<PropertyKey, never>; Returns: boolean }
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
