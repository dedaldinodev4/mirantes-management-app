// Auto-generated type skeleton — run `supabase gen types typescript` to regenerate
// from your project after applying the SQL migration.

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          display_name: string
          photo_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          display_name: string
          photo_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          email?: string
          display_name?: string
          photo_url?: string | null
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          name: string
          description: string
          color: string
          cover_url: string | null
          owner_id: string
          member_ids: string[]
          due_date: string | null
          archived: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string
          color: string
          cover_url?: string | null
          owner_id: string
          member_ids?: string[]
          due_date?: string | null
          archived?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          name?: string
          description?: string
          color?: string
          cover_url?: string | null
          member_ids?: string[]
          due_date?: string | null
          archived?: boolean
          updated_at?: string
        }
      }
      tasks: {
        Row: {
          id: string
          project_id: string
          title: string
          description: string
          status: string
          priority: string
          label: string
          assignee_id: string | null
          reporter_id: string
          due_date: string | null
          completed_at: string | null
          order: number
          attachments: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          title: string
          description?: string
          status?: string
          priority?: string
          label?: string
          assignee_id?: string | null
          reporter_id: string
          due_date?: string | null
          completed_at?: string | null
          order?: number
          attachments?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          description?: string
          status?: string
          priority?: string
          label?: string
          assignee_id?: string | null
          due_date?: string | null
          completed_at?: string | null
          order?: number
          updated_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          task_id: string
          project_id: string
          author_id: string
          content: string
          edited: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          task_id: string
          project_id: string
          author_id: string
          content: string
          edited?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          content?: string
          edited?: boolean
          updated_at?: string
        }
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          type: string
          title: string
          body: string
          read: boolean
          task_id: string | null
          project_id: string | null
          actor_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          type: string
          title: string
          body: string
          read?: boolean
          task_id?: string | null
          project_id?: string | null
          actor_id?: string | null
          created_at?: string
        }
        Update: {
          read?: boolean
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
