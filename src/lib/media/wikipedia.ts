/**
 * Fetches freely-licensed photos from Wikipedia for park/ride banners and
 * gallery cards — there's no free API for official park photography, but
 * Wikimedia Commons images (used across Wikipedia) are reusable and this is
 * the standard way apps source real photos without a licensing footgun.
 *
 * Two-step lookup: opensearch resolves a fuzzy query ("Disney Magic Kingdom")
 * to the real Wikipedia page title ("Magic Kingdom"), then the REST summary
 * endpoint returns that page's lead image.
 */

const UA = "ParkPilot/1.0 (theme park trip planner; https://github.com/thebunnyweb/park-pilot)";

export interface WikiImage {
  title: string;
  imageUrl: string;
  pageUrl: string;
}

async function resolveTitle(query: string): Promise<string | null> {
  const url = `https://en.wikipedia.org/w/api.php?action=opensearch&format=json&limit=1&namespace=0&search=${encodeURIComponent(query)}`;
  const res = await fetch(url, {
    headers: { "User-Agent": UA },
    next: { revalidate: 60 * 60 * 24 * 30 },
  });
  if (!res.ok) return null;
  const data = (await res.json()) as [string, string[]];
  return data[1]?.[0] ?? null;
}

async function fetchSummary(title: string): Promise<WikiImage | null> {
  const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    next: { revalidate: 60 * 60 * 24 * 30 },
  });
  if (!res.ok) return null;
  const data = await res.json();
  const imageUrl: string | undefined = data.originalimage?.source ?? data.thumbnail?.source;
  if (!imageUrl) return null;
  return {
    title: data.title ?? title,
    imageUrl,
    pageUrl: data.content_urls?.desktop?.page ?? `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`,
  };
}

export async function findWikiImage(query: string): Promise<WikiImage | null> {
  try {
    const title = await resolveTitle(query);
    if (!title) return null;
    return await fetchSummary(title);
  } catch {
    return null;
  }
}

/** Looks up several queries in parallel; failures resolve to null, never throw. */
export async function findWikiImages(queries: string[]): Promise<Record<string, WikiImage | null>> {
  const entries = await Promise.all(
    queries.map(async (q) => [q, await findWikiImage(q)] as const),
  );
  return Object.fromEntries(entries);
}
