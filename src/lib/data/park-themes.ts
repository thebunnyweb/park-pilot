/**
 * Per-park visual identity: an accent colour + icon motif + tagline, so the app
 * visibly changes character when you switch parks instead of looking identical
 * everywhere. Colours are HSL triples ("H S% L%") matching the CSS custom
 * property format already used in globals.css / tailwind.config.ts, so they can
 * be applied by overriding --primary/--ring on a wrapping element — no Tailwind
 * rebuild needed.
 *
 * Curated parks (the same set as lib/data/overlay.ts) get a hand-picked identity.
 * Every other park gets a theme deterministically derived from its name, so the
 * ~120 uncurated parks still each look distinct and stable across visits.
 */

export type ParkIconName =
  | "Castle"
  | "Globe"
  | "Clapperboard"
  | "Trees"
  | "Sun"
  | "Compass"
  | "Film"
  | "FerrisWheel"
  | "Rocket"
  | "Waves"
  | "Mountain"
  | "Sparkles";

export interface ParkTheme {
  primary: string; // HSL triple, e.g. "262 70% 50%"
  gradientFrom: string;
  gradientTo: string;
  icon: ParkIconName;
  tagline: string;
}

export const PARK_THEMES: Record<number, ParkTheme> = {
  6: {
    // Magic Kingdom
    primary: "262 68% 52%",
    gradientFrom: "262 60% 22%",
    gradientTo: "290 55% 30%",
    icon: "Castle",
    tagline: "Where the magic begins",
  },
  5: {
    // Epcot
    primary: "189 72% 38%",
    gradientFrom: "199 65% 16%",
    gradientTo: "175 55% 22%",
    icon: "Globe",
    tagline: "A world of discovery",
  },
  7: {
    // Hollywood Studios
    primary: "16 82% 50%",
    gradientFrom: "12 60% 20%",
    gradientTo: "330 45% 24%",
    icon: "Clapperboard",
    tagline: "Lights, camera, action",
  },
  8: {
    // Animal Kingdom
    primary: "142 45% 34%",
    gradientFrom: "150 40% 14%",
    gradientTo: "90 30% 20%",
    icon: "Trees",
    tagline: "Nature's greatest show",
  },
  16: {
    // Disneyland
    primary: "350 70% 48%",
    gradientFrom: "350 55% 20%",
    gradientTo: "35 60% 26%",
    icon: "Castle",
    tagline: "The original magic",
  },
  17: {
    // Disney California Adventure
    primary: "24 85% 50%",
    gradientFrom: "18 65% 22%",
    gradientTo: "200 50% 24%",
    icon: "Sun",
    tagline: "California dreaming",
  },
  64: {
    // Islands of Adventure
    primary: "150 55% 33%",
    gradientFrom: "155 45% 14%",
    gradientTo: "40 40% 20%",
    icon: "Compass",
    tagline: "Ride the story",
  },
  65: {
    // Universal Studios Florida
    primary: "214 80% 45%",
    gradientFrom: "220 60% 18%",
    gradientTo: "260 45% 24%",
    icon: "Film",
    tagline: "You're part of the show",
  },
  66: {
    // Universal Studios Hollywood
    primary: "201 75% 40%",
    gradientFrom: "205 60% 16%",
    gradientTo: "10 55% 22%",
    icon: "Clapperboard",
    tagline: "Hollywood's real deal",
  },
};

const FALLBACK_ICONS: ParkIconName[] = [
  "FerrisWheel",
  "Rocket",
  "Waves",
  "Mountain",
  "Sparkles",
  "Compass",
  "Globe",
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

/** Deterministic theme for a park with no hand-curated entry. */
function fallbackTheme(parkId: number, parkName: string): ParkTheme {
  const h = hashString(parkName || String(parkId));
  const hue = h % 360;
  const icon = FALLBACK_ICONS[h % FALLBACK_ICONS.length];
  return {
    primary: `${hue} 55% 45%`,
    gradientFrom: `${hue} 45% 16%`,
    gradientTo: `${(hue + 40) % 360} 40% 22%`,
    icon,
    tagline: "Your day, planned",
  };
}

export function getParkTheme(parkId: number, parkName: string): ParkTheme {
  return PARK_THEMES[parkId] ?? fallbackTheme(parkId, parkName);
}
