/**
 * Static, best-effort planning context per park. Hours and show times vary by
 * season and are always shown in the app as "verify in the official app".
 */

export interface ParkMeta {
  /** Typical published opening / closing time, 24h local. Early Entry ~30-60min before open. */
  typicalOpen: string;
  typicalClose: string;
  ropeDropAdvice: string;
  /** Rough walking minutes between lands, used to reduce backtracking. */
  landAdjacency?: Record<string, Record<string, number>>;
  /** Fixed daily events the planner should anchor around. */
  events?: { name: string; approxTime: string; note?: string }[];
  notes?: string[];
}

export const PARK_META: Record<number, ParkMeta> = {
  6: {
    typicalOpen: "09:00",
    typicalClose: "22:00",
    ropeDropAdvice:
      "Be at the tap-in 45 minutes before official open. At rope drop head straight to Seven Dwarfs Mine Train or Peter Pan's Flight, then sweep the rest of Fantasyland.",
    landAdjacency: {
      "Main Street, U.S.A.": { Adventureland: 5, Tomorrowland: 6, Fantasyland: 7, "Liberty Square": 6 },
      Adventureland: { "Main Street, U.S.A.": 5, Frontierland: 3, "Liberty Square": 4 },
      Frontierland: { Adventureland: 3, "Liberty Square": 3, Fantasyland: 6 },
      "Liberty Square": { Frontierland: 3, Fantasyland: 4, "Main Street, U.S.A.": 6 },
      Fantasyland: { "Liberty Square": 4, Tomorrowland: 6, "Main Street, U.S.A.": 7, Frontierland: 6 },
      Tomorrowland: { Fantasyland: 6, "Main Street, U.S.A.": 6 },
    },
    events: [
      { name: "Afternoon parade", approxTime: "15:00", note: "Great time to ride headliners while crowds line the route." },
      { name: "Fireworks", approxTime: "21:00", note: "For a toddler, watch from Main Street or leave before to beat the exit crush." },
    ],
    notes: [
      "Baby Care Center is next to the Crystal Palace at the Main Street/Adventureland hub.",
      "Rider Switch lets both adults ride Mine Train, Space Mountain, Big Thunder, TRON and Tiana's without waiting twice.",
    ],
  },
  5: {
    typicalOpen: "09:00",
    typicalClose: "21:00",
    ropeDropAdvice:
      "Rope drop Frozen Ever After or Remy's Ratatouille Adventure (World Showcase), or Guardians / Test Track (World Discovery). You cannot do both ends first, so pick one.",
    landAdjacency: {
      "World Celebration": { "World Discovery": 5, "World Nature": 5, "World Showcase": 7 },
      "World Discovery": { "World Celebration": 5, "World Showcase": 8 },
      "World Nature": { "World Celebration": 5, "World Showcase": 8 },
      "World Showcase": { "World Celebration": 7, "World Discovery": 8, "World Nature": 8 },
    },
    events: [
      { name: "Nighttime spectacular", approxTime: "21:00", note: "Best viewed from the World Showcase Lagoon promenade." },
    ],
    notes: [
      "World Showcase opens later than the front of the park (often 11:00).",
      "Baby Care Center is in World Celebration near the front.",
      "EPCOT involves the most walking of the four parks — plan a real midday break.",
    ],
  },
  7: {
    typicalOpen: "09:00",
    typicalClose: "21:00",
    ropeDropAdvice:
      "Rope drop Slinky Dog Dash or Rise of the Resistance. Both build to 90+ minute waits within an hour of opening.",
    landAdjacency: {
      "Hollywood Boulevard": { "Sunset Boulevard": 4, "Echo Lake": 4, "Animation Courtyard": 4 },
      "Sunset Boulevard": { "Hollywood Boulevard": 4 },
      "Echo Lake": { "Hollywood Boulevard": 4, "Grand Avenue": 3, "Star Wars: Galaxy's Edge": 6 },
      "Star Wars: Galaxy's Edge": { "Echo Lake": 6, "Toy Story Land": 7 },
      "Toy Story Land": { "Star Wars: Galaxy's Edge": 7, "Pixar Plaza": 2 },
      "Animation Courtyard": { "Hollywood Boulevard": 4, "Pixar Plaza": 3 },
    },
    events: [
      { name: "Fantasmic!", approxTime: "20:00", note: "Book the Fantasmic! dining package or arrive 45+ min early for a seat." },
    ],
    notes: [
      "Lots of air-conditioned shows here — good for pacing a toddler through the afternoon heat.",
      "Baby Care Center is on Grand Avenue near the First Aid station.",
    ],
  },
  8: {
    typicalOpen: "08:00",
    typicalClose: "19:00",
    ropeDropAdvice:
      "Rope drop Avatar Flight of Passage in Pandora, then Na'vi River Journey, then Kilimanjaro Safaris (animals are most active in the cool morning).",
    landAdjacency: {
      "The Oasis": { "Discovery Island": 3 },
      "Discovery Island": { "The Oasis": 3, Africa: 4, Asia: 5, "Pandora - The World of Avatar": 4, "Dinoland U.S.A": 5 },
      "Pandora - The World of Avatar": { "Discovery Island": 4, Africa: 6 },
      Africa: { "Discovery Island": 4, Asia: 6, "Pandora - The World of Avatar": 6 },
      Asia: { "Discovery Island": 5, Africa: 6, "Dinoland U.S.A": 4 },
      "Dinoland U.S.A": { "Discovery Island": 5, Asia: 4 },
    },
    events: [
      { name: "Festival of the Lion King", approxTime: "multiple", note: "Check the first show time and go early in the day." },
    ],
    notes: [
      "Animal Kingdom closes earliest of the four parks — start early.",
      "Kilimanjaro Safaris animal activity drops sharply after ~11:00 in summer.",
      "Baby Care Center is on Discovery Island.",
    ],
  },
  16: {
    typicalOpen: "08:00",
    typicalClose: "24:00",
    ropeDropAdvice:
      "Rope drop Rise of the Resistance or Peter Pan's Flight. Fantasyland dark rides load slowly and lines balloon fast.",
    events: [{ name: "Fireworks", approxTime: "21:30" }],
    notes: ["Baby Care Center is at the north end of Main Street, U.S.A."],
  },
  17: {
    typicalOpen: "08:00",
    typicalClose: "22:00",
    ropeDropAdvice:
      "Rope drop Radiator Springs Racers (or grab a Lightning Lane the moment they go on sale), then Web Slingers.",
    notes: ["Baby Care Center is in the Pacific Wharf / San Fransokyo area."],
  },
  64: {
    typicalOpen: "09:00",
    typicalClose: "19:00",
    ropeDropAdvice:
      "Rope drop Hagrid's Magical Creatures Motorbike Adventure — it routinely hits 2+ hours by mid-morning — then VelociCoaster.",
    notes: ["Universal's single-rider lines and Early Park Admission (with a hotel stay) are the big time-savers."],
  },
  65: {
    typicalOpen: "09:00",
    typicalClose: "21:00",
    ropeDropAdvice: "Rope drop Escape from Gringotts, then Hollywood Rip Ride Rockit or the Minion rides.",
    notes: ["A park-to-park ticket is required to ride the Hogwarts Express between the two Orlando parks."],
  },
  66: {
    typicalOpen: "09:00",
    typicalClose: "20:00",
    ropeDropAdvice:
      "Rope drop Super Nintendo World (Mario Kart) or the Studio Tour, then Harry Potter.",
    notes: ["Super Nintendo World may require a timed entry reservation or virtual line at busy times."],
  },
};

const GENERIC_META: ParkMeta = {
  typicalOpen: "10:00",
  typicalClose: "18:00",
  ropeDropAdvice:
    "Arrive before opening and ride the single most popular attraction first, then work outward from that area while waits are still low.",
  notes: ["No curated data for this park — the plan uses live waits and general touring principles."],
};

export function getParkMeta(parkId: number): ParkMeta {
  return PARK_META[parkId] ?? GENERIC_META;
}
