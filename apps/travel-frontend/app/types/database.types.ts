export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
        Update: Partial<Database["public"]["Tables"]["bookings"]["Insert"]>
        Relationships: []
      }
      cart_items: {
        Row: {
          created_at: string
          id: string
          item_id: string
          item_type: string
          quantity: number
          unit_price: number | null
          user_id: string
          title: string | null
          icon: string | null
          grad: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          item_type: string
          quantity?: number
          unit_price?: number | null
          user_id: string
          title?: string | null
          icon?: string | null
          grad?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["cart_items"]["Insert"]>
        Relationships: []
      }
      categories: {
        Row: { icon: string; id: string; name_ar: string; name_en: string; sort: number }
        Insert: { icon: string; id: string; name_ar: string; name_en: string; sort?: number }
        Update: Partial<Database["public"]["Tables"]["categories"]["Insert"]>
        Relationships: []
      }
      contact_messages: {
        Row: { created_at: string; email: string; id: string; message: string; name: string; phone: string | null }
        Insert: { created_at?: string; email: string; id?: string; message: string; name: string; phone?: string | null }
        Update: Partial<Database["public"]["Tables"]["contact_messages"]["Insert"]>
        Relationships: []
      }
      faqs: {
        Row: { answer_ar: string; answer_en: string; id: string; question_ar: string; question_en: string; sort: number }
        Insert: { answer_ar: string; answer_en: string; id?: string; question_ar: string; question_en: string; sort?: number }
        Update: Partial<Database["public"]["Tables"]["faqs"]["Insert"]>
        Relationships: []
      }
      newsletter_subscribers: {
        Row: { created_at: string; email: string; id: string; locale: string }
        Insert: { created_at?: string; email: string; id?: string; locale?: string }
        Update: Partial<Database["public"]["Tables"]["newsletter_subscribers"]["Insert"]>
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
        Update: Partial<Database["public"]["Tables"]["order_items"]["Insert"]>
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
          payment_provider: string | null
          payment_ref: string | null
          status: string
          subtotal: number
          total: number
          user_id: string
        }
        Insert: {
          created_at?: string
          currency?: string
          id?: string
          payment_provider?: string | null
          payment_ref?: string | null
          status?: string
          subtotal?: number
          total?: number
          user_id: string
        }
        Update: Partial<Database["public"]["Tables"]["orders"]["Insert"]>
        Relationships: []
      }
      packages: {
        Row: {
          desc_ar: string; desc_en: string; grad: string; icon: string; id: string; kind: string
          price_ar: string | null; price_en: string | null; sort: number; title_ar: string; title_en: string
        }
        Insert: {
          desc_ar: string; desc_en: string; grad: string; icon: string; id: string; kind: string
          price_ar?: string | null; price_en?: string | null; sort?: number; title_ar: string; title_en: string
        }
        Update: Partial<Database["public"]["Tables"]["packages"]["Insert"]>
        Relationships: []
      }
      products: {
        Row: {
          desc_ar: string; desc_en: string; grad: string; icon: string; id: string
          price_ar: string | null; price_en: string | null; sort: number; title_ar: string; title_en: string
        }
        Insert: {
          desc_ar: string; desc_en: string; grad: string; icon: string; id: string
          price_ar?: string | null; price_en?: string | null; sort?: number; title_ar: string; title_en: string
        }
        Update: Partial<Database["public"]["Tables"]["products"]["Insert"]>
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
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          locale?: string
          phone?: string | null
          username?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["profiles"]["Insert"]>
        Relationships: []
      }
      reviews: {
        Row: {
          created_at: string; grad: string; icon: string; id: string; name_ar: string; name_en: string
          rating: number; text_ar: string; text_en: string; trip_ar: string; trip_en: string; trip_id: string | null
        }
        Insert: {
          created_at?: string; grad: string; icon: string; id?: string; name_ar: string; name_en: string
          rating?: number; text_ar: string; text_en: string; trip_ar: string; trip_en: string; trip_id?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["reviews"]["Insert"]>
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
        Row: { desc_ar: string; desc_en: string; icon: string; id: string; sort: number; title_ar: string; title_en: string }
        Insert: { desc_ar: string; desc_en: string; icon: string; id: string; sort?: number; title_ar: string; title_en: string }
        Update: Partial<Database["public"]["Tables"]["services"]["Insert"]>
        Relationships: []
      }
      trips: {
        Row: {
          category_id: string | null; created_at: string; dates_ar: string; dates_en: string
          duration_ar: string; duration_en: string; featured: boolean; grad: string; icon: string; id: string
          kind: string; price_amount: number | null; price_ar: string; price_en: string; rating: number
          region_ar: string; region_en: string; reviews: number; seats: number | null; tier_key: string
          tier_variant: string; title_ar: string; title_en: string
        }
        Insert: {
          category_id?: string | null; created_at?: string; dates_ar: string; dates_en: string
          duration_ar: string; duration_en: string; featured?: boolean; grad: string; icon: string; id: string
          kind: string; price_amount?: number | null; price_ar: string; price_en: string; rating?: number
          region_ar: string; region_en: string; reviews?: number; seats?: number | null; tier_key: string
          tier_variant: string; title_ar: string; title_en: string
        }
        Update: Partial<Database["public"]["Tables"]["trips"]["Insert"]>
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
          created_at: string; id: string; item_id: string; item_type: string; user_id: string
          title: string | null; icon: string | null; grad: string | null; price: string | null
        }
        Insert: {
          created_at?: string; id?: string; item_id: string; item_type: string; user_id: string
          title?: string | null; icon?: string | null; grad?: string | null; price?: string | null
        }
        Update: Partial<Database["public"]["Tables"]["wishlists"]["Insert"]>
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}
