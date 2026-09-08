/**
 * Curated attraction metadata ("overlay") for the major US Disney & Universal parks.
 *
 * queue-times.com only gives live wait numbers. This overlay adds the context a
 * touring plan needs: height limits, whether a toddler can ride, ride intensity,
 * Lightning Lane / Express eligibility, duration and a planning priority.
 *
 * Keyed by park id -> queue-times ride id. Parks without an overlay fall back to
 * the model's own knowledge of the park plus the live wait list.
 *
 * heightIn: minimum height in inches, 0 = no requirement.
 * priority: 1 (skippable) .. 5 (must-do headliner).
 * lane: "multi" = Lightning Lane Multi Pass / Express, "single" = paid individual, "none".
 */

export type RideType =
  | "thrill"
  | "family"
  | "kids"
  | "show"
  | "meet"
  | "walkthrough"
  | "coaster";

export interface OverlayEntry {
  type: RideType;
  heightIn: number;
  toddlerFriendly: boolean;
  motion: "none" | "mild" | "high";
  darkOrLoud: boolean;
  priority: 1 | 2 | 3 | 4 | 5;
  lane: "none" | "multi" | "single";
  durationMin: number;
  riderSwitch: boolean;
  indoor: boolean;
  tip?: string;
}

type ParkOverlay = Record<number, OverlayEntry>;

const e = (
  type: RideType,
  opts: Partial<OverlayEntry> & { priority: OverlayEntry["priority"] },
): OverlayEntry => ({
  type,
  heightIn: 0,
  toddlerFriendly: type === "kids" || type === "show" || type === "meet" || type === "walkthrough",
  motion: "none",
  darkOrLoud: false,
  lane: "none",
  durationMin: 5,
  riderSwitch: false,
  indoor: false,
  ...opts,
});

