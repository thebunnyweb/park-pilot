import { handleError, json, requireUserId } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const userId = await requireUserId();
    const plans = await prisma.plan.findMany({
      where: { userId },
      orderBy: { date: "desc" },
    });
    return json({
      plans: plans.map((p) => ({
        id: p.id,
        parkId: p.parkId,
        parkName: p.parkName,
        date: p.date.toISOString().slice(0, 10),
        summary: p.summary,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
    });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const { parkId, parkName, date, input, itinerary, summary } = body ?? {};
    if (!parkId || !parkName || !date || !input || !itinerary) {
      return json({ error: "Missing plan fields" }, 400);
    }
    const plan = await prisma.plan.create({
      data: {
        userId,
        parkId: Number(parkId),
        parkName: String(parkName),
        date: new Date(date),
        inputJson: JSON.stringify(input),
        itineraryJson: JSON.stringify(itinerary),
        summary: summary ? String(summary) : null,
      },
    });
    return json({ id: plan.id }, 201);
  } catch (err) {
    return handleError(err);
  }
}
