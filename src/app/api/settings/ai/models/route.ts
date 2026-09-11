import { handleError, json, requireUserId } from "@/lib/api";
import { listModels } from "@/lib/ai/client";
import { isProviderId, resolveBaseUrl } from "@/lib/ai/providers";

/**
 * Lists models available to a (not-yet-saved) key, so Settings can offer a
 * real, currently-valid picklist instead of a hardcoded default that a
 * provider can deprecate out from under us (as Groq did to llama-3.3-70b).
 */
export async function POST(req: Request) {
  try {
    await requireUserId();
    const body = await req.json();
    const apiKey = String(body?.apiKey ?? "").trim();
    const providerRaw = String(body?.provider ?? "").trim();
    const customBaseUrl = body?.baseUrl ? String(body.baseUrl).trim() : "";

    if (!apiKey || apiKey.length < 8) return json({ error: "Enter an API key first." }, 400);
    if (!isProviderId(providerRaw)) return json({ error: "Pick a provider." }, 400);

    const baseUrl = resolveBaseUrl(providerRaw, customBaseUrl);
    if (!baseUrl) return json({ error: "Enter a base URL first." }, 400);

    try {
      const models = await listModels(apiKey, baseUrl);
      return json({ models });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Could not list models";
      return json(
        { error: `Could not list models: ${msg}. You can still type a model id manually.` },
        400,
      );
    }
  } catch (err) {
    return handleError(err);
  }
}
