"use client";

import { Check, ChevronsUpDown, Star } from "lucide-react";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { type ParkRow, useParks } from "@/lib/hooks";
import { cn } from "@/lib/utils";

export function ParkPicker({
  value,
  onChange,
  className,
}: {
  value: ParkRow | null;
  onChange: (park: ParkRow) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const { data, isLoading } = useParks();

  const groups = useMemo(() => {
    const parks = data?.parks ?? [];
    const byOperator = new Map<string, ParkRow[]>();
    const curated = parks.filter((p) => p.curated);
    for (const p of parks) {
      const list = byOperator.get(p.operatorName) ?? [];
      list.push(p);
      byOperator.set(p.operatorName, list);
    }
    return {
      curated,
      operators: [...byOperator.entries()].sort((a, b) => a[0].localeCompare(b[0])),
    };
  }, [data]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between font-normal", className)}
        >
          {value ? value.name : isLoading ? "Loading parks…" : "Choose a park…"}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command
          filter={(val, search) => (val.toLowerCase().includes(search.toLowerCase()) ? 1 : 0)}
        >
          <CommandInput placeholder="Search 130+ parks…" />
          <CommandList>
            <CommandEmpty>No park found.</CommandEmpty>
            {groups.curated.length > 0 && (
              <CommandGroup heading="Curated — sharper plans">
                {groups.curated.map((p) => (
                  <ParkOption
                    key={`c-${p.id}`}
                    park={p}
                    selected={value?.id === p.id}
                    onSelect={() => {
                      onChange(p);
                      setOpen(false);
                    }}
                  />
                ))}
              </CommandGroup>
            )}
            {groups.operators.map(([operator, parks]) => (
              <CommandGroup key={operator} heading={operator}>
                {parks.map((p) => (
                  <ParkOption
                    key={p.id}
                    park={p}
                    selected={value?.id === p.id}
                    onSelect={() => {
                      onChange(p);
                      setOpen(false);
                    }}
                  />
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function ParkOption({
  park,
  selected,
  onSelect,
}: {
  park: ParkRow;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <CommandItem value={`${park.name} ${park.country ?? ""}`} onSelect={onSelect}>
      <Check className={cn("mr-2 h-4 w-4", selected ? "opacity-100" : "opacity-0")} />
      <span className="flex-1 truncate">{park.name}</span>
      {park.curated && <Star className="ml-2 h-3.5 w-3.5 fill-primary text-primary" />}
      {park.country && (
        <span className="ml-2 text-xs text-muted-foreground">{park.country}</span>
      )}
    </CommandItem>
  );
}
