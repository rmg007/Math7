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
      [key: string]: {
        Row: Record<string, unknown>
        Insert: Record<string, unknown>
        Update: Record<string, unknown>
        Relationships: unknown[]
      }
    }
    Views: {
      [key: string]: {
        Row: Record<string, unknown>
        Relationships: unknown[]
      }
    }
    Functions: {
      consume_tenant_tokens: {
        Args: { p_app_id: string; p_token_count: number }
        Returns: void
      }
      validate_content: { // Added based on context
        Args: Record<string, unknown>
        Returns: { overall_score: number; status: string }
      }
    }
    Enums: {
      [key: string]: unknown
    }
  }
}
