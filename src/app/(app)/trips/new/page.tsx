"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Loader2, MapPinned } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiSend } from "@/lib/hooks";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function daysLater(dateStr: string, n: number) {
  const d = new Date(`${dateStr}T12:00:00`);
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export default function NewTripPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [name, setName] = useState("Our Disney World trip");
  const [startDate, setStartDate] = useState(todayStr());
  const [endDate, setEndDate] = useState(daysLater(todayStr(), 3));
  const [saving, setSaving] = useState(false);

  const dayCount =
    Math.round(
      (new Date(`${endDate}T12:00:00`).getTime() - new Date(`${startDate}T12:00:00`).getTime()) /
        86_400_000,
    ) + 1;

  async function create() {
    setSaving(true);
    try {
      const { id } = await apiSend<{ id: string }>("/api/trips", "POST", {
        name,
        startDate,
        endDate,
      });
      qc.invalidateQueries({ queryKey: ["trips"] });
      toast.success("Trip created");
      router.push(`/trips/${id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create trip");
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">New trip</h1>
        <p className="text-sm text-muted-foreground">
          Set your dates, then assign a park to each day next.
        </p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <MapPinned className="h-4 w-4" />
            Trip details
          </CardTitle>
          <CardDescription>{dayCount > 0 ? `${dayCount} day trip` : "Pick valid dates"}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="name">Trip name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="start">Start date</Label>
              <Input
                id="start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="end">End date</Label>
              <Input
                id="end"
                type="date"
                min={startDate}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
          <Button
            className="w-full gap-1.5"
            disabled={saving || !name.trim() || dayCount < 1 || dayCount > 21}
            onClick={create}
          >
            {saving && <Loader2 className="h-4 w-4 animate-spin" />}
            Create trip
          </Button>
          {dayCount > 21 && (
            <p className="text-xs text-destructive">Trips longer than 21 days aren&apos;t supported yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
