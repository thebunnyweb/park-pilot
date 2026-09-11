import { handleError, json, requireUserId } from "@/lib/api";
import { callJson } from "@/lib/ai/anthropic";
import { getAiConfig } from "@/lib/ai/keys";
import { REFINE_SYSTEM, refineUserMessage } from "@/lib/ai/prompts";
import { buildPlannerContext } from "@/lib/planner/context";
import type { Itinerary, PlannerInput } from "@/lib/planner/types";
import { validateItinerary } from "@/lib/planner/validate";
import { fetchQueueTimes, flattenRides } from "@/lib/queue-times";

interface ModelPlan {
  blocks: unknown;
  summary?: string;
}

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();

    const ai = await getAiConfig(userId);
    if (!ai) {
      return json(
        { error: "ai_disabled", message: "Add your Anthropic API key in Settings to use the planner." },
        400,
      );
    }

    const body = await req.json();
    const instruction = String(body?.instruction ?? "").trim();
    const input = body?.input as PlannerInput | undefined;
    const itinerary = body?.itinerary as Itinerary | undefined;

    if (!instruction || !input || !itinerary) {
      return json({ error: "instruction, input and itinerary are required" }, 400);
    }
    if (instruction.length > 400) {
      return json({ error: "Instruction is too long" }, 400);
    }

    const live = flattenRides(await fetchQueueTimes(input.parkId));
    const context = buildPlannerContext(input, live);

    const { data, model } = await callJson<ModelPlan>({
      apiKey: ai.key,
      model: ai.model,
      baseUrl: ai.baseUrl,
      system: REFINE_SYSTEM,
      user: refineUserMessage(itinerary, instruction, context),
    });

    const { blocks, warnings } = validateItinerary(data.blocks, input, live);

    const next: Itinerary = {
      ...itinerary,
      blocks,
      summary: data.summary ?? itinerary.summary,
      warnings,
      generatedAt: new Date().toISOString(),
      model,
    };

    return json({ itinerary: next });
  } catch (err) {
    return handleError(err);
  }
}
