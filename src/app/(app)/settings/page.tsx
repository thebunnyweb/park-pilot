"use client";

import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, KeyRound, ListTree, Loader2, ShieldCheck, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { apiSend, useAiSettings } from "@/lib/hooks";
import type { ProviderId } from "@/lib/ai/providers";

export default function SettingsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useAiSettings();
  const [provider, setProvider] = useState<ProviderId>("groq");
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [fetchedModels, setFetchedModels] = useState<string[]>([]);
  const [fetchingModels, setFetchingModels] = useState(false);

  // Once we know the current provider, default the picker to it.
  useEffect(() => {
    if (data?.provider) setProvider(data.provider as ProviderId);
  }, [data?.provider]);

  // Switching providers invalidates any model list we'd fetched for the old one.
  useEffect(() => {
    setFetchedModels([]);
  }, [provider]);

  const def = data?.providers.find((p) => p.id === provider);

  async function fetchModels() {
    if (!apiKey.trim()) {
      toast.error("Enter an API key first.");
      return;
    }
    setFetchingModels(true);
    try {
      const res = await apiSend<{ models: string[] }>("/api/settings/ai/models", "POST", {
        provider,
        apiKey: apiKey.trim(),
        baseUrl: provider === "custom" ? baseUrl.trim() : undefined,
      });
      setFetchedModels(res.models);
      toast.success(`Found ${res.models.length} models`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not list models");
    } finally {
      setFetchingModels(false);
    }
  }

  async function save() {
    setSaving(true);
    try {
      const res = await apiSend<{ hint: string; model: string }>("/api/settings/ai", "PUT", {
        provider,
        apiKey: apiKey.trim(),
        model: model.trim() || undefined,
        baseUrl: provider === "custom" ? baseUrl.trim() : undefined,
      });
      setApiKey("");
      qc.invalidateQueries({ queryKey: ["ai-settings"] });
      qc.invalidateQueries({ queryKey: ["ai-status"] });
      toast.success(`Connected to ${def?.label ?? provider} — model ${res.model}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save key");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    try {
      await apiSend("/api/settings/ai", "DELETE");
      qc.invalidateQueries({ queryKey: ["ai-settings"] });
      qc.invalidateQueries({ queryKey: ["ai-status"] });
      toast.success("Key removed");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not remove key");
    }
  }

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Connect any LLM provider to unlock the AI planner.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="h-4 w-4" />
            AI provider
          </CardTitle>
          <CardDescription>
            The live wait board works without this. The planner talks to any provider that
            speaks the standard chat-completions API — Anthropic, OpenAI, Groq, Google
            Gemini, OpenRouter, or your own endpoint.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <>
              {data?.hasUserKey ? (
                <Alert>
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  <AlertDescription className="flex items-center justify-between gap-2">
                    <span>
                      Connected to <strong>{def?.label ?? data.provider}</strong> — key ending{" "}
                      <code className="font-mono">…{data.hint}</code>
                      {data.effective && ` · ${data.effective.model}`}
                    </span>
                    <Button variant="ghost" size="sm" className="gap-1 text-destructive" onClick={remove}>
                      <Trash2 className="h-3.5 w-3.5" /> Remove
                    </Button>
                  </AlertDescription>
                </Alert>
              ) : data?.envFallbackAvailable ? (
                <Alert>
                  <ShieldCheck className="h-4 w-4" />
                  <AlertDescription>
                    Using a server-wide Anthropic key from the environment. Add your own below
                    to use a different provider instead.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <AlertDescription>No key yet — the planner is locked.</AlertDescription>
                </Alert>
              )}

              <div className="space-y-1.5">
                <Label>Provider</Label>
                <Select value={provider} onValueChange={(v) => setProvider(v as ProviderId)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(data?.providers ?? []).map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.label}
                        {p.note?.startsWith("Free") ? " — free tier" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {def?.note && <p className="text-xs text-muted-foreground">{def.note}</p>}
                {def?.keysUrl && (
                  <a
                    href={def.keysUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs underline text-muted-foreground"
                  >
                    Get a {def.label} key →
                  </a>
                )}
              </div>

              {provider === "custom" && (
                <div className="space-y-1.5">
                  <Label htmlFor="baseUrl">Base URL</Label>
                  <Input
                    id="baseUrl"
                    placeholder="https://your-endpoint.example.com/v1"
                    value={baseUrl}
                    onChange={(e) => setBaseUrl(e.target.value)}
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="key">{data?.hasUserKey ? "Replace key" : "API key"}</Label>
                <Input
                  id="key"
                  type="password"
                  autoComplete="off"
                  placeholder={def?.keyPlaceholder}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="model">Model</Label>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 gap-1 px-1.5 text-xs"
                    onClick={fetchModels}
                    disabled={fetchingModels || !apiKey.trim()}
                  >
                    {fetchingModels ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <ListTree className="h-3 w-3" />
                    )}
                    Fetch models
                  </Button>
                </div>
                <Input
                  id="model"
                  list="model-options"
                  placeholder={def?.defaultModel || "model id"}
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                />
                {fetchedModels.length > 0 && (
                  <datalist id="model-options">
                    {fetchedModels.map((m) => (
                      <option key={m} value={m} />
                    ))}
                  </datalist>
                )}
                <p className="text-xs text-muted-foreground">
                  {fetchedModels.length > 0
                    ? `${fetchedModels.length} models available on this key — start typing to see suggestions.`
                    : "Leave blank for the default shown above, or enter your API key and click \"Fetch models\" to see what's actually live on your account."}{" "}
                  The key is encrypted before storage and never shown again.
                </p>
              </div>
              <Button
                onClick={save}
                disabled={saving || !apiKey.trim() || (provider === "custom" && !baseUrl.trim())}
                className="gap-1.5"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                {saving ? "Verifying…" : "Verify & save"}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
