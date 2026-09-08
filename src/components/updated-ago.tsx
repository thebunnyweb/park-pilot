"use client";

import { useEffect, useState } from "react";

export function UpdatedAgo({ iso, prefix = "updated" }: { iso: string | null; prefix?: string }) {
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 15_000);
    return () => clearInterval(t);
  }, []);

  if (!iso) return null;
  const secs = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  const label =
    secs < 60
      ? `${secs}s ago`
      : secs < 3600
        ? `${Math.round(secs / 60)}m ago`
        : `${Math.round(secs / 3600)}h ago`;
  return (
    <span className="text-xs text-muted-foreground">
      {prefix} {label}
    </span>
  );
}
