const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

console.log("⚡ [init-db] Checking database initialization...");

try {
  // Ensure database schema is pushed
  console.log("⚡ [init-db] Running prisma db push...");
  execSync("npx prisma db push --accept-data-loss", { stdio: "inherit" });

  // Seed database
  console.log("⚡ [init-db] Running database seed...");
  execSync("node scripts/seed.js", { stdio: "inherit" });

  console.log("✅ [init-db] Database initialized successfully!");
} catch (error) {
  console.error("⚠️ [init-db] Database init error:", error.message);
}
