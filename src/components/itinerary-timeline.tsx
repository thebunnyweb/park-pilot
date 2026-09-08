"use client";

import {
  Armchair,
  Clock,
  Footprints,
  Sparkles,
  Ticket,
  TriangleAlert,
  Utensils,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import type { ItineraryBlock } from "@/lib/planner/types";
import { cn } from "@/lib/utils";

const ICON: Record<string, typeof Clock> = {
  arrive: Clock,
  ride: Ticket,
  show: Sparkles,
  meal: Utensils,
  break: Armchair,
  walk: Footprints,
  flex: Clock,
  depart: Clock,
};

export function ItineraryTimeline({
  blocks,
  warnings,
  nowMinutes,
}: {
  blocks: ItineraryBlock[];
  warnings?: string[];
  /** minutes-since-midnight of "now" — when set, highlights the current block */
  nowMinutes?: number;
}) {
  return (
    <div className="space-y-4">
      {warnings && warnings.length > 0 && (
        <Alert variant="destructive">
          <TriangleAlert className="h-4 w-4" />
          <AlertTitle>Check these before you rely on the plan</AlertTitle>
          <AlertDescription>
            <ul className="ml-4 list-disc space-y-0.5">
              {warnings.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      <ol className="relative space-y-1 border-l pl-6">
        {blocks.map((b, i) => {
          const Icon = ICON[b.type] ?? Clock;
          const current =
            nowMinutes !== undefined &&
            toMin(b.start) <= nowMinutes &&
            toMin(b.end) > nowMinutes;
          return (
            <li key={i} className="relative">
              <span
                className={cn(
                  "absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full border bg-background",
                  current && "border-primary bg-primary text-primary-foreground",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
              </span>
              <div
                className={cn(
                  "rounded-lg border bg-card p-3",
                  current && "border-primary ring-1 ring-primary",
                  b.type === "break" && "bg-muted/40",
                )}
              >
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <span className="text-sm font-semibold tabular-nums">
                    {b.start}–{b.end}
                  </span>
                  <span className="text-sm font-medium">{b.title}</span>
                  {b.land && (
                    <span className="text-xs text-muted-foreground">{b.land}</span>
                  )}
                  {current && (
                    <Badge className="h-4 px-1 text-[10px]">now</Badge>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-1.5">
                  {typeof b.projectedWaitMin === "number" && (
                    <Badge variant="outline" className="h-5 gap-1 text-[11px]">
                      <Clock className="h-3 w-3" />~{b.projectedWaitMin}m wait
                    </Badge>
                  )}
                  {b.lane && b.lane !== "none" && (
                    <Badge variant="outline" className="h-5 gap-1 text-[11px]">
                      <Ticket className="h-3 w-3" />
                      {b.lane === "single" ? "paid Lightning Lane" : "Lightning Lane"}
                    </Badge>
                  )}
                  {typeof b.walkMinutes === "number" && b.walkMinutes > 0 && (
                    <Badge variant="outline" className="h-5 gap-1 text-[11px]">
                      <Footprints className="h-3 w-3" />
                      {b.walkMinutes}m walk
                    </Badge>
                  )}
                </div>
                {b.why && (
                  <p className="mt-1.5 text-xs text-muted-foreground">{b.why}</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function toMin(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m || 0);
}
