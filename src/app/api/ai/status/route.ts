import { handleError, json, requireUserId } from "@/lib/api";
import { getAiConfig } from "@/lib/ai/keys";
import { PROVIDERS } from "@/lib/ai/providers";

export async function GET() {
  try {
    const userId = await requireUserId();
    const cfg = await getAiConfig(userId);
    return json({
      enabled: Boolean(cfg),
      model: cfg?.model ?? null,
      source: cfg?.source ?? null,
      provider: cfg?.provider ?? null,
      supportsSearch: cfg ? Boolean(PROVIDERS[cfg.provider]?.supportsSearch) : false,
      searchNote: cfg ? PROVIDERS[cfg.provider]?.searchNote : undefined,
    });
  } catch (err) {
    return handleError(err);
  }
}
