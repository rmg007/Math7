export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          role: 'admin' | 'student'
          email: string | null
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id: string
          role?: 'admin' | 'student'
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          role?: 'admin' | 'student'
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      domains: {
        Row: {
          id: string
          slug: string
          title: string
          description: string | null
          sort_order: number
          is_published: boolean
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          slug: string
          title: string
          description?: string | null
          sort_order?: number
          is_published?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          slug?: string
          title?: string
          description?: string | null
          sort_order?: number
          is_published?: boolean
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      // Minimal stubs for others to allow compilation if strictly needed, 
      // but assuming usage of profiles first for auth.
      skills: {
        Row: {
          id: string
          domain_id: string
          slug: string
          title: string
          description: string | null
          difficulty_level: number
          sort_order: number
          is_published: boolean
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
            id?: string
            domain_id: string
            slug: string
            title: string
            description?: string | null
            difficulty_level?: number
            sort_order?: number
            is_published?: boolean
            created_at?: string
            updated_at?: string
            deleted_at?: string | null
        }
        Update: {
            id?: string
            domain_id?: string
            slug?: string
            title?: string
            description?: string | null
            difficulty_level?: number
            sort_order?: number
            is_published?: boolean
            created_at?: string
            updated_at?: string
            deleted_at?: string | null
        }
      }
      questions: {
          Row: {
            id: string
            skill_id: string
            type: Database['public']['Enums']['question_type']
            content: string
            options: Json
            solution: Json
            explanation: string | null
            points: number
            is_published: boolean
            created_at: string
            updated_at: string
            deleted_at: string | null
          }
          Insert: {
            id?: string
            skill_id: string
            type?: Database['public']['Enums']['question_type']
            content: string
            options?: Json
            solution: Json
            explanation?: string | null
            points?: number
            is_published?: boolean
            created_at?: string
            updated_at?: string
            deleted_at?: string | null
          }
          Update: {
            id?: string
            skill_id?: string
            type?: Database['public']['Enums']['question_type']
            content?: string
            options?: Json
            solution?: Json
            explanation?: string | null
            points?: number
            is_published?: boolean
            created_at?: string
            updated_at?: string
            deleted_at?: string | null
          }
      }
    }
    Views: {
      [_: string]: {
        Row: {
          [key: string]: unknown
        }
      }
    }
    Functions: {
      [_: string]: {
        Args: {
          [key: string]: unknown
        }
        Returns: unknown
      }
    }
    Enums: {
      question_type: 'multiple_choice' | 'mcq_multi' | 'text_input' | 'boolean' | 'reorder_steps'
      user_role: 'admin' | 'student'
    }
  }
}
