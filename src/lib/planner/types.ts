export type ThrillTolerance = "low" | "medium" | "high";

export interface TravellerProfile {
  name: string;
  ageYears: number;
  heightInInches: number | null;
  thrillTolerance: ThrillTolerance;
  needsMiddayBreak: boolean;
  mobilityNotes?: string | null;
}

export type LaneStrategy = "none" | "multi" | "multi_plus_single";

export interface PlannerInput {
  parkId: number;
  parkName: string;
  date: string; // yyyy-mm-dd
  arrival: string; // HH:mm local
  departure: string; // HH:mm local
  travellers: TravellerProfile[];
  mustDoRideIds: number[];
  skipRideIds: number[];
  laneStrategy: LaneStrategy;
  middayBreak: boolean;
  notes?: string;
}

export type BlockType =
  | "arrive"
  | "ride"
  | "show"
  | "meal"
  | "break"
  | "walk"
  | "flex"
  | "depart";

export interface ItineraryBlock {
  start: string; // HH:mm
  end: string; // HH:mm
  type: BlockType;
  title: string;
  rideId?: number;
  land?: string;
  projectedWaitMin?: number;
  walkMinutes?: number;
  lane?: "none" | "multi" | "single";
  why: string;
}

export interface Itinerary {
  parkId: number;
  parkName: string;
  date: string;
  blocks: ItineraryBlock[];
  summary: string; // markdown concierge notes
  warnings: string[];
  generatedAt: string;
  model?: string;
}
