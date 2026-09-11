import { getOverlay } from "@/lib/data/overlay";
import type { LiveRide } from "@/lib/queue-times";
import { hoursFromHHmm } from "./crowd-curve";
import type { ItineraryBlock, PlannerInput } from "./types";

const HHMM = /^([01]\d|2[0-3]):([0-5]\d)$/;

export interface ValidationResult {
  blocks: ItineraryBlock[];
  warnings: string[];
}

/**
 * Deterministic sanity pass over an AI-generated itinerary. It repairs obviously
 * malformed data and surfaces (not silently drops) anything that looks wrong so
 * the user can judge it. On a park-hopping day, `secondParkLiveRides` lets a
 * block validate against whichever park it's actually tagged with.
 */
export function validateItinerary(
  rawBlocks: unknown,
  input: PlannerInput,
  liveRides: LiveRide[],
  secondParkLiveRides?: LiveRide[],
): ValidationResult {
  const warnings: string[] = [];

  const rideMapsByPark = new Map<number, Map<number, LiveRide>>([
    [input.parkId, new Map(liveRides.map((r) => [r.id, r]))],
  ]);
  if (input.secondPark && secondParkLiveRides) {
    rideMapsByPark.set(
      input.secondPark.parkId,
      new Map(secondParkLiveRides.map((r) => [r.id, r])),
    );
  }

  const minHeight = input.travellers
    .map((t) => t.heightInInches)
    .filter((h): h is number => typeof h === "number")
    .reduce<number | null>((m, h) => (m === null ? h : Math.min(m, h)), null);
  const youngest = input.travellers.length
    ? Math.min(...input.travellers.map((t) => t.ageYears))
    : 30;

  if (!Array.isArray(rawBlocks)) {
    return { blocks: [], warnings: ["The planner returned no usable itinerary."] };
  }

  const blocks: ItineraryBlock[] = [];
  let prevEnd = 0;

  for (const b of rawBlocks as Record<string, unknown>[]) {
    const start = String(b.start ?? "");
    const end = String(b.end ?? "");
    if (!HHMM.test(start) || !HHMM.test(end)) {
      warnings.push(`Skipped a block with an invalid time (${start}–${end}).`);
      continue;
    }
    const startH = hoursFromHHmm(start);
    const endH = hoursFromHHmm(end);
    if (endH < startH) {
      warnings.push(`"${b.title}" ends before it starts — check the plan around ${start}.`);
    }
    if (startH + 0.001 < prevEnd) {
      warnings.push(`"${b.title}" overlaps the previous block near ${start}.`);
    }
    prevEnd = Math.max(prevEnd, endH);

    const rideId = typeof b.rideId === "number" ? b.rideId : undefined;
    const parkId = typeof b.parkId === "number" ? b.parkId : input.parkId;
    if (rideId !== undefined) {
      const live = rideMapsByPark.get(parkId)?.get(rideId);
      if (!live) {
        warnings.push(`"${b.title}" references a ride id not on today's live list.`);
      }
      const overlay = getOverlay(parkId);
      const o = overlay?.[rideId];
      if (o && o.heightIn > 0 && minHeight !== null && minHeight < o.heightIn) {
        warnings.push(
          `"${live?.name ?? b.title}" needs ${o.heightIn}" — your shortest traveller is ${minHeight}". Use Rider Switch or skip.`,
        );
      }
      if (o && !o.toddlerFriendly && youngest < 4 && o.type !== "show") {
        warnings.push(
          `"${live?.name ?? b.title}" may be too intense for a ${youngest}-year-old — plan Rider Switch.`,
        );
      }
    }

    blocks.push({
      start,
      end,
      type: normalizeType(b.type),
      title: String(b.title ?? "Untitled"),
      rideId,
      parkId: input.secondPark ? parkId : undefined,
      land: b.land ? String(b.land) : undefined,
      projectedWaitMin:
        typeof b.projectedWaitMin === "number" ? Math.round(b.projectedWaitMin) : undefined,
      walkMinutes: typeof b.walkMinutes === "number" ? Math.round(b.walkMinutes) : undefined,
      lane: normalizeLane(b.lane),
      why: String(b.why ?? ""),
    });
  }

  const arrival = hoursFromHHmm(input.arrival);
  const departure = hoursFromHHmm(input.departure);
  if (blocks.length) {
    if (hoursFromHHmm(blocks[0].start) + 0.001 < arrival) {
      warnings.push("The plan starts before your stated arrival time.");
    }
    if (hoursFromHHmm(blocks[blocks.length - 1].end) - 0.001 > departure) {
      warnings.push("The plan runs past your stated departure time.");
    }
  }

  if (input.middayBreak && !blocks.some((b) => b.type === "break")) {
    warnings.push("You asked for a midday break but the plan has none.");
  }

  if (input.secondPark && !blocks.some((b) => b.parkId === input.secondPark!.parkId)) {
    warnings.push(`This was a park-hopping day but no blocks are at ${input.secondPark.parkName}.`);
  }

  return { blocks, warnings };
}

function normalizeType(t: unknown): ItineraryBlock["type"] {
  const allowed = [
    "arrive",
    "ride",
    "show",
    "meal",
    "break",
    "walk",
    "flex",
    "depart",
    "photo",
    "shop",
    "gem",
    "event",
  ];
  return (allowed.includes(String(t)) ? t : "flex") as ItineraryBlock["type"];
}

function normalizeLane(l: unknown): ItineraryBlock["lane"] {
  return (["none", "multi", "single"].includes(String(l)) ? l : "none") as ItineraryBlock["lane"];
}
