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
      approval_requests: {
        Row: {
          action_token: string
          applicant_email: string
          applicant_full_name: string | null
          applicant_role: string
          applicant_user_id: string
          approver_email: string
          approver_label: string
          created_at: string
          decided_at: string | null
          decided_by_email: string | null
          decision_note: string | null
          district: string | null
          email_sent_at: string | null
          id: string
          phone_number: string | null
          province: string | null
          school_name: string | null
          status: string
          updated_at: string
        }
        Insert: {
          action_token?: string
          applicant_email: string
          applicant_full_name?: string | null
          applicant_role: string
          applicant_user_id: string
          approver_email: string
          approver_label: string
          created_at?: string
          decided_at?: string | null
          decided_by_email?: string | null
          decision_note?: string | null
          district?: string | null
          email_sent_at?: string | null
          id?: string
          phone_number?: string | null
          province?: string | null
          school_name?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          action_token?: string
          applicant_email?: string
          applicant_full_name?: string | null
          applicant_role?: string
          applicant_user_id?: string
          approver_email?: string
          approver_label?: string
          created_at?: string
          decided_at?: string | null
          decided_by_email?: string | null
          decision_note?: string | null
          district?: string | null
          email_sent_at?: string | null
          id?: string
          phone_number?: string | null
          province?: string | null
          school_name?: string | null
          status?: string
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
      conversation_members: {
        Row: {
          conversation_id: string
          joined_at: string
          last_read_at: string
          muted_until: string | null
          role: Database["public"]["Enums"]["conversation_member_role"]
          user_id: string
        }
        Insert: {
          conversation_id: string
          joined_at?: string
          last_read_at?: string
          muted_until?: string | null
          role?: Database["public"]["Enums"]["conversation_member_role"]
          user_id: string
        }
        Update: {
          conversation_id?: string
          joined_at?: string
          last_read_at?: string
          muted_until?: string | null
          role?: Database["public"]["Enums"]["conversation_member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_members_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          avatar_url: string | null
          created_at: string
          created_by: string
          id: string
          last_message_at: string
          title: string | null
          type: Database["public"]["Enums"]["conversation_type"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          created_by: string
          id?: string
          last_message_at?: string
          title?: string | null
          type: Database["public"]["Enums"]["conversation_type"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          created_by?: string
          id?: string
          last_message_at?: string
          title?: string | null
          type?: Database["public"]["Enums"]["conversation_type"]
          updated_at?: string
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
          current_stage: Database["public"]["Enums"]["review_stage"]
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
          current_stage?: Database["public"]["Enums"]["review_stage"]
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
          current_stage?: Database["public"]["Enums"]["review_stage"]
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
      message_reads: {
        Row: {
          message_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          message_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          message_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reads_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachment_mime: string | null
          attachment_name: string | null
          attachment_size: number | null
          attachment_url: string | null
          body: string | null
          conversation_id: string
          created_at: string
          deleted_at: string | null
          edited_at: string | null
          id: string
          reply_to_id: string | null
          sender_id: string
        }
        Insert: {
          attachment_mime?: string | null
          attachment_name?: string | null
          attachment_size?: number | null
          attachment_url?: string | null
          body?: string | null
          conversation_id: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          reply_to_id?: string | null
          sender_id: string
        }
        Update: {
          attachment_mime?: string | null
          attachment_name?: string | null
          attachment_size?: number | null
          attachment_url?: string | null
          body?: string | null
          conversation_id?: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          id?: string
          reply_to_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "messages"
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
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          link: string | null
          read_at: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title: string
          type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
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
          current_stage: Database["public"]["Enums"]["review_stage"]
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
          current_stage?: Database["public"]["Enums"]["review_stage"]
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
          current_stage?: Database["public"]["Enums"]["review_stage"]
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
      signup_challenges: {
        Row: {
          correct_number: number
          created_at: string
          decoys: number[]
          email: string
          expires_at: string
          id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          correct_number: number
          created_at?: string
          decoys: number[]
          email: string
          expires_at?: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          correct_number?: number
          created_at?: string
          decoys?: number[]
          email?: string
          expires_at?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      statistics_submissions: {
        Row: {
          academic_year: string
          attendance_rate: number | null
          created_at: string
          current_stage: Database["public"]["Enums"]["review_stage"]
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
          current_stage?: Database["public"]["Enums"]["review_stage"]
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
          current_stage?: Database["public"]["Enums"]["review_stage"]
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
      submission_comments: {
        Row: {
          author_user_id: string
          body: string
          created_at: string
          id: string
          submission_id: string
          submission_table: string
          updated_at: string
        }
        Insert: {
          author_user_id: string
          body: string
          created_at?: string
          id?: string
          submission_id: string
          submission_table: string
          updated_at?: string
        }
        Update: {
          author_user_id?: string
          body?: string
          created_at?: string
          id?: string
          submission_id?: string
          submission_table?: string
          updated_at?: string
        }
        Relationships: []
      }
      submission_events: {
        Row: {
          action: string
          actor_user_id: string
          created_at: string
          from_stage: Database["public"]["Enums"]["review_stage"] | null
          id: string
          note: string | null
          submission_id: string
          submission_table: string
          to_stage: Database["public"]["Enums"]["review_stage"] | null
        }
        Insert: {
          action: string
          actor_user_id: string
          created_at?: string
          from_stage?: Database["public"]["Enums"]["review_stage"] | null
          id?: string
          note?: string | null
          submission_id: string
          submission_table: string
          to_stage?: Database["public"]["Enums"]["review_stage"] | null
        }
        Update: {
          action?: string
          actor_user_id?: string
          created_at?: string
          from_stage?: Database["public"]["Enums"]["review_stage"] | null
          id?: string
          note?: string | null
          submission_id?: string
          submission_table?: string
          to_stage?: Database["public"]["Enums"]["review_stage"] | null
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
      admin_update_profile_status: {
        Args: {
          _rejection_reason?: string
          _status: string
          _target_user_id: string
        }
        Returns: boolean
      }
      can_access_submission: {
        Args: { _id: string; _table: string }
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
      is_conversation_admin: {
        Args: { _conv: string; _user: string }
        Returns: boolean
      }
      is_conversation_member: {
        Args: { _conv: string; _user: string }
        Returns: boolean
      }
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
      conversation_member_role: "member" | "admin"
      conversation_type: "direct" | "group"
      review_stage:
        | "school"
        | "district"
        | "province"
        | "ministry"
        | "completed"
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
      conversation_member_role: ["member", "admin"],
      conversation_type: ["direct", "group"],
      review_stage: ["school", "district", "province", "ministry", "completed"],
    },
  },
} as const