// ---------------------------------------------------------------------------
// Magic Kingdom (park 6)
// ---------------------------------------------------------------------------
const magicKingdom: ParkOverlay = {
  134: e("family", { priority: 4, lane: "multi", durationMin: 10, toddlerFriendly: true, indoor: false, tip: "Jungle Cruise — long midday lines, ride early or with Lightning Lane." }),
  137: e("family", { priority: 4, lane: "multi", durationMin: 9, toddlerFriendly: true, darkOrLoud: true, indoor: true, tip: "Pirates of the Caribbean — one small drop, mild." }),
  141: e("kids", { priority: 2, durationMin: 2, toddlerFriendly: true, tip: "Magic Carpets of Aladdin — Dumbo-style spinner." }),
  355: e("walkthrough", { priority: 1, durationMin: 15, toddlerFriendly: true }),
  334: e("show", { priority: 2, durationMin: 15, toddlerFriendly: true, indoor: true }),
  1184: e("walkthrough", { priority: 1, durationMin: 20, toddlerFriendly: true }),
  133: e("family", { priority: 3, lane: "multi", durationMin: 12, toddlerFriendly: true, indoor: true, tip: "it's a small world — air-conditioned, great toddler reset." }),
  132: e("kids", { priority: 3, durationMin: 2, toddlerFriendly: true, tip: "Dumbo — there is an indoor play area for the queue." }),
  128: e("show", { priority: 3, lane: "multi", durationMin: 20, toddlerFriendly: true, indoor: true, tip: "Enchanted Tales with Belle — interactive, toddlers love it." }),
  135: e("family", { priority: 2, lane: "multi", durationMin: 2, motion: "mild", toddlerFriendly: true, tip: "Mad Tea Party — teacups, skip if prone to motion sickness." }),
  147: e("meet", { priority: 2, lane: "multi", durationMin: 5, toddlerFriendly: true }),
  6700: e("meet", { priority: 2, lane: "multi", durationMin: 8, toddlerFriendly: true }),
  6699: e("meet", { priority: 2, lane: "multi", durationMin: 8, toddlerFriendly: true }),
  144: e("meet", { priority: 1, durationMin: 5, toddlerFriendly: true }),
  145: e("meet", { priority: 1, durationMin: 5, toddlerFriendly: true }),
  171: e("show", { priority: 3, lane: "multi", durationMin: 12, toddlerFriendly: true, indoor: true, darkOrLoud: true, tip: "Mickey's PhilharMagic — 3D, loud in spots but short." }),
  136: e("family", { priority: 5, lane: "multi", durationMin: 3, toddlerFriendly: true, darkOrLoud: true, indoor: true, tip: "Peter Pan's Flight — always a long line, rope drop or Lightning Lane." }),
  161: e("kids", { priority: 2, durationMin: 2, toddlerFriendly: true }),
  129: e("coaster", { priority: 5, heightIn: 38, lane: "single", durationMin: 3, motion: "mild", riderSwitch: true, tip: "Seven Dwarfs Mine Train — family coaster, 38\" min. Rider Switch for the little one." }),
  126: e("coaster", { priority: 3, heightIn: 35, lane: "multi", durationMin: 1, motion: "mild", riderSwitch: true, tip: "The Barnstormer — gentle starter coaster, 35\" min." }),
  142: e("family", { priority: 3, lane: "multi", durationMin: 4, toddlerFriendly: true, darkOrLoud: true, indoor: true }),
  127: e("family", { priority: 3, lane: "multi", durationMin: 6, toddlerFriendly: true, indoor: true, tip: "Under the Sea — usually walk-on after 4pm." }),
  1181: e("family", { priority: 2, durationMin: 20, toddlerFriendly: true, tip: "WDW Railroad — a ride and a way to rest little legs." }),
  1189: e("family", { priority: 2, durationMin: 20, toddlerFriendly: true }),
  130: e("coaster", { priority: 4, heightIn: 40, lane: "multi", durationMin: 3, motion: "high", riderSwitch: true, tip: "Big Thunder Mountain — 40\" min, mild coaster but too big for under-3." }),
  1214: e("show", { priority: 2, durationMin: 12, toddlerFriendly: true, indoor: true }),
  13630: e("family", { priority: 5, heightIn: 40, lane: "multi", durationMin: 5, motion: "high", darkOrLoud: true, riderSwitch: true, tip: "Tiana's Bayou Adventure — log flume with a big drop, 40\" min. Rider Switch." }),
  140: e("family", { priority: 4, lane: "multi", durationMin: 8, darkOrLoud: true, indoor: true, toddlerFriendly: true, tip: "Haunted Mansion — dark and spooky-silly; fine for many toddlers, no height limit." }),
  356: e("show", { priority: 1, durationMin: 23, toddlerFriendly: true, indoor: true }),
  1188: e("family", { priority: 1, durationMin: 5, toddlerFriendly: true }),
  146: e("meet", { priority: 3, lane: "multi", durationMin: 8, toddlerFriendly: true, tip: "Meet Mickey at Town Square Theater — indoor, near the entrance." }),
  248: e("thrill", { priority: 1, heightIn: 44, durationMin: 2, motion: "high" }),
  131: e("family", { priority: 3, lane: "multi", durationMin: 5, toddlerFriendly: true, darkOrLoud: true, indoor: true, tip: "Buzz Lightyear — interactive shooter, toddlers can sit on a lap." }),
  125: e("show", { priority: 2, durationMin: 15, toddlerFriendly: true, indoor: true }),
  138: e("coaster", { priority: 4, heightIn: 44, lane: "multi", durationMin: 3, motion: "high", darkOrLoud: true, riderSwitch: true, tip: "Space Mountain — dark indoor coaster, 44\" min." }),
  143: e("family", { priority: 2, heightIn: 32, lane: "multi", durationMin: 5, tip: "Tomorrowland Speedway — 32\" to ride with an adult, 54\" to drive alone." }),
  1190: e("family", { priority: 3, durationMin: 10, toddlerFriendly: true, indoor: false, tip: "PeopleMover — breezy, relaxing, almost never a wait. Perfect toddler break." }),
  11527: e("coaster", { priority: 5, heightIn: 40, lane: "single", durationMin: 2, motion: "high", riderSwitch: true, tip: "TRON Lightcycle / Run — fast launch coaster, 40\" min, buy the individual Lightning Lane or join the virtual queue at 7am." }),
  457: e("show", { priority: 1, durationMin: 21, toddlerFriendly: true, indoor: true }),
};

