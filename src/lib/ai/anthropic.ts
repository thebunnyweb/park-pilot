import Anthropic from "@anthropic-ai/sdk";

export function makeAnthropic(apiKey: string): Anthropic {
  return new Anthropic({ apiKey });
}

interface JsonCallOpts {
  apiKey: string;
  model: string;
  system: string;
  user: string;
  maxTokens?: number;
}

/**
 * Call Claude and parse a single JSON object out of the response. Tolerates the
 * model wrapping JSON in prose or a code fence.
 */
export async function callJson<T>({
  apiKey,
  model,
  system,
  user,
  maxTokens = 8000,
}: JsonCallOpts): Promise<{ data: T; model: string }> {
  const res = await makeAnthropic(apiKey).messages.create({
    model,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: user }],
  });

  const text = res.content
    .filter((c): c is Anthropic.TextBlock => c.type === "text")
    .map((c) => c.text)
    .join("\n")
    .trim();

  return { data: extractJson<T>(text), model };
}

/** A cheap call used by Settings to confirm a key works. */
export async function verifyKey(apiKey: string, model: string): Promise<void> {
  await makeAnthropic(apiKey).messages.create({
    model,
    max_tokens: 8,
    messages: [{ role: "user", content: "Reply with the single word: ok" }],
  });
}

function extractJson<T>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("Model did not return JSON");
  }
  return JSON.parse(candidate.slice(start, end + 1)) as T;
}
