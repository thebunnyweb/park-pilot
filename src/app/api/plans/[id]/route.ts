import { handleError, json, requireUserId } from "@/lib/api";
import { prisma } from "@/lib/prisma";

async function owned(id: string, userId: string) {
  const p = await prisma.plan.findUnique({ where: { id } });
  return p && p.userId === userId ? p : null;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    const p = await owned(id, userId);
    if (!p) return json({ error: "Not found" }, 404);

    const tripDay = p.tripDayId
      ? await prisma.tripDay.findUnique({
          where: { id: p.tripDayId },
          include: { trip: true },
        })
      : null;

    return json({
      plan: {
        id: p.id,
        parkId: p.parkId,
        parkName: p.parkName,
        date: p.date.toISOString().slice(0, 10),
        input: JSON.parse(p.inputJson),
        itinerary: JSON.parse(p.itineraryJson),
        summary: p.summary,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
        trip: tripDay ? { id: tripDay.trip.id, name: tripDay.trip.name } : null,
      },
    });
  } catch (err) {
    return handleError(err);
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    if (!(await owned(id, userId))) return json({ error: "Not found" }, 404);
    const body = await req.json();
    const { itinerary, summary, input } = body ?? {};
    const plan = await prisma.plan.update({
      where: { id },
      data: {
        ...(itinerary ? { itineraryJson: JSON.stringify(itinerary) } : {}),
        ...(input ? { inputJson: JSON.stringify(input) } : {}),
        ...(summary !== undefined ? { summary: summary ? String(summary) : null } : {}),
      },
    });
    return json({ id: plan.id });
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
    await prisma.plan.delete({ where: { id } });
    return json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
