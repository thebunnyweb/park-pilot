import { handleError, json, requireUserId } from "@/lib/api";
import { verifyKey } from "@/lib/ai/anthropic";
import { DEFAULT_MODEL, getAiConfig, looksLikeAnthropicKey } from "@/lib/ai/keys";
import { encryptSecret } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const userId = await requireUserId();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { aiKeyHint: true, aiModel: true },
    });
    const cfg = await getAiConfig(userId);
    return json({
      hasUserKey: Boolean(user?.aiKeyHint),
      hint: user?.aiKeyHint ?? null,
      model: user?.aiModel ?? null,
      effective: cfg ? { model: cfg.model, source: cfg.source } : null,
      envFallbackAvailable: Boolean(process.env.ANTHROPIC_API_KEY?.trim()),
      defaultModel: DEFAULT_MODEL,
    });
  } catch (err) {
    return handleError(err);
  }
}

export async function PUT(req: Request) {
  try {
    const userId = await requireUserId();
    const body = await req.json();
    const apiKey = String(body?.apiKey ?? "").trim();
    const model = body?.model ? String(body.model).trim() : "";

    if (!looksLikeAnthropicKey(apiKey)) {
      return json({ error: "That does not look like an Anthropic API key (sk-ant-…)." }, 400);
    }

    try {
      await verifyKey(apiKey, model || DEFAULT_MODEL);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Key verification failed";
      return json({ error: `Anthropic rejected the key: ${msg}` }, 400);
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        aiKeyCipher: encryptSecret(apiKey),
        aiKeyHint: apiKey.slice(-4),
        aiModel: model || null,
      },
    });

    return json({ ok: true, hint: apiKey.slice(-4), model: model || null });
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE() {
  try {
    const userId = await requireUserId();
    await prisma.user.update({
      where: { id: userId },
      data: { aiKeyCipher: null, aiKeyHint: null, aiModel: null },
    });
    return json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
