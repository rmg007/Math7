// This file is a placeholder for Supabase types
// Generated from database schema analysis
// TODO: Replace with actual Supabase CLI generated types

export interface Database {
  public: {
    Tables: {
      apps: {
        Row: {
          id: string
          display_name: string
          description: string | null
          created_at: string
          updated_at: string
          created_by: string
          status: string
          config: Json | null
        }
        Insert: {
          id?: string
          display_name: string
          description?: string | null
          created_at?: string
          updated_at?: string
          created_by: string
          status?: string
          config?: Json | null
        }
        Update: {
          id?: string
          display_name?: string
          description?: string | null
          created_at?: string
          updated_at?: string
          created_by?: string
          status?: string
          config?: Json | null
        }
      }
      ai_generation_sessions: {
        Row: {
          id: string
          app_id: string
          session_type: string
          questions_generated: number
          token_count: number
          status: string
          created_at: string
          created_by: string
        }
        Insert: {
          id?: string
          app_id: string
          session_type: string
          questions_generated?: number
          token_count?: number
          status?: string
          created_at?: string
          created_by: string
        }
        Update: {
          id?: string
          app_id?: string
          session_type?: string
          questions_generated?: number
          token_count?: number
          status?: string
          created_at?: string
          created_by?: string
        }
      }
      // Add other tables as needed
    }
  }
}

