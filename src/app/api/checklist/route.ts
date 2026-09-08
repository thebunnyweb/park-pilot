import { handleError, json, requireUserId } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const userId = await requireUserId();
    const rows = await prisma.checklistState.findMany({ where: { userId } });
    const state: Record<string, boolean> = {};
    for (const r of rows) state[r.itemKey] = r.done;
    return json({ state });
  } catch (err) {
    return handleError(err);
  }
}

export async function PUT(req: Request) {
  try {
    const userId = await requireUserId();
    const { itemKey, done } = await req.json();
    if (typeof itemKey !== "string" || typeof done !== "boolean") {
      return json({ error: "itemKey and done required" }, 400);
    }
    await prisma.checklistState.upsert({
      where: { userId_itemKey: { userId, itemKey } },
      create: { userId, itemKey, done },
      update: { done },
    });
    return json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
