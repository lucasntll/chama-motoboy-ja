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
        Relationships: []
      }
      orders: {
        Row: {
          commission_amount: number | null
          completed_at: string | null
          created_at: string
          customer_name: string
          customer_phone: string
          delivery_address: string
          delivery_lat: number | null
          delivery_lng: number | null
          distance_km: number | null
          estimated_price: number | null
          estimated_time_min: number | null
          house_reference: string | null
          id: string
          is_paid: boolean | null
          item_description: string
          motoboy_id: string | null
          purchase_location: string | null
          service_type: string
          status: string
        }
        Insert: {
          commission_amount?: number | null
          completed_at?: string | null
          created_at?: string
          customer_name: string
          customer_phone: string
          delivery_address: string
          delivery_lat?: number | null
          delivery_lng?: number | null
          distance_km?: number | null
          estimated_price?: number | null
          estimated_time_min?: number | null
          house_reference?: string | null
          id?: string
          is_paid?: boolean | null
          item_description: string
          motoboy_id?: string | null
          purchase_location?: string | null
          service_type?: string
          status?: string
        }
        Update: {
          commission_amount?: number | null
          completed_at?: string | null
          created_at?: string
          customer_name?: string
          customer_phone?: string
          delivery_address?: string
          delivery_lat?: number | null
          delivery_lng?: number | null
          distance_km?: number | null
          estimated_price?: number | null
          estimated_time_min?: number | null
          house_reference?: string | null
          id?: string
          is_paid?: boolean | null
          item_description?: string
          motoboy_id?: string | null
          purchase_location?: string | null
          service_type?: string
          status?: string
        }
        Relationships: [
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
