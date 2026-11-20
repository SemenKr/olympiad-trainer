import { createHash, webcrypto } from "node:crypto";
import { runInNewContext } from "node:vm";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  browserDiagnosticCheck,
  createOperatorSession,
  parseLeadMinutes,
} from "./db-binding-operator.mjs";

const now = Date.parse("2026-10-19T12:00:00Z");
const confirmation = {
  deploymentId: "dpl_candidate",
  previousProductionId: "dpl_previous",
  hostname: "unique-candidate.vercel.app",
  identityVerified: true,
  protectionVerified: true,
  restoreVerified: true,
};
const passed = {
  ok: true,
  targetMatches: true,
  databaseMatches: true,
  migrationsMatch: true,
  schemaMatches: true,
};

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(now);
});
afterEach(() => vi.useRealTimers());

function fixture(issued = now) {
  const session = createOperatorSession(issued);
  const source = session.browserScript(confirmation, issued);
  const token = session.takeBearerForTranscription(issued);
  const config = { ...session.config, ...confirmation };
  const browser = {
    isSecureContext: true,
    location: {
      protocol: "https:",
      host: confirmation.hostname,
      pathname: "/sources",
      search: "",
      hash: "",
    },
    prompt: vi.fn(() => token),
    alert: vi.fn(),
    crypto: webcrypto,
    fetch: vi.fn(async () => Response.json(passed)),
  };
  browser.self = browser;
  browser.top = browser;
  Object.defineProperty(browser, "document", {
    get() {
      throw new Error("Must not read cookies");
    },
  });
  Object.defineProperty(browser, "localStorage", {
    get() {
      throw new Error("Must not use persistence");
    },
  });
  return { session, source, token, config, browser };
}

describe("private operator provisioning", () => {
  it("accepts immediate default and bounded whole-minute leads", () => {
    expect(parseLeadMinutes([])).toBe(0);
    for (const value of ["1", "15", "30"]) {
      expect(parseLeadMinutes(["--start-in-minutes", value])).toBe(
        Number(value),
      );
    }
    for (const args of [
      ["--start-in-minutes"],
      ["--other", "1"],
      ["--start-in-minutes", "1", "2"],
      ...["0", "-1", "1.5", "31", "1e1", " 1", "NaN"].map((value) => [
        "--start-in-minutes",
        value,
      ]),
    ])
      expect(() => parseLeadMinutes(args)).toThrow();
  });

  it("holds confirmation and reveal to the scheduled ten-minute interval", () => {
    const issued = now + 15 * 60_000;
    const session = createOperatorSession(issued);
    expect(Date.parse(session.config.DB_BINDING_DIAGNOSTIC_ISSUED_AT)).toBe(
      issued,
    );
    expect(Date.parse(session.config.DB_BINDING_DIAGNOSTIC_EXPIRES_AT)).toBe(
      issued + 600_000,
    );
    expect(() => session.browserScript(confirmation)).toThrow();
    vi.setSystemTime(issued);
    session.browserScript(confirmation);
    expect(() => session.takeBearerForTranscription(issued - 1)).toThrow();
    expect(() =>
      session.takeBearerForTranscription(issued + 600_000),
    ).toThrow();
    expect(session.takeBearerForTranscription(issued + 599_999)).toHaveLength(
      43,
    );
  });

  it("generates a unique verifier and reveals a random bearer once without embedding it in browser source", () => {
    const { session, source, token } = fixture();
    expect(Buffer.from(token, "base64url")).toHaveLength(32);
    expect(createHash("sha256").update(token).digest("hex")).toBe(
      session.config.DB_BINDING_DIAGNOSTIC_TOKEN_SHA256,
    );
    expect(Object.keys(session.config).sort()).toEqual([
      "DB_BINDING_DIAGNOSTIC_EXPIRES_AT",
      "DB_BINDING_DIAGNOSTIC_ISSUED_AT",
      "DB_BINDING_DIAGNOSTIC_TOKEN_SHA256",
    ]);
    expect(JSON.stringify(session.config)).not.toContain(token);
    expect(source).not.toContain(token);
    expect(source).not.toContain("CRON_SECRET");
    expect(session.config.DB_BINDING_DIAGNOSTIC_TOKEN_SHA256).not.toBe(
      createOperatorSession(now).config.DB_BINDING_DIAGNOSTIC_TOKEN_SHA256,
    );
    expect(() => session.takeBearerForTranscription(now)).toThrow(
      "prerequisites",
    );
    expect(() => session.browserScript(confirmation, now)).toThrow(
      "prerequisites",
    );
  });

  it.each([
    { identityVerified: false },
    { protectionVerified: false },
    { restoreVerified: false },
    { deploymentId: "dpl_previous" },
    { hostname: "attacker.example" },
    { previousProductionId: "" },
  ])("refuses browser source and bearer before gates: %j", (delta) => {
    const session = createOperatorSession(now);
    expect(() =>
      session.browserScript({ ...confirmation, ...delta }, now),
    ).toThrow("prerequisites");
    expect(() => session.takeBearerForTranscription(now)).toThrow(
      "prerequisites",
    );
  });

  it.each([now - 1, now + 600_000])(
    "refuses provisioning outside its window",
    (at) => {
      expect(() =>
        createOperatorSession(now).browserScript(confirmation, at),
      ).toThrow("prerequisites");
      const session = createOperatorSession(now);
      session.browserScript(confirmation, now);
      expect(() => session.takeBearerForTranscription(at)).toThrow(
        "prerequisites",
      );
    },
  );
});

