import { handleError, json } from "@/lib/api";
import { getOverlay, hasOverlay } from "@/lib/data/overlay";
import { computeStats, fetchQueueTimes, flattenRides } from "@/lib/queue-times";

export const revalidate = 60;

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ parkId: string }> },
) {
  try {
    const { parkId: raw } = await params;
    const parkId = Number(raw);
    if (!Number.isInteger(parkId) || parkId <= 0) {
      return json({ error: "Invalid park id" }, 400);
    }

    const data = await fetchQueueTimes(parkId);
    const rides = flattenRides(data);
    const overlay = getOverlay(parkId);

    const enriched = rides.map((r) => {
      const o = overlay?.[r.id];
      return {
        id: r.id,
        name: r.name,
        land: r.land,
        wait: r.wait_time,
        isOpen: r.is_open,
        lastUpdated: r.last_updated,
        meta: o
          ? {
              type: o.type,
              heightIn: o.heightIn,
              toddlerFriendly: o.toddlerFriendly,
              motion: o.motion,
              priority: o.priority,
              lane: o.lane,
              durationMin: o.durationMin,
              riderSwitch: o.riderSwitch,
              tip: o.tip,
            }
          : null,
      };
    });

    return json({
      parkId,
      curated: hasOverlay(parkId),
      stats: computeStats(rides),
      lands: [...new Set(rides.map((r) => r.land))],
      rides: enriched,
      fetchedAt: new Date().toISOString(),
    });
  } catch (err) {
    return handleError(err);
  }
}
