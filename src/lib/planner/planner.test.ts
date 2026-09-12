import { describe, expect, it } from "vitest";
import type { LiveRide } from "@/lib/queue-times";
import { buildPlannerContext } from "./context";
import { projectWait, relativeDemand } from "./crowd-curve";
import type { PlannerInput } from "./types";
import { validateItinerary } from "./validate";

const live: LiveRide[] = [
  { id: 129, name: "Seven Dwarfs Mine Train", land: "Fantasyland", is_open: true, wait_time: 45, last_updated: "2026-09-07T14:00:00Z" },
  { id: 136, name: "Peter Pan's Flight", land: "Fantasyland", is_open: true, wait_time: 60, last_updated: "2026-09-07T14:00:00Z" },
  { id: 1190, name: "PeopleMover", land: "Tomorrowland", is_open: true, wait_time: 5, last_updated: "2026-09-07T14:00:00Z" },
];

const baseInput: PlannerInput = {
  parkId: 6,
  parkName: "Disney Magic Kingdom",
  date: "2026-11-10",
  arrival: "08:15",
  departure: "21:00",
  travellers: [
    { name: "Parent", ageYears: 34, heightInInches: 70, thrillTolerance: "high", needsMiddayBreak: false },
    { name: "Toddler", ageYears: 2, heightInInches: 34, thrillTolerance: "low", needsMiddayBreak: true },
  ],
  mustDoRideIds: [136],
  skipRideIds: [],
  laneStrategy: "multi",
  middayBreak: true,
};

describe("crowd-curve", () => {
  it("midday is busier than morning", () => {
    expect(relativeDemand("13:00")).toBeGreaterThan(relativeDemand("08:30"));
  });
  it("projects a morning wait upward toward the afternoon peak", () => {
    expect(projectWait(20, "09:00", "14:00")).toBeGreaterThan(20);
  });
});

describe("buildPlannerContext", () => {
  const ctx = buildPlannerContext(baseInput, live);

  it("flags the toddler as the youngest and carries min height", () => {
    expect(ctx.party.youngestAgeYears).toBe(2);
    expect(ctx.party.minHeightInInches).toBe(34);
  });

  it("marks the 38\" Mine Train ineligible for a 34\" party", () => {
    const mineTrain = ctx.park.rides.find((r) => r.id === 129);
    expect(mineTrain?.eligibleForWholeParty).toBe(false);
  });

  it("keeps a no-height family ride eligible and surfaces must-do first", () => {
    expect(ctx.park.rides[0].id).toBe(136);
    expect(ctx.park.rides.find((r) => r.id === 136)?.eligibleForWholeParty).toBe(true);
  });

  it("includes curated park data for Magic Kingdom", () => {
    expect(ctx.park.hasCuratedData).toBe(true);
  });

  it("has no secondPark on a non-hopping day", () => {
    expect(ctx.secondPark).toBeUndefined();
  });
});

describe("buildPlannerContext with park hopping", () => {
  const hoppingInput: PlannerInput = {
    ...baseInput,
    secondPark: { parkId: 5, parkName: "Epcot", switchTime: "14:00" },
  };
  const secondLive: LiveRide[] = [
    { id: 160, name: "Test Track", land: "World Discovery", is_open: true, wait_time: 30, last_updated: "2026-09-07T14:00:00Z" },
  ];
  const ctx = buildPlannerContext(hoppingInput, live, secondLive);

  it("builds a secondPark block with its own rides and switch time", () => {
    expect(ctx.secondPark?.id).toBe(5);
    expect(ctx.secondPark?.switchTime).toBe("14:00");
    expect(ctx.secondPark?.rides.find((r) => r.id === 160)).toBeTruthy();
  });

  it("keeps the first park's rides separate from the second's", () => {
    expect(ctx.park.rides.some((r) => r.id === 160)).toBe(false);
  });
});

describe("validateItinerary", () => {
  it("warns on overlaps and missing midday break", () => {
    const { warnings } = validateItinerary(
      [
        { start: "09:00", end: "10:00", type: "ride", title: "A", rideId: 136, why: "x" },
        { start: "09:30", end: "10:30", type: "ride", title: "B", rideId: 1190, why: "y" },
      ],
      baseInput,
      live,
    );
    expect(warnings.some((w) => w.includes("overlaps"))).toBe(true);
    expect(warnings.some((w) => w.toLowerCase().includes("midday break"))).toBe(true);
  });

  it("warns when a block puts the toddler on a too-tall ride", () => {
    const { warnings } = validateItinerary(
      [{ start: "09:00", end: "09:30", type: "ride", title: "Mine Train", rideId: 129, why: "z" }],
      baseInput,
      live,
    );
    expect(warnings.some((w) => w.includes("38"))).toBe(true);
  });

  it("drops blocks with malformed times", () => {
    const { blocks } = validateItinerary(
      [{ start: "9am", end: "10am", type: "ride", title: "bad", why: "" }],
      baseInput,
      live,
    );
    expect(blocks).toHaveLength(0);
  });
});

describe("buildPlannerContext caps a very long ride list", () => {
  // A park with 100+ attractions can push the JSON payload over a provider's
  // request-size limit (this exact shape triggered a real 413 from Groq).
  const manyRides: LiveRide[] = Array.from({ length: 120 }, (_, i) => ({
    id: 1000 + i,
    name: `Ride ${i}`,
    land: "Land",
    is_open: true,
    wait_time: i,
    last_updated: "2026-09-07T14:00:00Z",
  }));
  // A must-do buried near the end, by wait time (lowest), of a huge list.
  const inputWithManyRides: PlannerInput = {
    ...baseInput,
    parkId: 999,
    mustDoRideIds: [1005],
  };

  it("caps the rides sent to the model instead of sending everything", () => {
    const ctx = buildPlannerContext(inputWithManyRides, manyRides);
    expect(ctx.park.rides.length).toBeLessThan(manyRides.length);
  });

  it("keeps a must-do ride even though it would otherwise fall outside the cap", () => {
    const ctx = buildPlannerContext(inputWithManyRides, manyRides);
    expect(ctx.park.rides.some((r) => r.id === 1005 && r.mustDo)).toBe(true);
  });
});
