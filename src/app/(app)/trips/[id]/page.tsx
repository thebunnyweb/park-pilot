"use client";

import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  ArrowLeft,
  CalendarClock,
  Check,
  ChevronRight,
  Loader2,
  Route,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ParkPicker } from "@/components/park-picker";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { apiSend, type ParkRow, type TripDayRow, useTrip } from "@/lib/hooks";

export default function TripDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const { data, isLoading } = useTrip(id);
  const [removing, setRemoving] = useState(false);

  async function removeTrip() {
    setRemoving(true);
    try {
      await apiSend(`/api/trips/${id}`, "DELETE");
      qc.invalidateQueries({ queryKey: ["trips"] });
      toast.success("Trip deleted");
      router.push("/trips");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not delete trip");
      setRemoving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-8 w-64" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    );
  }
  if (!data) return <p className="text-sm text-muted-foreground">Trip not found.</p>;

  const { trip } = data;

  return (
    <div className="space-y-6">
      <Link
        href="/trips"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" /> All trips
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{trip.name}</h1>
          <p className="text-sm text-muted-foreground">
            {format(new Date(`${trip.startDate}T12:00:00`), "d MMM")} –{" "}
            {format(new Date(`${trip.endDate}T12:00:00`), "d MMM yyyy")} · {trip.days.length} day
            {trip.days.length === 1 ? "" : "s"}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5 text-destructive"
          onClick={removeTrip}
          disabled={removing}
        >
          {removing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
          Delete trip
        </Button>
      </div>

      <div className="space-y-3">
        {trip.days.map((day, i) => (
          <DayCard key={day.id} tripId={trip.id} day={day} dayIndex={i} />
        ))}
      </div>
    </div>
  );
}

function DayCard({
  tripId,
  day,
  dayIndex,
}: {
  tripId: string;
  day: TripDayRow;
  dayIndex: number;
}) {
  const qc = useQueryClient();
  const todayStr = new Date().toISOString().slice(0, 10);
  const isToday = day.date === todayStr;

  const [park, setPark] = useState<ParkRow | null>(
    day.parkId && day.parkName
      ? {
          id: day.parkId,
          name: day.parkName,
          country: null,
          continent: null,
          timezone: null,
          operatorId: 0,
          operatorName: "",
          curated: false,
        }
      : null,
  );
  const [hopping, setHopping] = useState(day.hopping);
  const [secondPark, setSecondPark] = useState<ParkRow | null>(
    day.secondParkId && day.secondParkName
      ? {
          id: day.secondParkId,
          name: day.secondParkName,
          country: null,
          continent: null,
          timezone: null,
          operatorId: 0,
          operatorName: "",
          curated: false,
        }
      : null,
  );
  const [switchTime, setSwitchTime] = useState(day.switchTime ?? "14:00");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  async function saveDay() {
    setSaving(true);
    try {
      await apiSend(`/api/trips/${tripId}/days/${day.id}`, "PUT", {
        parkId: park?.id ?? null,
        parkName: park?.name ?? null,
        hopping,
        secondParkId: hopping ? secondPark?.id ?? null : null,
        secondParkName: hopping ? secondPark?.name ?? null : null,
        switchTime: hopping ? switchTime : null,
      });
      qc.invalidateQueries({ queryKey: ["trip", tripId] });
      toast.success(`Day ${dayIndex + 1} updated`);
      setDirty(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  const plannerHref = `/planner?tripId=${tripId}&dayId=${day.id}`;
  const ready = Boolean(park) && (!hopping || Boolean(secondPark));

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          Day {dayIndex + 1}
          <span className="font-normal text-muted-foreground">
            {format(new Date(`${day.date}T12:00:00`), "EEEE, d MMM")}
          </span>
          {isToday && <Badge className="h-5 px-1.5 text-[10px]">Today</Badge>}
        </CardTitle>
        {day.planId ? (
          <Badge variant="outline" className="gap-1 text-emerald-600 dark:text-emerald-400">
            <Check className="h-3 w-3" /> Planned
          </Badge>
        ) : (
          <Badge variant="outline" className="text-muted-foreground">
            Not planned
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Park</Label>
            <ParkPicker
              value={park}
              onChange={(p) => {
                setPark(p);
                setDirty(true);
              }}
            />
          </div>
          <div className="flex flex-col justify-end gap-1.5">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={hopping}
                onCheckedChange={(v) => {
                  setHopping(Boolean(v));
                  setDirty(true);
                }}
              />
              Park hop today?
            </label>
          </div>
        </div>

        {hopping && (
          <div className="grid gap-3 rounded-md border bg-muted/30 p-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Second park</Label>
              <ParkPicker
                value={secondPark}
                onChange={(p) => {
                  setSecondPark(p);
                  setDirty(true);
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Switch around</Label>
              <Input
                type="time"
                value={switchTime}
                onChange={(e) => {
                  setSwitchTime(e.target.value);
                  setDirty(true);
                }}
              />
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-1">
          {dirty && (
            <Button size="sm" onClick={saveDay} disabled={saving} className="gap-1.5">
              {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Save day
            </Button>
          )}
          {!dirty && ready && (
            <Button asChild size="sm" variant={day.planId ? "outline" : "default"} className="gap-1.5">
              <Link href={day.planId ? `/plans/${day.planId}` : plannerHref}>
                {day.planId ? <Route className="h-3.5 w-3.5" /> : <CalendarClock className="h-3.5 w-3.5" />}
                {day.planId ? "View plan" : "Build this day's plan"}
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          )}
          {!dirty && day.planId && (
            <Button asChild size="sm" variant="ghost" className="gap-1.5 text-xs">
              <Link href={plannerHref}>Rebuild</Link>
            </Button>
          )}
          {!dirty && !ready && (
            <p className="text-xs text-muted-foreground">
              Pick a park{hopping ? " (and a second park)" : ""} to plan this day.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
