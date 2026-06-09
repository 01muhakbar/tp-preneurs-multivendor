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
  console.log("Starting SELLER-WORKSPACE-2026-PROD-ADOPT-PAYMENT-PROFILE-14 smoke test...");
  let allPassed = true;
  const checks = [
    {
      name: "Flag paymentProfileEnabled exists",
      pass: checkContent(
        "features/sellerWorkspace2026/sellerWorkspace2026Flags.js",
        /paymentProfileEnabled:/
      ),
    },
    {
      name: "Function isSeller2026PaymentProfileProductionEnabled exists",
      pass: checkContent(
        "features/sellerWorkspace2026/sellerWorkspace2026Flags.js",
        /export function isSeller2026PaymentProfileProductionEnabled/
      ),
    },
    {
      name: "App.jsx uses isSeller2026PaymentProfileProductionEnabled for payment-profile",
      pass: checkContent("App.jsx", /isSeller2026PaymentProfileProductionEnabled\(\) \? \(/),
    },
    {
      name: "App.jsx imports Seller2026LivePaymentProfilePage",
      pass: checkContent("App.jsx", /Seller2026LivePaymentProfilePage/),
    },
    {
      name: "Seller2026LivePaymentProfilePage exists",
      pass: checkFileExists("pages/seller2026/Seller2026LivePaymentProfilePage.jsx"),
    },
    {
      name: "useSeller2026PaymentProfile hook exists",
      pass: checkFileExists("hooks/seller2026/useSeller2026PaymentProfile.ts"),
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
    console.log("🎉 SELLER-WORKSPACE-2026-PROD-ADOPT-PAYMENT-PROFILE-14 Smoke Test PASSED!");
    process.exit(0);
  } else {
    console.error("💥 SELLER-WORKSPACE-2026-PROD-ADOPT-PAYMENT-PROFILE-14 Smoke Test FAILED!");
    process.exit(1);
  }
}

runSmokeTest();
