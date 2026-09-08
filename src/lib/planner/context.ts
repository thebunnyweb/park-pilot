import { getOverlay } from "@/lib/data/overlay";
import { getParkMeta } from "@/lib/data/parks-meta";
import type { LiveRide } from "@/lib/queue-times";
import { CROWD_CURVE_NOTE, relativeDemand } from "./crowd-curve";
import type { PlannerInput } from "./types";

export interface ContextRide {
  id: number;
  name: string;
  land: string;
  liveWait: number;
  isOpen: boolean;
  type?: string;
  heightIn?: number;
  toddlerFriendly?: boolean;
  motion?: string;
  priority?: number;
  lane?: string;
  durationMin?: number;
  riderSwitch?: boolean;
  mustDo?: boolean;
  skip?: boolean;
  eligibleForWholeParty?: boolean;
}

export interface PlannerContext {
  park: { id: number; name: string; date: string };
  hours: { open: string; close: string; arrival: string; departure: string };
  ropeDropAdvice: string;
  landAdjacency?: Record<string, Record<string, number>>;
  events?: { name: string; approxTime: string; note?: string }[];
  parkNotes?: string[];
  party: {
    size: number;
    youngestAgeYears: number;
    minHeightInInches: number | null;
    anyNeedsMiddayBreak: boolean;
    thrillAppetite: string;
    travellers: {
      name: string;
      ageYears: number;
      heightInInches: number | null;
      thrillTolerance: string;
    }[];
  };
  laneStrategy: string;
  middayBreak: boolean;
  userNotes?: string;
  rides: ContextRide[];
  demandNow: number;
  crowdCurveNote: string;
  hasCuratedData: boolean;
}

function minPartyHeight(input: PlannerInput): number | null {
  const heights = input.travellers
    .map((t) => t.heightInInches)
    .filter((h): h is number => typeof h === "number");
  return heights.length ? Math.min(...heights) : null;
}

export function buildPlannerContext(
  input: PlannerInput,
  liveRides: LiveRide[],
): PlannerContext {
  const meta = getParkMeta(input.parkId);
  const overlay = getOverlay(input.parkId);
  const mustDo = new Set(input.mustDoRideIds);
  const skip = new Set(input.skipRideIds);

  const youngest = Math.min(
    ...(input.travellers.length ? input.travellers.map((t) => t.ageYears) : [99]),
  );
  const minHeight = minPartyHeight(input);

  const rides: ContextRide[] = liveRides.map((r) => {
    const o = overlay?.[r.id];
    const heightOk =
      !o || o.heightIn === 0 || (minHeight !== null && minHeight >= o.heightIn);
    const ageOk = !o || o.toddlerFriendly || youngest >= 4;
    return {
      id: r.id,
      name: r.name,
      land: r.land,
      liveWait: r.wait_time,
      isOpen: r.is_open,
      type: o?.type,
      heightIn: o?.heightIn,
      toddlerFriendly: o?.toddlerFriendly,
      motion: o?.motion,
      priority: o?.priority,
      lane: o?.lane,
      durationMin: o?.durationMin,
      riderSwitch: o?.riderSwitch,
      mustDo: mustDo.has(r.id),
      skip: skip.has(r.id),
      eligibleForWholeParty: heightOk && ageOk,
    };
  });

  rides.sort((a, b) => {
    if (a.mustDo !== b.mustDo) return a.mustDo ? -1 : 1;
    return (b.priority ?? 0) - (a.priority ?? 0) || b.liveWait - a.liveWait;
  });

  return {
    park: { id: input.parkId, name: input.parkName, date: input.date },
    hours: {
      open: meta.typicalOpen,
      close: meta.typicalClose,
      arrival: input.arrival,
      departure: input.departure,
    },
    ropeDropAdvice: meta.ropeDropAdvice,
    landAdjacency: meta.landAdjacency,
    events: meta.events,
    parkNotes: meta.notes,
    party: {
      size: input.travellers.length,
      youngestAgeYears: youngest === 99 ? 30 : youngest,
      minHeightInInches: minHeight,
      anyNeedsMiddayBreak: input.travellers.some((t) => t.needsMiddayBreak),
      thrillAppetite: summarizeThrill(input),
      travellers: input.travellers.map((t) => ({
        name: t.name,
        ageYears: t.ageYears,
        heightInInches: t.heightInInches,
        thrillTolerance: t.thrillTolerance,
      })),
    },
    laneStrategy: input.laneStrategy,
    middayBreak: input.middayBreak,
    userNotes: input.notes,
    rides,
    demandNow: Number(relativeDemand(nowHHmm()).toFixed(2)),
    crowdCurveNote: CROWD_CURVE_NOTE,
    hasCuratedData: overlay !== null,
  };
}

function summarizeThrill(input: PlannerInput): string {
  if (!input.travellers.length) return "unknown";
  const levels = input.travellers.map((t) => t.thrillTolerance);
  if (levels.every((l) => l === "high")) return "high — the whole party rides everything";
  if (levels.includes("low")) return "low — at least one traveller avoids thrill rides; plan Rider Switch";
  return "mixed";
}

export function nowHHmm(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}
