import { spawnSync } from "node:child_process";

const args = process.argv.slice(2);
const npmExecPath = process.env.npm_execpath || "";
const isWindows = process.platform === "win32";

const candidates = [];

if (/pnpm|corepack/i.test(npmExecPath)) {
  if (/\.(?:cjs|mjs|js)$/i.test(npmExecPath)) {
    candidates.push({
      command: process.execPath,
      args: [npmExecPath, ...args],
      shell: false,
    });
  } else {
    candidates.push({
      command: npmExecPath,
      args,
      shell: isWindows && /\.(?:cmd|bat)$/i.test(npmExecPath),
    });
  }
}

candidates.push(
  {
    command: "corepack",
    args: ["pnpm", ...args],
    shell: isWindows,
  },
  {
    command: "pnpm",
    args,
    shell: isWindows,
  }
);

let lastError = null;

for (const candidate of candidates) {
  const result = spawnSync(candidate.command, candidate.args, {
    stdio: "inherit",
    shell: candidate.shell,
  });

  if (result.error) {
    lastError = result.error;
    if (result.error.code === "ENOENT") {
      continue;
    }
    console.error(result.error.message);
    process.exit(1);
  }

  process.exit(result.status ?? 0);
}

console.error(lastError?.message || "Unable to locate pnpm.");
process.exit(1);
