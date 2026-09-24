import { spawn } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const isWindows = process.platform === "win32";
const checks = [
  { label: "pnpm test", command: "pnpm", args: ["test"] },
  {
    label: "pnpm typecheck",
    command: "pnpm",
    args: ["typecheck"],
  },
  { label: "pnpm lint", command: "pnpm", args: ["lint"] },
  { label: "pnpm stylelint", command: "pnpm", args: ["stylelint"] },
  {
    label: "pnpm format:check",
    command: "pnpm",
    args: ["format:check"],
  },
  { label: "pnpm build", command: "pnpm", args: ["build"] },
  { label: "git diff --check", command: "git", args: ["diff", "--check"] },
];

function runCheck(check) {
  return new Promise((resolveResult) => {
    let settled = false;
    const finish = (passed) => {
      if (settled) return;
      settled = true;
      resolveResult(passed);
    };

    const command =
      isWindows && check.command === "pnpm"
        ? (process.env.ComSpec ?? "cmd.exe")
        : check.command;
    const args =
      isWindows && check.command === "pnpm"
        ? ["/d", "/s", "/c", `pnpm ${check.args.join(" ")}`]
        : check.args;
    const child = spawn(command, args, {
      cwd: repositoryRoot,
      stdio: "inherit",
      windowsHide: true,
    });

    child.once("error", (error) => {
      process.stderr.write(
        `[verify] Could not start ${check.label}: ${error.message}\n`,
      );
      finish(false);
    });
    child.once("close", (code) => finish(code === 0));
  });
}

const results = [];
for (const check of checks) {
  process.stdout.write(`\n[verify] Running ${check.label}\n`);
  results.push({ label: check.label, passed: await runCheck(check) });
}

const passedCount = results.filter((result) => result.passed).length;
const failed = results.filter((result) => !result.passed);
process.stdout.write(
  `\n[verify] ${failed.length === 0 ? "PASS" : "FAIL"} — ${passedCount}/${checks.length} checks passed\n`,
);
for (const result of results) {
  process.stdout.write(
    `  ${result.passed ? "PASS" : "FAIL"} ${result.label}\n`,
  );
}

if (failed.length > 0) process.exitCode = 1;
