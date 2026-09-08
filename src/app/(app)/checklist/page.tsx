"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { CHECKLIST, flatChecklistKeys } from "@/lib/data/checklist";
import { apiGet, apiSend, useTravellers } from "@/lib/hooks";
import { ageYears } from "@/lib/validations";

export default function ChecklistPage() {
  const qc = useQueryClient();
  const { data: travellers } = useTravellers();
  const hasToddler = (travellers?.travellers ?? []).some(
    (t) => ageYears(t.birthdate) < 4,
  );

  const { data, isLoading } = useQuery({
    queryKey: ["checklist"],
    queryFn: () => apiGet<{ state: Record<string, boolean> }>("/api/checklist"),
  });
  const state = useMemo(() => data?.state ?? {}, [data]);

  const { done, total } = useMemo(() => {
    const keys = flatChecklistKeys(hasToddler);
    return {
      done: keys.filter((k) => state[k]).length,
      total: keys.length,
    };
  }, [state, hasToddler]);

  async function toggle(key: string, next: boolean) {
    qc.setQueryData<{ state: Record<string, boolean> }>(["checklist"], (old) => ({
      state: { ...(old?.state ?? {}), [key]: next },
    }));
    try {
      await apiSend("/api/checklist", "PUT", { itemKey: key, done: next });
    } catch {
      toast.error("Could not save — will retry on reload");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">First-timer checklist</h1>
        <p className="text-sm text-muted-foreground">
          {hasToddler
            ? "Tailored for a party travelling with a child under 4."
            : "Add a traveller under 4 and toddler-specific steps appear automatically."}
        </p>
      </div>

      <Card>
        <CardContent className="flex items-center gap-4 p-4">
          <Progress value={total ? (done / total) * 100 : 0} className="h-2" />
          <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
            {done}/{total}
          </span>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full" />
          ))}
        </div>
      ) : (
        CHECKLIST.map((section) => {
          const items = section.items.filter((i) => hasToddler || !i.toddler);
          if (!items.length) return null;
          return (
            <Card key={section.title}>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-baseline justify-between text-base">
                  {section.title}
                  <span className="text-xs font-normal text-muted-foreground">
                    {section.when}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {items.map((item) => (
                  <label key={item.key} className="flex gap-3">
                    <Checkbox
                      className="mt-0.5"
                      checked={Boolean(state[item.key])}
                      onCheckedChange={(v) => toggle(item.key, Boolean(v))}
                    />
                    <span>
                      <span
                        className={
                          state[item.key]
                            ? "text-sm text-muted-foreground line-through"
                            : "text-sm font-medium"
                        }
                      >
                        {item.label}
                      </span>
                      {item.detail && (
                        <span className="block text-xs text-muted-foreground">
                          {item.detail}
                        </span>
                      )}
                    </span>
                  </label>
                ))}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
}
