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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          active: boolean
          color: string
          created_at: string
          description: string | null
          display_order: number
          icon: string
          id: string
          image_url: string | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          color?: string
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string
          id?: string
          image_url?: string | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          color?: string
          created_at?: string
          description?: string | null
          display_order?: number
          icon?: string
          id?: string
          image_url?: string | null
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      cities: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          name: string
          state: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          state?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          state?: string
        }
        Relationships: []
      }
      establishment_applications: {
        Row: {
          address: string
          admin_note: string | null
          category: string
          city: string
          created_at: string
          description: string | null
          id: string
          name: string
          owner_name: string
          phone: string
          status: string
        }
        Insert: {
          address: string
          admin_note?: string | null
          category?: string
          city: string
          created_at?: string
          description?: string | null
          id?: string
          name: string
          owner_name: string
          phone: string
          status?: string
        }
        Update: {
          address?: string
          admin_note?: string | null
          category?: string
          city?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          owner_name?: string
          phone?: string
          status?: string
        }
        Relationships: []
      }
      establishment_categories: {
        Row: {
          active: boolean
          created_at: string
          establishment_id: string
          id: string
          name: string
          sort_order: number | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          establishment_id: string
          id?: string
          name: string
          sort_order?: number | null
        }
        Update: {
          active?: boolean
          created_at?: string
          establishment_id?: string
          id?: string
          name?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "establishment_categories_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      establishment_products: {
        Row: {
          active: boolean
          category_id: string | null
          created_at: string
          description: string | null
          establishment_id: string
          id: string
          image_url: string | null
          internal_code: string | null
          name: string
          price: number
          stock: number | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          category_id?: string | null
          created_at?: string
          description?: string | null
          establishment_id: string
          id?: string
          image_url?: string | null
          internal_code?: string | null
          name: string
          price?: number
          stock?: number | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          category_id?: string | null
          created_at?: string
          description?: string | null
          establishment_id?: string
          id?: string
          image_url?: string | null
          internal_code?: string | null
          name?: string
          price?: number
          stock?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "establishment_products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "establishment_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "establishment_products_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
        ]
      }
      establishments: {
        Row: {
          accepts_pickup: boolean | null
          access_code: string | null
          address: string
          address_number: string | null
          auto_schedule: boolean
          banner_url: string | null
          category: string
          category_id: string | null
          city_id: string
          close_time: string | null
          commission_per_order: number
          complement: string | null
          created_at: string
          delivery_fee: number | null
          delivery_radius_km: number | null
          document_number: string | null
          email: string | null
          estimated_delivery_time: number | null
          full_description: string | null
          id: string
          is_open: boolean
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          name: string
          neighborhood: string | null
          open_time: string | null
          own_delivery: boolean | null
          owner_name: string | null
          phone: string
          photo_url: string | null
          short_description: string | null
          status: string
          sunday_open: boolean | null
          whatsapp: string | null
          zip_code: string | null
        }
        Insert: {
          accepts_pickup?: boolean | null
          access_code?: string | null
          address: string
          address_number?: string | null
          auto_schedule?: boolean
          banner_url?: string | null
          category?: string
          category_id?: string | null
          city_id: string
          close_time?: string | null
          commission_per_order?: number
          complement?: string | null
          created_at?: string
          delivery_fee?: number | null
          delivery_radius_km?: number | null
          document_number?: string | null
          email?: string | null
          estimated_delivery_time?: number | null
          full_description?: string | null
          id?: string
          is_open?: boolean
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name: string
          neighborhood?: string | null
          open_time?: string | null
          own_delivery?: boolean | null
          owner_name?: string | null
          phone: string
          photo_url?: string | null
          short_description?: string | null
          status?: string
          sunday_open?: boolean | null
          whatsapp?: string | null
          zip_code?: string | null
        }
        Update: {
          accepts_pickup?: boolean | null
          access_code?: string | null
          address?: string
          address_number?: string | null
          auto_schedule?: boolean
          banner_url?: string | null
          category?: string
          category_id?: string | null
          city_id?: string
          close_time?: string | null
          commission_per_order?: number
          complement?: string | null
          created_at?: string
          delivery_fee?: number | null
          delivery_radius_km?: number | null
          document_number?: string | null
          email?: string | null
          estimated_delivery_time?: number | null
          full_description?: string | null
          id?: string
          is_open?: boolean
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name?: string
          neighborhood?: string | null
          open_time?: string | null
          own_delivery?: boolean | null
          owner_name?: string | null
          phone?: string
          photo_url?: string | null
          short_description?: string | null
          status?: string
          sunday_open?: boolean | null
          whatsapp?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "establishments_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "establishments_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      fcm_tokens: {
        Row: {
          created_at: string
          device_name: string | null
          id: string
          is_active: boolean
          last_seen_at: string
          platform: string
          reference_id: string
          token: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          device_name?: string | null
          id?: string
          is_active?: boolean
          last_seen_at?: string
          platform?: string
          reference_id: string
          token: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          device_name?: string | null
          id?: string
          is_active?: boolean
          last_seen_at?: string
          platform?: string
          reference_id?: string
          token?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      motoboy_applications: {
        Row: {
          address: string
          admin_note: string | null
          city: string
          created_at: string
          experience: string | null
          face_photo_url: string | null
          full_name: string
          id: string
          phone: string
          status: string
          vehicle_photo_url: string | null
          vehicle_type: string
        }
        Insert: {
          address: string
          admin_note?: string | null
          city: string
          created_at?: string
          experience?: string | null
          face_photo_url?: string | null
          full_name: string
          id?: string
          phone: string
          status?: string
          vehicle_photo_url?: string | null
          vehicle_type: string
        }
        Update: {
          address?: string
          admin_note?: string | null
          city?: string
          created_at?: string
          experience?: string | null
          face_photo_url?: string | null
          full_name?: string
          id?: string
          phone?: string
          status?: string
          vehicle_photo_url?: string | null
          vehicle_type?: string
        }
        Relationships: []
      }
      motoboys: {
        Row: {
          access_code: string | null
          city_id: string | null
          created_at: string
          id: string
          is_available: boolean
          last_activity: string | null
          latitude: number | null
          longitude: number | null
          name: string
          phone: string
          photo: string | null
          plate: string | null
          rating: number
          region: string
          status: string
          total_rides: number
          user_id: string | null
          vehicle: string
        }
        Insert: {
          access_code?: string | null
          city_id?: string | null
          created_at?: string
          id?: string
          is_available?: boolean
          last_activity?: string | null
          latitude?: number | null
          longitude?: number | null
          name: string
          phone: string
          photo?: string | null
          plate?: string | null
          rating?: number
          region: string
          status?: string
          total_rides?: number
          user_id?: string | null
          vehicle: string
        }
        Update: {
          access_code?: string | null
          city_id?: string | null
          created_at?: string
          id?: string
          is_available?: boolean
          last_activity?: string | null
          latitude?: number | null
          longitude?: number | null
          name?: string
          phone?: string
          photo?: string | null
          plate?: string | null
          rating?: number
          region?: string
          status?: string
          total_rides?: number
          user_id?: string | null
          vehicle?: string
        }
        Relationships: [
          {
            foreignKeyName: "motoboys_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          city_id: string | null
          commission_amount: number | null
          completed_at: string | null
          created_at: string
          customer_name: string
          customer_phone: string
          delivery_address: string
          delivery_fee: number | null
          delivery_lat: number | null
          delivery_lng: number | null
          dispatched_at: string | null
          dispatched_to: string[] | null
          distance_km: number | null
          establishment_commission: number | null
          establishment_id: string | null
          estimated_price: number | null
          estimated_time_min: number | null
          house_reference: string | null
          id: string
          is_paid: boolean | null
          item_description: string
          motoboy_id: string | null
          order_type: string
          product_value: number | null
          purchase_location: string | null
          service_type: string
          status: string
        }
        Insert: {
          city_id?: string | null
          commission_amount?: number | null
          completed_at?: string | null
          created_at?: string
          customer_name: string
          customer_phone: string
          delivery_address: string
          delivery_fee?: number | null
          delivery_lat?: number | null
          delivery_lng?: number | null
          dispatched_at?: string | null
          dispatched_to?: string[] | null
          distance_km?: number | null
          establishment_commission?: number | null
          establishment_id?: string | null
          estimated_price?: number | null
          estimated_time_min?: number | null
          house_reference?: string | null
          id?: string
          is_paid?: boolean | null
          item_description: string
          motoboy_id?: string | null
          order_type?: string
          product_value?: number | null
          purchase_location?: string | null
          service_type?: string
          status?: string
        }
        Update: {
          city_id?: string | null
          commission_amount?: number | null
          completed_at?: string | null
          created_at?: string
          customer_name?: string
          customer_phone?: string
          delivery_address?: string
          delivery_fee?: number | null
          delivery_lat?: number | null
          delivery_lng?: number | null
          dispatched_at?: string | null
          dispatched_to?: string[] | null
          distance_km?: number | null
          establishment_commission?: number | null
          establishment_id?: string | null
          estimated_price?: number | null
          estimated_time_min?: number | null
          house_reference?: string | null
          id?: string
          is_paid?: boolean | null
          item_description?: string
          motoboy_id?: string | null
          order_type?: string
          product_value?: number | null
          purchase_location?: string | null
          service_type?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_establishment_id_fkey"
            columns: ["establishment_id"]
            isOneToOne: false
            referencedRelation: "establishments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_motoboy_id_fkey"
            columns: ["motoboy_id"]
            isOneToOne: false
            referencedRelation: "motoboys"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          admin_note: string | null
          amount: number
          created_at: string | null
          id: string
          motoboy_id: string
        }
        Insert: {
          admin_note?: string | null
          amount: number
          created_at?: string | null
          id?: string
          motoboy_id: string
        }
        Update: {
          admin_note?: string | null
          amount?: number
          created_at?: string | null
          id?: string
          motoboy_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_motoboy_id_fkey"
            columns: ["motoboy_id"]
            isOneToOne: false
            referencedRelation: "motoboys"
            referencedColumns: ["id"]
          },
        ]
      }
      pharmacies: {
        Row: {
          accepts_pickup: boolean
          address: string
          address_number: string | null
          banner_url: string | null
          city_id: string | null
          closing_time: string | null
          cnpj: string | null
          complement: string | null
          created_at: string
          delivery_fee: number | null
          delivery_radius_km: number | null
          email: string | null
          estimated_delivery_time: number | null
          full_description: string | null
          id: string
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          name: string
          neighborhood: string | null
          opening_time: string | null
          own_delivery: boolean
          owner_name: string
          phone: string
          short_description: string | null
          status: string
          sunday_open: boolean
          updated_at: string
          whatsapp: string | null
          zip_code: string | null
        }
        Insert: {
          accepts_pickup?: boolean
          address?: string
          address_number?: string | null
          banner_url?: string | null
          city_id?: string | null
          closing_time?: string | null
          cnpj?: string | null
          complement?: string | null
          created_at?: string
          delivery_fee?: number | null
          delivery_radius_km?: number | null
          email?: string | null
          estimated_delivery_time?: number | null
          full_description?: string | null
          id?: string
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name: string
          neighborhood?: string | null
          opening_time?: string | null
          own_delivery?: boolean
          owner_name?: string
          phone?: string
          short_description?: string | null
          status?: string
          sunday_open?: boolean
          updated_at?: string
          whatsapp?: string | null
          zip_code?: string | null
        }
        Update: {
          accepts_pickup?: boolean
          address?: string
          address_number?: string | null
          banner_url?: string | null
          city_id?: string | null
          closing_time?: string | null
          cnpj?: string | null
          complement?: string | null
          created_at?: string
          delivery_fee?: number | null
          delivery_radius_km?: number | null
          email?: string | null
          estimated_delivery_time?: number | null
          full_description?: string | null
          id?: string
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name?: string
          neighborhood?: string | null
          opening_time?: string | null
          own_delivery?: boolean
          owner_name?: string
          phone?: string
          short_description?: string | null
          status?: string
          sunday_open?: boolean
          updated_at?: string
          whatsapp?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pharmacies_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      pharmacy_categories: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          pharmacy_id: string
          sort_order: number | null
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          pharmacy_id: string
          sort_order?: number | null
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          pharmacy_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pharmacy_categories_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
        ]
      }
      pharmacy_products: {
        Row: {
          active: boolean
          category_id: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          internal_code: string | null
          name: string
          pharmacy_id: string
          price: number
          stock: number | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          internal_code?: string | null
          name: string
          pharmacy_id: string
          price?: number
          stock?: number | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          category_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          internal_code?: string | null
          name?: string
          pharmacy_id?: string
          price?: number
          stock?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pharmacy_products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "pharmacy_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacy_products_pharmacy_id_fkey"
            columns: ["pharmacy_id"]
            isOneToOne: false
            referencedRelation: "pharmacies"
            referencedColumns: ["id"]
          },
        ]
      }
      popular_places: {
        Row: {
          created_at: string
          id: string
          name: string
          usage_count: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          usage_count?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          usage_count?: number
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          city_id: string | null
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          reference_id: string
          updated_at: string
          user_type: string
        }
        Insert: {
          auth: string
          city_id?: string | null
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          reference_id: string
          updated_at?: string
          user_type: string
        }
        Update: {
          auth?: string
          city_id?: string | null
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          reference_id?: string
          updated_at?: string
          user_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          motoboy_id: string
          order_id: string
          rating: number
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          motoboy_id: string
          order_id: string
          rating: number
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          motoboy_id?: string
          order_id?: string
          rating?: number
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "motoboy"
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
    Enums: {
      app_role: ["admin", "motoboy"],
    },
  },
} as const
