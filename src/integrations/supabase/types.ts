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
      activity_logs: {
        Row: {
          category: string | null
          created_at: string
          id: string
          log_type: string
          logged_at: string
          metadata: Json | null
          user_id: string
          value: number
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          log_type: string
          logged_at?: string
          metadata?: Json | null
          user_id: string
          value?: number
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          log_type?: string
          logged_at?: string
          metadata?: Json | null
          user_id?: string
          value?: number
        }
        Relationships: []
      }
      coaching_plans: {
        Row: {
          created_at: string
          description: string | null
          id: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      daily_tasks: {
        Row: {
          category: string
          completed_at: string | null
          created_at: string
          day_number: number
          id: string
          is_completed: boolean
          plan_id: string | null
          task: string
          user_id: string
        }
        Insert: {
          category?: string
          completed_at?: string | null
          created_at?: string
          day_number: number
          id?: string
          is_completed?: boolean
          plan_id?: string | null
          task: string
          user_id: string
        }
        Update: {
          category?: string
          completed_at?: string | null
          created_at?: string
          day_number?: number
          id?: string
          is_completed?: boolean
          plan_id?: string | null
          task?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_tasks_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "coaching_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          category: string
          created_at: string
          current_value: string | null
          id: string
          progress: number
          status: string
          target_value: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          current_value?: string | null
          id?: string
          progress?: number
          status?: string
          target_value?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          current_value?: string | null
          id?: string
          progress?: number
          status?: string
          target_value?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      interventions: {
        Row: {
          created_at: string
          id: string
          impact_score: number
          name: string
          times_accepted: number
          times_shown: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          impact_score?: number
          name: string
          times_accepted?: number
          times_shown?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          impact_score?: number
          name?: string
          times_accepted?: number
          times_shown?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      life_scores: {
        Row: {
          created_at: string
          date: string
          digital: number
          financial: number
          id: string
          overall: number
          physical: number
          productivity: number
          user_id: string
          wellbeing: number
        }
        Insert: {
          created_at?: string
          date?: string
          digital?: number
          financial?: number
          id?: string
          overall?: number
          physical?: number
          productivity?: number
          user_id: string
          wellbeing?: number
        }
        Update: {
          created_at?: string
          date?: string
          digital?: number
          financial?: number
          id?: string
          overall?: number
          physical?: number
          productivity?: number
          user_id?: string
          wellbeing?: number
        }
        Relationships: []
      }
      model_metrics: {
        Row: {
          accuracy: number
          avg_confidence: number
          correct_predictions: number
          created_at: string
          domain: string
          drift_score: number
          feedback_helpful: number
          feedback_total: number
          feedback_wrong: number
          id: string
          period_end: string
          period_start: string
          total_predictions: number
          usefulness_rate: number
          user_id: string
          version: number
        }
        Insert: {
          accuracy?: number
          avg_confidence?: number
          correct_predictions?: number
          created_at?: string
          domain: string
          drift_score?: number
          feedback_helpful?: number
          feedback_total?: number
          feedback_wrong?: number
          id?: string
          period_end: string
          period_start: string
          total_predictions?: number
          usefulness_rate?: number
          user_id: string
          version?: number
        }
        Update: {
          accuracy?: number
          avg_confidence?: number
          correct_predictions?: number
          created_at?: string
          domain?: string
          drift_score?: number
          feedback_helpful?: number
          feedback_total?: number
          feedback_wrong?: number
          id?: string
          period_end?: string
          period_start?: string
          total_predictions?: number
          usefulness_rate?: number
          user_id?: string
          version?: number
        }
        Relationships: []
      }
      notification_settings: {
        Row: {
          anti_spam_enabled: boolean
          channels: Json
          created_at: string
          id: string
          max_daily_notifications: number
          priority_threshold: string
          quiet_hours_enabled: boolean
          quiet_hours_end: string | null
          quiet_hours_start: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          anti_spam_enabled?: boolean
          channels?: Json
          created_at?: string
          id?: string
          max_daily_notifications?: number
          priority_threshold?: string
          quiet_hours_enabled?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          anti_spam_enabled?: boolean
          channels?: Json
          created_at?: string
          id?: string
          max_daily_notifications?: number
          priority_threshold?: string
          quiet_hours_enabled?: boolean
          quiet_hours_end?: string | null
          quiet_hours_start?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      nudges: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          nudge_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          nudge_type?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          nudge_type?: string
          user_id?: string
        }
        Relationships: []
      }
      prediction_feedback: {
        Row: {
          comment: string | null
          created_at: string
          feedback_type: string
          id: string
          prediction_id: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          feedback_type: string
          id?: string
          prediction_id: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          feedback_type?: string
          id?: string
          prediction_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prediction_feedback_prediction_id_fkey"
            columns: ["prediction_id"]
            isOneToOne: false
            referencedRelation: "predictions"
            referencedColumns: ["id"]
          },
        ]
      }
      predictions: {
        Row: {
          accuracy_score: number | null
          actual_outcome: Json | null
          confidence_score: number
          created_at: string
          domain: string
          expires_at: string | null
          id: string
          pattern_explanation: string | null
          predicted_outcome: Json | null
          prediction_text: string
          resolved_at: string | null
          risk_score: number
          status: string
          trend_direction: string
          user_id: string
        }
        Insert: {
          accuracy_score?: number | null
          actual_outcome?: Json | null
          confidence_score?: number
          created_at?: string
          domain?: string
          expires_at?: string | null
          id?: string
          pattern_explanation?: string | null
          predicted_outcome?: Json | null
          prediction_text: string
          resolved_at?: string | null
          risk_score?: number
          status?: string
          trend_direction?: string
          user_id: string
        }
        Update: {
          accuracy_score?: number | null
          actual_outcome?: Json | null
          confidence_score?: number
          created_at?: string
          domain?: string
          expires_at?: string | null
          id?: string
          pattern_explanation?: string | null
          predicted_outcome?: Json | null
          prediction_text?: string
          resolved_at?: string | null
          risk_score?: number
          status?: string
          trend_direction?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          timezone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id: string
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          timezone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_behavior_profiles: {
        Row: {
          created_at: string
          detected_patterns: Json | null
          id: string
          sleep_pattern: Json | null
          spending_habits: Json | null
          stress_indicators: Json | null
          study_schedule: Json | null
          updated_at: string
          user_id: string
          work_hours: Json | null
        }
        Insert: {
          created_at?: string
          detected_patterns?: Json | null
          id?: string
          sleep_pattern?: Json | null
          spending_habits?: Json | null
          stress_indicators?: Json | null
          study_schedule?: Json | null
          updated_at?: string
          user_id: string
          work_hours?: Json | null
        }
        Update: {
          created_at?: string
          detected_patterns?: Json | null
          id?: string
          sleep_pattern?: Json | null
          spending_habits?: Json | null
          stress_indicators?: Json | null
          study_schedule?: Json | null
          updated_at?: string
          user_id?: string
          work_hours?: Json | null
        }
        Relationships: []
      }
      user_consents: {
        Row: {
          consent_type: string
          created_at: string
          granted: boolean
          granted_at: string | null
          id: string
          revoked_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          consent_type: string
          created_at?: string
          granted?: boolean
          granted_at?: string | null
          id?: string
          revoked_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          consent_type?: string
          created_at?: string
          granted?: boolean
          granted_at?: string | null
          id?: string
          revoked_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
