import { PrismaLibSQL } from "@prisma/adapter-libsql";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Local dev (DATABASE_URL="file:...") uses Prisma's built-in SQLite engine, which
 * resolves the file path the same way the Prisma CLI does (relative to
 * prisma/schema.prisma).
 *
 * Production (Turso) sets a libsql:// URL + an auth token and goes through the
 * libSQL driver adapter, which works on serverless.
 *
 * Both the DATABASE_* and TURSO_* env var names are accepted, since Turso's own
 * Vercel integration provisions the TURSO_* ones.
 */
export function resolveDbEnv() {
  const url =
    process.env.DATABASE_URL ?? process.env.TURSO_DATABASE_URL ?? "file:./dev.db";
  const authToken =
    process.env.DATABASE_AUTH_TOKEN ?? process.env.TURSO_AUTH_TOKEN ?? undefined;
  const isRemote =
    url.startsWith("libsql://") || url.startsWith("https://") || url.startsWith("wss://");
  return { url, authToken, isRemote };
}

function makeClient() {
  const { url, authToken, isRemote } = resolveDbEnv();

  const log: ("error" | "warn")[] =
    process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"];

  if (isRemote) {
    if (!authToken) {
      throw new Error(
        "DATABASE_URL points at a remote libSQL/Turso database but no auth token is set. " +
          "Add DATABASE_AUTH_TOKEN (from `turso db tokens create <db>`) to the environment.",
      );
    }
    // Remote Turso URLs use the fetch-based hrana protocol (no native addon).
    // If a host ever rejects the native `libsql` optional dep, switch this import
    // to `@prisma/adapter-libsql/web`.
    return new PrismaClient({ adapter: new PrismaLibSQL({ url, authToken }), log });
  }

  // Local file: either through the adapter (if a token was somehow supplied) or
  // the built-in engine.
  if (authToken) {
    return new PrismaClient({ adapter: new PrismaLibSQL({ url, authToken }), log });
  }
  return new PrismaClient({ log });
}

export const prisma = globalForPrisma.prisma ?? makeClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
