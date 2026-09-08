export interface ChecklistItem {
  key: string;
  label: string;
  detail?: string;
  toddler?: boolean; // only shown when a traveller is under 4
}

export interface ChecklistSection {
  title: string;
  when: string;
  items: ChecklistItem[];
}

export const CHECKLIST: ChecklistSection[] = [
  {
    title: "As soon as the trip is booked",
    when: "60+ days out",
    items: [
      { key: "app", label: "Install the park's official app", detail: "My Disney Experience or the Universal app — you will live in it for wait times, mobile food orders and Lightning Lane." },
      { key: "account", label: "Create your account and link everyone's tickets in the app" },
      { key: "dining", label: "Book table-service dining", detail: "Disney opens reservations 60 days ahead; the popular spots go within minutes." },
      { key: "hours", label: "Check park hours and Early Entry for your dates", detail: "They are often not published until ~60 days out. Re-check a week before." },
      { key: "toddler-ident", label: "Pack a card with your phone number for your child's pocket", detail: "Point out staff (name tags / lanyards) as the people to find if they get lost.", toddler: true },
    ],
  },
  {
    title: "A week before",
    when: "7 days out",
    items: [
      { key: "ll-plan", label: "Decide your Lightning Lane / Express strategy per day", detail: "Which one or two rides are worth paying to skip? Park Pilot's planner will slot them in." },
      { key: "weather", label: "Check the forecast and pack rain ponchos", detail: "Afternoon storms are routine in Florida summer; ponchos beat $30 branded ones inside." },
      { key: "shoes", label: "Break in your walking shoes", detail: "Expect 8–12 miles a day." },
      { key: "stroller", label: "Arrange a stroller", detail: "An outside rental company is far cheaper than the in-park rental and can include a rain cover.", toddler: true },
      { key: "stroller-tag", label: "Print a luggage tag for the stroller", detail: "Strollers get moved by staff; a tag makes yours easy to find.", toddler: true },
    ],
  },
  {
    title: "The night before each park day",
    when: "Every evening",
    items: [
      { key: "charge", label: "Charge phones and a battery pack", detail: "The app drains batteries fast. Bring a pack per adult." },
      { key: "generate-plan", label: "Generate or re-check tomorrow's plan in Park Pilot" },
      { key: "mobile-order", label: "Pick lunch and place a mobile order slot", detail: "Order from your phone ~1 hour before you want to eat to skip the counter line." },
      { key: "bag", label: "Pack the bag: water, sunscreen, hats, snacks, meds, change of clothes" },
      { key: "wake", label: "Set an early alarm — plan to be at the gate 45 min before open", detail: "The first hour is worth three midday hours." },
    ],
  },
  {
    title: "Toddler logistics (in the park)",
    when: "During the day",
    items: [
      { key: "baby-care", label: "Find the Baby Care Center on arrival", detail: "Changing tables, nursing rooms, microwave, and a quiet, air-conditioned space for a meltdown reset.", toddler: true },
      { key: "rider-switch", label: "Ask for Rider Switch at any ride your child is too small for", detail: "One adult waits with the child, then swaps in without re-queuing. Both adults ride.", toddler: true },
      { key: "nap", label: "Protect the midday nap", detail: "Go back to the hotel or let them sleep in the stroller during the hottest, busiest hours.", toddler: true },
      { key: "snacks", label: "Feed on a schedule", detail: "A hungry toddler at 1pm in a 200-minute standby line is the classic mistake." },
      { key: "afternoon", label: "Save air-conditioned shows for the afternoon", detail: "Great pacing tool once the heat and crowds peak.", toddler: true },
    ],
  },
  {
    title: "Money & time savers",
    when: "Throughout",
    items: [
      { key: "single-rider", label: "Use single-rider lines when you are doing Rider Switch anyway" },
      { key: "parade-window", label: "Ride headliners during parades and fireworks", detail: "Waits drop noticeably while crowds watch." },
      { key: "leave-early", label: "For fireworks with a toddler, watch from a spot near the exit or leave before the finale", detail: "The post-show crush with a stroller is brutal." },
      { key: "refill", label: "Bring refillable water bottles", detail: "Quick-service counters give free cups of ice water." },
    ],
  },
];

export function flatChecklistKeys(includeToddler: boolean): string[] {
  return CHECKLIST.flatMap((s) =>
    s.items.filter((i) => includeToddler || !i.toddler).map((i) => i.key),
  );
}
