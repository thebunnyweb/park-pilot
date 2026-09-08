import { decryptSecret } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";

export const DEFAULT_MODEL = "claude-sonnet-5";

export interface AiConfig {
  key: string;
  model: string;
  source: "user" | "env";
}

/**
 * Resolve the Anthropic API key + model for a request. A key saved by the user
 * in Settings wins; otherwise fall back to a process-wide ANTHROPIC_API_KEY
 * (useful for a single-tenant self-host). Returns null when neither is present.
 */
export async function getAiConfig(userId: string): Promise<AiConfig | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { aiKeyCipher: true, aiModel: true },
  });

  if (user?.aiKeyCipher) {
    const key = decryptSecret(user.aiKeyCipher);
    if (key) {
      return {
        key,
        model: user.aiModel?.trim() || envModel() || DEFAULT_MODEL,
        source: "user",
      };
    }
  }

  const envKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (envKey) {
    return { key: envKey, model: envModel() || DEFAULT_MODEL, source: "env" };
  }

  return null;
}

function envModel(): string | undefined {
  return process.env.ANTHROPIC_MODEL?.trim() || undefined;
}

export function looksLikeAnthropicKey(v: string): boolean {
  return /^sk-ant-[A-Za-z0-9_-]{20,}$/.test(v.trim());
}
