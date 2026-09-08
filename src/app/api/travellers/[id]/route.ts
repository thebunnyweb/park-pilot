import { handleError, json, requireUserId } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { travellerSchema } from "@/lib/validations";

async function owned(id: string, userId: string) {
  const t = await prisma.traveller.findUnique({ where: { id } });
  return t && t.userId === userId ? t : null;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    if (!(await owned(id, userId))) return json({ error: "Not found" }, 404);
    const parsed = travellerSchema.partial().safeParse(await req.json());
    if (!parsed.success) {
      return json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, 400);
    }
    const d = parsed.data;
    const traveller = await prisma.traveller.update({
      where: { id },
      data: {
        ...(d.name !== undefined ? { name: d.name } : {}),
        ...(d.birthdate !== undefined ? { birthdate: new Date(d.birthdate) } : {}),
        ...(d.heightInInches !== undefined ? { heightInInches: d.heightInInches ?? null } : {}),
        ...(d.thrillTolerance !== undefined ? { thrillTolerance: d.thrillTolerance } : {}),
        ...(d.needsMiddayBreak !== undefined ? { needsMiddayBreak: d.needsMiddayBreak } : {}),
        ...(d.mobilityNotes !== undefined ? { mobilityNotes: d.mobilityNotes ?? null } : {}),
      },
    });
    return json({ traveller });
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
    await prisma.traveller.delete({ where: { id } });
    return json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