describe("same-origin browser invocation", () => {
  it.each([
    [-1, 0],
    [0, 1],
    [599_999, 1],
    [600_000, 0],
  ])(
    "allows prompt and POST only inside the scheduled window (offset %i)",
    async (offset, calls) => {
      const issued = now + 15 * 60_000;
      const { browser, config } = fixture(issued);
      vi.setSystemTime(issued + offset);
      await browserDiagnosticCheck(config, browser);
      expect(browser.prompt).toHaveBeenCalledTimes(calls);
      expect(browser.fetch).toHaveBeenCalledTimes(calls);
    },
  );

  it.each([-1, 600_000])(
    "rejects a clock outside the window after prompt (%i)",
    async (offset) => {
      const { browser, config, token } = fixture();
      browser.prompt.mockImplementation(() => {
        vi.setSystemTime(now + offset);
        return token;
      });
      await browserDiagnosticCheck(config, browser);
      expect(browser.fetch).not.toHaveBeenCalled();
    },
  );

  it("uses existing cookie credentials without reading/exporting them, sends a bodyless POST and reports booleans only", async () => {
    const { browser, config, token } = fixture();
    let usedHeaders;
    browser.fetch.mockImplementation(async (path, options) => {
      expect(path).toBe("/api/internal/db-binding");
      expect(options).toMatchObject({
        method: "POST",
        credentials: "same-origin",
        mode: "same-origin",
        redirect: "error",
        cache: "no-store",
        referrerPolicy: "no-referrer",
      });
      expect(options.body).toBeUndefined();
      expect(options.headers.get("authorization")).toBe(`Bearer ${token}`);
      expect(options.headers.get("x-db-binding-deployment-id")).toBe(
        "dpl_candidate",
      );
      usedHeaders = options.headers;
      return Response.json(passed);
    });
    await browserDiagnosticCheck(config, browser);
    expect(browser.fetch).toHaveBeenCalledOnce();
    expect(browser.alert).toHaveBeenCalledExactlyOnceWith(
      JSON.stringify(passed),
    );
    expect(usedHeaders.has("authorization")).toBe(false);
    expect(Object.values(browser).includes(token)).toBe(false);
  });

  it("runs the emitted secret-free snippet without a module/global helper dependency", async () => {
    const { browser, source } = fixture();
    const sandbox = {
      ...browser,
      Headers,
      AbortSignal,
      TextEncoder,
      Date,
      Uint8Array,
    };
    runInNewContext(source, sandbox);
    await vi.waitFor(() =>
      expect(browser.alert).toHaveBeenCalledExactlyOnceWith(
        JSON.stringify(passed),
      ),
    );
    expect(browser.fetch).toHaveBeenCalledOnce();
  });

  it.each([
    { isSecureContext: false },
    { location: { protocol: "http:", host: confirmation.hostname } },
    { location: { protocol: "https:", host: "different.vercel.app" } },
    {
      location: {
        protocol: "https:",
        host: confirmation.hostname,
        pathname: "/",
      },
    },
    { top: {} },
  ])("does not prompt or transmit on unsafe page: %j", async (delta) => {
    const { browser, config } = fixture();
    Object.assign(browser, delta);
    await browserDiagnosticCheck(config, browser);
    expect(browser.prompt).not.toHaveBeenCalled();
    expect(browser.fetch).not.toHaveBeenCalled();
  });

  it.each([
    { deploymentId: "invalid" },
    { previousProductionId: "dpl_candidate" },
    { identityVerified: false },
    { protectionVerified: false },
    { restoreVerified: false },
    { DB_BINDING_DIAGNOSTIC_EXPIRES_AT: new Date(now).toISOString() },
    { DB_BINDING_DIAGNOSTIC_EXPIRES_AT: new Date(now + 600_001).toISOString() },
    { DB_BINDING_DIAGNOSTIC_ISSUED_AT: "invalid" },
  ])("refuses invalid identity/window configuration: %j", async (delta) => {
    const { browser, config } = fixture();
    await browserDiagnosticCheck({ ...config, ...delta }, browser);
    expect(browser.prompt).not.toHaveBeenCalled();
    expect(browser.fetch).not.toHaveBeenCalled();
  });

  it.each([null, "", "invalid", Buffer.alloc(32, 4).toString("base64url")])(
    "rejects cancellation/wrong bearer before network",
    async (input) => {
      const { browser, config } = fixture();
      browser.prompt.mockReturnValue(input);
      await browserDiagnosticCheck(config, browser);
      expect(browser.fetch).not.toHaveBeenCalled();
      await browserDiagnosticCheck(config, browser);
      expect(browser.prompt).toHaveBeenCalledOnce();
    },
  );

  it.each([
    () => Response.json({ ...passed, detail: "untrusted secret" }),
    () => Response.json({ ...passed, schemaMatches: false }),
    () => Response.json(passed, { status: 401 }),
    () => {
      throw new Error("provider/network secret");
    },
  ])(
    "sanitizes failure, including loss of Vercel session, and latches against retry",
    async (response) => {
      const { browser, config } = fixture();
      browser.fetch.mockImplementation(async () => response());
      await browserDiagnosticCheck(config, browser);
      expect(browser.alert).toHaveBeenCalledExactlyOnceWith(
        "Diagnostic failed. Do not retry or release; follow removal procedure.",
      );
      await browserDiagnosticCheck(config, browser);
      expect(browser.prompt).toHaveBeenCalledOnce();
      expect(browser.fetch).toHaveBeenCalledOnce();
    },
  );
});
