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
      app_38b06dea2963452f9265ca4a0de19e02_audit_logs: {
        Row: {
          action: string
          created_at: string
          data: Json | null
          id: string
          ip_address: unknown | null
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          data?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          data?: Json | null
          id?: string
          ip_address?: unknown | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      app_38b06dea2963452f9265ca4a0de19e02_generated_content: {
        Row: {
          created_at: string
          credits_used: number | null
          id: string
          output: Json
          prompt: string
          team_id: string | null
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credits_used?: number | null
          id?: string
          output: Json
          prompt: string
          team_id?: string | null
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          credits_used?: number | null
          id?: string
          output?: Json
          prompt?: string
          team_id?: string | null
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_38b06dea2963452f9265ca4a0de19e02_generated_con_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "app_38b06dea2963452f9265ca4a0de19e02_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      app_38b06dea2963452f9265ca4a0de19e02_integration_tokens: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          provider: string
          refresh_token_encrypted: string | null
          scopes: string[] | null
          token_encrypted: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          provider: string
          refresh_token_encrypted?: string | null
          scopes?: string[] | null
          token_encrypted: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          provider?: string
          refresh_token_encrypted?: string | null
          scopes?: string[] | null
          token_encrypted?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      app_38b06dea2963452f9265ca4a0de19e02_team_members: {
        Row: {
          created_at: string
          id: string
          invited_at: string | null
          invited_email: string | null
          joined_at: string | null
          role: string | null
          status: string | null
          team_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_at?: string | null
          invited_email?: string | null
          joined_at?: string | null
          role?: string | null
          status?: string | null
          team_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_at?: string | null
          invited_email?: string | null
          joined_at?: string | null
          role?: string | null
          status?: string | null
          team_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_38b06dea2963452f9265ca4a0de19e02_team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "app_38b06dea2963452f9265ca4a0de19e02_teams"
            referencedColumns: ["id"]
          },
        ]
      }
      app_38b06dea2963452f9265ca4a0de19e02_teams: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      app_38b06dea2963452f9265ca4a0de19e02_user_credits: {
        Row: {
          created_at: string
          credits_used: number | null
          id: string
          monthly_limit: number | null
          reset_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credits_used?: number | null
          id?: string
          monthly_limit?: number | null
          reset_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credits_used?: number | null
          id?: string
          monthly_limit?: number | null
          reset_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      app_38b06dea2963452f9265ca4a0de19e02_user_plans: {
        Row: {
          created_at: string
          credits: number | null
          id: string
          plan: string | null
          seat_count: number | null
          status: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credits?: number | null
          id?: string
          plan?: string | null
          seat_count?: number | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credits?: number | null
          id?: string
          plan?: string | null
          seat_count?: number | null
          status?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string
          id: string
          ip_address: unknown | null
          new_values: Json | null
          old_values: Json | null
          record_id: string | null
          table_name: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          new_values?: Json | null
          old_values?: Json | null
          record_id?: string | null
          table_name?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      billing: {
        Row: {
          amount: number | null
          attrs: Json | null
          created: string | null
          currency: string | null
          customer: string | null
          id: string | null
          payment_method: string | null
        }
        Insert: {
          amount?: number | null
          attrs?: Json | null
          created?: string | null
          currency?: string | null
          customer?: string | null
          id?: string | null
          payment_method?: string | null
        }
        Update: {
          amount?: number | null
          attrs?: Json | null
          created?: string | null
          currency?: string | null
          customer?: string | null
          id?: string | null
          payment_method?: string | null
        }
        Relationships: []
      }
      content_analytics: {
        Row: {
          content_id: string
          id: string
          metadata: Json | null
          metric_type: string
          metric_value: number
          recorded_at: string
        }
        Insert: {
          content_id: string
          id?: string
          metadata?: Json | null
          metric_type: string
          metric_value?: number
          recorded_at?: string
        }
        Update: {
          content_id?: string
          id?: string
          metadata?: Json | null
          metric_type?: string
          metric_value?: number
          recorded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_analytics_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "generated_content"
            referencedColumns: ["id"]
          },
        ]
      }
      content_collaborations: {
        Row: {
          collaborator_id: string
          content_id: string
          created_at: string
          id: string
          invited_by: string
          permission_level: Database["public"]["Enums"]["collaboration_permission"]
          status: Database["public"]["Enums"]["collaboration_status"]
        }
        Insert: {
          collaborator_id: string
          content_id: string
          created_at?: string
          id?: string
          invited_by: string
          permission_level?: Database["public"]["Enums"]["collaboration_permission"]
          status?: Database["public"]["Enums"]["collaboration_status"]
        }
        Update: {
          collaborator_id?: string
          content_id?: string
          created_at?: string
          id?: string
          invited_by?: string
          permission_level?: Database["public"]["Enums"]["collaboration_permission"]
          status?: Database["public"]["Enums"]["collaboration_status"]
        }
        Relationships: [
          {
            foreignKeyName: "content_collaborations_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "generated_content"
            referencedColumns: ["id"]
          },
        ]
      }
      content_comments: {
        Row: {
          comment_text: string
          content_id: string
          created_at: string
          id: string
          is_resolved: boolean | null
          parent_comment_id: string | null
          user_id: string
        }
        Insert: {
          comment_text: string
          content_id: string
          created_at?: string
          id?: string
          is_resolved?: boolean | null
          parent_comment_id?: string | null
          user_id: string
        }
        Update: {
          comment_text?: string
          content_id?: string
          created_at?: string
          id?: string
          is_resolved?: boolean | null
          parent_comment_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_comments_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "generated_content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "content_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      content_performance_summary: {
        Row: {
          content_id: string
          engagement_rate: number | null
          last_updated: string
          total_clicks: number | null
          total_conversions: number | null
          total_views: number | null
        }
        Insert: {
          content_id: string
          engagement_rate?: number | null
          last_updated?: string
          total_clicks?: number | null
          total_conversions?: number | null
          total_views?: number | null
        }
        Update: {
          content_id?: string
          engagement_rate?: number | null
          last_updated?: string
          total_clicks?: number | null
          total_conversions?: number | null
          total_views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "content_performance_summary_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: true
            referencedRelation: "generated_content"
            referencedColumns: ["id"]
          },
        ]
      }
      content_templates: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          id: string
          is_public: boolean | null
          min_plan_type: Database["public"]["Enums"]["plan_type"]
          name: string
          tags: string[] | null
          template_data: Json
          type: Database["public"]["Enums"]["content_type"]
          updated_at: string
          usage_count: number | null
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          min_plan_type?: Database["public"]["Enums"]["plan_type"]
          name: string
          tags?: string[] | null
          template_data: Json
          type: Database["public"]["Enums"]["content_type"]
          updated_at?: string
          usage_count?: number | null
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          is_public?: boolean | null
          min_plan_type?: Database["public"]["Enums"]["plan_type"]
          name?: string
          tags?: string[] | null
          template_data?: Json
          type?: Database["public"]["Enums"]["content_type"]
          updated_at?: string
          usage_count?: number | null
        }
        Relationships: []
      }
      content_versions: {
        Row: {
          change_summary: string | null
          content_data: Json
          content_id: string
          created_at: string
          created_by: string
          id: string
          version_number: number
        }
        Insert: {
          change_summary?: string | null
          content_data: Json
          content_id: string
          created_at?: string
          created_by: string
          id?: string
          version_number: number
        }
        Update: {
          change_summary?: string | null
          content_data?: Json
          content_id?: string
          created_at?: string
          created_by?: string
          id?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "content_versions_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "generated_content"
            referencedColumns: ["id"]
          },
        ]
      }
      email_delivery_logs: {
        Row: {
          created_at: string | null
          id: string
          invitation_id: string | null
          provider_response: Json | null
          recipient_email: string
          retry_count: number
          status: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          invitation_id?: string | null
          provider_response?: Json | null
          recipient_email: string
          retry_count?: number
          status: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          invitation_id?: string | null
          provider_response?: Json | null
          recipient_email?: string
          retry_count?: number
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_delivery_logs_invitation_id_fkey"
            columns: ["invitation_id"]
            isOneToOne: false
            referencedRelation: "team_invitations"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_usage_tracking: {
        Row: {
          feature_name: string
          id: string
          last_used_at: string | null
          period_start: string | null
          updated_at: string | null
          usage_count: number | null
          user_id: string
        }
        Insert: {
          feature_name: string
          id?: string
          last_used_at?: string | null
          period_start?: string | null
          updated_at?: string | null
          usage_count?: number | null
          user_id: string
        }
        Update: {
          feature_name?: string
          id?: string
          last_used_at?: string | null
          period_start?: string | null
          updated_at?: string | null
          usage_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      generated_content: {
        Row: {
          content: Json
          created_at: string
          id: string
          is_favorite: boolean | null
          metadata: Json | null
          prompt: string
          title: string
          type: Database["public"]["Enums"]["content_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          content: Json
          created_at?: string
          id?: string
          is_favorite?: boolean | null
          metadata?: Json | null
          prompt: string
          title: string
          type: Database["public"]["Enums"]["content_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          is_favorite?: boolean | null
          metadata?: Json | null
          prompt?: string
          title?: string
          type?: Database["public"]["Enums"]["content_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_content_type_fkey"
            columns: ["type"]
            isOneToOne: true
            referencedRelation: "generated_content"
            referencedColumns: ["type"]
          },
        ]
      }
      integration_tokens: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          provider: Database["public"]["Enums"]["integration_provider"]
          token_data: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          provider: Database["public"]["Enums"]["integration_provider"]
          token_data: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          provider?: Database["public"]["Enums"]["integration_provider"]
          token_data?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      plan_features: {
        Row: {
          created_at: string
          feature_limit: number | null
          feature_name: string
          id: string
          is_enabled: boolean | null
          plan_type: Database["public"]["Enums"]["plan_type"]
        }
        Insert: {
          created_at?: string
          feature_limit?: number | null
          feature_name: string
          id?: string
          is_enabled?: boolean | null
          plan_type: Database["public"]["Enums"]["plan_type"]
        }
        Update: {
          created_at?: string
          feature_limit?: number | null
          feature_name?: string
          id?: string
          is_enabled?: boolean | null
          plan_type?: Database["public"]["Enums"]["plan_type"]
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          company_name: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          onboarded: boolean | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          onboarded?: boolean | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          company_name?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          onboarded?: boolean | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
      team_activity_log: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          team_id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          team_id: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          team_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_activity_log_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_invitations: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          role: Database["public"]["Enums"]["team_role"]
          status: Database["public"]["Enums"]["invitation_status"]
          team_id: string
          token: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          role?: Database["public"]["Enums"]["team_role"]
          status?: Database["public"]["Enums"]["invitation_status"]
          team_id: string
          token: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          role?: Database["public"]["Enums"]["team_role"]
          status?: Database["public"]["Enums"]["invitation_status"]
          team_id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_invitations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          created_at: string
          id: string
          invited_by: string | null
          joined_at: string | null
          role: Database["public"]["Enums"]["team_role"]
          status: string
          team_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          role?: Database["public"]["Enums"]["team_role"]
          status?: string
          team_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          invited_by?: string | null
          joined_at?: string | null
          role?: Database["public"]["Enums"]["team_role"]
          status?: string
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_teams_profiles"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity_log: {
        Row: {
          action: string
          created_at: string
          id: string
          metadata: Json | null
          resource_id: string | null
          resource_type: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_credits: {
        Row: {
          created_at: string
          credits_used: number
          id: string
          monthly_limit: number
          reset_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credits_used?: number
          id?: string
          monthly_limit?: number
          reset_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credits_used?: number
          id?: string
          monthly_limit?: number
          reset_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user_credits_profiles"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_favorites: {
        Row: {
          created_at: string
          id: string
          item_id: string
          item_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          item_id: string
          item_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          item_id?: string
          item_type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_plans: {
        Row: {
          created_at: string
          credits: number
          current_period_end: string | null
          id: string
          plan_type: Database["public"]["Enums"]["plan_type"]
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          team_seats: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credits?: number
          current_period_end?: string | null
          id?: string
          plan_type?: Database["public"]["Enums"]["plan_type"]
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          team_seats?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credits?: number
          current_period_end?: string | null
          id?: string
          plan_type?: Database["public"]["Enums"]["plan_type"]
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          team_seats?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          default_content_settings: Json | null
          email_notifications: Json | null
          language: string | null
          theme: string | null
          timezone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          default_content_settings?: Json | null
          email_notifications?: Json | null
          language?: string | null
          theme?: string | null
          timezone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          default_content_settings?: Json | null
          email_notifications?: Json | null
          language?: string | null
          theme?: string | null
          timezone?: string | null
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
      accept_team_invitation: {
        Args: { invitation_token: string }
        Returns: Json
      }
      audit_sensitive_operation: {
        Args: {
          p_action: string
          p_table_name: string
          p_record_id?: string
          p_old_values?: Json
          p_new_values?: Json
        }
        Returns: undefined
      }
      can_access_feature: {
        Args: { feature_name: string; check_user_id?: string }
        Returns: boolean
      }
      can_access_template: {
        Args: {
          template_plan_type: Database["public"]["Enums"]["plan_type"]
          user_id?: string
        }
        Returns: boolean
      }
      check_rate_limit: {
        Args: {
          identifier: string
          max_attempts?: number
          time_window_minutes?: number
        }
        Returns: boolean
      }
      cleanup_expired_invitations: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_team_with_access_control: {
        Args: { p_team_name: string; p_description?: string }
        Returns: Json
      }
      enhanced_password_validation: {
        Args: { password: string }
        Returns: boolean
      }
      generate_invitation_token: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_feature_usage_with_limits: {
        Args: { p_user_id: string; p_feature_name: string }
        Returns: {
          usage_count: number
          feature_limit: number
          remaining: number
          period_start: string
        }[]
      }
      get_team_member_count: {
        Args: { team_uuid: string }
        Returns: number
      }
      get_user_plan_info: {
        Args: { check_user_id?: string }
        Returns: {
          plan_type: string
          credits: number
          team_seats: number
          can_manage_teams: boolean
        }[]
      }
      get_user_recommendations: {
        Args: { limit_count?: number }
        Returns: {
          content_id: string
          title: string
          type: Database["public"]["Enums"]["content_type"]
          score: number
        }[]
      }
      get_user_team_seats: {
        Args: { user_uuid?: string }
        Returns: number
      }
      has_team_plan: {
        Args: { user_uuid?: string }
        Returns: boolean
      }
      is_admin_or_super: {
        Args: { user_id?: string }
        Returns: boolean
      }
      is_admin_user: {
        Args: { user_id?: string }
        Returns: boolean
      }
      is_owner: {
        Args: { team_uuid: string; uid?: string }
        Returns: boolean
      }
      is_super_admin: {
        Args: { user_id?: string }
        Returns: boolean
      }
      is_super_admin_user: {
        Args: { user_id?: string }
        Returns: boolean
      }
      is_team_admin: {
        Args: { team_uuid: string; uid?: string }
        Returns: boolean
      }
      is_team_member_direct: {
        Args: { team_uuid: string; user_uuid?: string }
        Returns: boolean
      }
      is_team_owner_direct: {
        Args: { team_uuid: string; user_uuid?: string }
        Returns: boolean
      }
      log_security_event: {
        Args: { event_type: string; event_data?: Json; user_id_param?: string }
        Returns: undefined
      }
      log_team_activity: {
        Args: { p_team_id: string; p_action: string; p_details?: Json }
        Returns: undefined
      }
      log_user_activity: {
        Args: {
          p_action: string
          p_resource_type?: string
          p_resource_id?: string
          p_metadata?: Json
        }
        Returns: undefined
      }
      reset_monthly_credits: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      reset_monthly_feature_usage: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      test_team_members_rls_fix: {
        Args: Record<PropertyKey, never>
        Returns: {
          test_name: string
          status: string
          details: string
        }[]
      }
      test_team_policies: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      validate_admin_session: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      collaboration_permission: "view" | "edit" | "admin"
      collaboration_status: "pending" | "accepted" | "declined"
      content_type:
        | "email_sequence"
        | "ad_copy"
        | "landing_page"
        | "social_post"
        | "blog_post"
        | "funnel"
        | "strategy_brief"
      integration_provider:
        | "mailchimp"
        | "convertkit"
        | "airtable"
        | "zapier"
        | "mailerlite"
      invitation_status: "pending" | "accepted" | "expired" | "cancelled"
      plan_type: "starter" | "pro" | "growth" | "elite"
      team_role: "owner" | "admin" | "editor" | "viewer"
      user_role: "user" | "admin" | "super_admin"
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
    Enums: {
      collaboration_permission: ["view", "edit", "admin"],
      collaboration_status: ["pending", "accepted", "declined"],
      content_type: [
        "email_sequence",
        "ad_copy",
        "landing_page",
        "social_post",
        "blog_post",
        "funnel",
        "strategy_brief",
      ],
      integration_provider: [
        "mailchimp",
        "convertkit",
        "airtable",
        "zapier",
        "mailerlite",
      ],
      invitation_status: ["pending", "accepted", "expired", "cancelled"],
      plan_type: ["starter", "pro", "growth", "elite"],
      team_role: ["owner", "admin", "editor", "viewer"],
      user_role: ["user", "admin", "super_admin"],
    },
  },
} as const
