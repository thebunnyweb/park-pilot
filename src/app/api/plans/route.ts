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
        tripDayId: p.tripDayId,
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
    const { parkId, parkName, date, input, itinerary, summary, tripDayId } = body ?? {};
    if (!parkId || !parkName || !date || !input || !itinerary) {
      return json({ error: "Missing plan fields" }, 400);
    }

    if (tripDayId) {
      const day = await prisma.tripDay.findUnique({
        where: { id: String(tripDayId) },
        include: { trip: true, plan: true },
      });
      if (!day || day.trip.userId !== userId) {
        return json({ error: "Trip day not found" }, 404);
      }
      // Rebuilding a day's plan replaces the previous one rather than erroring
      // on the tripDayId unique constraint.
      if (day.plan) {
        const plan = await prisma.plan.update({
          where: { id: day.plan.id },
          data: {
            parkId: Number(parkId),
            parkName: String(parkName),
            date: new Date(date),
            inputJson: JSON.stringify(input),
            itineraryJson: JSON.stringify(itinerary),
            summary: summary ? String(summary) : null,
          },
        });
        return json({ id: plan.id }, 200);
      }
      const plan = await prisma.plan.create({
        data: {
          userId,
          tripDayId: String(tripDayId),
          parkId: Number(parkId),
          parkName: String(parkName),
          date: new Date(date),
          inputJson: JSON.stringify(input),
          itineraryJson: JSON.stringify(itinerary),
          summary: summary ? String(summary) : null,
        },
      });
      return json({ id: plan.id }, 201);
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
