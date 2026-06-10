/**
 * Type definitions for the Carbon Assessment feature.
 *
 * These types model the inputs and outputs of the carbon footprint
 * calculator and are used across the service layer, API routes,
 * and UI components.
 */

// ---------------------------------------------------------------------------
// Emission Factor Enums
// ---------------------------------------------------------------------------

/** Supported vehicle fuel types for transport emissions calculation. */
export type FuelType = 'petrol' | 'diesel' | 'electric' | 'hybrid';

/** Flight distance categories affecting per-km emission factors. */
export type FlightType = 'short-haul' | 'long-haul';

/** Dietary pattern categories ranked by annual CO2 impact. */
export type DietType = 'vegan' | 'vegetarian' | 'mixed' | 'meat-heavy';

/** Consumer spending intensity levels. */
export type ShoppingLevel = 'low' | 'medium' | 'high';

// ---------------------------------------------------------------------------
// Calculator Inputs
// ---------------------------------------------------------------------------

/** Input for calculating annual car transport emissions. */
export interface CarInput {
  /** Weekly distance driven in kilometers. */
  readonly weeklyKm: number;
  /** Fuel type of the vehicle. */
  readonly fuelType: FuelType;
}

/** Input for calculating annual flight emissions. */
export interface FlightInput {
  /** Number of flights per year for this category. */
  readonly flightsPerYear: number;
  /** Average distance per flight in kilometers. */
  readonly avgDistanceKm: number;
  /** Flight distance category. */
  readonly type: FlightType;
}

/** Combined transport input for all modes of travel. */
export interface TransportInput {
  /** Car travel details. Omit if no car is used. */
  readonly car?: CarInput;
  /** Flight details broken down by category. */
  readonly flights: readonly FlightInput[];
}

/** Input for calculating annual diet emissions. */
export interface DietInput {
  /** Self-reported dietary pattern. */
  readonly dietType: DietType;
}

/** Input for calculating annual household energy emissions. */
export interface EnergyInput {
  /** Monthly electricity consumption in kWh. */
  readonly electricityKwhPerMonth: number;
  /** Monthly natural gas consumption in kWh. */
  readonly gasKwhPerMonth: number;
  /**
   * Grid carbon intensity in kg CO2 per kWh.
   * Defaults to UK grid average (0.233) if omitted.
   */
  readonly electricityGridFactor?: number;
}

/** Input for calculating annual shopping/consumption emissions. */
export interface ShoppingInput {
  /** Self-reported shopping intensity level. */
  readonly level: ShoppingLevel;
}

/** Complete assessment input combining all categories. */
export interface AssessmentInput {
  readonly transport: TransportInput;
  readonly diet: DietInput;
  readonly energy: EnergyInput;
  readonly shopping: ShoppingInput;
}

// ---------------------------------------------------------------------------
// Calculator Outputs
// ---------------------------------------------------------------------------

/** Full breakdown of calculated carbon footprint. */
export interface FootprintBreakdown {
  /** Annual transport emissions in kg CO2. */
  readonly transport: number;
  /** Annual diet emissions in kg CO2. */
  readonly diet: number;
  /** Annual energy emissions in kg CO2. */
  readonly energy: number;
  /** Annual shopping emissions in kg CO2. */
  readonly shopping: number;
  /** Total annual emissions in kg CO2. */
  readonly total: number;
  /**
   * Ratio of user's footprint to the global average (approx 4,700 kg CO2/yr).
   * Values < 1 mean below average; > 1 means above average.
   */
  readonly comparedToAverage: number;
  /**
   * Estimated percentile ranking (0–100).
   * Lower values indicate a smaller footprint relative to the population.
   */
  readonly percentile: number;
}

// ---------------------------------------------------------------------------
// Wizard State
// ---------------------------------------------------------------------------

/** Steps of the assessment wizard in order. */
export type WizardStep = 'transport' | 'diet' | 'energy' | 'shopping' | 'review';

/** Full state managed by the wizard's useReducer. */
export interface WizardState {
  readonly currentStep: WizardStep;
  readonly transport: TransportInput;
  readonly diet: DietInput;
  readonly energy: EnergyInput;
  readonly shopping: ShoppingInput;
  readonly result: FootprintBreakdown | null;
  readonly isSubmitting: boolean;
  readonly error: string | null;
}

/** All possible actions dispatched by the wizard. */
export type WizardAction =
  | { type: 'SET_TRANSPORT'; payload: TransportInput }
  | { type: 'SET_DIET'; payload: DietInput }
  | { type: 'SET_ENERGY'; payload: EnergyInput }
  | { type: 'SET_SHOPPING'; payload: ShoppingInput }
  | { type: 'GO_TO_STEP'; payload: WizardStep }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_SUCCESS'; payload: FootprintBreakdown }
  | { type: 'SUBMIT_ERROR'; payload: string }
  | { type: 'RESET' };

// ---------------------------------------------------------------------------
// API Types
// ---------------------------------------------------------------------------

/** Shape of the POST body sent to /api/assessment. */
export interface AssessmentApiRequest {
  readonly transport: TransportInput;
  readonly diet: DietInput;
  readonly energy: EnergyInput;
  readonly shopping: ShoppingInput;
}

/** Shape of the successful response from /api/assessment. */
export interface AssessmentApiResponse {
  readonly id: string;
  readonly breakdown: FootprintBreakdown;
  readonly createdAt: string;
}
