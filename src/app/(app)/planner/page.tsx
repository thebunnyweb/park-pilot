"use client";

import { useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CalendarClock,
  Loader2,
  RefreshCw,
  Save,
  Sparkles,
  Wand2,
} from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { toast } from "sonner";
import { ConnectClaude } from "@/components/connect-claude";
import { ItineraryTimeline } from "@/components/itinerary-timeline";
import { ParkHero } from "@/components/park-hero";
import { ParkPicker } from "@/components/park-picker";
import { ParkThemeProvider } from "@/components/park-theme-provider";
import { RideSelector, type RideSelection } from "@/components/ride-selector";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Textarea } from "@/components/ui/textarea";
import { apiSend, type ParkRow, useAiStatus, useTravellers, useTrip } from "@/lib/hooks";
import type { Itinerary, PlannerInput, SecondPark } from "@/lib/planner/types";
import { ageYears } from "@/lib/validations";
import { useSelectedPark } from "@/lib/use-selected-park";

type LaneStrategy = "none" | "multi" | "multi_plus_single";

interface PlanResponse {
  itinerary: Itinerary;
  input: PlannerInput;
}

export default function PlannerPage() {
  return (
    <Suspense fallback={<Skeleton className="mx-auto h-64 max-w-lg" />}>
      <PlannerInner />
    </Suspense>
  );
}

