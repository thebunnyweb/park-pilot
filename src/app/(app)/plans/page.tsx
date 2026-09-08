"use client";

import { format } from "date-fns";
import { CalendarClock, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { usePlans } from "@/lib/hooks";

export default function PlansPage() {
  const { data, isLoading } = usePlans();
  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">My plans</h1>
          <p className="text-sm text-muted-foreground">Saved touring plans, newest first.</p>
        </div>
        <Button asChild className="gap-1.5">
          <Link href="/planner">
            <CalendarClock className="h-4 w-4" /> New plan
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : data?.plans.length ? (
        <div className="space-y-2">
          {data.plans.map((p) => {
            const isToday = p.date === todayStr;
            return (
              <Link key={p.id} href={`/plans/${p.id}`}>
                <Card className="transition-colors hover:border-primary">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{p.parkName}</span>
                        {isToday && (
                          <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                            Today
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(`${p.date}T12:00:00`), "EEEE, d MMMM yyyy")}
                      </p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed py-16 text-center text-sm text-muted-foreground">
          No saved plans yet.
        </div>
      )}
    </div>
  );
}