// ---------------------------------------------------------------------------
// EPCOT (park 5)
// ---------------------------------------------------------------------------
const epcot: ParkOverlay = {
  155: e("family", { priority: 2, lane: "multi", durationMin: 6, toddlerFriendly: true, indoor: true }),
  159: e("family", { priority: 3, lane: "multi", durationMin: 16, toddlerFriendly: true, darkOrLoud: true, indoor: true, tip: "Spaceship Earth — slow dark ride inside the big golf ball, gentle." }),
  2495: e("show", { priority: 1, durationMin: 18, toddlerFriendly: true, indoor: true }),
  13627: e("meet", { priority: 2, lane: "multi", durationMin: 8, toddlerFriendly: true }),
  10916: e("coaster", { priority: 5, heightIn: 42, lane: "single", durationMin: 3, motion: "high", darkOrLoud: true, riderSwitch: true, tip: "Guardians of the Galaxy: Cosmic Rewind — big indoor coaster, 42\" min. Virtual queue or paid Lightning Lane only." }),
  158: e("thrill", { priority: 3, heightIn: 40, lane: "multi", durationMin: 5, motion: "high", riderSwitch: true, tip: "Mission: SPACE — choose the Green (mild) side; Orange spins. 40\" min." }),
  160: e("thrill", { priority: 4, heightIn: 40, lane: "multi", durationMin: 5, motion: "high", riderSwitch: true, tip: "Test Track — fast outdoor finish, 40\" min." }),
  156: e("family", { priority: 2, lane: "multi", durationMin: 14, toddlerFriendly: true, indoor: true, tip: "Living with the Land — calm boat ride, usually short wait, good nap-fighter." }),
  153: e("family", { priority: 2, lane: "multi", durationMin: 4, toddlerFriendly: true, indoor: true }),
  152: e("show", { priority: 2, durationMin: 12, toddlerFriendly: true, indoor: true, tip: "Turtle Talk with Crush — interactive, great for little kids." }),
  12387: e("walkthrough", { priority: 2, durationMin: 20, toddlerFriendly: true, tip: "Journey of Water — outdoor splash-and-play trail, bring a change of clothes." }),
  16467: e("family", { priority: 5, heightIn: 40, lane: "multi", durationMin: 5, motion: "mild", riderSwitch: true, tip: "Soarin' — feet-dangling flight simulator, 40\" min, gentle but high." }),
  2679: e("family", { priority: 5, lane: "multi", durationMin: 5, toddlerFriendly: true, darkOrLoud: true, indoor: true, tip: "Frozen Ever After — small backwards drop, very popular, rope drop or Lightning Lane." }),
  466: e("family", { priority: 2, lane: "multi", durationMin: 8, toddlerFriendly: true, indoor: true }),
  6701: e("meet", { priority: 3, lane: "multi", durationMin: 10, toddlerFriendly: true, tip: "Meet Anna & Elsa at Royal Sommerhus — usually a shorter line than in Magic Kingdom." }),
  10914: e("family", { priority: 5, lane: "multi", durationMin: 5, toddlerFriendly: true, darkOrLoud: true, indoor: true, tip: "Remy's Ratatouille Adventure — trackless 3D dark ride, no height limit, toddler-friendly." }),
  829: e("show", { priority: 1, durationMin: 15, toddlerFriendly: true, indoor: true }),
};

