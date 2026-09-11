import { handleError, json, requireUserId } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; dayId: string }> },
) {
  try {
    const userId = await requireUserId();
    const { id, dayId } = await params;

    const day = await prisma.tripDay.findUnique({
      where: { id: dayId },
      include: { trip: true, plan: true },
    });
    if (!day || day.trip.userId !== userId || day.tripId !== id) {
      return json({ error: "Not found" }, 404);
    }

    const body = await req.json();
    const parkId = body?.parkId != null ? Number(body.parkId) : null;
    const parkName = body?.parkName ? String(body.parkName) : null;
    const hopping = Boolean(body?.hopping);
    const secondParkId = hopping && body?.secondParkId != null ? Number(body.secondParkId) : null;
    const secondParkName = hopping && body?.secondParkName ? String(body.secondParkName) : null;
    const switchTime = hopping && body?.switchTime ? String(body.switchTime) : null;

    const parkAssignmentChanged =
      day.parkId !== parkId ||
      day.hopping !== hopping ||
      day.secondParkId !== secondParkId;

    if (parkAssignmentChanged && day.plan) {
      await prisma.plan.delete({ where: { id: day.plan.id } });
    }

    const updated = await prisma.tripDay.update({
      where: { id: dayId },
      data: { parkId, parkName, hopping, secondParkId, secondParkName, switchTime },
    });

    return json({
      day: {
        id: updated.id,
        date: updated.date.toISOString().slice(0, 10),
        dayIndex: updated.dayIndex,
        parkId: updated.parkId,
        parkName: updated.parkName,
        hopping: updated.hopping,
        secondParkId: updated.secondParkId,
        secondParkName: updated.secondParkName,
        switchTime: updated.switchTime,
        planCleared: parkAssignmentChanged && Boolean(day.plan),
      },
    });
  } catch (err) {
    return handleError(err);
  }
}
