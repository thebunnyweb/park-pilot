"use client";

import { Search, Star, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { WaitPill } from "@/components/wait-pill";
import { useQueueTimes } from "@/lib/hooks";
import { cn } from "@/lib/utils";

export interface RideSelection {
  mustDo: number[];
  skip: number[];
}

export function RideSelector({
  parkId,
  value,
  onChange,
}: {
  parkId: number;
  value: RideSelection;
  onChange: (next: RideSelection) => void;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const { data, isLoading } = useQueueTimes(parkId);

  const rides = useMemo(() => {
    const list = (data?.rides ?? []).filter((r) => r.isOpen || r.meta);
    const needle = q.trim().toLowerCase();
    const filtered = needle
      ? list.filter((r) => r.name.toLowerCase().includes(needle))
      : list;
    return [...filtered].sort(
      (a, b) => (b.meta?.priority ?? 0) - (a.meta?.priority ?? 0) || b.wait - a.wait,
    );
  }, [data, q]);

  const mustSet = new Set(value.mustDo);
  const skipSet = new Set(value.skip);

  function toggle(id: number, kind: "must" | "skip") {
    const must = new Set(value.mustDo);
    const skip = new Set(value.skip);
    if (kind === "must") {
      if (must.has(id)) must.delete(id);
      else {
        must.add(id);
        skip.delete(id);
      }
    } else {
      if (skip.has(id)) skip.delete(id);
      else {
        skip.add(id);
        must.delete(id);
      }
    }
    onChange({ mustDo: [...must], skip: [...skip] });
  }

  const nameById = new Map((data?.rides ?? []).map((r) => [r.id, r.name]));

  return (
    <div className="space-y-2">
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full justify-start font-normal">
            {value.mustDo.length + value.skip.length > 0
              ? `${value.mustDo.length} must-do · ${value.skip.length} skip`
              : "Pick must-do rides and rides to skip"}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Must-do &amp; skip</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-8"
              placeholder="Search rides"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <ScrollArea className="h-[50vh] pr-3">
            {isLoading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Loading rides…</p>
            ) : (
              <ul className="space-y-1">
                {rides.map((r) => {
                  const must = mustSet.has(r.id);
                  const skip = skipSet.has(r.id);
                  return (
                    <li
                      key={r.id}
                      className="flex items-center gap-2 rounded-md border p-2"
                    >
                      <WaitPill wait={r.wait} isOpen={r.isOpen} className="scale-90" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm">{r.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {r.land}
                          {r.meta?.heightIn ? ` · ${r.meta.heightIn}"` : ""}
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant={must ? "default" : "outline"}
                        className="h-7 gap-1 px-2 text-xs"
                        onClick={() => toggle(r.id, "must")}
                      >
                        <Star className="h-3 w-3" /> Must
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={skip ? "destructive" : "outline"}
                        className="h-7 gap-1 px-2 text-xs"
                        onClick={() => toggle(r.id, "skip")}
                      >
                        <X className="h-3 w-3" /> Skip
                      </Button>
                    </li>
                  );
                })}
              </ul>
            )}
          </ScrollArea>
          <DialogFooter>
            <Button onClick={() => setOpen(false)}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {value.mustDo.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {value.mustDo.map((id) => (
            <span
              key={id}
              className={cn(
                "inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary",
              )}
            >
              <Star className="h-3 w-3" />
              {nameById.get(id) ?? `#${id}`}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