// ---------------------------------------------------------------------------
// Hollywood Studios (park 7)
// ---------------------------------------------------------------------------
const hollywoodStudios: ParkOverlay = {
  6361: e("family", { priority: 5, lane: "multi", durationMin: 5, toddlerFriendly: true, darkOrLoud: true, indoor: true, tip: "Mickey & Minnie's Runaway Railway — trackless dark ride, no height limit. Rope drop." }),
  117: e("family", { priority: 4, lane: "multi", durationMin: 5, toddlerFriendly: true, indoor: true, tip: "Toy Story Mania — 3D shooter, toddlers ride on a lap." }),
  5477: e("family", { priority: 2, heightIn: 32, lane: "multi", durationMin: 2, motion: "mild", riderSwitch: true, tip: "Alien Swirling Saucers — mild spinner, 32\" min." }),
  5476: e("coaster", { priority: 5, heightIn: 38, lane: "multi", durationMin: 2, motion: "mild", riderSwitch: true, tip: "Slinky Dog Dash — family coaster, 38\" min, the park's toughest line. Rope drop or Lightning Lane." }),
  6368: e("thrill", { priority: 4, heightIn: 38, lane: "multi", durationMin: 5, motion: "mild", riderSwitch: true, tip: "Millennium Falcon: Smugglers Run — cockpit simulator, 38\" min." }),
  6369: e("thrill", { priority: 5, heightIn: 40, lane: "single", durationMin: 18, motion: "high", darkOrLoud: true, riderSwitch: true, tip: "Rise of the Resistance — the park's best ride, 40\" min. Paid Lightning Lane or rope drop." }),
  123: e("thrill", { priority: 4, heightIn: 40, lane: "multi", durationMin: 4, motion: "high", darkOrLoud: true, riderSwitch: true, tip: "Tower of Terror — drop ride, 40\" min." }),
  16342: e("coaster", { priority: 3, heightIn: 48, lane: "multi", durationMin: 2, motion: "high", darkOrLoud: true, riderSwitch: true, tip: "Rock 'n' Roller Coaster — launch coaster with inversions, 48\" min." }),
  120: e("thrill", { priority: 3, heightIn: 40, lane: "multi", durationMin: 5, motion: "high", riderSwitch: true, tip: "Star Tours — 3D motion simulator, 40\" min." }),
  1174: e("show", { priority: 3, durationMin: 30, toddlerFriendly: true, indoor: true, tip: "Frozen Sing-Along — air-conditioned, funny, great toddler break." }),
  1176: e("show", { priority: 3, durationMin: 25, toddlerFriendly: true, indoor: false }),
  14859: e("show", { priority: 3, durationMin: 17, toddlerFriendly: true, indoor: true }),
  16641: e("show", { priority: 3, durationMin: 25, toddlerFriendly: true, indoor: true, tip: "Disney Jr. Play & Dance — aimed right at toddlers and preschoolers." }),
  6702: e("show", { priority: 2, durationMin: 30, toddlerFriendly: true, darkOrLoud: true }),
  7333: e("show", { priority: 1, durationMin: 15, toddlerFriendly: true, indoor: true }),
  5145: e("walkthrough", { priority: 1, durationMin: 20, toddlerFriendly: true }),
};

// ---------------------------------------------------------------------------
// Animal Kingdom (park 8)
// ---------------------------------------------------------------------------
const animalKingdom: ParkOverlay = {
  113: e("family", { priority: 5, lane: "multi", durationMin: 22, toddlerFriendly: true, tip: "Kilimanjaro Safaris — real animals, open-air truck, no height limit. Go early for active animals." }),
  651: e("walkthrough", { priority: 2, durationMin: 25, toddlerFriendly: true }),
  655: e("family", { priority: 1, durationMin: 7, toddlerFriendly: true }),
  657: e("show", { priority: 4, lane: "multi", durationMin: 30, toddlerFriendly: true, indoor: true, tip: "Festival of the Lion King — outstanding, air-conditioned. A must." }),
  110: e("coaster", { priority: 4, heightIn: 44, lane: "multi", durationMin: 3, motion: "high", darkOrLoud: true, riderSwitch: true, tip: "Expedition Everest — coaster with a backwards section, 44\" min." }),
  112: e("family", { priority: 3, heightIn: 38, lane: "multi", durationMin: 5, motion: "mild", riderSwitch: true, tip: "Kali River Rapids — you will get soaked, 38\" min." }),
  10921: e("show", { priority: 2, durationMin: 12, toddlerFriendly: true }),
  10920: e("show", { priority: 3, durationMin: 25, toddlerFriendly: true, indoor: true, tip: "Finding Nemo: The Big Blue — big Broadway-style musical, air-conditioned." }),
  116: e("meet", { priority: 2, lane: "multi", durationMin: 8, toddlerFriendly: true }),
  12451: e("meet", { priority: 2, lane: "multi", durationMin: 8, toddlerFriendly: true }),
  13751: e("walkthrough", { priority: 2, durationMin: 20, toddlerFriendly: true }),
  14943: e("show", { priority: 3, durationMin: 20, toddlerFriendly: true, indoor: true }),
  4439: e("thrill", { priority: 5, heightIn: 44, lane: "single", durationMin: 5, motion: "mild", darkOrLoud: true, riderSwitch: true, tip: "Avatar Flight of Passage — 3D flight simulator, the park's headliner, 44\" min. Paid Lightning Lane or rope drop." }),
  4438: e("family", { priority: 4, lane: "multi", durationMin: 5, toddlerFriendly: true, darkOrLoud: true, indoor: true, tip: "Na'vi River Journey — gentle glowing boat ride, no height limit." }),
  13811: e("walkthrough", { priority: 1, durationMin: 15, toddlerFriendly: true }),
  13812: e("walkthrough", { priority: 1, durationMin: 15, toddlerFriendly: true }),
  13808: e("walkthrough", { priority: 1, durationMin: 30, toddlerFriendly: true, tip: "Wilderness Explorers — a park-wide badge activity, fun for older kids." }),
};

