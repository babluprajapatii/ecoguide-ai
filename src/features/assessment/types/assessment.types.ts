/**
 * Type definitions for the Carbon Assessment feature.
 */

// ---------------------------------------------------------------------------
// Emission Factor Enums
// ---------------------------------------------------------------------------

export type FuelType = 'petrol' | 'diesel' | 'electric' | 'hybrid' | 'none';

export type DietType = 'vegan' | 'vegetarian' | 'mixed' | 'meat-heavy';

export type ShoppingLevel = 'low' | 'medium' | 'high';

// ---------------------------------------------------------------------------
// Calculator Inputs
// ---------------------------------------------------------------------------

export interface TransportInput {
  readonly weeklyKm: number;
  readonly fuelType: FuelType;
  readonly publicTransportWeeklyHours: number;
  readonly rideShareWeeklyKm: number;
}

export interface EnergyInput {
  readonly electricityKwhPerMonth: number;
  readonly gasKwhPerMonth: number;
  readonly renewableEnergyPercent: number;
  readonly homeSizeSqFt: number;
  readonly householdMembers: number;
}

export interface DietInput {
  readonly dietType: DietType;
}

export interface ShoppingInput {
  readonly level: ShoppingLevel;
}

export interface TravelInput {
  readonly flightsPerYear: number;
  readonly avgDistanceKm: number;
  readonly hotelStaysPerYear: number;
}

export interface AssessmentInput {
  readonly transport: TransportInput;
  readonly energy: EnergyInput;
  readonly diet: DietInput;
  readonly shopping: ShoppingInput;
  readonly travel: TravelInput;
}

// Default values for initialisation
export const DEFAULT_ASSESSMENT_INPUT: AssessmentInput = {
  transport: {
    weeklyKm: 0,
    fuelType: 'none',
    publicTransportWeeklyHours: 0,
    rideShareWeeklyKm: 0,
  },
  energy: {
    electricityKwhPerMonth: 0,
    gasKwhPerMonth: 0,
    renewableEnergyPercent: 0,
    homeSizeSqFt: 0,
    householdMembers: 1,
  },
  diet: {
    dietType: 'mixed',
  },
  shopping: {
    level: 'medium',
  },
  travel: {
    flightsPerYear: 0,
    avgDistanceKm: 0,
    hotelStaysPerYear: 0,
  },
};

// ---------------------------------------------------------------------------
// Calculator Outputs
// ---------------------------------------------------------------------------

export interface FootprintBreakdown {
  readonly transport: number;
  readonly diet: number;
  readonly energy: number;
  readonly shopping: number;
  readonly travel: number;
  readonly total: number;
  readonly comparedToAverage: number;
  readonly percentile: number;
}

// ---------------------------------------------------------------------------
// Wizard State
// ---------------------------------------------------------------------------

export type WizardStep = 'welcome' | 'transport' | 'energy' | 'diet' | 'shopping' | 'travel' | 'results';

export interface WizardState {
  readonly currentStep: WizardStep;
  readonly transport: TransportInput;
  readonly energy: EnergyInput;
  readonly diet: DietInput;
  readonly shopping: ShoppingInput;
  readonly travel: TravelInput;
  readonly result: FootprintBreakdown | null;
  readonly grade: string | null;
  readonly recommendations: readonly string[];
  readonly isSubmitting: boolean;
  readonly error: string | null;
  readonly draftVersion: number;
  readonly isSaving: boolean;
}

export type WizardAction =
  | { type: 'SET_TRANSPORT'; payload: TransportInput }
  | { type: 'SET_ENERGY'; payload: EnergyInput }
  | { type: 'SET_DIET'; payload: DietInput }
  | { type: 'SET_SHOPPING'; payload: ShoppingInput }
  | { type: 'SET_TRAVEL'; payload: TravelInput }
  | { type: 'GO_TO_STEP'; payload: WizardStep }
  | { type: 'SUBMIT_START' }
  | { type: 'SUBMIT_SUCCESS'; payload: { breakdown: FootprintBreakdown; grade: string; recommendations: readonly string[] } }
  | { type: 'SUBMIT_ERROR'; payload: string }
  | { type: 'RESTORE_DRAFT'; payload: { inputs: AssessmentInput; step: WizardStep; version: number } }
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'INCREMENT_DRAFT_VERSION' }
  | { type: 'RESET' };

// ---------------------------------------------------------------------------
// API Types
// ---------------------------------------------------------------------------

export interface AssessmentApiRequest {
  readonly transport: TransportInput;
  readonly energy: EnergyInput;
  readonly diet: DietInput;
  readonly shopping: ShoppingInput;
  readonly travel: TravelInput;
}

export interface AssessmentApiResponse {
  readonly id: string;
  readonly breakdown: FootprintBreakdown;
  readonly grade: string;
  readonly recommendations: readonly string[];
  readonly createdAt: string;
}

export interface DraftApiResponse {
  readonly inputs: AssessmentInput;
  readonly currentStep: WizardStep;
  readonly draftVersion: number;
  readonly lastSavedAt: string;
}
