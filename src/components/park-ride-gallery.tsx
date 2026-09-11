"use client";

import { FerrisWheel, ImageOff } from "lucide-react";
import { useMemo, useState } from "react";
import { WaitPill } from "@/components/wait-pill";
import { Skeleton } from "@/components/ui/skeleton";
import { type LiveRideRow, useQueueTimes, useRidePhotos } from "@/lib/hooks";

function pickTopRides(rides: LiveRideRow[], count: number): LiveRideRow[] {
  const open = rides.filter((r) => r.isOpen);
  const pool = open.length ? open : rides;
  return [...pool]
    .sort((a, b) => (b.meta?.priority ?? 0) - (a.meta?.priority ?? 0) || b.wait - a.wait)
    .slice(0, count);
}

export function ParkRideGallery({ parkId }: { parkId: number }) {
  const { data, isLoading } = useQueueTimes(parkId);
  const top = useMemo(() => (data ? pickTopRides(data.rides, 8) : []), [data]);
  const { data: photosData } = useRidePhotos(top.map((r) => r.name));

  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-1">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-48 shrink-0 rounded-lg" />
        ))}
      </div>
    );
  }
  if (!top.length) return null;

  return (
    <div className="space-y-1.5">
      <h3 className="text-sm font-medium text-muted-foreground">Top attractions</h3>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {top.map((ride) => (
          <RideCard key={ride.id} ride={ride} photo={photosData?.images[ride.name]} />
        ))}
      </div>
    </div>
  );
}

function RideCard({
  ride,
  photo,
}: {
  ride: LiveRideRow;
  photo: { imageUrl: string; pageUrl: string } | null | undefined;
}) {
  const [failed, setFailed] = useState(false);
  const showPhoto = photo && !failed;

  return (
    <div className="relative h-32 w-48 shrink-0 overflow-hidden rounded-lg border bg-muted">
      {showPhoto ? (
        <img
          src={photo.imageUrl}
          alt=""
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted to-muted/50">
          {photo === null ? (
            <ImageOff className="h-6 w-6 text-muted-foreground/50" />
          ) : (
            <FerrisWheel className="h-6 w-6 text-muted-foreground/50" />
          )}
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-2 pt-6">
        <p className="truncate text-xs font-medium text-white">{ride.name}</p>
        <div className="mt-0.5 flex items-center justify-between">
          <span className="truncate text-[10px] text-white/70">{ride.land}</span>
          <WaitPill wait={ride.wait} isOpen={ride.isOpen} className="h-4 scale-75 px-1" />
        </div>
      </div>
    </div>
  );
}
