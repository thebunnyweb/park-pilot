import { handleError, json } from "@/lib/api";
import { CURATED_PARK_IDS } from "@/lib/data/overlay";
import { fetchAllParks } from "@/lib/queue-times";

export const revalidate = 86400;

export async function GET() {
  try {
    const parks = await fetchAllParks();
    const curated = new Set(CURATED_PARK_IDS);
    return json({
      parks: parks.map((p) => ({ ...p, curated: curated.has(p.id) })),
    });
  } catch (err) {
    return handleError(err);
  }
}
