import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs";

function getDatabaseUrl(): string {
  const envUrl = process.env.DATABASE_URL || "file:./prisma/dev.db";

  if (envUrl.startsWith("file:")) {
    const rawPath = envUrl.replace("file:", "");

    // In Linux Docker containers, ensure SQLite database is copied to /tmp with 777 permissions for WAL journaling
    if (process.env.NODE_ENV === "production" && process.platform === "linux") {
      const tmpPath = path.join("/tmp", "dev.db");
      const seedDbPath = path.resolve(process.cwd(), "prisma/dev.db");

      if (!fs.existsSync(tmpPath)) {
        if (fs.existsSync(seedDbPath)) {
          try {
            fs.copyFileSync(seedDbPath, tmpPath);
            fs.chmodSync(tmpPath, 0o777);
            console.log("⚡ Copied pre-seeded dev.db to /tmp/dev.db with 777 permissions.");
          } catch (e) {
            console.error("Warning: Failed to copy seed db to /tmp:", e);
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
