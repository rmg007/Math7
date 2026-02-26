export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.1';
  };
  public: {
    Tables: {
      ai_token_usage: {
        Row: {
          app_id: string;
          created_at: string | null;
          id: string;
          operation: string;
          tokens_used: number;
          user_id: string | null;
        };
        Insert: {
          app_id: string;
          created_at?: string | null;
          id?: string;
          operation: string;
          tokens_used: number;
          user_id?: string | null;
        };
        Update: {
          app_id?: string;
          created_at?: string | null;
          id?: string;
          operation?: string;
          tokens_used?: number;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'ai_token_usage_app_id_fkey';
            columns: ['app_id'];
            isOneToOne: false;
            referencedRelation: 'apps';
            referencedColumns: ['app_id'];
          },
          {
            foreignKeyName: 'ai_token_usage_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      app_landing_pages: {
        Row: {
          app_id: string;
          created_at: string | null;
          cta_text: string | null;
          features: Json | null;
          hero_headline: string | null;
          hero_subheadline: string | null;
          meta_description: string | null;
          meta_title: string | null;
          sections: Json | null;
          updated_at: string | null;
        };
        Insert: {
          app_id: string;
          created_at?: string | null;
          cta_text?: string | null;
          features?: Json | null;
          hero_headline?: string | null;
          hero_subheadline?: string | null;
          meta_description?: string | null;
          meta_title?: string | null;
          sections?: Json | null;
          updated_at?: string | null;
        };
        Update: {
          app_id?: string;
          created_at?: string | null;
          cta_text?: string | null;
          features?: Json | null;
          hero_headline?: string | null;
          hero_subheadline?: string | null;
          meta_description?: string | null;
          meta_title?: string | null;
          sections?: Json | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'app_landing_pages_app_id_fkey';
            columns: ['app_id'];
            isOneToOne: true;
            referencedRelation: 'apps';
            referencedColumns: ['app_id'];
          },
        ];
      };
      apps: {
        Row: {
          ai_token_limit: number | null;
          app_id: string;
          branding: Json | null;
          created_at: string | null;
          description: string | null;
          display_name: string;
          grade_level: string;
          grade_number: number;
          is_active: boolean | null;
          subdomain: string;
          subject_id: string | null;
          updated_at: string | null;
        };
        Insert: {
          ai_token_limit?: number | null;
          app_id?: string;
          branding?: Json | null;
          created_at?: string | null;
          description?: string | null;
          display_name: string;
          grade_level: string;
          grade_number?: number;
          is_active?: boolean | null;
          subdomain: string;
          subject_id?: string | null;
          updated_at?: string | null;
        };
        Update: {
          ai_token_limit?: number | null;
          app_id?: string;
          branding?: Json | null;
          created_at?: string | null;
          description?: string | null;
          display_name?: string;
          grade_level?: string;
          grade_number?: number;
          is_active?: boolean | null;
          subdomain?: string;
          subject_id?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'apps_subject_id_fkey';
            columns: ['subject_id'];
            isOneToOne: false;
            referencedRelation: 'subjects';
            referencedColumns: ['subject_id'];
          },
        ];
      };
      assignments: {
        Row: {
          completion_trigger: Json | null;
          created_at: string | null;
          due_date: string | null;
          group_id: string | null;
          id: string;
          scope: Database['public']['Enums']['assignment_scope'] | null;
          status: Database['public']['Enums']['assignment_status'] | null;
          student_id: string | null;
          target_id: string;
          type: Database['public']['Enums']['assignment_type'];
          updated_at: string | null;
        };
        Insert: {
          completion_trigger?: Json | null;
          created_at?: string | null;
          due_date?: string | null;
          group_id?: string | null;
          id?: string;
          scope?: Database['public']['Enums']['assignment_scope'] | null;
          status?: Database['public']['Enums']['assignment_status'] | null;
          student_id?: string | null;
          target_id: string;
          type: Database['public']['Enums']['assignment_type'];
          updated_at?: string | null;
        };
        Update: {
          completion_trigger?: Json | null;
          created_at?: string | null;
          due_date?: string | null;
          group_id?: string | null;
          id?: string;
          scope?: Database['public']['Enums']['assignment_scope'] | null;
          status?: Database['public']['Enums']['assignment_status'] | null;
          student_id?: string | null;
          target_id?: string;
          type?: Database['public']['Enums']['assignment_type'];
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'assignments_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'groups';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'assignments_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      attempts: {
        Row: {
          answered: Json;
          created_at: string;
          id: string;
          is_correct: boolean;
          points_earned: number;
          question_id: string;
          time_spent_ms: number | null;
          user_id: string;
        };
        Insert: {
          answered: Json;
          created_at?: string;
          id?: string;
          is_correct: boolean;
          points_earned?: number;
          question_id: string;
          time_spent_ms?: number | null;
          user_id: string;
        };
        Update: {
          answered?: Json;
          created_at?: string;
          id?: string;
          is_correct?: boolean;
          points_earned?: number;
          question_id?: string;
          time_spent_ms?: number | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'attempts_question_id_fkey';
            columns: ['question_id'];
            isOneToOne: false;
            referencedRelation: 'questions';
            referencedColumns: ['question_id'];
          },
          {
            foreignKeyName: 'attempts_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      curriculum_meta: {
        Row: {
          app_id: string;
          created_at: string;
          last_published_at: string | null;
          updated_at: string;
          version: number;
        };
        Insert: {
          app_id: string;
          created_at?: string;
          last_published_at?: string | null;
          updated_at?: string;
          version?: number;
        };
        Update: {
          app_id?: string;
          created_at?: string;
          last_published_at?: string | null;
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'curriculum_meta_app_id_fkey';
            columns: ['app_id'];
            isOneToOne: true;
            referencedRelation: 'apps';
            referencedColumns: ['app_id'];
          },
        ];
      };
      curriculum_snapshots: {
        Row: {
          app_id: string;
          content: Json;
          created_at: string;
          domains_count: number;
          id: string;
          published_at: string;
          published_by: string | null;
          questions_count: number;
          skills_count: number;
          updated_at: string;
          version: number;
        };
        Insert: {
          app_id: string;
          content?: Json;
          created_at?: string;
          domains_count?: number;
          id?: string;
          published_at?: string;
          published_by?: string | null;
          questions_count?: number;
          skills_count?: number;
          updated_at?: string;
          version: number;
        };
        Update: {
          app_id?: string;
          content?: Json;
          created_at?: string;
          domains_count?: number;
          id?: string;
          published_at?: string;
          published_by?: string | null;
          questions_count?: number;
          skills_count?: number;
          updated_at?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'curriculum_snapshots_app_id_fkey';
            columns: ['app_id'];
            isOneToOne: false;
            referencedRelation: 'apps';
            referencedColumns: ['app_id'];
          },
          {
            foreignKeyName: 'curriculum_snapshots_published_by_fkey';
            columns: ['published_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      domains: {
        Row: {
          app_id: string;
          color: string | null;
          created_at: string;
          deleted_at: string | null;
          description: string | null;
          domain_id: string;
          icon: string | null;
          slug: string;
          sort_order: number | null;
          status: Database['public']['Enums']['curriculum_status'] | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          app_id: string;
          color?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          description?: string | null;
          domain_id?: string;
          icon?: string | null;
          slug: string;
          sort_order?: number | null;
          status?: Database['public']['Enums']['curriculum_status'] | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          app_id?: string;
          color?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          description?: string | null;
          domain_id?: string;
          icon?: string | null;
          slug?: string;
          sort_order?: number | null;
          status?: Database['public']['Enums']['curriculum_status'] | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'domains_app_id_fkey';
            columns: ['app_id'];
            isOneToOne: false;
            referencedRelation: 'apps';
            referencedColumns: ['app_id'];
          },
        ];
      };
      error_logs: {
        Row: {
          alert_sent: boolean | null;
          app_id: string | null;
          app_version: string | null;
          created_at: string;
          error_message: string;
          error_type: string;
          extra_context: Json | null;
          id: string;
          platform: string;
          stack_trace: string | null;
          status: string | null;
          url: string | null;
          user_agent: string | null;
          user_id: string | null;
        };
        Insert: {
          alert_sent?: boolean | null;
          app_id?: string | null;
          app_version?: string | null;
          created_at?: string;
          error_message: string;
          error_type: string;
          extra_context?: Json | null;
          id?: string;
          platform: string;
          stack_trace?: string | null;
          status?: string | null;
          url?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Update: {
          alert_sent?: boolean | null;
          app_id?: string | null;
          app_version?: string | null;
          created_at?: string;
          error_message?: string;
          error_type?: string;
          extra_context?: Json | null;
          id?: string;
          platform?: string;
          stack_trace?: string | null;
          status?: string | null;
          url?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'error_logs_app_id_fkey';
            columns: ['app_id'];
            isOneToOne: false;
            referencedRelation: 'apps';
            referencedColumns: ['app_id'];
          },
        ];
      };
      group_members: {
        Row: {
          group_id: string;
          joined_at: string | null;
          nickname: string | null;
          role: Database['public']['Enums']['user_role'] | null;
          student_id: string;
        };
        Insert: {
          group_id: string;
          joined_at?: string | null;
          nickname?: string | null;
          role?: Database['public']['Enums']['user_role'] | null;
          student_id: string;
        };
        Update: {
          group_id?: string;
          joined_at?: string | null;
          nickname?: string | null;
          role?: Database['public']['Enums']['user_role'] | null;
          student_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'group_members_group_id_fkey';
            columns: ['group_id'];
            isOneToOne: false;
            referencedRelation: 'groups';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'group_members_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      groups: {
        Row: {
          allow_anonymous_join: boolean | null;
          app_id: string;
          created_at: string | null;
          deleted_at: string | null;
          id: string;
          join_code: string;
          name: string;
          owner_id: string;
          requires_approval: boolean | null;
          settings: Json | null;
          type: Database['public']['Enums']['group_type'];
          updated_at: string | null;
        };
        Insert: {
          allow_anonymous_join?: boolean | null;
          app_id: string;
          created_at?: string | null;
          deleted_at?: string | null;
          id?: string;
          join_code: string;
          name: string;
          owner_id: string;
          requires_approval?: boolean | null;
          settings?: Json | null;
          type?: Database['public']['Enums']['group_type'];
          updated_at?: string | null;
        };
        Update: {
          allow_anonymous_join?: boolean | null;
          app_id?: string;
          created_at?: string | null;
          deleted_at?: string | null;
          id?: string;
          join_code?: string;
          name?: string;
          owner_id?: string;
          requires_approval?: boolean | null;
          settings?: Json | null;
          type?: Database['public']['Enums']['group_type'];
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'groups_app_id_fkey';
            columns: ['app_id'];
            isOneToOne: false;
            referencedRelation: 'apps';
            referencedColumns: ['app_id'];
          },
          {
            foreignKeyName: 'groups_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      known_issues: {
        Row: {
          app_id: string | null;
          created_at: string;
          description: string | null;
          id: string;
          resolution: string | null;
          root_cause: string | null;
          severity: string | null;
          status: string | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          app_id?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          resolution?: string | null;
          root_cause?: string | null;
          severity?: string | null;
          status?: string | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          app_id?: string | null;
          created_at?: string;
          description?: string | null;
          id?: string;
          resolution?: string | null;
          root_cause?: string | null;
          severity?: string | null;
          status?: string | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'known_issues_app_id_fkey';
            columns: ['app_id'];
            isOneToOne: false;
            referencedRelation: 'apps';
            referencedColumns: ['app_id'];
          },
        ];
      };
      profiles: {
        Row: {
          app_id: string | null;
          avatar_url: string | null;
          created_at: string;
          deleted_at: string | null;
          email: string;
          full_name: string | null;
          id: string;
          role: Database['public']['Enums']['user_role'];
          updated_at: string;
        };
        Insert: {
          app_id?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          email: string;
          full_name?: string | null;
          id: string;
          role?: Database['public']['Enums']['user_role'];
          updated_at?: string;
        };
        Update: {
          app_id?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          email?: string;
          full_name?: string | null;
          id?: string;
          role?: Database['public']['Enums']['user_role'];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'profiles_app_id_fkey';
            columns: ['app_id'];
            isOneToOne: false;
            referencedRelation: 'apps';
            referencedColumns: ['app_id'];
          },
        ];
      };
      questions: {
        Row: {
          app_id: string;
          content: string;
          content_hash: string | null;
          created_at: string;
          deleted_at: string | null;
          explanation: string | null;
          options: Json | null;
          points: number | null;
          question_id: string;
          skill_id: string;
          solution: string;
          sort_order: number | null;
          status: Database['public']['Enums']['curriculum_status'] | null;
          type: Database['public']['Enums']['question_type'];
          updated_at: string;
        };
        Insert: {
          app_id: string;
          content: string;
          content_hash?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          explanation?: string | null;
          options?: Json | null;
          points?: number | null;
          question_id?: string;
          skill_id: string;
          solution: string;
          sort_order?: number | null;
          status?: Database['public']['Enums']['curriculum_status'] | null;
          type: Database['public']['Enums']['question_type'];
          updated_at?: string;
        };
        Update: {
          app_id?: string;
          content?: string;
          content_hash?: string | null;
          created_at?: string;
          deleted_at?: string | null;
          explanation?: string | null;
          options?: Json | null;
          points?: number | null;
          question_id?: string;
          skill_id?: string;
          solution?: string;
          sort_order?: number | null;
          status?: Database['public']['Enums']['curriculum_status'] | null;
          type?: Database['public']['Enums']['question_type'];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'questions_app_id_fkey';
            columns: ['app_id'];
            isOneToOne: false;
            referencedRelation: 'apps';
            referencedColumns: ['app_id'];
          },
          {
            foreignKeyName: 'questions_skill_id_fkey';
            columns: ['skill_id'];
            isOneToOne: false;
            referencedRelation: 'skills';
            referencedColumns: ['skill_id'];
          },
        ];
      };
      security_logs: {
        Row: {
          app_id: string | null;
          created_at: string;
          device_info: Json | null;
          event_type: string;
          id: string;
          ip_address: string | null;
          location: string | null;
          metadata: Json | null;
          risk_score: number | null;
          severity: string | null;
          user_agent: string | null;
          user_id: string | null;
        };
        Insert: {
          app_id?: string | null;
          created_at?: string;
          device_info?: Json | null;
          event_type: string;
          id?: string;
          ip_address?: string | null;
          location?: string | null;
          metadata?: Json | null;
          risk_score?: number | null;
          severity?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Update: {
          app_id?: string | null;
          created_at?: string;
          device_info?: Json | null;
          event_type?: string;
          id?: string;
          ip_address?: string | null;
          location?: string | null;
          metadata?: Json | null;
          risk_score?: number | null;
          severity?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'security_logs_app_id_fkey';
            columns: ['app_id'];
            isOneToOne: false;
            referencedRelation: 'apps';
            referencedColumns: ['app_id'];
          },
        ];
      };
      skill_progress: {
        Row: {
          correct_attempts: number | null;
          created_at: string;
          current_streak: number | null;
          id: string;
          last_attempt_at: string | null;
          longest_streak: number | null;
          mastery_level: number | null;
          skill_id: string;
          total_attempts: number | null;
          total_points: number | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          correct_attempts?: number | null;
          created_at?: string;
          current_streak?: number | null;
          id?: string;
          last_attempt_at?: string | null;
          longest_streak?: number | null;
          mastery_level?: number | null;
          skill_id: string;
          total_attempts?: number | null;
          total_points?: number | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          correct_attempts?: number | null;
          created_at?: string;
          current_streak?: number | null;
          id?: string;
          last_attempt_at?: string | null;
          longest_streak?: number | null;
          mastery_level?: number | null;
          skill_id?: string;
          total_attempts?: number | null;
          total_points?: number | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'skill_progress_skill_id_fkey';
            columns: ['skill_id'];
            isOneToOne: false;
            referencedRelation: 'skills';
            referencedColumns: ['skill_id'];
          },
          {
            foreignKeyName: 'skill_progress_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      skills: {
        Row: {
          app_id: string;
          created_at: string;
          deleted_at: string | null;
          description: string | null;
          difficulty_level: number | null;
          domain_id: string;
          skill_id: string;
          slug: string;
          sort_order: number | null;
          status: Database['public']['Enums']['curriculum_status'] | null;
          title: string;
          updated_at: string;
        };
        Insert: {
          app_id: string;
          created_at?: string;
          deleted_at?: string | null;
          description?: string | null;
          difficulty_level?: number | null;
          domain_id: string;
          skill_id?: string;
          slug: string;
          sort_order?: number | null;
          status?: Database['public']['Enums']['curriculum_status'] | null;
          title: string;
          updated_at?: string;
        };
        Update: {
          app_id?: string;
          created_at?: string;
          deleted_at?: string | null;
          description?: string | null;
          difficulty_level?: number | null;
          domain_id?: string;
          skill_id?: string;
          slug?: string;
          sort_order?: number | null;
          status?: Database['public']['Enums']['curriculum_status'] | null;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'skills_app_id_fkey';
            columns: ['app_id'];
            isOneToOne: false;
            referencedRelation: 'apps';
            referencedColumns: ['app_id'];
          },
          {
            foreignKeyName: 'skills_domain_id_fkey';
            columns: ['domain_id'];
            isOneToOne: false;
            referencedRelation: 'domains';
            referencedColumns: ['domain_id'];
          },
        ];
      };
      subjects: {
        Row: {
          color_hex: string | null;
          created_at: string | null;
          description: string | null;
          display_order: number | null;
          icon_name: string | null;
          icon_url: string | null;
          slug: string;
          status: Database['public']['Enums']['curriculum_status'] | null;
          subject_id: string;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          color_hex?: string | null;
          created_at?: string | null;
          description?: string | null;
          display_order?: number | null;
          icon_name?: string | null;
          icon_url?: string | null;
          slug: string;
          status?: Database['public']['Enums']['curriculum_status'] | null;
          subject_id?: string;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          color_hex?: string | null;
          created_at?: string | null;
          description?: string | null;
          display_order?: number | null;
          icon_name?: string | null;
          icon_url?: string | null;
          slug?: string;
          status?: Database['public']['Enums']['curriculum_status'] | null;
          subject_id?: string;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      cleanup_security_logs: {
        Args: { retention_days?: number };
        Returns: number;
      };
      current_app_id: { Args: never; Returns: string };
      custom_access_token_hook: { Args: { event: Json }; Returns: Json };
      deactivate_invitation_code: {
        Args: { p_code_id: string };
        Returns: undefined;
      };
      deactivate_own_account: { Args: never; Returns: undefined };
      delete_own_account: { Args: never; Returns: undefined };
      generate_invitation_code: {
        Args: { p_expires_days?: number; p_max_uses?: number };
        Returns: string;
      };
      import_questions_bulk: {
        Args: { questions_data: Json };
        Returns: {
          inserted_count: number;
          success: boolean;
        }[];
      };
      jwt_is_admin: { Args: never; Returns: boolean };
      jwt_is_mentor: { Args: never; Returns: boolean };
      jwt_is_super_admin: { Args: never; Returns: boolean };
      jwt_is_tenant_admin: { Args: never; Returns: boolean };
      log_error: {
        Args: {
          p_app_id?: string;
          p_app_version?: string;
          p_error_message: string;
          p_error_type: string;
          p_extra_context?: Json;
          p_platform: string;
          p_stack_trace?: string;
          p_url?: string;
          p_user_agent?: string;
        };
        Returns: string;
      };
      log_security_event: {
        Args: {
          p_app_id?: string;
          p_event_type: string;
          p_location?: string;
          p_metadata?: Json;
          p_severity: string;
        };
        Returns: string;
      };
      promote_error_to_issue: {
        Args: {
          p_error_id: string;
          p_resolution?: string;
          p_root_cause?: string;
          p_title: string;
        };
        Returns: string;
      };
      prune_old_error_logs: { Args: never; Returns: number };
      publish_curriculum: { Args: { p_app_id?: string }; Returns: Json };
      pull_changes: {
        Args: { last_sync_time?: string; table_name: string };
        Returns: Json;
      };
      rollback_publish: {
        Args: { p_app_id: string; p_target_version: number };
        Returns: Json;
      };
      validate_and_use_invitation_code: {
        Args: { p_code: string };
        Returns: boolean;
      };
      validate_invitation_code: { Args: { p_code: string }; Returns: boolean };
    };
    Enums: {
      assignment_scope: 'mandatory' | 'suggested';
      assignment_status: 'pending' | 'completed' | 'late';
      assignment_type: 'skill_mastery' | 'time_goal' | 'custom';
      curriculum_status: 'draft' | 'published' | 'live';
      group_type: 'class' | 'family';
      question_type: 'multiple_choice' | 'mcq_multi' | 'text_input' | 'boolean' | 'reorder_steps';
      user_role: 'super_admin' | 'admin' | 'student' | 'mentor';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] & DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      assignment_scope: ['mandatory', 'suggested'],
      assignment_status: ['pending', 'completed', 'late'],
      assignment_type: ['skill_mastery', 'time_goal', 'custom'],
      curriculum_status: ['draft', 'published', 'live'],
      group_type: ['class', 'family'],
      question_type: ['multiple_choice', 'mcq_multi', 'text_input', 'boolean', 'reorder_steps'],
      user_role: ['super_admin', 'admin', 'student', 'mentor'],
    },
  },
} as const;
