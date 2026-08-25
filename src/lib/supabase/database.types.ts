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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      admin_test_push_subscription: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          p256dh: string
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      courses: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id: string
          name?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string | null
        }
        Relationships: []
      }
      devotion_reminder_settings: {
        Row: {
          evening_enabled: boolean
          evening_time: string
          id: boolean
          last_evening_sent_date: string | null
          last_morning_sent_date: string | null
          morning_enabled: boolean
          morning_time: string
          updated_at: string
        }
        Insert: {
          evening_enabled?: boolean
          evening_time?: string
          id?: boolean
          last_evening_sent_date?: string | null
          last_morning_sent_date?: string | null
          morning_enabled?: boolean
          morning_time?: string
          updated_at?: string
        }
        Update: {
          evening_enabled?: boolean
          evening_time?: string
          id?: boolean
          last_evening_sent_date?: string | null
          last_morning_sent_date?: string | null
          morning_enabled?: boolean
          morning_time?: string
          updated_at?: string
        }
        Relationships: []
      }
      gift_from_god: {
        Row: {
          ambassador: number
          being_single: number
          blessing_prayer: number
          compassion: number
          created_at: string
          discernment_of_spirits: number
          executive: number
          exorcism: number
          faith_trust: number
          healing_of_disease: number
          image_url: string | null
          interpreting_tongues: number
          lamb_id: string
          miracle: number
          missionary: number
          note: string | null
          offering: number
          pastoral: number
          preacher: number
          prophet: number
          ruler: number
          speaking_in_tongues: number
          supporter: number
          teaching: number
          to_serve: number
          updated_at: string
          warning_and_encouragement: number
          welcoming_guests: number
          word_of_wisdom: number
          words_with_knowledge: number
        }
        Insert: {
          ambassador?: number
          being_single?: number
          blessing_prayer?: number
          compassion?: number
          created_at?: string
          discernment_of_spirits?: number
          executive?: number
          exorcism?: number
          faith_trust?: number
          healing_of_disease?: number
          image_url?: string | null
          interpreting_tongues?: number
          lamb_id: string
          miracle?: number
          missionary?: number
          note?: string | null
          offering?: number
          pastoral?: number
          preacher?: number
          prophet?: number
          ruler?: number
          speaking_in_tongues?: number
          supporter?: number
          teaching?: number
          to_serve?: number
          updated_at?: string
          warning_and_encouragement?: number
          welcoming_guests?: number
          word_of_wisdom?: number
          words_with_knowledge?: number
        }
        Update: {
          ambassador?: number
          being_single?: number
          blessing_prayer?: number
          compassion?: number
          created_at?: string
          discernment_of_spirits?: number
          executive?: number
          exorcism?: number
          faith_trust?: number
          healing_of_disease?: number
          image_url?: string | null
          interpreting_tongues?: number
          lamb_id?: string
          miracle?: number
          missionary?: number
          note?: string | null
          offering?: number
          pastoral?: number
          preacher?: number
          prophet?: number
          ruler?: number
          speaking_in_tongues?: number
          supporter?: number
          teaching?: number
          to_serve?: number
          updated_at?: string
          warning_and_encouragement?: number
          welcoming_guests?: number
          word_of_wisdom?: number
          words_with_knowledge?: number
        }
        Relationships: [
          {
            foreignKeyName: "gift_from_god_lamb_id_fkey"
            columns: ["lamb_id"]
            isOneToOne: true
            referencedRelation: "lamb_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "gift_from_god_lamb_id_fkey"
            columns: ["lamb_id"]
            isOneToOne: true
            referencedRelation: "lamb_info"
            referencedColumns: ["id"]
          },
        ]
      }
      group_care: {
        Row: {
          address: string | null
          day: string | null
          id: string
          name: string
        }
        Insert: {
          address?: string | null
          day?: string | null
          id?: string
          name: string
        }
        Update: {
          address?: string | null
          day?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      lamb_attendance_log: {
        Row: {
          came_to_church: boolean
          came_to_group_care: boolean
          created_at: string
          id: string
          lamb_id: string
          note: string | null
          recorded_by: string | null
          updated_at: string
          week_start: string
        }
        Insert: {
          came_to_church?: boolean
          came_to_group_care?: boolean
          created_at?: string
          id?: string
          lamb_id: string
          note?: string | null
          recorded_by?: string | null
          updated_at?: string
          week_start: string
        }
        Update: {
          came_to_church?: boolean
          came_to_group_care?: boolean
          created_at?: string
          id?: string
          lamb_id?: string
          note?: string | null
          recorded_by?: string | null
          updated_at?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "lamb_attendance_log_lamb_id_fkey"
            columns: ["lamb_id"]
            isOneToOne: false
            referencedRelation: "lamb_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lamb_attendance_log_lamb_id_fkey"
            columns: ["lamb_id"]
            isOneToOne: false
            referencedRelation: "lamb_info"
            referencedColumns: ["id"]
          },
        ]
      }
      lamb_devotion: {
        Row: {
          content_html: string
          created_at: string
          devotion_date: string
          id: string
          image_urls: string[]
          is_public: boolean | null
          lamb_id: string
          title: string
          updated_at: string
        }
        Insert: {
          content_html: string
          created_at?: string
          devotion_date: string
          id?: string
          image_urls?: string[]
          is_public?: boolean | null
          lamb_id: string
          title: string
          updated_at?: string
        }
        Update: {
          content_html?: string
          created_at?: string
          devotion_date?: string
          id?: string
          image_urls?: string[]
          is_public?: boolean | null
          lamb_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lamb_devotion_lamb_id_fkey"
            columns: ["lamb_id"]
            isOneToOne: false
            referencedRelation: "lamb_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lamb_devotion_lamb_id_fkey"
            columns: ["lamb_id"]
            isOneToOne: false
            referencedRelation: "lamb_info"
            referencedColumns: ["id"]
          },
        ]
      }
      lamb_info: {
        Row: {
          address: string | null
          age: number | null
          auth_user_id: string | null
          birthday: string | null
          class: string | null
          email: string | null
          favorite_food: string | null
          first_name: string | null
          gender: string | null
          group_care: string | null
          id: string
          interesting: string | null
          is_timote: boolean | null
          job: string | null
          lamb_lesson_ch18_progress: number | null
          lamb_lesson_life_progress: number | null
          last_name: string | null
          nick_name: string | null
          personality_code: string | null
          phone: string | null
          previous_church: string | null
          profile_picture: string | null
          remark: string | null
          role: string
          status: boolean | null
          tags: string | null
          unfavorite_food: string | null
          years_of_faith: number | null
        }
        Insert: {
          address?: string | null
          age?: number | null
          auth_user_id?: string | null
          birthday?: string | null
          class?: string | null
          email?: string | null
          favorite_food?: string | null
          first_name?: string | null
          gender?: string | null
          group_care?: string | null
          id?: string
          interesting?: string | null
          is_timote?: boolean | null
          job?: string | null
          lamb_lesson_ch18_progress?: number | null
          lamb_lesson_life_progress?: number | null
          last_name?: string | null
          nick_name?: string | null
          personality_code?: string | null
          phone?: string | null
          previous_church?: string | null
          profile_picture?: string | null
          remark?: string | null
          role?: string
          status?: boolean | null
          tags?: string | null
          unfavorite_food?: string | null
          years_of_faith?: number | null
        }
        Update: {
          address?: string | null
          age?: number | null
          auth_user_id?: string | null
          birthday?: string | null
          class?: string | null
          email?: string | null
          favorite_food?: string | null
          first_name?: string | null
          gender?: string | null
          group_care?: string | null
          id?: string
          interesting?: string | null
          is_timote?: boolean | null
          job?: string | null
          lamb_lesson_ch18_progress?: number | null
          lamb_lesson_life_progress?: number | null
          last_name?: string | null
          nick_name?: string | null
          personality_code?: string | null
          phone?: string | null
          previous_church?: string | null
          profile_picture?: string | null
          remark?: string | null
          role?: string
          status?: boolean | null
          tags?: string | null
          unfavorite_food?: string | null
          years_of_faith?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "lamb_info_group_care_fkey"
            columns: ["group_care"]
            isOneToOne: false
            referencedRelation: "group_care"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lamb_info_personality_code_fkey"
            columns: ["personality_code"]
            isOneToOne: false
            referencedRelation: "personality_type"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "lamb_info_role_fkey"
            columns: ["role"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["code"]
          },
        ]
      }
      lamb_lesson_progress: {
        Row: {
          completed_at: string | null
          id: string
          is_completed: boolean | null
          lamb_id: string | null
          lesson_id: string | null
        }
        Insert: {
          completed_at?: string | null
          id: string
          is_completed?: boolean | null
          lamb_id?: string | null
          lesson_id?: string | null
        }
        Update: {
          completed_at?: string | null
          id?: string
          is_completed?: boolean | null
          lamb_id?: string | null
          lesson_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lamb_lesson_progress_lamb_id_fkey"
            columns: ["lamb_id"]
            isOneToOne: false
            referencedRelation: "lamb_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lamb_lesson_progress_lamb_id_fkey"
            columns: ["lamb_id"]
            isOneToOne: false
            referencedRelation: "lamb_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lamb_lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lamb_prayer_request: {
        Row: {
          answered_date: string | null
          created_at: string
          detail: string | null
          id: string
          is_answered: boolean
          is_shared: boolean
          lamb_id: string
          title: string
          type: Database["public"]["Enums"]["prayer_entry_type"]
          updated_at: string
        }
        Insert: {
          answered_date?: string | null
          created_at?: string
          detail?: string | null
          id?: string
          is_answered?: boolean
          is_shared?: boolean
          lamb_id: string
          title: string
          type?: Database["public"]["Enums"]["prayer_entry_type"]
          updated_at?: string
        }
        Update: {
          answered_date?: string | null
          created_at?: string
          detail?: string | null
          id?: string
          is_answered?: boolean
          is_shared?: boolean
          lamb_id?: string
          title?: string
          type?: Database["public"]["Enums"]["prayer_entry_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lamb_prayer_request_lamb_id_fkey"
            columns: ["lamb_id"]
            isOneToOne: false
            referencedRelation: "lamb_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lamb_prayer_request_lamb_id_fkey"
            columns: ["lamb_id"]
            isOneToOne: false
            referencedRelation: "lamb_info"
            referencedColumns: ["id"]
          },
        ]
      }
      lamb_push_subscription: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          lamb_id: string
          p256dh: string
          updated_at: string
          user_agent: string | null
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          lamb_id: string
          p256dh: string
          updated_at?: string
          user_agent?: string | null
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          lamb_id?: string
          p256dh?: string
          updated_at?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lamb_push_subscription_lamb_id_fkey"
            columns: ["lamb_id"]
            isOneToOne: false
            referencedRelation: "lamb_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lamb_push_subscription_lamb_id_fkey"
            columns: ["lamb_id"]
            isOneToOne: false
            referencedRelation: "lamb_info"
            referencedColumns: ["id"]
          },
        ]
      }
      lamb_time_logs: {
        Row: {
          created_at: string | null
          duration_minutes: number | null
          id: string
          lamb_id: string | null
          meeting_type: string | null
          note: string | null
          recorded_by: string | null
          response_score: number | null
          topic: string | null
          updated_at: string | null
          visit_date: string | null
        }
        Insert: {
          created_at?: string | null
          duration_minutes?: number | null
          id: string
          lamb_id?: string | null
          meeting_type?: string | null
          note?: string | null
          recorded_by?: string | null
          response_score?: number | null
          topic?: string | null
          updated_at?: string | null
          visit_date?: string | null
        }
        Update: {
          created_at?: string | null
          duration_minutes?: number | null
          id?: string
          lamb_id?: string | null
          meeting_type?: string | null
          note?: string | null
          recorded_by?: string | null
          response_score?: number | null
          topic?: string | null
          updated_at?: string | null
          visit_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lamb_time_logs_lamb_id_fkey"
            columns: ["lamb_id"]
            isOneToOne: false
            referencedRelation: "lamb_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lamb_time_logs_lamb_id_fkey"
            columns: ["lamb_id"]
            isOneToOne: false
            referencedRelation: "lamb_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lamb_time_logs_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "lamb_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lamb_time_logs_recorded_by_fkey"
            columns: ["recorded_by"]
            isOneToOne: false
            referencedRelation: "lamb_info"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          course_id: string | null
          id: string
          order_no: number | null
          title: string | null
        }
        Insert: {
          course_id?: string | null
          id: string
          order_no?: number | null
          title?: string | null
        }
        Update: {
          course_id?: string | null
          id?: string
          order_no?: number | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      news: {
        Row: {
          author_id: string
          category_id: string | null
          content_html: string
          cover_image_url: string | null
          created_at: string
          excerpt: string | null
          id: string
          image_urls: string[]
          published_at: string | null
          slug: string
          status: string
          title: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          author_id: string
          category_id?: string | null
          content_html: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          image_urls?: string[]
          published_at?: string | null
          slug: string
          status?: string
          title: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          author_id?: string
          category_id?: string | null
          content_html?: string
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          image_urls?: string[]
          published_at?: string | null
          slug?: string
          status?: string
          title?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "news_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "lamb_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "lamb_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "news_category"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "lamb_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "lamb_info"
            referencedColumns: ["id"]
          },
        ]
      }
      news_category: {
        Row: {
          code: string
          created_at: string
          id: string
          name_th: string
          sort_order: number
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name_th: string
          sort_order?: number
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name_th?: string
          sort_order?: number
        }
        Relationships: []
      }
      payment_slips: {
        Row: {
          extracted_amount: number | null
          file_size: number | null
          id: string
          mime_type: string | null
          original_name: string
          path: string
          person_id: string | null
          updated_at: string | null
          uploaded_at: string | null
          user_id: string | null
        }
        Insert: {
          extracted_amount?: number | null
          file_size?: number | null
          id?: string
          mime_type?: string | null
          original_name: string
          path: string
          person_id?: string | null
          updated_at?: string | null
          uploaded_at?: string | null
          user_id?: string | null
        }
        Update: {
          extracted_amount?: number | null
          file_size?: number | null
          id?: string
          mime_type?: string | null
          original_name?: string
          path?: string
          person_id?: string | null
          updated_at?: string | null
          uploaded_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      personality_type: {
        Row: {
          archetype: string | null
          code: string
          description_en: string | null
          description_th: string | null
          explain: string | null
        }
        Insert: {
          archetype?: string | null
          code: string
          description_en?: string | null
          description_th?: string | null
          explain?: string | null
        }
        Update: {
          archetype?: string | null
          code?: string
          description_en?: string | null
          description_th?: string | null
          explain?: string | null
        }
        Relationships: []
      }
      quiet_time_weekly_log: {
        Row: {
          created_at: string | null
          id: string
          member_id: string | null
          month: number | null
          soft_delete: boolean | null
          weekly_logs: number[]
          year: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          member_id?: string | null
          month?: number | null
          soft_delete?: boolean | null
          weekly_logs?: number[]
          year?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          member_id?: string | null
          month?: number | null
          soft_delete?: boolean | null
          weekly_logs?: number[]
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "quiet_time_weekly_log_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "lamb_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiet_time_weekly_log_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "lamb_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiet_time_weekly_log_member_id_fkey1"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "lamb_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quiet_time_weekly_log_member_id_fkey1"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "lamb_info"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          permission: string
          role: string
        }
        Insert: {
          permission: string
          role: string
        }
        Update: {
          permission?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_role_fkey"
            columns: ["role"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["code"]
          },
        ]
      }
      roles: {
        Row: {
          code: string
          name_th: string
          sort_order: number
        }
        Insert: {
          code: string
          name_th: string
          sort_order?: number
        }
        Update: {
          code?: string
          name_th?: string
          sort_order?: number
        }
        Relationships: []
      }
    }
    Views: {
      lamb_directory: {
        Row: {
          first_name: string | null
          id: string | null
          last_name: string | null
          nick_name: string | null
        }
        Insert: {
          first_name?: string | null
          id?: string | null
          last_name?: string | null
          nick_name?: string | null
        }
        Update: {
          first_name?: string | null
          id?: string | null
          last_name?: string | null
          nick_name?: string | null
        }
        Relationships: []
      }
      public_devotion_feed: {
        Row: {
          content_html: string | null
          created_at: string | null
          devotion_date: string | null
          id: string | null
          image_urls: string[] | null
          lamb_first_name: string | null
          lamb_last_name: string | null
          lamb_nick_name: string | null
          lamb_profile_picture: string | null
          title: string | null
        }
        Relationships: []
      }
      public_news_feed: {
        Row: {
          author_first_name: string | null
          author_last_name: string | null
          author_nick_name: string | null
          author_profile_picture: string | null
          category_name: string | null
          content_html: string | null
          cover_image_url: string | null
          created_at: string | null
          excerpt: string | null
          id: string | null
          image_urls: string[] | null
          published_at: string | null
          slug: string | null
          title: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      auth_cell_ids: { Args: never; Returns: string[] }
      auth_has_permission: { Args: { perm: string }; Returns: boolean }
      auth_is_hardcoded_super_admin: { Args: never; Returns: boolean }
      auth_is_super_admin: { Args: never; Returns: boolean }
      auth_lamb_id: { Args: never; Returns: string }
      get_group_payment_analysis: {
        Args: never
        Returns: {
          group_care: string
          payment_slip_count: number
          total_extracted_amount: number
        }[]
      }
    }
    Enums: {
      prayer_entry_type: "prayer" | "conversation"
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
      prayer_entry_type: ["prayer", "conversation"],
    },
  },
} as const