// ---------------------------------------------------------------------------
// Disneyland (park 16)
// ---------------------------------------------------------------------------
const disneyland: ParkOverlay = {
  326: e("thrill", { priority: 4, heightIn: 46, lane: "multi", durationMin: 4, motion: "high", darkOrLoud: true, riderSwitch: true, tip: "Indiana Jones Adventure — jeep dark ride, 46\" min." }),
  296: e("family", { priority: 3, lane: "multi", durationMin: 10, toddlerFriendly: true }),
  289: e("family", { priority: 4, lane: "multi", durationMin: 15, toddlerFriendly: true, darkOrLoud: true, indoor: true, tip: "Pirates of the Caribbean — two small drops, longer than the Florida version." }),
  14168: e("family", { priority: 5, heightIn: 40, lane: "multi", durationMin: 5, motion: "high", darkOrLoud: true, riderSwitch: true, tip: "Tiana's Bayou Adventure — log flume with a big drop, 40\" min." }),
  306: e("family", { priority: 3, lane: "multi", durationMin: 4, toddlerFriendly: true, darkOrLoud: true, indoor: true }),
  307: e("family", { priority: 3, lane: "multi", durationMin: 12, toddlerFriendly: true, indoor: true }),
  285: e("family", { priority: 2, lane: "multi", durationMin: 4, toddlerFriendly: true, indoor: true }),
  275: e("kids", { priority: 3, durationMin: 2, toddlerFriendly: true }),
  277: e("kids", { priority: 1, durationMin: 2, toddlerFriendly: true }),
  278: e("family", { priority: 2, durationMin: 2, motion: "mild", toddlerFriendly: true }),
  279: e("coaster", { priority: 4, heightIn: 42, lane: "multi", durationMin: 4, motion: "high", riderSwitch: true, tip: "Matterhorn Bobsleds — rough older coaster, 42\" min." }),
  280: e("family", { priority: 2, lane: "multi", durationMin: 2, toddlerFriendly: true, darkOrLoud: true, indoor: true }),
  281: e("family", { priority: 5, lane: "multi", durationMin: 3, toddlerFriendly: true, darkOrLoud: true, indoor: true, tip: "Peter Pan's Flight — brutal line all day, rope drop or Lightning Lane." }),
  283: e("family", { priority: 3, lane: "multi", durationMin: 2, toddlerFriendly: true, darkOrLoud: true, indoor: true }),
  305: e("family", { priority: 2, durationMin: 9, toddlerFriendly: true }),
  323: e("coaster", { priority: 4, heightIn: 40, lane: "multi", durationMin: 3, motion: "high", riderSwitch: true, tip: "Big Thunder Mountain — 40\" min." }),
  324: e("coaster", { priority: 3, heightIn: 35, lane: "multi", durationMin: 1, motion: "mild", riderSwitch: true, tip: "Chip 'n' Dale's GADGETcoaster — starter coaster, 35\" min." }),
  11526: e("family", { priority: 5, lane: "multi", durationMin: 5, toddlerFriendly: true, darkOrLoud: true, indoor: true, tip: "Mickey & Minnie's Runaway Railway — trackless dark ride, no height limit." }),
  709: e("meet", { priority: 2, durationMin: 10, toddlerFriendly: true }),
  325: e("family", { priority: 4, lane: "multi", durationMin: 8, darkOrLoud: true, indoor: true, toddlerFriendly: true, tip: "Haunted Mansion — no height limit; some toddlers find it too dark." }),
  6339: e("thrill", { priority: 4, heightIn: 38, lane: "multi", durationMin: 5, motion: "mild", riderSwitch: true, tip: "Millennium Falcon: Smugglers Run — 38\" min." }),
  6340: e("thrill", { priority: 5, heightIn: 40, lane: "multi", durationMin: 18, motion: "high", darkOrLoud: true, riderSwitch: true, tip: "Rise of the Resistance — 40\" min, the park's best. Lightning Lane worth it." }),
  273: e("family", { priority: 3, lane: "multi", durationMin: 5, toddlerFriendly: true, darkOrLoud: true, indoor: true }),
  276: e("family", { priority: 2, lane: "multi", durationMin: 15, toddlerFriendly: true, indoor: true }),
  284: e("coaster", { priority: 4, heightIn: 40, lane: "multi", durationMin: 3, motion: "high", darkOrLoud: true, riderSwitch: true, tip: "Space Mountain — 40\" min, dark indoor coaster." }),
  286: e("thrill", { priority: 3, heightIn: 40, lane: "multi", durationMin: 5, motion: "high", riderSwitch: true }),
  317: e("family", { priority: 2, heightIn: 32, lane: "multi", durationMin: 4 }),
};

