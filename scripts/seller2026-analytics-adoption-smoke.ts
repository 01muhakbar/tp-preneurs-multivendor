import fs from "fs";
import path from "path";

const log = (msg: string) => console.log(`[Analytics Smoke] ${msg}`);
const fail = (msg: string): never => {
  console.error(`[Analytics Smoke] ERROR: ${msg}`);
  process.exit(1);
};

const read = (rootDir: string, relativePath: string) =>
  fs.readFileSync(path.join(rootDir, relativePath), "utf-8");

const assertIncludes = (content: string, needle: string, label: string) => {
  if (!content.includes(needle)) fail(`${label} missing: ${needle}`);
};

const assertNotIncludes = (content: string, needle: string, label: string) => {
  if (content.includes(needle)) fail(`${label} must not include: ${needle}`);
};

async function run() {
  log("Starting Seller 2026 Analytics Adoption Smoke Test...");

  const rootDir = process.cwd();
  const app = read(rootDir, "client/src/App.jsx");
  const flags = read(rootDir, "client/src/features/sellerWorkspace2026/sellerWorkspace2026Flags.js");
  const page = read(rootDir, "client/src/pages/seller2026/Seller2026LiveAnalyticsPage.jsx");
  const hook = read(rootDir, "client/src/features/sellerWorkspace2026/hooks/useSellerWorkspace2026Analytics.js");
  const adapter = read(
    rootDir,
    "client/src/features/sellerWorkspace2026/adapters/sellerWorkspace2026AnalyticsAdapter.js"
  );

  log("Checking feature-flagged production route and legacy fallback...");
  assertIncludes(app, 'path="analytics"', "App analytics route");
  assertIncludes(app, "isSeller2026AnalyticsProductionEnabled()", "Analytics production flag gate");
  assertIncludes(app, "<Seller2026LiveAnalyticsPage />", "Analytics live component");
  assertIncludes(app, "<SellerAnalyticsPage />", "Analytics legacy fallback");

  log("Checking default-off feature flag helpers...");
  assertIncludes(flags, "isSellerWorkspace2026Enabled", "Global Seller 2026 flag helper");
  assertIncludes(flags, "VITE_SELLER_WORKSPACE_2026_ANALYTICS_ENABLED", "Analytics flag");
  assertIncludes(flags, "VITE_SELLER_WORKSPACE_2026_ANALYTICS_SYNC_ENABLED", "Analytics sync flag");
  assertIncludes(flags, "isSeller2026AnalyticsSyncPreviewEnabled", "Analytics sync preview helper");
  assertIncludes(flags, "String(value || \"\").trim().toLowerCase() === \"true\"", "Strict true parser");
  assertNotIncludes(flags, "|| true", "Feature flags");

  log("Checking React Query import and store-scoped analytics hook...");
  assertIncludes(hook, 'import { useQuery } from "@tanstack/react-query";', "Analytics hook");
  assertNotIncludes(hook, "from \"react-query\"", "Analytics hook");
  assertNotIncludes(page, "from \"react-query\"", "Analytics page");
  assertIncludes(page, "useSellerWorkspaceRoute", "Analytics page");
  assertIncludes(page, "workspaceStoreId: storeId", "Analytics page store id scope");
  assertIncludes(adapter, "getSellerAnalyticsSummary(storeId)", "Analytics adapter existing API use");

  log("Checking read-only mutation guardrails...");
  for (const forbidden of [
    "publishStorefront",
    "rebuildIndex",
    "syncNow",
    "changePublicVisibility",
    "forceRefreshPublicStorefront",
  ]) {
    assertNotIncludes(page, forbidden, "Analytics page mutation guardrail");
    assertNotIncludes(adapter, forbidden, "Analytics adapter mutation guardrail");
    assertNotIncludes(hook, forbidden, "Analytics hook mutation guardrail");
  }
  assertIncludes(page, "Unavailable until storefront sync workflow is validated.", "Disabled action copy");
  assertIncludes(page, "disabled", "Disabled analytics actions");

  log("Smoke test PASS.");
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
