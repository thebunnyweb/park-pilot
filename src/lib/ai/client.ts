import OpenAI from "openai";
import type { ProviderId } from "./providers";

export function makeClient(apiKey: string, baseUrl: string): OpenAI {
  return new OpenAI({
    apiKey,
    baseURL: baseUrl,
    defaultHeaders: {
      // Identifies the app to routers/analytics (OpenRouter uses these); most
      // providers just ignore unknown headers.
      "HTTP-Referer": "https://github.com/thebunnyweb/park-pilot",
      "X-Title": "Park Pilot",
    },
  });
}

/**
 * Reasoning models (Groq's gpt-oss, OpenAI's o-series/gpt-5) can spend most of
 * max_tokens on an internal "thinking" trace before ever writing the JSON
 * answer, which truncates the response mid-array and looks like a JSON parse
 * bug. Capping reasoning effort reclaims that budget for the actual output.
 * Only sent to providers/models known to support the field — an unknown
 * provider silently ignoring or rejecting it is a bigger risk than skipping it.
 */
function reasoningEffortFor(provider: ProviderId, model: string): "low" | undefined {
  // Groq's "compound" models are an agentic wrapper (search + code execution),
  // not a plain reasoning model — leave their request shape alone.
  if (model.startsWith("groq/compound")) return undefined;
  if (provider === "groq" || provider === "openai") return "low";
  if (provider === "openrouter" && /\bo\d|gpt-oss|thinking/i.test(model)) return "low";
  return undefined;
}

/**
 * Turn "search enabled" into the provider-specific request shape that grounds
 * the answer in live web results — no separate search API/key needed.
 *   - OpenRouter: any model gets grounding via the ":online" suffix.
 *   - Groq: only the "compound" models have built-in search, so we switch to
 *     one (preserving an already-compound model the user picked themselves).
 * Other providers don't support this yet, so the model is returned unchanged.
 */
export function applySearch(provider: ProviderId, model: string, enabled: boolean): string {
  if (!enabled) return model;
  if (provider === "openrouter") {
    return model.endsWith(":online") ? model : `${model}:online`;
  }
  if (provider === "groq") {
    return model.startsWith("groq/compound") ? model : "groq/compound-mini";
  }
  return model;
}

interface JsonCallOpts {
  apiKey: string;
  baseUrl: string;
  model: string;
  provider: ProviderId;
  system: string;
  user: string;
  maxTokens?: number;
  searchEnabled?: boolean;
}

/**
 * Call a chat-completions-compatible model and parse a single JSON object out
 * of the response. Tolerates the model wrapping JSON in prose or a code fence
 * — free/smaller models are less disciplined about "JSON only" than Claude.
 */
export async function callJson<T>({
  apiKey,
  baseUrl,
  model,
  provider,
  system,
  user,
  maxTokens = 16000,
  searchEnabled = false,
}: JsonCallOpts): Promise<{ data: T; model: string }> {
  const effectiveModel = applySearch(provider, model, searchEnabled);
  const res = await makeClient(apiKey, baseUrl).chat.completions.create({
    model: effectiveModel,
    max_tokens: maxTokens,
    reasoning_effort: reasoningEffortFor(provider, effectiveModel),
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  const choice = res.choices[0];
  const text = choice?.message?.content ?? "";

  if (choice?.finish_reason === "length") {
    throw new Error(
      "The model's response was cut off before it finished (hit the output token limit). " +
        "Try again, pick fewer must-do rides, or switch to a model with a larger output limit.",
    );
  }

  return { data: extractJson<T>(text), model: effectiveModel };
}

/** A cheap call used by Settings to confirm a key + model + endpoint work. */
export async function verifyKey(apiKey: string, model: string, baseUrl: string): Promise<void> {
  const res = await makeClient(apiKey, baseUrl).chat.completions.create({
    model,
    max_tokens: 8,
    messages: [{ role: "user", content: "Reply with the single word: ok" }],
  });
  if (!res.choices?.length) {
    throw new Error("The endpoint responded but returned no choices — check the model id.");
  }
}

/**
 * List models the given key can actually use, via the standard GET /models
 * endpoint (supported by OpenAI, Groq, and OpenRouter; best-effort elsewhere).
 * Lets Settings offer real, currently-valid model ids instead of a guessed
 * default that can silently go stale when a provider deprecates a model.
 */
export async function listModels(apiKey: string, baseUrl: string): Promise<string[]> {
  const page = await makeClient(apiKey, baseUrl).models.list();
  const ids = page.data.map((m) => m.id);
  ids.sort((a, b) => a.localeCompare(b));
  return ids;
}

function extractJson<T>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("Model did not return JSON");
  }
  try {
    return JSON.parse(candidate.slice(start, end + 1)) as T;
  } catch {
    throw new Error(
      "The model's JSON was malformed (likely cut off mid-response). Try again — smaller/free " +
        "models occasionally produce invalid JSON on a long plan.",
    );
  }
}
