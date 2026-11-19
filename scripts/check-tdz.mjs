import ts from "../client/node_modules/typescript/lib/typescript.js";
import fs from "node:fs";
import path from "node:path";

function getAllFiles(dir, exts) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      if (file !== "node_modules" && file !== "dist" && file !== "_archive") {
        results = results.concat(getAllFiles(fullPath, exts));
      }
    } else if (exts.some((ext) => file.endsWith(ext))) {
      results.push(fullPath);
    }
  });
  return results;
}

const files = getAllFiles("client/src", [".jsx", ".tsx"]);
const options = {
  jsx: ts.JsxEmit.ReactJSX,
  allowJs: true,
  checkJs: true,
  noEmit: true,
  target: ts.ScriptTarget.Latest,
};

const host = ts.createCompilerHost(options);
const program = ts.createProgram(files, options, host);
const diagnostics = ts.getPreEmitDiagnostics(program);

const tdzErrors = [];
diagnostics.forEach((diag) => {
  const message = ts.flattenDiagnosticMessageText(diag.messageText, "\n");
  if (
    message.includes("initialization") ||
    message.includes("used before its declaration") ||
    message.includes("block-scoped")
  ) {
    const { line, character } = diag.file.getLineAndCharacterOfPosition(diag.start);
    tdzErrors.push(`${diag.file.fileName} (${line + 1},${character + 1}): ${message}`);
  }
});

if (tdzErrors.length > 0) {
  console.error(`[check-tdz] FAILED: Found ${tdzErrors.length} TDZ error(s):`);
  tdzErrors.forEach((err) => console.error(`  - ${err}`));
  process.exit(1);
} else {
  console.log(`[check-tdz] OK: 0 TDZ / block-scoped errors found across ${files.length} client files.`);
  process.exit(0);
}
