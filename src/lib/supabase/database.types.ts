/* eslint-disable */
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
      badges: {
        Row: {
          id: string;
          slug: string;
          name: string;
          description: string;
          icon: string;
          xp_reward: number;
          unlock_condition: string;
          category: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          slug: string;
          name: string;
          description: string;
          icon: string;
          xp_reward: number;
          unlock_condition: string;
          category: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          slug?: string;
          name?: string;
          description?: string;
          icon?: string;
          xp_reward?: number;
          unlock_condition?: string;
          category?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      user_points: {
        Row: {
          id: string;
          user_id: string;
          total_points: number;
          lifetime_points: number;
          current_level: number;
          current_streak: number;
          longest_streak: number;
          last_activity_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          total_points?: number;
          lifetime_points?: number;
          current_level?: number;
          current_streak?: number;
          longest_streak?: number;
          last_activity_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          total_points?: number;
          lifetime_points?: number;
          current_level?: number;
          current_streak?: number;
          longest_streak?: number;
          last_activity_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_points_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      user_badges: {
        Row: {
          id: string;
          user_id: string;
          badge_id: string;
          earned_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          badge_id: string;
          earned_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          badge_id?: string;
          earned_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'user_badges_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_badges_badge_id_fkey';
            columns: ['badge_id'];
            referencedRelation: 'badges';
            referencedColumns: ['id'];
          }
        ];
      };
      points_transactions: {
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
            foreignKeyName: 'points_transactions_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      goals: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          category: string;
          target_value: number;
          current_value: number;
          unit: string;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          category: string;
          target_value: number;
          current_value?: number;
          unit: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          category?: string;
          target_value?: number;
          current_value?: number;
          unit?: string;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'goals_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      community_profiles: {
        Row: {
          id: string;
          opt_in: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          opt_in?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          opt_in?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'community_profiles_id_fkey';
            columns: ['id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      coach_conversations: {
        Row: {
          id: string;
          user_id: string;
          role: string;
          message: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: string;
          message: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: string;
          message?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'coach_conversations_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      coach_recommendations: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string;
          priority: string;
          estimated_savings: number;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description: string;
          priority: string;
          estimated_savings: number;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string;
          priority?: string;
          estimated_savings?: number;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'coach_recommendations_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      saved_simulations: {
        Row: {
          id: string;
          user_id: string;
          scenario_name: string;
          scenario_type: string;
          configuration: Record<string, any>;
          estimated_carbon_savings: number;
          estimated_cost_savings: number;
          estimated_water_savings: number;
          estimated_energy_savings: number;
          impact_score: number;
          is_favorite: boolean;
          comparison_group_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          scenario_name: string;
          scenario_type: string;
          configuration: Record<string, any>;
          estimated_carbon_savings: number;
          estimated_cost_savings: number;
          estimated_water_savings?: number;
          estimated_energy_savings?: number;
          impact_score: number;
          is_favorite?: boolean;
          comparison_group_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          scenario_name?: string;
          scenario_type?: string;
          configuration?: Record<string, any>;
          estimated_carbon_savings?: number;
          estimated_cost_savings?: number;
          estimated_water_savings?: number;
          estimated_energy_savings?: number;
          impact_score?: number;
          is_favorite?: boolean;
          comparison_group_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'saved_simulations_user_id_fkey';
            columns: ['user_id'];
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