// ---------------------------------------------------------------------------
// Disney California Adventure (park 17)
// ---------------------------------------------------------------------------
const dca: ParkOverlay = {
  329: e("thrill", { priority: 4, heightIn: 40, lane: "multi", durationMin: 3, motion: "high", darkOrLoud: true, riderSwitch: true, tip: "Guardians – Mission: BREAKOUT! — drop tower, 40\" min." }),
  8843: e("family", { priority: 4, lane: "multi", durationMin: 4, toddlerFriendly: true, indoor: true, tip: "WEB SLINGERS — 3D shooter, no height limit." }),
  295: e("thrill", { priority: 5, heightIn: 40, lane: "single", durationMin: 4, motion: "high", riderSwitch: true, tip: "Radiator Springs Racers — the park's headliner, 40\" min. Single-rider line moves faster." }),
  302: e("thrill", { priority: 3, heightIn: 42, lane: "multi", durationMin: 5, motion: "mild", riderSwitch: true, tip: "Grizzly River Run — raft ride, you will get wet, 42\" min." }),
  6440: e("show", { priority: 3, lane: "multi", durationMin: 12, toddlerFriendly: true, indoor: true, darkOrLoud: true }),
};

// ---------------------------------------------------------------------------
// Universal's Islands of Adventure (park 64)
// ---------------------------------------------------------------------------
const ioa: ParkOverlay = {
  8721: e("coaster", { priority: 5, heightIn: 51, lane: "multi", durationMin: 3, motion: "high", riderSwitch: true, tip: "VelociCoaster — intense launch coaster, 51\" min." }),
  5994: e("thrill", { priority: 3, heightIn: 42, lane: "multi", durationMin: 6, motion: "high", riderSwitch: true, tip: "Jurassic Park River Adventure — big final drop, 42\" min." }),
  6017: e("family", { priority: 3, lane: "multi", durationMin: 6, toddlerFriendly: true, darkOrLoud: true, indoor: true }),
  6008: e("walkthrough", { priority: 2, durationMin: 20, toddlerFriendly: true, tip: "Camp Jurassic — big outdoor play area, let the toddler run." }),
  5985: e("family", { priority: 5, lane: "multi", durationMin: 5, toddlerFriendly: true, darkOrLoud: true, indoor: true, tip: "Amazing Adventures of Spider-Man — 3D dark ride, no height limit, toddler-friendly." }),
  6004: e("coaster", { priority: 5, heightIn: 54, lane: "multi", durationMin: 2, motion: "high", riderSwitch: true, tip: "Incredible Hulk Coaster — launch + inversions, 54\" min." }),
  5988: e("thrill", { priority: 2, heightIn: 52, durationMin: 1, motion: "high" }),
  6003: e("family", { priority: 2, durationMin: 2, motion: "mild", toddlerFriendly: true }),
  5987: e("kids", { priority: 3, lane: "multi", durationMin: 3, toddlerFriendly: true, indoor: true, tip: "The Cat in the Hat — gentle spinning dark ride, no height limit." }),
  5986: e("kids", { priority: 1, durationMin: 2, toddlerFriendly: true }),
  5997: e("kids", { priority: 2, durationMin: 2, toddlerFriendly: true }),
  6001: e("kids", { priority: 2, lane: "multi", durationMin: 3, toddlerFriendly: true }),
  5991: e("coaster", { priority: 3, heightIn: 36, lane: "multi", durationMin: 1, motion: "mild", riderSwitch: true, tip: "Flight of the Hippogriff — starter coaster, 36\" min." }),
  6682: e("coaster", { priority: 5, heightIn: 48, lane: "multi", durationMin: 3, motion: "high", riderSwitch: true, tip: "Hagrid's Magical Creatures Motorbike Adventure — story coaster, 48\" min, long lines." }),
  5992: e("thrill", { priority: 4, heightIn: 48, lane: "multi", durationMin: 4, motion: "high", darkOrLoud: true, riderSwitch: true, tip: "Harry Potter and the Forbidden Journey — motion-heavy dark ride, 48\" min." }),
  6015: e("family", { priority: 3, lane: "multi", durationMin: 5, toddlerFriendly: true, indoor: true, tip: "Hogwarts Express — needs a park-to-park ticket." }),
  5989: e("thrill", { priority: 3, heightIn: 44, lane: "multi", durationMin: 5, motion: "high", riderSwitch: true, tip: "Dudley Do-Right's Ripsaw Falls — soaking log flume, 44\" min." }),
  5998: e("family", { priority: 2, heightIn: 42, lane: "multi", durationMin: 5, riderSwitch: true }),
  6013: e("walkthrough", { priority: 1, durationMin: 15, toddlerFriendly: true }),
};

