import { decryptSecret } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";

export const DEFAULT_MODEL = "claude-sonnet-5";
export const DEFAULT_OPENROUTER_MODEL = "anthropic/claude-haiku-4.5";
export const OPENROUTER_BASE_URL = "https://openrouter.ai/api";

export type AiProvider = "anthropic" | "openrouter";

export interface AiConfig {
  key: string;
  model: string;
  baseUrl?: string;
  provider: AiProvider;
  source: "user" | "env";
}

/** OpenRouter keys start with `sk-or-`, Anthropic keys with `sk-ant-`. */
export function providerForKey(key: string): AiProvider {
  return key.trim().startsWith("sk-or-") ? "openrouter" : "anthropic";
}

export function looksLikeSupportedKey(v: string): boolean {
  const k = v.trim();
  return /^sk-ant-[A-Za-z0-9_-]{20,}$/.test(k) || /^sk-or-[A-Za-z0-9._-]{20,}$/.test(k);
}

export function defaultModelFor(provider: AiProvider): string {
  return provider === "openrouter" ? DEFAULT_OPENROUTER_MODEL : DEFAULT_MODEL;
}

function buildConfig(
  key: string,
  storedModel: string | undefined,
  source: "user" | "env",
): AiConfig {
  const provider = providerForKey(key);
  return {
    key,
    provider,
    model: storedModel?.trim() || envModel() || defaultModelFor(provider),
    baseUrl: provider === "openrouter" ? OPENROUTER_BASE_URL : undefined,
    source,
  };
}

/**
 * Resolve the API key + model for a request. A key saved by the user in Settings
 * wins; otherwise fall back to a process-wide ANTHROPIC_API_KEY. Returns null
 * when neither is present.
 */
export async function getAiConfig(userId: string): Promise<AiConfig | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { aiKeyCipher: true, aiModel: true },
  });

  if (user?.aiKeyCipher) {
    const key = decryptSecret(user.aiKeyCipher);
    if (key) return buildConfig(key, user.aiModel ?? undefined, "user");
  }

  const envKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (envKey) return buildConfig(envKey, undefined, "env");

  return null;
}

function envModel(): string | undefined {
  return process.env.ANTHROPIC_MODEL?.trim() || undefined;
}
