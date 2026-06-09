import { readFileSync, existsSync } from "fs";
import { resolve, join } from "path";

const SRC_DIR = resolve(process.cwd(), "client/src");

function checkFileExists(filePath: string): boolean {
  return existsSync(join(SRC_DIR, filePath));
}

function checkContent(filePath: string, expectedContent: string | RegExp): boolean {
  if (!checkFileExists(filePath)) return false;
  const content = readFileSync(join(SRC_DIR, filePath), "utf-8");
  if (expectedContent instanceof RegExp) {
    return expectedContent.test(content);
  }
  return content.includes(expectedContent);
}

function runSmokeTest() {
  console.log("Starting SELLER-WORKSPACE-2026-PROD-ADOPT-STORE-PROFILE-15 smoke test...");
  let allPassed = true;

  const checks = [
    {
      name: "Flag storeProfileEnabled exists",
      pass: checkContent("features/sellerWorkspace2026/sellerWorkspace2026Flags.js", /storeProfileEnabled:/),
    },
    {
      name: "Function isSeller2026StoreProfileProductionEnabled exists",
      pass: checkContent(
        "features/sellerWorkspace2026/sellerWorkspace2026Flags.js",
        /export function isSeller2026StoreProfileProductionEnabled/
      ),
    },
    {
      name: "App.jsx uses isSeller2026StoreProfileProductionEnabled for store-profile route",
      pass: checkContent("App.jsx", /isSeller2026StoreProfileProductionEnabled\(\) \? \(/),
    },
    {
      name: "App.jsx imports Seller2026LiveStorefrontPage",
      pass: checkContent("App.jsx", /Seller2026LiveStorefrontPage/),
    },
    {
      name: "App.jsx has legacy redirect /seller/stores/:storeSlug/profile",
      pass: checkContent("App.jsx", /path="\/seller\/stores\/:storeSlug\/profile"/),
    },
    {
      name: "Seller2026LiveStorefrontPage exists",
      pass: checkFileExists("pages/seller2026/Seller2026LiveStorefrontPage.jsx"),
    },
    {
      name: "useSeller2026Storefront hook exists",
      pass: checkFileExists("hooks/seller2026/useSeller2026Storefront.ts"),
    },
    {
      name: "useSeller2026UpdateStoreProfile hook exists",
      pass: checkFileExists("hooks/seller2026/useSeller2026UpdateStoreProfile.ts"),
    },
    {
      name: "Mutation payloads are whitelisted",
      pass: checkContent("api/seller2026/storefront.mutations.ts", /allowedTopLevelFields/),
    },
  ];

  checks.forEach((check) => {
    if (check.pass) {
      console.log(`✅ [PASS] ${check.name}`);
    } else {
      console.error(`❌ [FAIL] ${check.name}`);
      allPassed = false;
    }
  });

  if (allPassed) {
    console.log("🎉 SELLER-WORKSPACE-2026-PROD-ADOPT-STORE-PROFILE-15 Smoke Test PASSED!");
    process.exit(0);
  } else {
    console.error("💥 SELLER-WORKSPACE-2026-PROD-ADOPT-STORE-PROFILE-15 Smoke Test FAILED!");
    process.exit(1);
  }
}

runSmokeTest();
