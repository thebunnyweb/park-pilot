import { handleError, json, requireUserId } from "@/lib/api";
import { callJson } from "@/lib/ai/anthropic";
import { getAiConfig } from "@/lib/ai/keys";
import { PLANNER_SYSTEM, plannerUserMessage } from "@/lib/ai/prompts";
import { buildPlannerContext } from "@/lib/planner/context";
import type { Itinerary, PlannerInput, TravellerProfile } from "@/lib/planner/types";
import { validateItinerary } from "@/lib/planner/validate";
import { prisma } from "@/lib/prisma";
import { fetchQueueTimes, flattenRides } from "@/lib/queue-times";
import { ageYears, plannerInputSchema } from "@/lib/validations";

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
        {
          error: "ai_disabled",
          message:
            "Add your Anthropic API key in Settings to build plans.",
        },
        400,
      );
    }

    const parsed = plannerInputSchema.safeParse(await req.json());
    if (!parsed.success) {
      return json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, 400);
    }
    const form = parsed.data;

    const travellers = await prisma.traveller.findMany({
      where: { userId, id: { in: form.travellerIds } },
    });
    if (!travellers.length) {
      return json({ error: "No matching travellers" }, 400);
    }

    const profiles: TravellerProfile[] = travellers.map((t) => ({
      name: t.name,
      ageYears: ageYears(t.birthdate, form.date),
      heightInInches: t.heightInInches,
      thrillTolerance: t.thrillTolerance as TravellerProfile["thrillTolerance"],
      needsMiddayBreak: t.needsMiddayBreak,
      mobilityNotes: t.mobilityNotes,
    }));

    const input: PlannerInput = {
      parkId: form.parkId,
      parkName: form.parkName,
      date: form.date,
      arrival: form.arrival,
      departure: form.departure,
      travellers: profiles,
      mustDoRideIds: form.mustDoRideIds,
      skipRideIds: form.skipRideIds,
      laneStrategy: form.laneStrategy,
      middayBreak: form.middayBreak,
      notes: form.notes,
    };

    const live = flattenRides(await fetchQueueTimes(form.parkId));
    const context = buildPlannerContext(input, live);

    const { data, model } = await callJson<ModelPlan>({
      apiKey: ai.key,
      model: ai.model,
      system: PLANNER_SYSTEM,
      user: plannerUserMessage(context),
    });

    const { blocks, warnings } = validateItinerary(data.blocks, input, live);

    const itinerary: Itinerary = {
      parkId: input.parkId,
      parkName: input.parkName,
      date: input.date,
      blocks,
      summary: data.summary ?? "",
      warnings,
      generatedAt: new Date().toISOString(),
      model,
    };

    return json({ itinerary, input });
  } catch (err) {
    return handleError(err);
  }
}
