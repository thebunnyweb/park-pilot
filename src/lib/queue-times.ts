/**
 * Typed client for the queue-times.com real-time API.
 *
 * Endpoints:
 *   - https://queue-times.com/parks.json
 *   - https://queue-times.com/parks/{id}/queue_times.json
 *
 * The API sends no CORS headers, so it can only be called from the server.
 * Attribution ("Powered by Queue-Times.com") is required and rendered in the footer.
 */

const BASE = "https://queue-times.com";

export interface QtPark {
  id: number;
  name: string;
  country: string | null;
  continent: string | null;
  latitude: string | null;
  longitude: string | null;
  timezone: string | null;
}

export interface QtOperator {
  id: number;
  name: string;
  parks: QtPark[];
}

export interface QtRide {
  id: number;
  name: string;
  is_open: boolean;
  wait_time: number;
  last_updated: string; // ISO UTC
}

export interface QtLand {
  id: number;
  name: string;
  rides: QtRide[];
}

export interface QtQueueTimes {
  lands: QtLand[];
  rides: QtRide[];
}

/** A ride flattened out of lands, with its land name attached. */
export interface LiveRide extends QtRide {
  land: string;
}

export interface ParkSummary {
  id: number;
  name: string;
  country: string | null;
  continent: string | null;
  timezone: string | null;
  operatorId: number;
  operatorName: string;
}

export async function fetchOperators(): Promise<QtOperator[]> {
  const res = await fetch(`${BASE}/parks.json`, {
    next: { revalidate: 60 * 60 * 24 },
  });
  if (!res.ok) throw new Error(`queue-times parks.json: ${res.status}`);
  return (await res.json()) as QtOperator[];
}

export async function fetchAllParks(): Promise<ParkSummary[]> {
  const operators = await fetchOperators();
  const parks: ParkSummary[] = [];
  for (const op of operators) {
    for (const p of op.parks) {
      parks.push({
        id: p.id,
        name: p.name,
        country: p.country,
        continent: p.continent,
        timezone: p.timezone,
        operatorId: op.id,
        operatorName: op.name,
      });
    }
  }
  parks.sort((a, b) => a.name.localeCompare(b.name));
  return parks;
}

export async function fetchQueueTimes(parkId: number): Promise<QtQueueTimes> {
  const res = await fetch(`${BASE}/parks/${parkId}/queue_times.json`, {
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`queue-times park ${parkId}: ${res.status}`);
  const data = (await res.json()) as Partial<QtQueueTimes>;
  return { lands: data.lands ?? [], rides: data.rides ?? [] };
}

/** Flatten lands + loose rides into one list. */
export function flattenRides(data: QtQueueTimes): LiveRide[] {
  const out: LiveRide[] = [];
  for (const land of data.lands) {
    for (const ride of land.rides) out.push({ ...ride, land: land.name });
  }
  for (const ride of data.rides) out.push({ ...ride, land: "Other" });
  return out;
}

export interface ParkStats {
  totalRides: number;
  openRides: number;
  closedRides: number;
  avgWait: number;
  medianWait: number;
  maxWait: number;
  busiest: { name: string; wait: number } | null;
  quietest: { name: string; wait: number } | null;
  lastUpdated: string | null;
}

export function computeStats(rides: LiveRide[]): ParkStats {
  const open = rides.filter((r) => r.is_open);
  const waits = open.map((r) => r.wait_time).sort((a, b) => a - b);
  const sum = waits.reduce((a, b) => a + b, 0);
  const withWait = open.filter((r) => r.wait_time > 0);
  const sortedByWait = [...open].sort((a, b) => b.wait_time - a.wait_time);
  const lastUpdated =
    rides
      .map((r) => r.last_updated)
      .filter(Boolean)
      .sort()
      .at(-1) ?? null;

  return {
    totalRides: rides.length,
    openRides: open.length,
    closedRides: rides.length - open.length,
    avgWait: withWait.length ? Math.round(sum / withWait.length) : 0,
    medianWait: waits.length ? waits[Math.floor(waits.length / 2)] : 0,
    maxWait: waits.at(-1) ?? 0,
    busiest: sortedByWait[0]
      ? { name: sortedByWait[0].name, wait: sortedByWait[0].wait_time }
      : null,
    quietest: withWait.length
      ? {
          name: withWait.sort((a, b) => a.wait_time - b.wait_time)[0].name,
          wait: withWait[0].wait_time,
        }
      : null,
    lastUpdated,
  };
}
