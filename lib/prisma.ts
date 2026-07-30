import { PrismaClient } from "@prisma/client";
import { execSync } from "child_process";
import path from "path";
import fs from "fs";

let isInitialized = false;

function ensureDatabaseInitialized(dbFile: string) {
  if (isInitialized) return;
  try {
    const dir = path.dirname(dbFile);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const needsSchema = !fs.existsSync(dbFile) || fs.statSync(dbFile).size < 4096;
    if (needsSchema) {
      console.log(`⚡ [Prisma] Initializing database at ${dbFile}...`);
      execSync("npx prisma db push --accept-data-loss", {
        env: { ...process.env, DATABASE_URL: `file:${dbFile}` },
        stdio: "inherit",
      });
      execSync("node scripts/seed.js", {
        env: { ...process.env, DATABASE_URL: `file:${dbFile}` },
        stdio: "inherit",
      });
      console.log(`✅ [Prisma] Database schema and seed complete at ${dbFile}`);
    }
    isInitialized = true;
  } catch (err) {
    console.error("Warning initializing database:", err);
  }
}

function getDatabaseUrl(): string {
  const envUrl = process.env.DATABASE_URL;

  if (!envUrl || envUrl.startsWith("file:")) {
    const isProductionLinux = process.platform === "linux" || !!process.env.RENDER;
    const dbFile = isProductionLinux
      ? "/tmp/production_app.db"
      : path.resolve(process.cwd(), "prisma/dev.db");

    ensureDatabaseInitialized(dbFile);
    return `file:${dbFile}`;
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
