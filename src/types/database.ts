export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      session_history: {
        Row: {
          created_at: string;
          elapsed_at_event: number | null;
          event_time: string;
          event_type: string;
          id: string;
          metadata: Json | null;
          session_id: string;
        };
        Insert: {
          created_at?: string;
          elapsed_at_event?: number | null;
          event_time?: string;
          event_type: string;
          id?: string;
          metadata?: Json | null;
          session_id: string;
        };
        Update: {
          created_at?: string;
          elapsed_at_event?: number | null;
          event_time?: string;
          event_type?: string;
          id?: string;
          metadata?: Json | null;
          session_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'session_history_session_id_fkey';
            columns: ['session_id'];
            isOneToOne: false;
            referencedRelation: 'sessions';
            referencedColumns: ['id'];
          }
        ];
      };
      sessions: {
        Row: {
          created_at: string;
          device_id: string;
          duration_seconds: number | null;
          end_time: string | null;
          id: string;
          start_time: string;
          status: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          device_id: string;
          duration_seconds?: number | null;
          end_time?: string | null;
          id?: string;
          start_time?: string;
          status?: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          device_id?: string;
          duration_seconds?: number | null;
          end_time?: string | null;
          id?: string;
          start_time?: string;
          status?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// Helper types for easier usage
export type Session = Database['public']['Tables']['sessions']['Row'];
export type SessionInsert = Database['public']['Tables']['sessions']['Insert'];
export type SessionUpdate = Database['public']['Tables']['sessions']['Update'];

export type SessionHistory = Database['public']['Tables']['session_history']['Row'];
export type SessionHistoryInsert = Database['public']['Tables']['session_history']['Insert'];

export type SessionStatus = 'active' | 'paused' | 'completed' | 'cancelled';
export type EventType =
  | 'started'
  | 'paused'
  | 'resumed'
  | 'stopped'
  | 'activity_started'
  | 'activity_updated'
  | 'activity_ended';
