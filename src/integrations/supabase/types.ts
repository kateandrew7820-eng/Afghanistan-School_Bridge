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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          content: string
          created_at: string
          created_by: string
          id: string
          is_published: boolean | null
          priority: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by: string
          id?: string
          is_published?: boolean | null
          priority?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string
          id?: string
          is_published?: boolean | null
          priority?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      center_documents: {
        Row: {
          category: string | null
          created_at: string
          created_by: string
          description: string | null
          file_name: string
          file_path: string
          id: string
          title: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          file_name: string
          file_path: string
          id?: string
          title: string
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          file_name?: string
          file_path?: string
          id?: string
          title?: string
        }
        Relationships: []
      }
      deadlines: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          due_date: string
          id: string
          is_active: boolean | null
          title: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          due_date: string
          id?: string
          is_active?: boolean | null
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string
          id?: string
          is_active?: boolean | null
          title?: string
        }
        Relationships: []
      }
      districts: {
        Row: {
          code: string | null
          created_at: string
          id: string
          name: string
          province_id: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: string
          name: string
          province_id: string
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: string
          name?: string
          province_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "districts_province_id_fkey"
            columns: ["province_id"]
            isOneToOne: false
            referencedRelation: "provinces"
            referencedColumns: ["id"]
          },
        ]
      }
      form_submissions: {
        Row: {
          created_at: string
          district: string | null
          form_data: Json
          form_type: string
          id: string
          province: string | null
          school_id: string
          status: string | null
          submitted_by: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          district?: string | null
          form_data?: Json
          form_type: string
          id?: string
          province?: string | null
          school_id: string
          status?: string | null
          submitted_by: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          district?: string | null
          form_data?: Json
          form_type?: string
          id?: string
          province?: string | null
          school_id?: string
          status?: string | null
          submitted_by?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "form_submissions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      nesp_reference: {
        Row: {
          baseline_value: number | null
          category: string
          created_at: string
          id: string
          metric_key: string
          metric_label_fa: string
          notes_fa: string | null
          source_page: number | null
          target_value: number | null
          target_year: number | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          baseline_value?: number | null
          category: string
          created_at?: string
          id?: string
          metric_key: string
          metric_label_fa: string
          notes_fa?: string | null
          source_page?: number | null
          target_value?: number | null
          target_year?: number | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          baseline_value?: number | null
          category?: string
          created_at?: string
          id?: string
          metric_key?: string
          metric_label_fa?: string
          notes_fa?: string | null
          source_page?: number | null
          target_value?: number | null
          target_year?: number | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          district: string | null
          district_id: string | null
          full_name: string | null
          id: string
          phone_number: string | null
          province: string | null
          province_id: string | null
          rejection_reason: string | null
          role: string | null
          school_id: string | null
          school_name: string | null
          status: string | null
          updated_at: string
          user_id: string
          verified_at: string | null
          verified_by_user_id: string | null
        }
        Insert: {
          created_at?: string
          district?: string | null
          district_id?: string | null
          full_name?: string | null
          id?: string
          phone_number?: string | null
          province?: string | null
          province_id?: string | null
          rejection_reason?: string | null
          role?: string | null
          school_id?: string | null
          school_name?: string | null
          status?: string | null
          updated_at?: string
          user_id: string
          verified_at?: string | null
          verified_by_user_id?: string | null
        }
        Update: {
          created_at?: string
          district?: string | null
          district_id?: string | null
          full_name?: string | null
          id?: string
          phone_number?: string | null
          province?: string | null
          province_id?: string | null
          rejection_reason?: string | null
          role?: string | null
          school_id?: string | null
          school_name?: string | null
          status?: string | null
          updated_at?: string
          user_id?: string
          verified_at?: string | null
          verified_by_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_profiles_school"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_province_id_fkey"
            columns: ["province_id"]
            isOneToOne: false
            referencedRelation: "provinces"
            referencedColumns: ["id"]
          },
        ]
      }
      provinces: {
        Row: {
          code: string | null
          created_at: string
          id: string
          name: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          code?: string | null
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      report_submissions: {
        Row: {
          created_at: string
          description: string | null
          district: string | null
          file_name: string
          file_path: string
          id: string
          province: string | null
          school_id: string
          status: string | null
          submitted_by: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          district?: string | null
          file_name: string
          file_path: string
          id?: string
          province?: string | null
          school_id: string
          status?: string | null
          submitted_by: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          district?: string | null
          file_name?: string
          file_path?: string
          id?: string
          province?: string | null
          school_id?: string
          status?: string | null
          submitted_by?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "report_submissions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          code: string | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          district: string | null
          district_id: string | null
          id: string
          is_active: boolean | null
          name: string
          province: string | null
          province_id: string | null
          updated_at: string
        }
        Insert: {
          code?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          district?: string | null
          district_id?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          province?: string | null
          province_id?: string | null
          updated_at?: string
        }
        Update: {
          code?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          district?: string | null
          district_id?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          province?: string | null
          province_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schools_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schools_province_id_fkey"
            columns: ["province_id"]
            isOneToOne: false
            referencedRelation: "provinces"
            referencedColumns: ["id"]
          },
        ]
      }
      statistics_submissions: {
        Row: {
          academic_year: string
          attendance_rate: number | null
          created_at: string
          district: string | null
          female_students: number | null
          id: string
          male_students: number | null
          notes: string | null
          province: string | null
          school_id: string
          status: string | null
          submitted_by: string
          total_students: number | null
          total_teachers: number | null
          updated_at: string
        }
        Insert: {
          academic_year: string
          attendance_rate?: number | null
          created_at?: string
          district?: string | null
          female_students?: number | null
          id?: string
          male_students?: number | null
          notes?: string | null
          province?: string | null
          school_id: string
          status?: string | null
          submitted_by: string
          total_students?: number | null
          total_teachers?: number | null
          updated_at?: string
        }
        Update: {
          academic_year?: string
          attendance_rate?: number | null
          created_at?: string
          district?: string | null
          female_students?: number | null
          id?: string
          male_students?: number | null
          notes?: string | null
          province?: string | null
          school_id?: string
          status?: string | null
          submitted_by?: string
          total_students?: number | null
          total_teachers?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "statistics_submissions_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
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
      admin_update_profile_status: {
        Args: {
          _rejection_reason?: string
          _status: string
          _target_user_id: string
        }
        Returns: boolean
      }
      get_user_district: { Args: { _user_id: string }; Returns: string }
      get_user_province: { Args: { _user_id: string }; Returns: string }
      get_user_school_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role:
        | "admin"
        | "school"
        | "teacher"
        | "principal"
        | "district_admin"
        | "province_admin"
        | "ministry_admin"
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
      app_role: [
        "admin",
        "school",
        "teacher",
        "principal",
        "district_admin",
        "province_admin",
        "ministry_admin",
      ],
    },
  },
} as const
