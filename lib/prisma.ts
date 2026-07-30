import { PrismaClient } from "@prisma/client";
import path from "path";

function getDatabaseUrl(): string {
  const envUrl = process.env.DATABASE_URL || "file:./prisma/dev.db";

  if (envUrl.startsWith("file:")) {
    const rawPath = envUrl.replace("file:", "");
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
