"use client";

import { format } from "date-fns";
import { ChevronRight, MapPinned, Plus } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTrips } from "@/lib/hooks";

export default function TripsPage() {
  const { data, isLoading } = useTrips();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Trips</h1>
          <p className="text-sm text-muted-foreground">
            Plan a whole multi-day trip, one day (or two parks) at a time.
          </p>
        </div>
        <Button asChild className="gap-1.5">
          <Link href="/trips/new">
            <Plus className="h-4 w-4" /> New trip
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      ) : data?.trips.length ? (
        <div className="space-y-2">
          {data.trips.map((t) => {
            const plannedDays = t.days.filter((d) => d.parkId).length;
            return (
              <Link key={t.id} href={`/trips/${t.id}`}>
                <Card className="transition-colors hover:border-primary">
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className="flex-1">
                      <div className="font-medium">{t.name}</div>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(`${t.startDate}T12:00:00`), "d MMM")} –{" "}
                        {format(new Date(`${t.endDate}T12:00:00`), "d MMM yyyy")} ·{" "}
                        {t.days.length} day{t.days.length === 1 ? "" : "s"} · {plannedDays}{" "}
                        planned
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
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-16 text-center">
          <MapPinned className="h-8 w-8 text-muted-foreground" />
          <p className="max-w-xs text-sm text-muted-foreground">
            No trips yet. Create one to lay out your whole visit, day by day.
          </p>
        </div>
      )}
    </div>
  );
}
