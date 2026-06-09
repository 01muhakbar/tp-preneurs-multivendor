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
  console.log("Starting SELLER-WORKSPACE-2026-PROD-ADOPT-TEAM-16 smoke test...");
  let allPassed = true;

  const checks = [
    {
      name: "Flag teamEnabled exists",
      pass: checkContent("features/sellerWorkspace2026/sellerWorkspace2026Flags.js", /teamEnabled:/),
    },
    {
      name: "Function isSeller2026TeamProductionEnabled exists",
      pass: checkContent(
        "features/sellerWorkspace2026/sellerWorkspace2026Flags.js",
        /export function isSeller2026TeamProductionEnabled/
      ),
    },
    {
      name: "App.jsx prioritizes team/audit route before team/:memberId",
      pass: (() => {
        if (!checkFileExists("App.jsx")) return false;
        const content = readFileSync(join(SRC_DIR, "App.jsx"), "utf-8");
        const auditIndex = content.indexOf('path="team/audit"');
        const memberIndex = content.indexOf('path="team/:memberId"');
        return auditIndex !== -1 && memberIndex !== -1 && auditIndex < memberIndex;
      })(),
    },
    {
      name: "App.jsx imports Seller2026LiveTeamPage",
      pass: checkContent("App.jsx", /Seller2026LiveTeamPage/),
    },
    {
      name: "App.jsx imports Seller2026LiveTeamAuditPage",
      pass: checkContent("App.jsx", /Seller2026LiveTeamAuditPage/),
    },
    {
      name: "App.jsx imports Seller2026LiveMemberDetailPage",
      pass: checkContent("App.jsx", /Seller2026LiveMemberDetailPage/),
    },
    {
      name: "useSeller2026Team hook exists",
      pass: checkFileExists("hooks/seller2026/useSeller2026Team.ts"),
    },
    {
      name: "API team uses store-scoped removal",
      pass: checkContent("api/sellerTeam.ts", /\/seller\/stores\/\${storeId}\/members\/\${memberId}\/remove/),
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
    console.log("🎉 SELLER-WORKSPACE-2026-PROD-ADOPT-TEAM-16 Smoke Test PASSED!");
    process.exit(0);
  } else {
    console.error("💥 SELLER-WORKSPACE-2026-PROD-ADOPT-TEAM-16 Smoke Test FAILED!");
    process.exit(1);
  }
}

runSmokeTest();