// ---------------------------------------------------------------------------
// Universal Studios Florida (park 65)
// ---------------------------------------------------------------------------
const usf: ParkOverlay = {
  13605: e("coaster", { priority: 3, heightIn: 36, lane: "multi", durationMin: 2, motion: "mild", riderSwitch: true, tip: "Trolls Trollercoaster — starter coaster, 36\" min." }),
  5990: e("family", { priority: 3, lane: "multi", durationMin: 5, toddlerFriendly: true, darkOrLoud: true, indoor: true, tip: "E.T. Adventure — gentle classic dark ride, no height limit." }),
  5984: e("thrill", { priority: 4, heightIn: 40, lane: "multi", durationMin: 5, motion: "high", riderSwitch: true, tip: "Despicable Me Minion Mayhem — motion simulator, 40\" min (stationary seats available)." }),
  12107: e("family", { priority: 3, lane: "multi", durationMin: 5, toddlerFriendly: true, indoor: true }),
  6000: e("coaster", { priority: 4, heightIn: 48, lane: "multi", durationMin: 3, motion: "high", darkOrLoud: true, riderSwitch: true, tip: "Revenge of the Mummy — indoor launch coaster, 48\" min." }),
  6006: e("thrill", { priority: 4, heightIn: 40, lane: "multi", durationMin: 5, motion: "high", darkOrLoud: true, riderSwitch: true, tip: "TRANSFORMERS: The Ride-3D — intense 3D dark ride, 40\" min." }),
  6014: e("coaster", { priority: 5, heightIn: 42, lane: "multi", durationMin: 5, motion: "high", darkOrLoud: true, riderSwitch: true, tip: "Escape from Gringotts — coaster-dark-ride hybrid, 42\" min." }),
  6016: e("family", { priority: 3, lane: "multi", durationMin: 5, toddlerFriendly: true, indoor: true, tip: "Hogwarts Express — needs a park-to-park ticket." }),
  5996: e("family", { priority: 4, heightIn: 42, lane: "multi", durationMin: 5, motion: "mild", riderSwitch: true, tip: "MEN IN BLACK Alien Attack — spinning laser shooter, 42\" min." }),
  6005: e("thrill", { priority: 3, heightIn: 40, lane: "multi", durationMin: 5, motion: "high", riderSwitch: true, tip: "The Simpsons Ride — motion simulator, 40\" min." }),
  5995: e("kids", { priority: 2, durationMin: 2, toddlerFriendly: true }),
  6018: e("thrill", { priority: 2, heightIn: 40, lane: "multi", durationMin: 5, motion: "high", riderSwitch: true }),
};

