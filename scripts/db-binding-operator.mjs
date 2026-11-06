import { createHash, randomBytes } from "node:crypto";
import { closeSync, openSync, writeSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline/promises";

const WINDOW_MS = 10 * 60 * 1_000;

// Serialized as reviewed, secret-free console source; no module dependencies.
export async function browserDiagnosticCheck(config, browser = globalThis) {
  let token = "";
  let headers;
  try {
    const issued = Date.parse(config.DB_BINDING_DIAGNOSTIC_ISSUED_AT);
    const expires = Date.parse(config.DB_BINDING_DIAGNOSTIC_EXPIRES_AT);
    if (
      !browser.isSecureContext ||
      browser.top !== browser.self ||
      browser.location.protocol !== "https:" ||
      browser.location.host !== config.hostname ||
      !/^[a-z0-9][a-z0-9-]*\.vercel\.app$/.test(config.hostname ?? "") ||
      browser.location.pathname !== "/sources" ||
      browser.location.search !== "" ||
      browser.location.hash !== "" ||
      !/^dpl_[A-Za-z0-9]+$/.test(config.deploymentId ?? "") ||
      !/^dpl_[A-Za-z0-9]+$/.test(config.previousProductionId ?? "") ||
      config.deploymentId === config.previousProductionId ||
      config.identityVerified !== true ||
      config.protectionVerified !== true ||
      config.restoreVerified !== true ||
      !/^[a-f0-9]{64}$/.test(config.DB_BINDING_DIAGNOSTIC_TOKEN_SHA256 ?? "") ||
      !Number.isFinite(issued) ||
      !Number.isFinite(expires) ||
      issued > Date.now() ||
      expires <= Date.now() ||
      expires <= issued ||
      expires - issued > 600_000 ||
      browser.__dbBindingDiagnosticAttempted
    )
      throw new Error();
    // Non-secret page-lifetime latch; neither token nor cookies are stored here.
    Object.defineProperty(browser, "__dbBindingDiagnosticAttempted", {
      value: true,
    });
    token =
      browser.prompt(
        "Dedicated diagnostic bearer (private manual transcription; no clipboard):",
      ) ?? "";
    if (!/^[A-Za-z0-9_-]{43}$/.test(token) || Date.now() >= expires)
      throw new Error();
    const digest = await browser.crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(token),
    );
    const verifier = Array.from(new Uint8Array(digest), (byte) =>
      byte.toString(16).padStart(2, "0"),
    ).join("");
    if (
      verifier !== config.DB_BINDING_DIAGNOSTIC_TOKEN_SHA256 ||
      Date.now() >= expires
    )
      throw new Error();
    headers = new Headers({
      authorization: `Bearer ${token}`,
      "x-db-binding-deployment-id": config.deploymentId,
    });
    token = "";
    const response = await browser.fetch("/api/internal/db-binding", {
      method: "POST",
      credentials: "same-origin",
      mode: "same-origin",
      redirect: "error",
      cache: "no-store",
      referrerPolicy: "no-referrer",
      headers,
      signal: AbortSignal.timeout(12_000),
    });
    if (response.status !== 200) throw new Error();
    const result = await response.json();
    const keys = [
      "ok",
      "targetMatches",
      "databaseMatches",
      "migration0021Present",
    ];
    if (
      !result ||
      Object.keys(result).length !== keys.length ||
      !keys.every((key) => result[key] === true)
    )
      throw new Error();
    browser.alert(
      JSON.stringify({
        ok: true,
        targetMatches: true,
        databaseMatches: true,
        migration0021Present: true,
      }),
    );
  } catch {
    browser.alert(
      "Diagnostic failed. Do not retry or release; follow removal procedure.",
    );
  } finally {
    token = "";
    headers?.delete("authorization");
  }
}

export function createOperatorSession(now = Date.now()) {
  let token = randomBytes(32).toString("base64url");
  const expires = now + WINDOW_MS;
  let prepared = false;
  const config = {
    DB_BINDING_DIAGNOSTIC_TOKEN_SHA256: createHash("sha256")
      .update(token)
      .digest("hex"),
    DB_BINDING_DIAGNOSTIC_ISSUED_AT: new Date(now).toISOString(),
    DB_BINDING_DIAGNOSTIC_EXPIRES_AT: new Date(expires).toISOString(),
  };
  return {
    config,
    browserScript(confirmation, at = Date.now()) {
      if (
        prepared ||
        at < now ||
        at >= expires ||
        !confirmation ||
        !/^dpl_[A-Za-z0-9]+$/.test(confirmation.deploymentId ?? "") ||
        !/^dpl_[A-Za-z0-9]+$/.test(confirmation.previousProductionId ?? "") ||
        confirmation.deploymentId === confirmation.previousProductionId ||
        !/^[a-z0-9][a-z0-9-]*\.vercel\.app$/.test(
          confirmation.hostname ?? "",
        ) ||
        confirmation.identityVerified !== true ||
        confirmation.protectionVerified !== true ||
        confirmation.restoreVerified !== true
      )
        throw new Error("Operator prerequisites not satisfied.");
      prepared = true;
      const pinned = {
        ...config,
        hostname: confirmation.hostname,
        deploymentId: confirmation.deploymentId,
        previousProductionId: confirmation.previousProductionId,
        identityVerified: true,
        protectionVerified: true,
        restoreVerified: true,
      };
      return `void (${browserDiagnosticCheck.toString()})(${JSON.stringify(pinned)});`;
    },
    takeBearerForTranscription(at = Date.now()) {
      if (!prepared || !token || at < now || at >= expires)
        throw new Error("Operator prerequisites not satisfied.");
      const value = token;
      token = "";
      return value;
    },
  };
}

async function main() {
  if (
    !process.stdin.isTTY ||
    !process.stdout.isTTY ||
    !/^(xterm|screen|tmux|rxvt|alacritty|wezterm|foot)(-|$)/.test(
      process.env.TERM ?? "",
    )
  ) {
    throw new Error("Private alternate-screen terminal required.");
  }
  const session = createOperatorSession();
  // Only public verifier/window and secret-free browser source use stdout.
  process.stdout.write(`${JSON.stringify(session.config, null, 2)}\n`);
  const terminal = createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  let tty;
  try {
    const confirmation = JSON.parse(
      await terminal.question(
        "After authorized provisioning and normal browser login, enter verified non-secret confirmation JSON: ",
      ),
    );
    process.stdout.write(`${session.browserScript(confirmation)}\n`);
    if (
      (await terminal.question(
        "With browser bearer prompt open, type REVEAL in this private, unrecorded terminal: ",
      )) !== "REVEAL"
    )
      throw new Error();
    tty = openSync("/dev/tty", "w");
    writeSync(
      tty,
      "\x1b[?1049h\x1b[2J\x1b[HDedicated bearer — transcribe into browser prompt; never copy or record:\n",
    );
    let bearer = session.takeBearerForTranscription();
    writeSync(tty, bearer);
    bearer = "";
    await terminal.question(
      "\nAfter browser result, press Enter to erase this screen and exit. ",
    );
  } finally {
    if (tty !== undefined) {
      writeSync(tty, "\x1b[2J\x1b[H\x1b[?1049l");
      closeSync(tty);
    }
    terminal.close();
  }
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main().catch(() => {
    process.stderr.write(
      "Diagnostic session ended. Follow revocation/removal; do not release.\n",
    );
    process.exitCode = 1;
  });
}
