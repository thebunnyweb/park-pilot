"use client";

import {
  Castle,
  Clapperboard,
  Compass,
  ExternalLink,
  FerrisWheel,
  Film,
  Globe,
  Mountain,
  Rocket,
  Sparkles,
  Sun,
  Trees,
  Waves,
} from "lucide-react";
import { useState } from "react";
import { getParkTheme, type ParkIconName } from "@/lib/data/park-themes";
import { useParkPhoto } from "@/lib/hooks";

const ICONS: Record<ParkIconName, typeof Castle> = {
  Castle,
  Globe,
  Clapperboard,
  Trees,
  Sun,
  Compass,
  Film,
  FerrisWheel,
  Rocket,
  Waves,
  Mountain,
  Sparkles,
};

export function ParkHero({
  parkId,
  parkName,
  subtitle,
}: {
  parkId: number;
  parkName: string;
  subtitle?: string;
}) {
  const theme = getParkTheme(parkId, parkName);
  const Icon = ICONS[theme.icon];
  const { data, isLoading } = useParkPhoto(parkId, parkName);
  const [imgFailed, setImgFailed] = useState(false);
  const photo = !imgFailed ? data?.image : null;

  return (
    <div
      className="relative h-44 overflow-hidden rounded-xl border text-white shadow-sm transition-[background] duration-500 sm:h-56"
      style={{
        background: `linear-gradient(135deg, hsl(${theme.gradientFrom}), hsl(${theme.gradientTo}))`,
      }}
    >
      {photo && (
        <img
          key={photo.imageUrl}
          src={photo.imageUrl}
          alt=""
          onError={() => setImgFailed(true)}
          className="absolute inset-0 h-full w-full animate-in fade-in object-cover duration-700"
        />
      )}
      {/* Legibility gradient — always present so text reads the same with or without a photo */}
      <div
        className="absolute inset-0"
        style={{
          background: photo
            ? "linear-gradient(0deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.25) 55%, rgba(0,0,0,0.15) 100%)"
            : undefined,
        }}
      />
      {!photo && (
        <Icon
          className="pointer-events-none absolute -right-6 -top-6 h-40 w-40 opacity-15"
          strokeWidth={1.1}
        />
      )}

      <div className="relative flex h-full flex-col justify-end p-5">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm">
            <Icon className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold leading-tight drop-shadow-sm">
              {parkName}
            </h2>
            <p className="truncate text-sm text-white/85">{subtitle ?? theme.tagline}</p>
          </div>
        </div>
        {photo && (
          <a
            href={photo.pageUrl}
            target="_blank"
            rel="noreferrer"
            className="absolute bottom-2 right-3 flex items-center gap-1 text-[10px] text-white/60 hover:text-white/90"
          >
            Photo: Wikipedia <ExternalLink className="h-2.5 w-2.5" />
          </a>
        )}
      </div>

      {isLoading && !photo && (
        <div className="absolute inset-0 animate-pulse bg-white/5" />
      )}
    </div>
  );
}
