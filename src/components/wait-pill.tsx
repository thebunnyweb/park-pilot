import { cn } from "@/lib/utils";

export function waitColor(wait: number): string {
  if (wait <= 15) return "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300";
  if (wait <= 35) return "bg-amber-500/15 text-amber-700 dark:text-amber-300";
  if (wait <= 60) return "bg-orange-500/15 text-orange-700 dark:text-orange-300";
  return "bg-red-500/15 text-red-700 dark:text-red-300";
}

export function WaitPill({
  wait,
  isOpen,
  className,
}: {
  wait: number;
  isOpen: boolean;
  className?: string;
}) {
  if (!isOpen) {
    return (
      <span
        className={cn(
          "inline-flex min-w-[3.5rem] items-center justify-center rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground",
          className,
        )}
      >
        Closed
      </span>
    );
  }
  return (
    <span
      className={cn(
        "inline-flex min-w-[3.5rem] items-center justify-center rounded-md px-2 py-1 text-sm font-semibold tabular-nums",
        waitColor(wait),
        className,
      )}
    >
      {wait}m
    </span>
  );
}
