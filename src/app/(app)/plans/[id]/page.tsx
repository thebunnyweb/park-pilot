"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ArrowLeft, Loader2, RefreshCw, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ItineraryTimeline } from "@/components/itinerary-timeline";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { apiGet, apiSend } from "@/lib/hooks";
import type { Itinerary, PlannerInput } from "@/lib/planner/types";

interface PlanDetail {
  plan: {
    id: string;
    parkId: number;
    parkName: string;
    date: string;
    input: PlannerInput;
    itinerary: Itinerary;
    summary: string | null;
  };
}

export default function PlanDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["plan", id],
    queryFn: () => apiGet<PlanDetail>(`/api/plans/${id}`),
  });

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-20 w-full" />
        ))}
      </div>
    );
  }
  if (!data) return <p className="text-sm text-muted-foreground">Plan not found.</p>;

  const { plan } = data;
  const isToday = plan.date === new Date().toISOString().slice(0, 10);
  const now = new Date();
  const nowMinutes = isToday ? now.getHours() * 60 + now.getMinutes() : undefined;

  async function reoptimize() {
    setBusy(true);
    try {
      const res = await apiSend<{ itinerary: Itinerary }>("/api/ai/refine", "POST", {
        instruction:
          "Re-sequence the remainder of the day using the current live wait times. Keep the same rides and overall structure where it still makes sense, but move things to their lowest-wait windows from now on.",
        itinerary: plan.itinerary,
        input: plan.input,
      });
      await apiSend(`/api/plans/${id}`, "PUT", {
        itinerary: res.itinerary,
        summary: res.itinerary.summary,
      });
      qc.invalidateQueries({ queryKey: ["plan", id] });
      toast.success("Re-optimized with live waits");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not re-optimize");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    try {
      await apiSend(`/api/plans/${id}`, "DELETE");
      qc.invalidateQueries({ queryKey: ["plans"] });
      router.push("/plans");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete");
    }
  }

  return (
    <div className="space-y-5">
      <Link
        href="/plans"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> All plans
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{plan.parkName}</h1>
          <p className="text-sm text-muted-foreground">
            {format(new Date(`${plan.date}T12:00:00`), "EEEE, d MMMM yyyy")}
            {isToday && " · today"}
          </p>
        </div>
        <div className="flex gap-2">
          {isToday && (
            <Button variant="outline" size="sm" className="gap-1.5" onClick={reoptimize} disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              Re-optimize now
            </Button>
          )}
          <Button variant="ghost" size="sm" className="gap-1.5 text-destructive" onClick={remove}>
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
        </div>
      </div>

      {plan.summary && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Concierge notes</CardTitle>
          </CardHeader>
          <CardContent className="whitespace-pre-wrap text-sm">{plan.summary}</CardContent>
        </Card>
      )}

      <ItineraryTimeline
        blocks={plan.itinerary.blocks}
        warnings={plan.itinerary.warnings}
        nowMinutes={nowMinutes}
      />
    </div>
  );
}