function PlannerInner() {
  const ai = useAiStatus();
  const { park: savedPark, select } = useSelectedPark();
  const { data: travellersData, isLoading: travellersLoading } = useTravellers();
  const router = useRouter();
  const qc = useQueryClient();
  const searchParams = useSearchParams();

  const tripId = searchParams.get("tripId");
  const dayId = searchParams.get("dayId");
  const { data: tripData } = useTrip(tripId ?? undefined);
  const day = tripData?.trip.days.find((d) => d.id === dayId);
  const dayIndex = day ? tripData!.trip.days.findIndex((d) => d.id === dayId) : -1;

  const [park, setPark] = useState<ParkRow | null>(savedPark);
  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [arrival, setArrival] = useState("08:15");
  const [departure, setDeparture] = useState("21:00");
  const [travellerIds, setTravellerIds] = useState<string[]>([]);
  const [lane, setLane] = useState<LaneStrategy>("multi");
  const [middayBreak, setMiddayBreak] = useState(true);
  const [searchEnabled, setSearchEnabled] = useState(false);
  const [rides, setRides] = useState<RideSelection>({ mustDo: [], skip: [] });
  const [notes, setNotes] = useState("");
  const [prefilled, setPrefilled] = useState(false);

  const [result, setResult] = useState<PlanResponse | null>(null);
  const [busy, setBusy] = useState<null | "generate" | "reoptimize" | "refine">(null);
  const [instruction, setInstruction] = useState("");

  // Prefill everything from the trip day the first time it (and travellers) load.
  useEffect(() => {
    if (prefilled || !dayId) return;
    if (!day || travellersLoading) return;
    if (day.parkId && day.parkName) {
      setPark({
        id: day.parkId,
        name: day.parkName,
        country: null,
        continent: null,
        timezone: null,
        operatorId: 0,
        operatorName: "",
        curated: false,
      });
    }
    setDate(day.date);
    setTravellerIds((travellersData?.travellers ?? []).map((t) => t.id));
    setPrefilled(true);
  }, [prefilled, dayId, day, travellersData, travellersLoading]);

  const secondPark: SecondPark | undefined =
    day?.hopping && day.secondParkId && day.secondParkName && day.switchTime
      ? { parkId: day.secondParkId, parkName: day.secondParkName, switchTime: day.switchTime }
      : undefined;

  if (ai.isLoading) {
    return <Skeleton className="mx-auto h-64 max-w-lg" />;
  }
  if (ai.data && !ai.data.enabled) {
    return <ConnectClaude />;
  }

  const effectivePark = dayId ? park : (park ?? savedPark);
  const canGenerate = Boolean(effectivePark) && travellerIds.length > 0 && !busy;
  const lockedToTrip = Boolean(dayId);

  async function generate(mode: "generate" | "reoptimize") {
    if (!effectivePark) return;
    setBusy(mode);
    try {
      const res = await apiSend<PlanResponse>("/api/ai/plan", "POST", {
        parkId: effectivePark.id,
        parkName: effectivePark.name,
        date,
        arrival,
        departure,
        travellerIds,
        mustDoRideIds: rides.mustDo,
        skipRideIds: rides.skip,
        laneStrategy: lane,
        middayBreak,
        notes: notes || undefined,
        secondPark,
        tripDayId: dayId ?? undefined,
        searchEnabled,
      });
      setResult(res);
      toast.success(mode === "reoptimize" ? "Plan re-optimized with live waits" : "Plan ready");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not build the plan");
    } finally {
      setBusy(null);
    }
  }

  async function refine() {
    if (!result || !instruction.trim()) return;
    setBusy("refine");
    try {
      const res = await apiSend<{ itinerary: Itinerary }>("/api/ai/refine", "POST", {
        instruction,
        itinerary: result.itinerary,
        input: result.input,
      });
      setResult({ ...result, itinerary: res.itinerary });
      setInstruction("");
      toast.success("Plan updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not refine");
    } finally {
      setBusy(null);
    }
  }

  async function save() {
    if (!result) return;
    try {
      const { id } = await apiSend<{ id: string }>("/api/plans", "POST", {
        parkId: result.itinerary.parkId,
        parkName: result.itinerary.parkName,
        date: result.itinerary.date,
        input: result.input,
        itinerary: result.itinerary,
        summary: result.itinerary.summary,
        tripDayId: dayId ?? undefined,
      });
      qc.invalidateQueries({ queryKey: ["plans"] });
      if (tripId) qc.invalidateQueries({ queryKey: ["trip", tripId] });
      toast.success("Plan saved");
      router.push(tripId ? `/trips/${tripId}` : `/plans/${id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not save");
    }
  }

  return (
    <ParkThemeProvider
      parkId={effectivePark?.id ?? null}
      parkName={effectivePark?.name ?? null}
      className="space-y-6"
    >
      {tripId && (
        <Link
          href={`/trips/${tripId}`}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> {tripData?.trip.name ?? "Back to trip"}
        </Link>
      )}

      <div>
        <h1 className="text-2xl font-semibold">
          {lockedToTrip ? `Day ${dayIndex + 1} plan` : "AI touring planner"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {ai.data?.model ? `Powered by ${ai.data.model}. ` : ""}
          Live waits + your travellers → a minute-by-minute plan.
        </p>
        {secondPark && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <Badge variant="outline">Park hopping</Badge>
            <span className="text-xs text-muted-foreground">
              {effectivePark?.name ?? "Park 1"} until {secondPark.switchTime}, then{" "}
              {secondPark.parkName}
            </span>
          </div>
        )}
      </div>

      {effectivePark && <ParkHero parkId={effectivePark.id} parkName={effectivePark.name} />}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_1fr]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">Trip details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label>Park</Label>
              {lockedToTrip ? (
                <div className="flex h-9 items-center rounded-md border bg-muted/40 px-3 text-sm">
                  {effectivePark?.name ?? "No park set for this day"}
                </div>
              ) : (
                <ParkPicker
                  value={effectivePark}
                  onChange={(p) => {
                    setPark(p);
                    select(p);
                    setRides({ mustDo: [], skip: [] });
                    setResult(null);
                  }}
                />
              )}
              {lockedToTrip && (
                <p className="text-xs text-muted-foreground">
                  Set on the{" "}
                  <Link href={`/trips/${tripId}`} className="underline">
                    trip page
                  </Link>
                  .
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                min={lockedToTrip ? undefined : today}
                disabled={lockedToTrip}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="arr">Arrive</Label>
                <Input id="arr" type="time" value={arrival} onChange={(e) => setArrival(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="dep">Leave</Label>
                <Input id="dep" type="time" value={departure} onChange={(e) => setDeparture(e.target.value)} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Who is going?</Label>
              {travellersLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : travellersData?.travellers.length ? (
                <div className="space-y-1.5 rounded-md border p-2">
                  {travellersData.travellers.map((t) => (
                    <label key={t.id} className="flex items-center gap-2 text-sm">
                      <Checkbox
                        checked={travellerIds.includes(t.id)}
                        onCheckedChange={(v) =>
                          setTravellerIds((ids) =>
                            v ? [...ids, t.id] : ids.filter((x) => x !== t.id),
                          )
                        }
                      />
                      {t.name}
                      <span className="text-xs text-muted-foreground">
                        age {ageYears(t.birthdate, date)}
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Add travellers first on the{" "}
                  <a href="/travellers" className="underline">
                    Travellers
                  </a>{" "}
                  page.
                </p>
              )}
            </div>

            {effectivePark && (
              <div className="space-y-1.5">
                <Label>Must-do &amp; skip</Label>
                <RideSelector parkId={effectivePark.id} value={rides} onChange={setRides} />
              </div>
            )}

            <div className="space-y-1.5">
              <Label>Lightning Lane strategy</Label>
              <Select value={lane} onValueChange={(v) => setLane(v as LaneStrategy)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None — rope drop &amp; low-wait windows only</SelectItem>
                  <SelectItem value="multi">Multi Pass / Express</SelectItem>
                  <SelectItem value="multi_plus_single">Multi Pass + paid individual rides</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {!secondPark && (
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={middayBreak}
                  onCheckedChange={(v) => setMiddayBreak(Boolean(v))}
                />
                Plan a midday break / nap
              </label>
            )}

            {ai.data?.supportsSearch && (
              <div className="space-y-1">
                <label className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={searchEnabled}
                    onCheckedChange={(v) => setSearchEnabled(Boolean(v))}
                  />
                  Include live search — events, hidden gems, photo spots, shopping
                </label>
                {searchEnabled && ai.data.searchNote && (
                  <p className="pl-6 text-xs text-muted-foreground">{ai.data.searchNote}</p>
                )}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="notes">Anything else?</Label>
              <Textarea
                id="notes"
                rows={2}
                placeholder="e.g. celebrating a birthday, want a sit-down lunch, stroller"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            <Button className="w-full gap-1.5" disabled={!canGenerate} onClick={() => generate("generate")}>
              {busy === "generate" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wand2 className="h-4 w-4" />
              )}
              {result ? "Rebuild plan" : "Build my plan"}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {!result && busy !== "generate" && (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed text-center">
              <CalendarClock className="h-8 w-8 text-muted-foreground" />
              <p className="max-w-xs text-sm text-muted-foreground">
                Fill in the trip details and Park Pilot will build a full day around today&apos;s
                live waits.
              </p>
            </div>
          )}

          {busy === "generate" && (
            <div className="space-y-2">
              <Skeleton className="h-6 w-40" />
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          )}

          {result && (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant="outline" className="gap-1.5" onClick={() => generate("reoptimize")} disabled={!!busy}>
                  {busy === "reoptimize" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Re-optimize with live waits
                </Button>
                <Button size="sm" className="gap-1.5" onClick={save} disabled={!!busy}>
                  <Save className="h-4 w-4" />
                  Save plan
                </Button>
                {result.itinerary.model && (
                  <span className="text-xs text-muted-foreground">
                    generated by {result.itinerary.model}
                  </span>
                )}
              </div>

              {result.itinerary.summary && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                      <Sparkles className="h-4 w-4 text-primary" />
                      Concierge notes
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm">
                    {result.itinerary.summary}
                  </CardContent>
                </Card>
              )}

              <ItineraryTimeline
                blocks={result.itinerary.blocks}
                warnings={result.itinerary.warnings}
                parkNames={
                  secondPark
                    ? {
                        [result.itinerary.parkId]: result.itinerary.parkName,
                        [secondPark.parkId]: secondPark.parkName,
                      }
                    : undefined
                }
              />

              <Card>
                <CardContent className="flex flex-col gap-2 p-3 sm:flex-row">
                  <Input
                    placeholder="Refine: 'we're tired, cut the afternoon' or 'more character meets'"
                    value={instruction}
                    onChange={(e) => setInstruction(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && refine()}
                  />
                  <Button
                    variant="secondary"
                    className="gap-1.5"
                    onClick={refine}
                    disabled={!!busy || !instruction.trim()}
                  >
                    {busy === "refine" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Wand2 className="h-4 w-4" />
                    )}
                    Refine
                  </Button>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    </ParkThemeProvider>
  );
}
