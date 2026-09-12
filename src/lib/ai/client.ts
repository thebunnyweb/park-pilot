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
 * Ask the API to guarantee syntactically valid JSON server-side, instead of
 * relying purely on prompt instructions — the actual fix for "model did not
 * return JSON" on providers that support it. Skipped for Groq's "compound"
 * models (they orchestrate tool calls themselves and don't reliably support
 * forced JSON mode alongside that) and for providers where support is
 * unconfirmed (Anthropic/Google's OpenAI-compat layers, custom endpoints) —
 * for those the tolerant text-based extraction below is the safety net.
 */
function jsonResponseFormatFor(
  provider: ProviderId,
  model: string,
): OpenAI.Chat.Completions.ChatCompletionCreateParams["response_format"] {
  if (model.startsWith("groq/compound")) return undefined;
  if (provider === "groq" || provider === "openai" || provider === "openrouter") {
    return { type: "json_object" };
  }
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

/**
 * Pulls the model's real output-token cap out of a rejection message like:
 *   "400 `max_tokens` must be less than or equal to `8192`, the maximum
 *    value for `max_tokens` is less than the `context_window` for this model"
 * Deliberately loose (first 3-7 digit number, anywhere in the message) rather
 * than anchored near the word "max" — real provider error prose puts far more
 * than a few characters between the word and the number, and being too strict
 * here means the retry below silently never fires (which is exactly what
 * shipped the first time).
 */
export function parseMaxTokensCap(message: string): number | null {
  if (!/max[_ ]?tokens|context[_ ]?window/i.test(message)) return null;
  // Providers quote the actual limit in backticks; prefer that so a leading
  // "400 " HTTP status prefix (itself a 3-digit number) never gets mistaken
  // for the cap.
  const quoted = message.match(/`(\d{3,7})`/);
  if (quoted) return Number(quoted[1]);
  const withoutStatusPrefix = message.replace(/^\d{3}\s+/, "");
  const match = withoutStatusPrefix.match(/(\d{3,7})/);
  return match ? Number(match[1]) : null;
}

/**
 * Every provider/model caps `max_tokens` differently (and some, like Groq's
 * gpt-oss-120b, cap it well below what a full itinerary can need) — there's no
 * reliable table of these to hardcode. Instead: ask for a generous amount, and
 * if the API rejects it, parse the real cap out of the error and retry once
 * at that limit rather than failing the whole request.
 */
async function createChatCompletion(
  client: OpenAI,
  params: OpenAI.Chat.Completions.ChatCompletionCreateParamsNonStreaming,
): Promise<OpenAI.Chat.Completions.ChatCompletion> {
  try {
    return await client.chat.completions.create(params);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);

    const cap = parseMaxTokensCap(msg);
    if (cap && params.max_tokens && cap < params.max_tokens) {
      return await client.chat.completions.create({ ...params, max_tokens: cap });
    }

    if (/^413\b|request entity too large|payload too large/i.test(msg)) {
      throw new Error(
        "The request to the model was too large for this provider to accept. This can happen " +
          "on a park with a very long ride list — try again (the ride list is now capped), pick " +
          "fewer must-do rides, or switch to a different model/provider.",
      );
    }

    // Some providers 400 on an unrecognized/unsupported response_format even
    // though they otherwise speak the chat-completions shape — drop it and
    // fall back to the tolerant text-based JSON extraction instead of failing.
    if (params.response_format && /response_format|json_object|json_schema/i.test(msg)) {
      const rest = { ...params };
      delete rest.response_format;
      return await client.chat.completions.create(rest);
    }

    throw err;
  }
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
  const res = await createChatCompletion(makeClient(apiKey, baseUrl), {
    model: effectiveModel,
    max_tokens: maxTokens,
    reasoning_effort: reasoningEffortFor(provider, effectiveModel),
    response_format: jsonResponseFormatFor(provider, effectiveModel),
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

  return { data: extractJson<T>(text, choice?.finish_reason), model: effectiveModel };
}

/** A cheap call used by Settings to confirm a key + model + endpoint work. */
export async function verifyKey(apiKey: string, model: string, baseUrl: string): Promise<void> {
  const res = await createChatCompletion(makeClient(apiKey, baseUrl), {
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

export function extractJson<T>(text: string, finishReason?: string | null): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");

  if (start === -1 || end === -1) {
    const reasonNote = finishReason && finishReason !== "stop" ? ` (finish_reason: ${finishReason})` : "";
    const trimmed = text.trim();
    if (!trimmed) {
      throw new Error(
        `The model returned an empty response${reasonNote}. Try again, or switch to a different model.`,
      );
    }
    const preview = trimmed.length > 240 ? `${trimmed.slice(0, 240)}…` : trimmed;
    throw new Error(`Model did not return JSON${reasonNote} — it said: "${preview}"`);
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
