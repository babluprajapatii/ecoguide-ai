/**
 * Type definitions for the Dashboard feature.
 *
 * These types model the data shapes consumed by dashboard components
 * and hooks, including historical assessment records and chart data.
 *
 * @module dashboard.types
 */

// ---------------------------------------------------------------------------
// Assessment Record (from Supabase)
// ---------------------------------------------------------------------------

/** A single persisted assessment row returned from Supabase. */
export interface AssessmentRecord {
  readonly id: string;
  readonly user_id: string;
  readonly transport_kg: number;
  readonly diet_kg: number;
  readonly energy_kg: number;
  readonly shopping_kg: number;
  readonly travel_kg: number;
  readonly total_kg: number;
  readonly compared_to_average: number;
  readonly percentile: number;
  readonly created_at: string;
}

// ---------------------------------------------------------------------------
// Dashboard Data
// ---------------------------------------------------------------------------

/** Aggregated dashboard data consumed by the dashboard page and components. */
export interface DashboardData {
  /** The most recent assessment, or `null` if none exist. */
  readonly latestAssessment: AssessmentRecord | null;
  /** Historical assessments ordered by date ascending (oldest first). */
  readonly history: readonly AssessmentRecord[];
}

// ---------------------------------------------------------------------------
// Chart Data Shapes
// ---------------------------------------------------------------------------

/** A single data point for the category radar chart. */
export interface CategoryDataPoint {
  readonly category: string;
  readonly value: number;
  /** Maximum reference value for normalisation. */
  readonly fullMark: number;
}

/** A single data point for the historical trend line chart. */
export interface TrendDataPoint {
  /** Formatted date string for the X axis (e.g. "Jan 15"). */
  readonly date: string;
  /** Total kg CO2 for this assessment. */
  readonly total: number;
  /** ISO timestamp for tooltip display. */
  readonly fullDate: string;
}

// ---------------------------------------------------------------------------
// Score Tier (for colour coding)
// ---------------------------------------------------------------------------

/** Colour tier based on annual CO2 emissions. */
export type ScoreTier = 'green' | 'yellow' | 'red';
