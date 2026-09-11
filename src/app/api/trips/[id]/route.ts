import { handleError, json, requireUserId } from "@/lib/api";
import { prisma } from "@/lib/prisma";

async function owned(id: string, userId: string) {
  const t = await prisma.trip.findUnique({ where: { id } });
  return t && t.userId === userId ? t : null;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    if (!(await owned(id, userId))) return json({ error: "Not found" }, 404);

    const trip = await prisma.trip.findUnique({
      where: { id },
      include: { days: { orderBy: { dayIndex: "asc" }, include: { plan: true } } },
    });
    if (!trip) return json({ error: "Not found" }, 404);

    return json({
      trip: {
        id: trip.id,
        name: trip.name,
        startDate: trip.startDate.toISOString().slice(0, 10),
        endDate: trip.endDate.toISOString().slice(0, 10),
        days: trip.days.map((d) => ({
          id: d.id,
          date: d.date.toISOString().slice(0, 10),
          dayIndex: d.dayIndex,
          parkId: d.parkId,
          parkName: d.parkName,
          hopping: d.hopping,
          secondParkId: d.secondParkId,
          secondParkName: d.secondParkName,
          switchTime: d.switchTime,
          plan: d.plan
            ? {
                id: d.plan.id,
                summary: d.plan.summary,
                itinerary: JSON.parse(d.plan.itineraryJson),
                input: JSON.parse(d.plan.inputJson),
              }
            : null,
        })),
      },
    });
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    if (!(await owned(id, userId))) return json({ error: "Not found" }, 404);
    await prisma.trip.delete({ where: { id } });
    return json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
