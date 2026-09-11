import { decryptSecret } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";
import { type ProviderId, PROVIDERS, isProviderId, resolveBaseUrl } from "./providers";

export interface AiConfig {
  key: string;
  model: string;
  baseUrl: string;
  provider: ProviderId;
  source: "user" | "env";
}

/**
 * Resolve the LLM key + model + endpoint for a request. A key saved by the
 * user in Settings wins; otherwise fall back to a process-wide
 * ANTHROPIC_API_KEY (useful for a single-tenant self-host). Returns null when
 * neither is present.
 */
export async function getAiConfig(userId: string): Promise<AiConfig | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { aiKeyCipher: true, aiProvider: true, aiModel: true, aiBaseUrl: true },
  });

  if (user?.aiKeyCipher) {
    const key = decryptSecret(user.aiKeyCipher);
    const provider: ProviderId =
      user.aiProvider && isProviderId(user.aiProvider) ? user.aiProvider : "anthropic";
    if (key) {
      return {
        key,
        provider,
        model: user.aiModel?.trim() || PROVIDERS[provider].defaultModel,
        baseUrl: resolveBaseUrl(provider, user.aiBaseUrl),
        source: "user",
      };
    }
  }

  const envKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (envKey) {
    return {
      key: envKey,
      provider: "anthropic",
      model: process.env.ANTHROPIC_MODEL?.trim() || PROVIDERS.anthropic.defaultModel,
      baseUrl: PROVIDERS.anthropic.baseUrl,
      source: "env",
    };
  }

  return null;
}
