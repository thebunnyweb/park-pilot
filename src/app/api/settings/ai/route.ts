import { handleError, json, requireUserId } from "@/lib/api";
import { verifyKey } from "@/lib/ai/client";
import { getAiConfig } from "@/lib/ai/keys";
import { isProviderId, PROVIDERS, resolveBaseUrl } from "@/lib/ai/providers";
import { encryptSecret } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const userId = await requireUserId();
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { aiKeyHint: true, aiProvider: true, aiModel: true, aiBaseUrl: true },
    });
    const cfg = await getAiConfig(userId);
    return json({
      hasUserKey: Boolean(user?.aiKeyHint),
      hint: user?.aiKeyHint ?? null,
      provider: user?.aiProvider ?? null,
      model: user?.aiModel ?? null,
      baseUrl: user?.aiBaseUrl ?? null,
      effective: cfg
        ? { model: cfg.model, source: cfg.source, provider: cfg.provider, baseUrl: cfg.baseUrl }
        : null,
      envFallbackAvailable: Boolean(process.env.ANTHROPIC_API_KEY?.trim()),
      providers: Object.values(PROVIDERS),
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
    const providerRaw = String(body?.provider ?? "").trim();
    const model = body?.model ? String(body.model).trim() : "";
    const customBaseUrl = body?.baseUrl ? String(body.baseUrl).trim() : "";

    if (!apiKey || apiKey.length < 8) {
      return json({ error: "Enter a valid API key." }, 400);
    }
    if (!isProviderId(providerRaw)) {
      return json({ error: "Pick a provider." }, 400);
    }
    const provider = providerRaw;

    if (provider === "custom" && !customBaseUrl) {
      return json({ error: "Custom provider needs a base URL." }, 400);
    }
    const baseUrl = resolveBaseUrl(provider, customBaseUrl);
    if (!baseUrl) {
      return json({ error: "That provider has no endpoint configured." }, 400);
    }
    const modelToUse = model || PROVIDERS[provider].defaultModel;
    if (!modelToUse) {
      return json({ error: "Enter a model id for a custom provider." }, 400);
    }

    try {
      await verifyKey(apiKey, modelToUse, baseUrl);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Key verification failed";
      return json({ error: `${PROVIDERS[provider].label} rejected the request: ${msg}` }, 400);
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        aiKeyCipher: encryptSecret(apiKey),
        aiKeyHint: apiKey.slice(-4),
        aiProvider: provider,
        aiModel: model || null,
        aiBaseUrl: provider === "custom" ? customBaseUrl : null,
      },
    });

    return json({ ok: true, hint: apiKey.slice(-4), provider, model: modelToUse });
  } catch (err) {
    return handleError(err);
  }
}

export async function DELETE() {
  try {
    const userId = await requireUserId();
    await prisma.user.update({
      where: { id: userId },
      data: { aiKeyCipher: null, aiKeyHint: null, aiProvider: null, aiModel: null, aiBaseUrl: null },
    });
    return json({ ok: true });
  } catch (err) {
    return handleError(err);
  }
}
