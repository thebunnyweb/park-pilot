import { handleError, json, requireUserId } from "@/lib/api";
import { getAiConfig } from "@/lib/ai/keys";

export async function GET() {
  try {
    const userId = await requireUserId();
    const cfg = await getAiConfig(userId);
    return json({
      enabled: Boolean(cfg),
      model: cfg?.model ?? null,
      source: cfg?.source ?? null,
    });
  } catch (err) {
    return handleError(err);
  }
}
