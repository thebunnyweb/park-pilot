import { handleError, json, requireUserId } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const userId = await requireUserId();
    const trips = await prisma.trip.findMany({
      where: { userId },
      orderBy: { startDate: "desc" },
      include: { days: { orderBy: { dayIndex: "asc" }, include: { plan: true } } },
    });
    return json({
      trips: trips.map((t) => ({
        id: t.id,
        name: t.name,
        startDate: t.startDate.toISOString().slice(0, 10),
        endDate: t.endDate.toISOString().slice(0, 10),
        days: t.days.map((d) => ({
          id: d.id,
          date: d.date.toISOString().slice(0, 10),
          dayIndex: d.dayIndex,
          parkId: d.parkId,
          parkName: d.parkName,
          hopping: d.hopping,
          secondParkId: d.secondParkId,
          secondParkName: d.secondParkName,
          switchTime: d.switchTime,
          planId: d.plan?.id ?? null,
        })),
      })),
    });
  } catch (err) {
    return handleError(err);
  }
}

function* dateRange(start: Date, end: Date): Generator<Date> {
  const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  const last = new Date(Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()));
  while (d <= last) {
    yield new Date(d);
    d.setUTCDate(d.getUTCDate() + 1);
  }
}

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const name = String(body?.name ?? "").trim();
    const startDate = new Date(String(body?.startDate ?? ""));
    const endDate = new Date(String(body?.endDate ?? ""));

    if (!name) return json({ error: "Give the trip a name" }, 400);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return json({ error: "Invalid dates" }, 400);
    }
    if (endDate < startDate) {
      return json({ error: "End date must be on or after the start date" }, 400);
    }
    const days = [...dateRange(startDate, endDate)];
    if (days.length > 21) {
      return json({ error: "Trips longer than 21 days aren't supported yet" }, 400);
    }

    const trip = await prisma.trip.create({
      data: {
        userId,
        name,
        startDate,
        endDate,
        days: {
          create: days.map((date, dayIndex) => ({ date, dayIndex })),
        },
      },
    });

    return json({ id: trip.id }, 201);
  } catch (err) {
    return handleError(err);
  }
}
