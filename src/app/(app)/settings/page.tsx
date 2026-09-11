"use client";

import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, KeyRound, Loader2, ShieldCheck, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { apiSend, useAiSettings } from "@/lib/hooks";

export default function SettingsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useAiSettings();
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await apiSend<{ hint: string }>("/api/settings/ai", "PUT", {
        apiKey: apiKey.trim(),
        model: model.trim() || undefined,
      });
      setApiKey("");
      qc.invalidateQueries({ queryKey: ["ai-settings"] });
      qc.invalidateQueries({ queryKey: ["ai-status"] });
      toast.success(`Key verified and saved (…${res.hint})`);
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
        <p className="text-sm text-muted-foreground">Connect Claude to unlock the AI planner.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <KeyRound className="h-4 w-4" />
            AI provider key
          </CardTitle>
          <CardDescription>
            The live wait board works without this. The AI touring planner needs a key —
            an <strong>Anthropic</strong> key (<code>sk-ant-…</code>) or an{" "}
            <strong>OpenRouter</strong> key (<code>sk-or-…</code>), auto-detected.
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
                      Connected — key ending <code className="font-mono">…{data.hint}</code>
                      {data.effective && ` · model ${data.effective.model}`}
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
                    Using a server-wide key from the environment. Add your own below to use it
                    instead.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <AlertDescription>
                    No key yet — the planner is locked. Get an{" "}
                    <a
                      className="underline"
                      href="https://console.anthropic.com/settings/keys"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Anthropic
                    </a>{" "}
                    or{" "}
                    <a
                      className="underline"
                      href="https://openrouter.ai/keys"
                      target="_blank"
                      rel="noreferrer"
                    >
                      OpenRouter
                    </a>{" "}
                    key.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="key">{data?.hasUserKey ? "Replace key" : "API key"}</Label>
                <Input
                  id="key"
                  type="password"
                  autoComplete="off"
                  placeholder="sk-ant-…  or  sk-or-…"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="model">Model (optional)</Label>
                <Input
                  id="model"
                  placeholder={data?.defaultModel ?? "claude-sonnet-5"}
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Leave blank for the default. For an OpenRouter key, paste a model id from{" "}
                  <a
                    className="underline"
                    href="https://openrouter.ai/models?max_price=0"
                    target="_blank"
                    rel="noreferrer"
                  >
                    the $0 model list
                  </a>{" "}
                  (slugs change often — e.g. <code>meta-llama/llama-3.3-70b-instruct:free</code>)
                  or a paid one like <code>anthropic/claude-haiku-4.5</code>. The key is
                  encrypted before storage and never shown again.
                </p>
              </div>
              <Button onClick={save} disabled={saving || !apiKey.trim()} className="gap-1.5">
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
