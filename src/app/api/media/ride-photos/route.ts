import { findWikiImages } from "@/lib/media/wikipedia";

export const revalidate = 2592000; // 30 days

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const titles = Array.isArray(body?.titles) ? body.titles.map(String).slice(0, 12) : [];
  if (!titles.length) {
    return Response.json({ error: "titles is required" }, { status: 400 });
  }
  const images = await findWikiImages(titles);
  return Response.json({ images });
}
