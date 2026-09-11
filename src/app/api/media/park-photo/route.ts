import { wikiQueryFor } from "@/lib/data/park-themes";
import { findWikiImage } from "@/lib/media/wikipedia";

export const revalidate = 2592000; // 30 days — Wikipedia lead images barely change

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const parkId = Number(searchParams.get("parkId"));
  const parkName = searchParams.get("parkName") ?? "";
  if (!parkName) {
    return Response.json({ error: "parkName is required" }, { status: 400 });
  }

  const query = wikiQueryFor(parkId, parkName);
  const image = await findWikiImage(query);
  return Response.json({ image });
}
