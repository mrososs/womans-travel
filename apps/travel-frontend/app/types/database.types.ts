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
      packages: {
        Row: {
          desc_ar: string
          desc_en: string
          grad: string
          icon: string
          id: string
          kind: string
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
          kind: string
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
          kind?: string
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
          created_at: string
          dates_ar: string
          dates_en: string
          duration_ar: string
          duration_en: string
          featured: boolean
          grad: string
          icon: string
          id: string
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
          created_at?: string
          dates_ar: string
          dates_en: string
          duration_ar: string
          duration_en: string
          featured?: boolean
          grad: string
          icon: string
          id: string
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
          created_at?: string
          dates_ar?: string
          dates_en?: string
          duration_ar?: string
          duration_en?: string
          featured?: boolean
          grad?: string
          icon?: string
          id?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
