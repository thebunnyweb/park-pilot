import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The libSQL / Turso driver pulls in a native addon (`libsql`) plus a couple of
  // packages webpack can't parse. Keep them out of the server bundle.
  serverExternalPackages: [
    "@prisma/adapter-libsql",
    "@libsql/client",
    "libsql",
    "@libsql/isomorphic-fetch",
    "@libsql/isomorphic-ws",
  ],
};

export default nextConfig;
