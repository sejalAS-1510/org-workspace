import { PrismaClient } from "@prisma/client";
import path from "path";
import fs from "fs";
import { execSync } from "child_process";

function getDatabaseUrl(): string {
  const envUrl = process.env.DATABASE_URL || "file:./prisma/dev.db";

  if (envUrl.startsWith("file:")) {
    const rawPath = envUrl.replace("file:", "");

    // In Linux Docker containers, ensure pre-seeded or freshly pushed schema exists at /tmp/dev.db
    if (process.env.NODE_ENV === "production" && process.platform === "linux") {
      const tmpPath = "/tmp/dev.db";

      const needsInit = !fs.existsSync(tmpPath) || fs.statSync(tmpPath).size < 4096;

      if (needsInit) {
        const candidates = [
          path.resolve(process.cwd(), "prisma/dev.db"),
          path.resolve(process.cwd(), "dev.db"),
          "/app/prisma/dev.db",
          "/app/dev.db",
        ];

        let copied = false;
        for (const candidate of candidates) {
          if (fs.existsSync(candidate) && fs.statSync(candidate).size > 4096) {
            try {
              fs.copyFileSync(candidate, tmpPath);
              fs.chmodSync(tmpPath, 0o777);
              console.log(`⚡ Copied pre-seeded database (${fs.statSync(candidate).size} bytes) from ${candidate} to ${tmpPath}`);
              copied = true;
              break;
            } catch (e) {
              console.error("Warning copying database candidate:", e);
            }
          }
        }

        // Self-healing fallback: If no pre-seeded db exists, push schema directly to /tmp/dev.db
        if (!copied) {
          try {
            console.log("⚡ Auto-pushing Prisma schema to /tmp/dev.db...");
            execSync("npx prisma db push --accept-data-loss", {
              env: { ...process.env, DATABASE_URL: `file:${tmpPath}` },
              stdio: "inherit",
            });
            if (fs.existsSync(tmpPath)) {
              fs.chmodSync(tmpPath, 0o777);
            }
          } catch (pushErr) {
            console.error("Warning auto db push failed:", pushErr);
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
