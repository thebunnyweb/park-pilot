/**
 * The app talks to every provider through the OpenAI-compatible "chat
 * completions" shape — the closest thing the industry has to a universal LLM
 * API. Anthropic, OpenAI, Groq, Google Gemini, and OpenRouter (a router in
 * front of ~300 more models) all implement it, so adding a provider here is a
 * one-line registry entry, not a new integration.
 */

export type ProviderId = "anthropic" | "openai" | "groq" | "google" | "openrouter" | "custom";

export interface ProviderDef {
  id: ProviderId;
  label: string;
  baseUrl: string;
  defaultModel: string;
  keyPlaceholder: string;
  keysUrl: string;
  note?: string;
}

export const PROVIDERS: Record<ProviderId, ProviderDef> = {
  anthropic: {
    id: "anthropic",
    label: "Anthropic",
    baseUrl: "https://api.anthropic.com/v1/",
    defaultModel: "claude-sonnet-5",
    keyPlaceholder: "sk-ant-…",
    keysUrl: "https://console.anthropic.com/settings/keys",
  },
  openai: {
    id: "openai",
    label: "OpenAI",
    baseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-5-mini",
    keyPlaceholder: "sk-…",
    keysUrl: "https://platform.openai.com/api-keys",
  },
  groq: {
    id: "groq",
    label: "Groq",
    baseUrl: "https://api.groq.com/openai/v1",
    defaultModel: "llama-3.3-70b-versatile",
    keyPlaceholder: "gsk_…",
    keysUrl: "https://console.groq.com/keys",
    note: "Free tier, no card required.",
  },
  google: {
    id: "google",
    label: "Google Gemini",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai/",
    defaultModel: "gemini-2.5-flash",
    keyPlaceholder: "AIza…",
    keysUrl: "https://aistudio.google.com/apikey",
    note: "Free tier, no card required.",
  },
  openrouter: {
    id: "openrouter",
    label: "OpenRouter",
    baseUrl: "https://openrouter.ai/api/v1",
    defaultModel: "anthropic/claude-haiku-4.5",
    keyPlaceholder: "sk-or-…",
    keysUrl: "https://openrouter.ai/keys",
    note: "Routes to ~300 models, including free ones — see openrouter.ai/models?max_price=0",
  },
  custom: {
    id: "custom",
    label: "Custom (OpenAI-compatible)",
    baseUrl: "",
    defaultModel: "",
    keyPlaceholder: "…",
    keysUrl: "",
    note: "Any endpoint that implements POST {baseUrl}/chat/completions — a local Ollama tunnel, Together, Fireworks, etc.",
  },
};

export const PROVIDER_LIST = Object.values(PROVIDERS);

export function isProviderId(v: string): v is ProviderId {
  return v in PROVIDERS;
}

export function resolveBaseUrl(provider: ProviderId, customBaseUrl?: string | null): string {
  if (provider === "custom") return (customBaseUrl ?? "").trim();
  return PROVIDERS[provider].baseUrl;
}
