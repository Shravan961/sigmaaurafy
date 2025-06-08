export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      agents: {
        Row: {
          bot_id: string
          configuration: Json
          created_at: string
          id: string
          name: string
          prompt_template: string | null
          role: string
          updated_at: string
        }
        Insert: {
          bot_id: string
          configuration?: Json
          created_at?: string
          id?: string
          name: string
          prompt_template?: string | null
          role: string
          updated_at?: string
        }
        Update: {
          bot_id?: string
          configuration?: Json
          created_at?: string
          id?: string
          name?: string
          prompt_template?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agents_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "bots"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics: {
        Row: {
          bot_id: string
          created_at: string
          event_data: Json | null
          event_type: string
          id: string
        }
        Insert: {
          bot_id: string
          created_at?: string
          event_data?: Json | null
          event_type: string
          id?: string
        }
        Update: {
          bot_id?: string
          created_at?: string
          event_data?: Json | null
          event_type?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analytics_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "bots"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          created_at: string
          encrypted_key: string
          id: string
          service_name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          encrypted_key: string
          id?: string
          service_name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          encrypted_key?: string
          id?: string
          service_name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bots: {
        Row: {
          configuration: Json
          created_at: string
          description: string | null
          id: string
          is_published: boolean | null
          is_template: boolean | null
          name: string
          theme: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          configuration?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean | null
          is_template?: boolean | null
          name: string
          theme?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          configuration?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_published?: boolean | null
          is_template?: boolean | null
          name?: string
          theme?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          clone_id: string | null
          content: string
          created_at: string
          id: string
          message_type: string
          sender: string
          thread_id: string
          timestamp: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          clone_id?: string | null
          content: string
          created_at?: string
          id?: string
          message_type?: string
          sender: string
          thread_id?: string
          timestamp: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          clone_id?: string | null
          content?: string
          created_at?: string
          id?: string
          message_type?: string
          sender?: string
          thread_id?: string
          timestamp?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      clones: {
        Row: {
          conversation_log: Json | null
          created_at: string
          id: string
          is_active: boolean | null
          memory: Json | null
          name: string
          personality: string | null
          role: string
          style: string
          system_prompt: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          conversation_log?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          memory?: Json | null
          name: string
          personality?: string | null
          role: string
          style?: string
          system_prompt: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          conversation_log?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          memory?: Json | null
          name?: string
          personality?: string | null
          role?: string
          style?: string
          system_prompt?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      conversations: {
        Row: {
          bot_id: string
          created_at: string
          id: string
          messages: Json
          metadata: Json | null
          session_id: string
          updated_at: string
        }
        Insert: {
          bot_id: string
          created_at?: string
          id?: string
          messages?: Json
          metadata?: Json | null
          session_id: string
          updated_at?: string
        }
        Update: {
          bot_id?: string
          created_at?: string
          id?: string
          messages?: Json
          metadata?: Json | null
          session_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "bots"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      usage_limits: {
        Row: {
          created_at: string
          food_logs_used: number
          functions_used: number
          id: string
          messages_used: number
          mood_logs_used: number
          reset_date: string
          symptom_logs_used: number
          tasks_used: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          food_logs_used?: number
          functions_used?: number
          id?: string
          messages_used?: number
          mood_logs_used?: number
          reset_date?: string
          symptom_logs_used?: number
          tasks_used?: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          food_logs_used?: number
          functions_used?: number
          id?: string
          messages_used?: number
          mood_logs_used?: number
          reset_date?: string
          symptom_logs_used?: number
          tasks_used?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      workflows: {
        Row: {
          bot_id: string
          created_at: string
          edges: Json
          id: string
          name: string
          nodes: Json
          triggers: Json | null
          updated_at: string
        }
        Insert: {
          bot_id: string
          created_at?: string
          edges?: Json
          id?: string
          name: string
          nodes?: Json
          triggers?: Json | null
          updated_at?: string
        }
        Update: {
          bot_id?: string
          created_at?: string
          edges?: Json
          id?: string
          name?: string
          nodes?: Json
          triggers?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflows_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "bots"
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