// ---------------------------------------------------------------------------
// Universal Studios Hollywood (park 66)
// ---------------------------------------------------------------------------
const ush: ParkOverlay = {
  6049: e("thrill", { priority: 4, heightIn: 42, lane: "multi", durationMin: 5, motion: "high", darkOrLoud: true, riderSwitch: true, tip: "Jurassic World – The Ride — big final drop, 42\" min." }),
  6050: e("coaster", { priority: 4, heightIn: 48, lane: "multi", durationMin: 3, motion: "high", darkOrLoud: true, riderSwitch: true, tip: "Revenge of the Mummy — indoor launch coaster, 48\" min." }),
  6045: e("thrill", { priority: 4, heightIn: 40, lane: "multi", durationMin: 5, motion: "high", riderSwitch: true, tip: "Despicable Me Minion Mayhem — simulator, 40\" min." }),
  14926: e("kids", { priority: 2, durationMin: 2, toddlerFriendly: true }),
  7332: e("family", { priority: 3, lane: "multi", durationMin: 5, toddlerFriendly: true, indoor: true, tip: "Secret Life of Pets — gentle dark ride, no height limit." }),
  6053: e("thrill", { priority: 3, heightIn: 40, lane: "multi", durationMin: 5, motion: "high", riderSwitch: true }),
  11513: e("family", { priority: 5, heightIn: 40, lane: "multi", durationMin: 5, motion: "mild", darkOrLoud: true, riderSwitch: true, tip: "Mario Kart: Bowser's Challenge — AR dark ride, 40\" min, long lines all day." }),
  6047: e("coaster", { priority: 3, heightIn: 39, lane: "multi", durationMin: 1, motion: "mild", riderSwitch: true, tip: "Flight of the Hippogriff — starter coaster, 39\" min." }),
  6048: e("thrill", { priority: 4, heightIn: 48, lane: "multi", durationMin: 4, motion: "high", darkOrLoud: true, riderSwitch: true, tip: "Harry Potter and the Forbidden Journey — motion-heavy, 48\" min." }),
  6051: e("family", { priority: 5, lane: "multi", durationMin: 60, toddlerFriendly: true, tip: "Studio Tour — the signature 1-hour tram tour, no height limit." }),
  6055: e("thrill", { priority: 4, heightIn: 40, lane: "multi", durationMin: 5, motion: "high", darkOrLoud: true, riderSwitch: true }),
};

export const PARK_OVERLAYS: Record<number, ParkOverlay> = {
  5: epcot,
  6: magicKingdom,
  7: hollywoodStudios,
  8: animalKingdom,
  16: disneyland,
  17: dca,
  64: ioa,
  65: usf,
  66: ush,
};

export const CURATED_PARK_IDS = Object.keys(PARK_OVERLAYS).map(Number);

export function getOverlay(parkId: number): ParkOverlay | null {
  return PARK_OVERLAYS[parkId] ?? null;
}

export function hasOverlay(parkId: number): boolean {
  return parkId in PARK_OVERLAYS;
}
