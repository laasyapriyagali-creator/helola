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
      account_deletion_audit: {
        Row: {
          created_at: string
          event: string
          id: string
          metadata: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event: string
          id?: string
          metadata?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string
          event?: string
          id?: string
          metadata?: Json | null
          user_id?: string
        }
        Relationships: []
      }
      blocked_users: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      memories: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          image_url: string
          like_count: number
          media: Json
          story: string | null
          trip_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url: string
          like_count?: number
          media?: Json
          story?: string | null
          trip_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url?: string
          like_count?: number
          media?: Json
          story?: string | null
          trip_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      memory_likes: {
        Row: {
          created_at: string
          id: string
          memory_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          memory_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          memory_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "memory_likes_memory_id_fkey"
            columns: ["memory_id"]
            isOneToOne: false
            referencedRelation: "memories"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachments: Json
          content: string | null
          created_at: string
          id: string
          sender_id: string
          trip_id: string
        }
        Insert: {
          attachments?: Json
          content?: string | null
          created_at?: string
          id?: string
          sender_id: string
          trip_id: string
        }
        Update: {
          attachments?: Json
          content?: string | null
          created_at?: string
          id?: string
          sender_id?: string
          trip_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_prefs: {
        Row: {
          group_chat: boolean
          new_trip_alerts: boolean
          offers_promotions: boolean
          trip_updates: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          group_chat?: boolean
          new_trip_alerts?: boolean
          offers_promotions?: boolean
          trip_updates?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          group_chat?: boolean
          new_trip_alerts?: boolean
          offers_promotions?: boolean
          trip_updates?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          actor_id: string | null
          created_at: string
          data: Json
          entity_id: string | null
          entity_type: string | null
          id: string
          read_at: string | null
          recipient_id: string
          type: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string
          data?: Json
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          read_at?: string | null
          recipient_id: string
          type: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string
          data?: Json
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          read_at?: string | null
          recipient_id?: string
          type?: string
        }
        Relationships: []
      }
      premium_payment_history: {
        Row: {
          amount_inr: number
          created_at: string
          id: string
          paid_at: string
          plan: Database["public"]["Enums"]["premium_plan"]
          provider: string | null
          provider_payment_id: string | null
          status: string
          subscription_id: string | null
          user_id: string
        }
        Insert: {
          amount_inr: number
          created_at?: string
          id?: string
          paid_at?: string
          plan: Database["public"]["Enums"]["premium_plan"]
          provider?: string | null
          provider_payment_id?: string | null
          status?: string
          subscription_id?: string | null
          user_id: string
        }
        Update: {
          amount_inr?: number
          created_at?: string
          id?: string
          paid_at?: string
          plan?: Database["public"]["Enums"]["premium_plan"]
          provider?: string | null
          provider_payment_id?: string | null
          status?: string
          subscription_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "premium_payment_history_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "premium_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      premium_subscriptions: {
        Row: {
          auto_renew: boolean
          cancelled_at: string | null
          created_at: string
          expiry_date: string | null
          id: string
          plan: Database["public"]["Enums"]["premium_plan"]
          provider: string | null
          provider_subscription_id: string | null
          renewal_date: string | null
          start_date: string
          status: Database["public"]["Enums"]["premium_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          auto_renew?: boolean
          cancelled_at?: string | null
          created_at?: string
          expiry_date?: string | null
          id?: string
          plan: Database["public"]["Enums"]["premium_plan"]
          provider?: string | null
          provider_subscription_id?: string | null
          renewal_date?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["premium_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          auto_renew?: boolean
          cancelled_at?: string | null
          created_at?: string
          expiry_date?: string | null
          id?: string
          plan?: Database["public"]["Enums"]["premium_plan"]
          provider?: string | null
          provider_subscription_id?: string | null
          renewal_date?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["premium_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          age: number | null
          avatar_config: Json | null
          avatar_url: string | null
          bio: string | null
          cover_url: string | null
          created_at: string
          date_of_birth: string | null
          full_name: string | null
          gender: string | null
          hobbies: string[] | null
          id: string
          identity_locked: boolean
          is_verified: boolean
          location: string | null
          location_city: string | null
          location_country: string | null
          message_permission: string
          pending_deletion_at: string | null
          previous_usernames: string[] | null
          profile_visibility: string
          updated_at: string
          username: string | null
          username_change_count: number
          username_changed_at: string | null
        }
        Insert: {
          age?: number | null
          avatar_config?: Json | null
          avatar_url?: string | null
          bio?: string | null
          cover_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          full_name?: string | null
          gender?: string | null
          hobbies?: string[] | null
          id: string
          identity_locked?: boolean
          is_verified?: boolean
          location?: string | null
          location_city?: string | null
          location_country?: string | null
          message_permission?: string
          pending_deletion_at?: string | null
          previous_usernames?: string[] | null
          profile_visibility?: string
          updated_at?: string
          username?: string | null
          username_change_count?: number
          username_changed_at?: string | null
        }
        Update: {
          age?: number | null
          avatar_config?: Json | null
          avatar_url?: string | null
          bio?: string | null
          cover_url?: string | null
          created_at?: string
          date_of_birth?: string | null
          full_name?: string | null
          gender?: string | null
          hobbies?: string[] | null
          id?: string
          identity_locked?: boolean
          is_verified?: boolean
          location?: string | null
          location_city?: string | null
          location_country?: string | null
          message_permission?: string
          pending_deletion_at?: string | null
          previous_usernames?: string[] | null
          profile_visibility?: string
          updated_at?: string
          username?: string | null
          username_change_count?: number
          username_changed_at?: string | null
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      travel_prefs: {
        Row: {
          budget_max: number | null
          budget_min: number | null
          location_access: boolean
          preferred_destinations: string[]
          travel_interests: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          budget_max?: number | null
          budget_min?: number | null
          location_access?: boolean
          preferred_destinations?: string[]
          travel_interests?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          budget_max?: number | null
          budget_min?: number | null
          location_access?: boolean
          preferred_destinations?: string[]
          travel_interests?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      trip_members: {
        Row: {
          id: string
          joined_at: string
          trip_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          trip_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          trip_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_members_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
      trips: {
        Row: {
          coordinator_contact: string | null
          coordinator_name: string | null
          cost_food: number | null
          cost_other: number | null
          cost_stay: number | null
          cost_travel: number | null
          cover_image_url: string | null
          created_at: string
          creator_id: string
          description: string | null
          destination: string
          end_date: string
          id: string
          important_notes: Json | null
          interests: string[] | null
          itinerary: Json | null
          max_members: number
          price_per_person: number
          start_date: string
          status: Database["public"]["Enums"]["trip_status"]
          stay_details: Json | null
          travel_details: Json | null
          updated_at: string
        }
        Insert: {
          coordinator_contact?: string | null
          coordinator_name?: string | null
          cost_food?: number | null
          cost_other?: number | null
          cost_stay?: number | null
          cost_travel?: number | null
          cover_image_url?: string | null
          created_at?: string
          creator_id: string
          description?: string | null
          destination: string
          end_date: string
          id?: string
          important_notes?: Json | null
          interests?: string[] | null
          itinerary?: Json | null
          max_members?: number
          price_per_person?: number
          start_date: string
          status?: Database["public"]["Enums"]["trip_status"]
          stay_details?: Json | null
          travel_details?: Json | null
          updated_at?: string
        }
        Update: {
          coordinator_contact?: string | null
          coordinator_name?: string | null
          cost_food?: number | null
          cost_other?: number | null
          cost_stay?: number | null
          cost_travel?: number | null
          cover_image_url?: string | null
          created_at?: string
          creator_id?: string
          description?: string | null
          destination?: string
          end_date?: string
          id?: string
          important_notes?: Json | null
          interests?: string[] | null
          itinerary?: Json | null
          max_members?: number
          price_per_person?: number
          start_date?: string
          status?: Database["public"]["Enums"]["trip_status"]
          stay_details?: Json | null
          travel_details?: Json | null
          updated_at?: string
        }
        Relationships: []
      }
      user_reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          reason: string
          reported_id: string
          reporter_id: string
          status: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          reason: string
          reported_id: string
          reporter_id: string
          status?: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          reason?: string
          reported_id?: string
          reporter_id?: string
          status?: string
        }
        Relationships: []
      }
      wishlists: {
        Row: {
          created_at: string
          id: string
          trip_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          trip_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          trip_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_trip_id_fkey"
            columns: ["trip_id"]
            isOneToOne: false
            referencedRelation: "trips"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      my_profile_private: {
        Row: {
          date_of_birth: string | null
          id: string | null
          identity_locked: boolean | null
          pending_deletion_at: string | null
          previous_usernames: string[] | null
          username_changed_at: string | null
        }
        Insert: {
          date_of_birth?: string | null
          id?: string | null
          identity_locked?: boolean | null
          pending_deletion_at?: string | null
          previous_usernames?: string[] | null
          username_changed_at?: string | null
        }
        Update: {
          date_of_birth?: string | null
          id?: string | null
          identity_locked?: boolean | null
          pending_deletion_at?: string | null
          previous_usernames?: string[] | null
          username_changed_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      cancel_account_deletion: { Args: never; Returns: undefined }
      cancel_premium_subscription: { Args: never; Returns: undefined }
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      email_queue_dispatch: { Args: never; Returns: undefined }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      get_memory_authors: {
        Args: { _ids: string[] }
        Returns: {
          avatar_url: string
          full_name: string
          id: string
          username: string
        }[]
      }
      get_trip_coordinator_contact: {
        Args: { _trip_id: string }
        Returns: string
      }
      is_trip_member: {
        Args: { _trip_id: string; _user_id: string }
        Returns: boolean
      }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      purge_expired_accounts: { Args: never; Returns: number }
      purge_user_data: { Args: { _user_id: string }; Returns: undefined }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      request_account_deletion: { Args: never; Returns: undefined }
      set_premium_auto_renew: { Args: { _value: boolean }; Returns: undefined }
    }
    Enums: {
      premium_plan: "monthly" | "six_month" | "yearly"
      premium_status: "active" | "cancelled" | "expired" | "pending"
      trip_status: "upcoming" | "ongoing" | "completed" | "cancelled"
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
      premium_plan: ["monthly", "six_month", "yearly"],
      premium_status: ["active", "cancelled", "expired", "pending"],
      trip_status: ["upcoming", "ongoing", "completed", "cancelled"],
    },
  },
} as const
