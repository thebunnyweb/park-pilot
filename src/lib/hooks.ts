"use client";

import { useQuery } from "@tanstack/react-query";

export async function apiGet<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || body.message || `Request failed (${res.status})`);
  }
  return res.json() as Promise<T>;
}

export async function apiSend<T>(
  url: string,
  method: "POST" | "PUT" | "PATCH" | "DELETE",
  body?: unknown,
): Promise<T> {
  const res = await fetch(url, {
    method,
    headers: body ? { "content-type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || data.message || `Request failed (${res.status})`);
    (err as Error & { payload?: unknown }).payload = data;
    throw err;
  }
  return data as T;
}

export interface ParkRow {
  id: number;
  name: string;
  country: string | null;
  continent: string | null;
  timezone: string | null;
  operatorId: number;
  operatorName: string;
  curated: boolean;
}

export function useParks() {
  return useQuery({
    queryKey: ["parks"],
    queryFn: () => apiGet<{ parks: ParkRow[] }>("/api/parks"),
    staleTime: 1000 * 60 * 60,
  });
}

export interface RideMeta {
  type: string;
  heightIn: number;
  toddlerFriendly: boolean;
  motion: string;
  priority: number;
  lane: "none" | "multi" | "single";
  durationMin: number;
  riderSwitch: boolean;
  tip?: string;
}

export interface LiveRideRow {
  id: number;
  name: string;
  land: string;
  wait: number;
  isOpen: boolean;
  lastUpdated: string;
  meta: RideMeta | null;
}

export interface QueueTimesResponse {
  parkId: number;
  curated: boolean;
  stats: {
    totalRides: number;
    openRides: number;
    closedRides: number;
    avgWait: number;
    medianWait: number;
    maxWait: number;
    busiest: { name: string; wait: number } | null;
    quietest: { name: string; wait: number } | null;
    lastUpdated: string | null;
  };
  lands: string[];
  rides: LiveRideRow[];
  fetchedAt: string;
}

export function useQueueTimes(parkId: number | null) {
  return useQuery({
    queryKey: ["queue-times", parkId],
    queryFn: () => apiGet<QueueTimesResponse>(`/api/parks/${parkId}/queue-times`),
    enabled: parkId != null,
    refetchInterval: 60_000,
    staleTime: 55_000,
  });
}

export interface TravellerRow {
  id: string;
  name: string;
  birthdate: string;
  heightInInches: number | null;
  thrillTolerance: "low" | "medium" | "high";
  needsMiddayBreak: boolean;
  mobilityNotes: string | null;
}

export function useTravellers() {
  return useQuery({
    queryKey: ["travellers"],
    queryFn: () => apiGet<{ travellers: TravellerRow[] }>("/api/travellers"),
  });
}

export interface PlanRow {
  id: string;
  parkId: number;
  parkName: string;
  date: string;
  summary: string | null;
  createdAt: string;
  updatedAt: string;
}

export function usePlans() {
  return useQuery({
    queryKey: ["plans"],
    queryFn: () => apiGet<{ plans: PlanRow[] }>("/api/plans"),
  });
}

export interface AiStatus {
  enabled: boolean;
  model: string | null;
  source: "user" | "env" | null;
  provider: string | null;
  supportsSearch: boolean;
  searchNote?: string;
}

export function useAiStatus() {
  return useQuery({
    queryKey: ["ai-status"],
    queryFn: () => apiGet<AiStatus>("/api/ai/status"),
    staleTime: 1000 * 60,
  });
}

export interface AiSettings {
  hasUserKey: boolean;
  hint: string | null;
  provider: string | null;
  model: string | null;
  baseUrl: string | null;
  effective: { model: string; source: "user" | "env"; provider: string; baseUrl: string } | null;
  envFallbackAvailable: boolean;
  providers: {
    id: string;
    label: string;
    baseUrl: string;
    defaultModel: string;
    keyPlaceholder: string;
    keysUrl: string;
    note?: string;
  }[];
}

export function useAiSettings() {
  return useQuery({
    queryKey: ["ai-settings"],
    queryFn: () => apiGet<AiSettings>("/api/settings/ai"),
  });
}

export interface TripDayRow {
  id: string;
  date: string;
  dayIndex: number;
  parkId: number | null;
  parkName: string | null;
  hopping: boolean;
  secondParkId: number | null;
  secondParkName: string | null;
  switchTime: string | null;
  planId?: string | null;
  plan?: { id: string; summary: string | null; itinerary: unknown; input: unknown } | null;
}

export interface TripRow {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  days: TripDayRow[];
}

export function useTrips() {
  return useQuery({
    queryKey: ["trips"],
    queryFn: () => apiGet<{ trips: TripRow[] }>("/api/trips"),
  });
}

export function useTrip(id: string | undefined) {
  return useQuery({
    queryKey: ["trip", id],
    queryFn: () => apiGet<{ trip: TripRow }>(`/api/trips/${id}`),
    enabled: Boolean(id),
  });
}

export interface WikiImage {
  title: string;
  imageUrl: string;
  pageUrl: string;
}

export function useParkPhoto(parkId: number | null, parkName: string | null) {
  return useQuery({
    queryKey: ["park-photo", parkId],
    queryFn: () =>
      apiGet<{ image: WikiImage | null }>(
        `/api/media/park-photo?parkId=${parkId}&parkName=${encodeURIComponent(parkName ?? "")}`,
      ),
    enabled: parkId != null && Boolean(parkName),
    staleTime: 1000 * 60 * 60 * 24,
    retry: false,
  });
}

export function useRidePhotos(titles: string[]) {
  const key = [...titles].sort().join("|");
  return useQuery({
    queryKey: ["ride-photos", key],
    queryFn: () =>
      apiSend<{ images: Record<string, WikiImage | null> }>("/api/media/ride-photos", "POST", {
        titles,
      }),
    enabled: titles.length > 0,
    staleTime: 1000 * 60 * 60 * 24,
    retry: false,
  });
}
