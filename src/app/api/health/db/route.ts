import path from "node:path";
import { createClient } from "@libsql/client";
import { resolveDbEnv } from "@/lib/prisma";

/**
 * Non-secret deployment diagnostic. Reports which DB env vars are present (names
 * and lengths only — never values) and whether a live connection works.
 *
 * Safe to leave in, but you can delete this file once the deploy is healthy.
 */
export const dynamic = "force-dynamic";

function presence(v: string | undefined) {
  return v ? `set (${v.length} chars)` : "MISSING";
}

export async function GET() {
  const { authToken, isRemote } = resolveDbEnv();
  let { url } = resolveDbEnv();
  if (!isRemote && url.startsWith("file:")) {
    const p = url.slice("file:".length);
    if (!path.isAbsolute(p)) url = "file:" + path.resolve(process.cwd(), "prisma", p);
  }

  const report: Record<string, unknown> = {
    env: {
      DATABASE_URL: presence(process.env.DATABASE_URL),
      DATABASE_AUTH_TOKEN: presence(process.env.DATABASE_AUTH_TOKEN),
      TURSO_DATABASE_URL: presence(process.env.TURSO_DATABASE_URL),
      TURSO_AUTH_TOKEN: presence(process.env.TURSO_AUTH_TOKEN),
      AUTH_SECRET: presence(process.env.AUTH_SECRET),
    },
    resolved: {
      urlScheme: url.split(":")[0] + ":",
      urlHost: isRemote ? url.replace(/^\w+:\/\//, "").split("/")[0] : "(local file)",
      isRemote,
      hasToken: Boolean(authToken),
      tokenLength: authToken?.length ?? 0,
    },
  };

  try {
    const client = createClient(isRemote ? { url, authToken } : { url });
    const r = await client.execute(
      "SELECT (SELECT COUNT(*) FROM sqlite_master WHERE type='table') AS tables",
    );
    client.close();
    report.connect = "ok";
    report.tables = r.rows[0]?.tables ?? null;
  } catch (err) {
    report.connect = "FAILED";
    report.error = err instanceof Error ? err.message : String(err);
  }

  return Response.json(report, {
    status: report.connect === "ok" ? 200 : 500,
  });
}
