"use client";

import { Baby, RefreshCw, Search, Ticket, TriangleAlert } from "lucide-react";
import { useMemo, useState } from "react";
import { UpdatedAgo } from "@/components/updated-ago";
import { WaitPill } from "@/components/wait-pill";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { type LiveRideRow, useQueueTimes } from "@/lib/hooks";
import { cn } from "@/lib/utils";

type SortKey = "wait-desc" | "wait-asc" | "name" | "priority";

export function WaitBoard({ parkId }: { parkId: number }) {
  const { data, isLoading, isError, error, isFetching, refetch } = useQueueTimes(parkId);
  const [q, setQ] = useState("");
  const [land, setLand] = useState("all");
  const [sort, setSort] = useState<SortKey>("wait-desc");
  const [toddlerOnly, setToddlerOnly] = useState(false);
  const [laneOnly, setLaneOnly] = useState(false);
  const [hideClosed, setHideClosed] = useState(true);

  const curated = data?.curated ?? false;

  const rides = useMemo(() => {
    let list: LiveRideRow[] = data?.rides ?? [];
    if (q.trim()) {
      const needle = q.toLowerCase();
      list = list.filter((r) => r.name.toLowerCase().includes(needle));
    }
    if (land !== "all") list = list.filter((r) => r.land === land);
    if (toddlerOnly) list = list.filter((r) => r.meta?.toddlerFriendly);
    if (laneOnly) list = list.filter((r) => r.meta && r.meta.lane !== "none");
    if (hideClosed) list = list.filter((r) => r.isOpen);

    const sorted = [...list];
    sorted.sort((a, b) => {
      switch (sort) {
        case "wait-asc":
          return a.wait - b.wait;
        case "name":
          return a.name.localeCompare(b.name);
        case "priority":
          return (b.meta?.priority ?? 0) - (a.meta?.priority ?? 0) || b.wait - a.wait;
        default:
          return b.wait - a.wait;
      }
    });
    return sorted;
  }, [data, q, land, sort, toddlerOnly, laneOnly, hideClosed]);

  if (isError) {
    return (
      <Alert variant="destructive">
        <TriangleAlert className="h-4 w-4" />
        <AlertDescription>
          Could not load live waits: {error instanceof Error ? error.message : "unknown error"}.
          <Button variant="outline" size="sm" className="ml-3" onClick={() => refetch()}>
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Open rides" value={data ? `${data.stats.openRides}/${data.stats.totalRides}` : "—"} loading={isLoading} />
        <Stat label="Average wait" value={data ? `${data.stats.avgWait}m` : "—"} loading={isLoading} />
        <Stat label="Longest wait" value={data ? `${data.stats.maxWait}m` : "—"} loading={isLoading} />
        <Stat
          label="Busiest now"
          value={data?.stats.busiest ? data.stats.busiest.name : "—"}
          sub={data?.stats.busiest ? `${data.stats.busiest.wait}m` : undefined}
          loading={isLoading}
        />
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-lg border bg-card p-3">
        <div className="relative min-w-[180px] flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search rides"
            className="pl-8"
          />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Land</Label>
          <Select value={land} onValueChange={setLand}>
            <SelectTrigger className="w-[170px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All lands</SelectItem>
              {(data?.lands ?? []).map((l) => (
                <SelectItem key={l} value={l}>
                  {l}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Sort</Label>
          <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="wait-desc">Longest wait</SelectItem>
              <SelectItem value="wait-asc">Shortest wait</SelectItem>
              <SelectItem value="name">Name</SelectItem>
              {curated && <SelectItem value="priority">Must-do priority</SelectItem>}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          {curated && (
            <>
              <FilterToggle active={toddlerOnly} onClick={() => setToddlerOnly((v) => !v)}>
                <Baby className="h-3.5 w-3.5" /> Toddler-friendly
              </FilterToggle>
              <FilterToggle active={laneOnly} onClick={() => setLaneOnly((v) => !v)}>
                <Ticket className="h-3.5 w-3.5" /> Lightning Lane
              </FilterToggle>
            </>
          )}
          <FilterToggle active={hideClosed} onClick={() => setHideClosed((v) => !v)}>
            Hide closed
          </FilterToggle>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => refetch()}
          className="ml-auto gap-1.5"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", isFetching && "animate-spin")} />
          <UpdatedAgo iso={data?.stats.lastUpdated ?? null} />
        </Button>
      </div>

      {!curated && data && (
        <p className="text-xs text-muted-foreground">
          No curated ride data for this park — the toddler / Lightning Lane filters are hidden.
          The AI planner still works using live waits.
        </p>
      )}

      {isLoading ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2">
          {rides.map((r) => (
            <RideRow key={r.id} ride={r} />
          ))}
          {rides.length === 0 && (
            <p className="col-span-full py-8 text-center text-sm text-muted-foreground">
              No rides match these filters.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function RideRow({ ride }: { ride: LiveRideRow }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card p-3">
      <WaitPill wait={ride.wait} isOpen={ride.isOpen} />
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">{ride.name}</div>
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <span>{ride.land}</span>
          {ride.meta?.heightIn ? (
            <Badge variant="outline" className="h-4 px-1 text-[10px]">
              {ride.meta.heightIn}&quot;
            </Badge>
          ) : null}
          {ride.meta?.toddlerFriendly && (
            <Badge variant="outline" className="h-4 gap-0.5 px-1 text-[10px]">
              <Baby className="h-2.5 w-2.5" /> toddler ok
            </Badge>
          )}
          {ride.meta && ride.meta.lane !== "none" && (
            <Badge variant="outline" className="h-4 px-1 text-[10px] capitalize">
              {ride.meta.lane === "single" ? "paid LL" : "Lightning Lane"}
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  sub,
  loading,
}: {
  label: string;
  value: string;
  sub?: string;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-3">
        <div className="text-xs text-muted-foreground">{label}</div>
        {loading ? (
          <Skeleton className="mt-1 h-6 w-16" />
        ) : (
          <div className="truncate text-lg font-semibold">{value}</div>
        )}
        {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
      </CardContent>
    </Card>
  );
}

function FilterToggle({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-md border px-2 py-1.5 text-xs transition-colors",
        active
          ? "border-primary bg-primary/10 text-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}
