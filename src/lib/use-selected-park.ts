"use client";

import { useCallback, useEffect, useState } from "react";
import type { ParkRow } from "@/lib/hooks";

const KEY = "pp.selectedPark";

export function useSelectedPark() {
  const [park, setPark] = useState<ParkRow | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setPark(JSON.parse(raw));
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  const select = useCallback((next: ParkRow) => {
    setPark(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  }, []);

  return { park, select, ready };
}
