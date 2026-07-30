import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs";

function getDatabaseUrl(): string {
  const envUrl = process.env.DATABASE_URL || "file:./dev.db";

  if (envUrl.startsWith("file:")) {
    const rawPath = envUrl.replace("file:", "");

    // In Linux Docker containers, copy pre-seeded dev.db to /tmp/dev.db with 777 permissions
    if (process.env.NODE_ENV === "production" && process.platform === "linux") {
      const tmpPath = path.join("/tmp", "dev.db");

      if (!fs.existsSync(tmpPath) || fs.statSync(tmpPath).size === 0) {
        const candidates = [
          path.resolve(process.cwd(), "dev.db"),
          path.resolve(process.cwd(), "prisma/dev.db"),
          "/app/dev.db",
          "/app/prisma/dev.db",
        ];

        for (const candidate of candidates) {
          if (fs.existsSync(candidate) && fs.statSync(candidate).size > 0) {
            try {
              fs.copyFileSync(candidate, tmpPath);
              fs.chmodSync(tmpPath, 0o777);
              console.log(`⚡ Copied database from ${candidate} to ${tmpPath} with 777 permissions.`);
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
