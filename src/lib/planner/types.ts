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

export interface SecondPark {
  parkId: number;
  parkName: string;
  /** HH:mm local — when the day should hand off from the first park to this one. */
  switchTime: string;
}

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
  /** Set when this day is a park-hopping day — the plan should cover both parks. */
  secondPark?: SecondPark;
  /** Links a generated plan back to its slot in a multi-day trip. */
  tripDayId?: string;
  /**
   * Ask the model to ground event/gem/photo-spot/shopping content in live web
   * search, when the connected provider supports it (see lib/ai/providers.ts).
   * Ignored (silently) if the provider can't do it.
   */
  searchEnabled?: boolean;
}

export type BlockType =
  | "arrive"
  | "ride"
  | "show"
  | "meal"
  | "break"
  | "walk"
  | "flex"
  | "depart"
  | "photo"
  | "shop"
  | "gem"
  | "event";

export interface ItineraryBlock {
  start: string; // HH:mm
  end: string; // HH:mm
  type: BlockType;
  title: string;
  rideId?: number;
  /** Which park this block is at — only meaningful/present on a park-hopping day. */
  parkId?: number;
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
