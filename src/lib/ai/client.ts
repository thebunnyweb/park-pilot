import OpenAI from "openai";

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

interface JsonCallOpts {
  apiKey: string;
  baseUrl: string;
  model: string;
  system: string;
  user: string;
  maxTokens?: number;
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
  system,
  user,
  maxTokens = 8000,
}: JsonCallOpts): Promise<{ data: T; model: string }> {
  const res = await makeClient(apiKey, baseUrl).chat.completions.create({
    model,
    max_tokens: maxTokens,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });

  const text = res.choices[0]?.message?.content ?? "";
  return { data: extractJson<T>(text), model };
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
