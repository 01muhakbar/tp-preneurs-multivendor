import { execSync } from "child_process";
import fs from "fs";
import path from "path";

const log = (msg: string) => console.log(`[Analytics Smoke] ${msg}`);
const err = (msg: string) => console.error(`[Analytics Smoke] ERROR: ${msg}`);

async function run() {
  log("Starting Seller 2026 Analytics Adoption Smoke Test...");

  const rootDir = process.cwd();
  
  const appPath = path.join(rootDir, "client/src/App.jsx");
  const flagsPath = path.join(rootDir, "client/src/features/sellerWorkspace2026/sellerWorkspace2026Flags.js");

  log("Checking App.jsx for analytics route mapping...");
  const appContent = fs.readFileSync(appPath, "utf-8");
  if (!appContent.includes("path=\"analytics\"") || !appContent.includes("Seller2026LiveAnalyticsPage")) {
    err("App.jsx does not have proper Analytics route mapping.");
    process.exit(1);
  }
  log("App.jsx has proper Analytics route mapping.");

  log("Checking feature flags...");
  const flagsContent = fs.readFileSync(flagsPath, "utf-8");
  if (!flagsContent.includes("isSeller2026AnalyticsProductionEnabled")) {
    err("sellerWorkspace2026Flags.js missing isSeller2026AnalyticsProductionEnabled");
    process.exit(1);
  }
  log("isSeller2026AnalyticsProductionEnabled flag found.");

  log("Smoke test PASS.");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
