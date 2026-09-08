import { handleError, json, requireUserId } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { travellerSchema } from "@/lib/validations";

export async function GET() {
  try {
    const userId = await requireUserId();
    const travellers = await prisma.traveller.findMany({
      where: { userId },
      orderBy: { birthdate: "asc" },
    });
    return json({ travellers });
  } catch (err) {
    return handleError(err);
  }
}

export async function POST(req: Request) {
  try {
    const userId = await requireUserId();
    const parsed = travellerSchema.safeParse(await req.json());
    if (!parsed.success) {
      return json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, 400);
    }
    const d = parsed.data;
    const traveller = await prisma.traveller.create({
      data: {
        userId,
        name: d.name,
        birthdate: new Date(d.birthdate),
        heightInInches: d.heightInInches ?? null,
        thrillTolerance: d.thrillTolerance,
        needsMiddayBreak: d.needsMiddayBreak,
        mobilityNotes: d.mobilityNotes ?? null,
      },
    });
    return json({ traveller }, 201);
  } catch (err) {
    return handleError(err);
  }
}
