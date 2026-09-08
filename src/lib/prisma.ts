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
 * Production (Turso) sets DATABASE_URL="libsql://…" + DATABASE_AUTH_TOKEN and goes
 * through the libSQL driver adapter, which works on serverless.
 */
function makeClient() {
  const url = process.env.DATABASE_URL ?? "file:./dev.db";
  const authToken = process.env.DATABASE_AUTH_TOKEN;

  const useAdapter = url.startsWith("libsql://") || url.startsWith("https://") || Boolean(authToken);

  const log: ("error" | "warn")[] =
    process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"];

  if (useAdapter) {
    // Remote Turso URLs use the fetch-based hrana protocol (no native addon).
    // If a host ever rejects the native `libsql` optional dep, switch this import
    // to `@prisma/adapter-libsql/web`.
    return new PrismaClient({ adapter: new PrismaLibSQL({ url, authToken }), log });
  }
  return new PrismaClient({ log });
}

export const prisma = globalForPrisma.prisma ?? makeClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
