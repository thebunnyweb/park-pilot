"use client";

import {
  Castle,
  Clapperboard,
  Compass,
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
import { getParkTheme, type ParkIconName } from "@/lib/data/park-themes";

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

  return (
    <div
      className="relative overflow-hidden rounded-xl border p-5 text-white shadow-sm transition-[background] duration-500"
      style={{
        background: `linear-gradient(135deg, hsl(${theme.gradientFrom}), hsl(${theme.gradientTo}))`,
      }}
    >
      <Icon className="pointer-events-none absolute -right-4 -top-4 h-28 w-28 opacity-15" strokeWidth={1.25} />
      <div className="relative flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-semibold leading-tight">{parkName}</h2>
          <p className="text-sm text-white/80">{subtitle ?? theme.tagline}</p>
        </div>
      </div>
    </div>
  );
}
