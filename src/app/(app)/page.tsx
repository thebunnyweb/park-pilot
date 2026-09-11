"use client";

import { CalendarClock, MapPin } from "lucide-react";
import Link from "next/link";
import { ParkHero } from "@/components/park-hero";
import { ParkPicker } from "@/components/park-picker";
import { ParkThemeProvider } from "@/components/park-theme-provider";
import { WaitBoard } from "@/components/wait-board";
import { Button } from "@/components/ui/button";
import { useSelectedPark } from "@/lib/use-selected-park";

export default function DashboardPage() {
  const { park, select, ready } = useSelectedPark();

  return (
    <ParkThemeProvider parkId={park?.id ?? null} parkName={park?.name ?? null} className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Live wait times</h1>
          <p className="text-sm text-muted-foreground">
            Real-time queues for any park, refreshed every minute.
          </p>
        </div>
        {park && (
          <Button asChild variant="default" className="gap-1.5">
            <Link href="/planner">
              <CalendarClock className="h-4 w-4" />
              Build a plan for {park.name}
            </Link>
          </Button>
        )}
      </div>

      <div className="max-w-md space-y-1">
        <label className="text-sm font-medium">Park</label>
        <ParkPicker value={park} onChange={select} />
      </div>

      {ready && !park && (
        <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed py-16 text-center">
          <MapPin className="h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Pick a park to see its live wait board.
          </p>
        </div>
      )}

      {park && (
        <>
          <ParkHero
            parkId={park.id}
            parkName={park.name}
            subtitle={park.country ? `${park.country}${park.curated ? " · Curated data" : ""}` : undefined}
          />
          <WaitBoard parkId={park.id} />
        </>
      )}
    </ParkThemeProvider>
  );
}
