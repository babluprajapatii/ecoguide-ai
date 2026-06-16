/**
 * Auto-generated Supabase database types.
 *
 * To regenerate, run:
 * ```bash
 * npx supabase gen types typescript --project-id <project-id> > src/lib/supabase/database.types.ts
 * ```
 *
 * This placeholder provides the minimum structure needed for type-safe
 * Supabase client instantiation. Replace with generated types once
 * the Supabase project schema is finalized.
 */
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          avatar_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      assessments: {
        Row: {
          id: string;
          user_id: string;
          transport_input: Record<string, unknown>;
          diet_input: Record<string, unknown>;
          energy_input: Record<string, unknown>;
          shopping_input: Record<string, unknown>;
          transport_kg: number;
          diet_kg: number;
          energy_kg: number;
          shopping_kg: number;
          total_kg: number;
          compared_to_average: number;
          percentile: number;
          transport_score: number;
          energy_score: number;
          diet_score: number;
          shopping_score: number;
          travel_score: number;
          total_score: number;
          grade: string;
          is_complete: boolean;
          inputs: Record<string, unknown>;
          draft_version: number;
          last_saved_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          transport_input?: Record<string, unknown>;
          diet_input?: Record<string, unknown>;
          energy_input?: Record<string, unknown>;
          shopping_input?: Record<string, unknown>;
          transport_kg?: number;
          diet_kg?: number;
          energy_kg?: number;
          shopping_kg?: number;
          total_kg?: number;
          compared_to_average?: number;
          percentile?: number;
          transport_score?: number;
          energy_score?: number;
          diet_score?: number;
          shopping_score?: number;
          travel_score?: number;
          total_score?: number;
          grade?: string;
          is_complete?: boolean;
          inputs?: Record<string, unknown>;
          draft_version?: number;
          last_saved_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          transport_input?: Record<string, unknown>;
          diet_input?: Record<string, unknown>;
          energy_input?: Record<string, unknown>;
          shopping_input?: Record<string, unknown>;
          transport_kg?: number;
          diet_kg?: number;
          energy_kg?: number;
          shopping_kg?: number;
          total_kg?: number;
          compared_to_average?: number;
          percentile?: number;
          transport_score?: number;
          energy_score?: number;
          diet_score?: number;
          shopping_score?: number;
          travel_score?: number;
          total_score?: number;
          grade?: string;
          is_complete?: boolean;
          inputs?: Record<string, unknown>;
          draft_version?: number;
          last_saved_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'assessments_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      user_points: {
        Row: {
          id: string;
          user_id: string;
          action: string;
          points: number;
          awarded_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          action: string;
          points: number;
          awarded_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          action?: string;
          points?: number;
          awarded_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_points_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      user_badges: {
        Row: {
          id: string;
          user_id: string;
          badge_slug: string;
          earned_at: string;
          points_awarded: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          badge_slug: string;
          earned_at?: string;
          points_awarded: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          badge_slug?: string;
          earned_at?: string;
          points_awarded?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'user_badges_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
