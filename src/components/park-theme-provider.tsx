"use client";

import { getParkTheme } from "@/lib/data/park-themes";

/**
 * Overrides --primary/--ring for everything inside it, using a park's theme.
 * Works by setting CSS custom properties on a wrapper div — every existing
 * `bg-primary` / `text-primary` / `ring-primary` class already resolves
 * `hsl(var(--primary))`, so this needs no Tailwind config changes and no
 * per-component edits. Falls back to the app's default theme when no park
 * is selected.
 */
export function ParkThemeProvider({
  parkId,
  parkName,
  children,
  className,
}: {
  parkId: number | null;
  parkName: string | null;
  children: React.ReactNode;
  className?: string;
}) {
  const theme = parkId != null ? getParkTheme(parkId, parkName ?? "") : null;

  return (
    <div
      className={className}
      style={
        theme
          ? ({
              "--primary": theme.primary,
              "--primary-foreground": "0 0% 98%",
              "--ring": theme.primary,
              transition: "color 300ms ease, background-color 300ms ease",
            } as React.CSSProperties)
          : undefined
      }
    >
      {children}
    </div>
  );
}
