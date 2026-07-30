import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs";

function getDatabaseUrl(): string {
  const envUrl = process.env.DATABASE_URL || "file:./prisma/dev.db";

  if (envUrl.startsWith("file:")) {
    const rawPath = envUrl.replace("file:", "");

    // In Linux Docker containers, copy pre-seeded database to /tmp/dev.db with 777 permissions
    if (process.env.NODE_ENV === "production" && process.platform === "linux") {
      const tmpPath = "/tmp/dev.db";

      // If /tmp/dev.db does not exist or is an empty/blank SQLite file (< 4KB)
      const needsSeed = !fs.existsSync(tmpPath) || fs.statSync(tmpPath).size < 4096;

      if (needsSeed) {
        const candidates = [
          path.resolve(process.cwd(), "prisma/dev.db"),
          path.resolve(process.cwd(), "dev.db"),
          "/app/prisma/dev.db",
          "/app/dev.db",
        ];

        for (const candidate of candidates) {
          if (fs.existsSync(candidate) && fs.statSync(candidate).size > 4096) {
            try {
              fs.copyFileSync(candidate, tmpPath);
              fs.chmodSync(tmpPath, 0o777);
              console.log(`⚡ Copied pre-seeded database (${fs.statSync(candidate).size} bytes) from ${candidate} to ${tmpPath}`);
              break;
            } catch (e) {
              console.error("Warning copying database candidate:", e);
            }
          }
        }
      }
      return `file:${tmpPath}`;
    }

    if (!path.isAbsolute(rawPath)) {
      const absPath = path.resolve(process.cwd(), rawPath);
      return `file:${absPath}`;
    }
  }

  return envUrl;
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
    log: ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
