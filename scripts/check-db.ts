/**
 * Verify the database connection using the SAME resolution the app uses.
 *
 *   # local
 *   npm run db:check
 *
 *   # against production creds
 *   DATABASE_URL="libsql://…" DATABASE_AUTH_TOKEN="…" npm run db:check
 */
import path from "node:path";
import { createClient } from "@libsql/client";
import { resolveDbEnv } from "../src/lib/prisma";

async function main() {
  const { authToken, isRemote } = resolveDbEnv();
  let { url } = resolveDbEnv();

  // Prisma resolves a relative file: URL against prisma/schema.prisma's folder.
  // Match that here so the local check looks at the same file the app uses.
  if (!isRemote && url.startsWith("file:")) {
    const p = url.slice("file:".length);
    if (!path.isAbsolute(p)) {
      url = "file:" + path.resolve(process.cwd(), "prisma", p);
    }
  }
  console.log(`URL        : ${url}`);
  console.log(`Auth token : ${authToken ? `set (${authToken.length} chars, …${authToken.slice(-6)})` : "NOT SET"}`);
  console.log(`Mode       : ${isRemote ? "remote (libSQL/Turso)" : "local file"}`);
  console.log("---");

  const client = createClient(isRemote ? { url, authToken } : { url });
  try {
    const ping = await client.execute("SELECT 1 AS ok");
    console.log("Connectivity: OK", ping.rows[0]);
    const tables = await client.execute(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_prisma%'",
    );
    console.log("Tables      :", tables.rows.map((r) => r.name).join(", ") || "(none — run the migration!)");
    if (tables.rows.some((r) => r.name === "User")) {
      const users = await client.execute("SELECT COUNT(*) AS n FROM User");
      console.log("User rows   :", users.rows[0].n);
    }
    console.log("\n✅ Database is reachable and usable.");
  } catch (err) {
    console.error("\n❌ Database check failed:\n", err instanceof Error ? err.message : err);
    if (String(err).includes("401")) {
      console.error(
        "\n401 = the auth token is missing, wrong, for a different database, or expired.\n" +
          "Fix: turso db tokens create <db>   then set DATABASE_AUTH_TOKEN and redeploy.",
      );
    }
    process.exitCode = 1;
  } finally {
    client.close();
  }
}

main();
