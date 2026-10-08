import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { randomBytes } from "node:crypto";
vi.mock("server-only", () => ({}));
const state = vi.hoisted(() => ({
  jar: new Map<string, string>(),
  set: vi.fn(),
  auth: vi.fn(),
  start: vi.fn(),
  recover: vi.fn(),
  confirm: vi.fn(),
  cancel: vi.fn(),
  context: vi.fn(),
  status: vi.fn(),
  cleanup: vi.fn(),
  limit: vi.fn(),
  network: vi.fn(),
}));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) =>
      state.jar.has(name) ? { value: state.jar.get(name) } : undefined,
    set: state.set,
  }),
}));
vi.mock("../../../../modules/practice/server/learner-identity", () => ({
  LEARNER_COOKIE_NAME: "browser",
  resolveLearnerFromCookie: state.auth,
}));
vi.mock("../../../../modules/learner/server/recovery-credentials", () => ({
  startAuthenticatedCredentialChange: state.start,
  startRecovery: state.recover,
  confirmCredentialChange: state.confirm,
  cancelCredentialChange: state.cancel,
  pendingTransitionContext: state.context,
  readRecoveryCredentialStatus: state.status,
}));
vi.mock("../../../../modules/learner/server/identity-rate-limit", () => ({
  cleanupCredentialOperations: state.cleanup,
  limitCredentialAttempts: state.limit,
  CredentialRateLimited: class extends Error {
    constructor(public retryAfter: number) {
      super("Rate limited.");
    }
  },
}));
vi.mock(
  "../../../../modules/learner/server/recovery-security",
  async (importOriginal) => ({
    ...(await importOriginal<
      typeof import("../../../../modules/learner/server/recovery-security")
    >()),
    trustedRecoveryNetworkBucket: state.network,
  }),
);
import { CredentialRateLimited } from "../../../../modules/learner/server/identity-rate-limit";
import { POST } from "./route";
import { PENDING_COOKIE_NAME } from "../../../../modules/learner/server/credential-cookies";
import {
  generateBearerSecret,
  generateRecoveryCode,
} from "../../../../modules/learner/server/recovery-secrets";

const code = generateRecoveryCode();
const secret = generateBearerSecret();
const owner = {
  learnerId: "00000000-0000-4000-8000-000000000001",
  generation: "1",
};
function request(
  body: unknown,
  headers: Record<string, string> = {},
  url = "http://localhost:3000/api/identity/credentials",
) {
  return new Request(url, {
    method: "POST",
    headers: {
      origin: "http://localhost:3000",
      host: "localhost:3000",
      "content-type": "application/json",
      ...headers,
    },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}
beforeEach(() => {
  vi.clearAllMocks();
  state.jar.clear();
  vi.stubEnv("NODE_ENV", "test");
  vi.stubEnv("VERCEL", "");
  vi.stubEnv("RECOVERY_ENABLED", "true");
  vi.stubEnv(
    "RECOVERY_NETWORK_HMAC_KEY",
    randomBytes(32).toString("base64url"),
  );
  vi.stubEnv("CRON_SECRET", randomBytes(32).toString("base64url"));
  state.start.mockResolvedValue({ operationId: "operation", code, secret });
  state.recover.mockResolvedValue({ operationId: "operation", code, secret });
  state.confirm.mockResolvedValue({ owner });
  state.auth.mockResolvedValue({
    learnerId: owner.learnerId,
    generation: BigInt(0),
    tokenHash: "hash",
  });
  state.network.mockReturnValue(null);
  state.cleanup.mockResolvedValue(undefined);
});
afterEach(() => vi.unstubAllEnvs());
describe("credential HTTP boundary", () => {
  it.each(["production", "preview"])(
    "disabled feature rejects %s before any DB/auth work",
    async (target) => {
      if (target === "production") vi.stubEnv("NODE_ENV", "production");
      else vi.stubEnv("VERCEL", "1");
      vi.stubEnv("RECOVERY_ENABLED", undefined);
      expect((await POST(request({ action: "enrollment" }))).status).toBe(503);
      expect(state.auth).not.toHaveBeenCalled();
      expect(state.cleanup).not.toHaveBeenCalled();
    },
  );
  it.each([undefined, "", "false", "invalid", "TRUE"])(
    "feature unset/invalid rejects before body, network or DB",
    async (flag) => {
      vi.stubEnv("RECOVERY_ENABLED", flag);
      expect((await POST(request({ action: "enrollment" }))).status).toBe(503);
      expect(state.network).not.toHaveBeenCalled();
      expect(state.auth).not.toHaveBeenCalled();
      expect(state.cleanup).not.toHaveBeenCalled();
    },
  );
  it.each(["RECOVERY_NETWORK_HMAC_KEY", "CRON_SECRET"])(
    "enabled but missing security configuration fails closed",
    async (name) => {
      vi.stubEnv(name, undefined);
      expect((await POST(request({ action: "enrollment" }))).status).toBe(503);
      expect(state.auth).not.toHaveBeenCalled();
      expect(state.cleanup).not.toHaveBeenCalled();
    },
  );
  it("enabled Vercel Preview may execute with valid controlled config and trusted origin", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("VERCEL", "1");
    vi.stubEnv("VERCEL_ENV", "preview");
    vi.stubEnv("VERCEL_URL", "trainer-preview.vercel.app");
    state.network.mockReturnValue("a".repeat(64));
    const result = await POST(
      request(
        { action: "recovery", code },
        {
          origin: "https://trainer-preview.vercel.app",
          host: "trainer-preview.vercel.app",
        },
        "https://trainer-preview.vercel.app/api/identity/credentials",
      ),
    );
    expect(result.status).toBe(200);
    expect(state.limit).toHaveBeenCalledWith(
      "recovery-start-network",
      "a".repeat(64),
      10,
    );
  });
  it("uses only the explicit development network test address, never local forwarding headers", async () => {
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("RECOVERY_LOCAL_TEST_NETWORK_ADDRESS", "127.0.0.1");
    state.network.mockImplementation(
      (
        _headers: Headers,
        _env: Record<string, string>,
        testAddress: string,
      ) => {
        expect(testAddress).toBe("127.0.0.1");
        return "a".repeat(64);
      },
    );
    const response = await POST(
      request(
        { action: "recovery", code },
        { "x-forwarded-for": "203.0.113.77" },
      ),
    );
    expect(response.status).toBe(200);
    expect(state.limit).toHaveBeenCalledWith(
      "recovery-start-network",
      "a".repeat(64),
      10,
    );
  });
  it("reads only recovery-enabled status behind the authenticated identity boundary", async () => {
    state.status.mockResolvedValue({ enabled: true });
    const result = await POST(request({ action: "status-authenticated" }));
    expect(result.status).toBe(200);
    expect(result.headers.get("cache-control")).toBe("no-store");
    expect(await result.json()).toEqual({ ok: true, enabled: true });
    expect(state.auth).toHaveBeenCalledOnce();
    expect(state.status).toHaveBeenCalledWith(
      expect.objectContaining({ learnerId: owner.learnerId }),
    );
    expect(state.limit).toHaveBeenCalledWith(
      "authenticated-context",
      owner.learnerId,
    );
  });
  it.each(["recovery", "context-recovery", "confirm-recovery"])(
    "network limit is enforced before sensitive %s service work",
    async (action) => {
      state.network.mockReturnValue("a".repeat(64));
      state.jar.set(PENDING_COOKIE_NAME, secret);
      state.limit.mockRejectedValueOnce(new CredentialRateLimited(90));
      const result = await POST(request({ action, code }));
      expect(result.status).toBe(429);
      expect(result.headers.get("Retry-After")).toBe("90");
      expect(await result.json()).toEqual({
        ok: false,
        error: "retry-later",
        retryAfter: 90,
      });
      expect(state.limit).toHaveBeenCalledWith(
        action === "recovery"
          ? "recovery-start-network"
          : "recovery-confirm-network",
        "a".repeat(64),
        action === "recovery" ? 10 : 30,
      );
      expect(state.recover).not.toHaveBeenCalled();
      expect(state.context).not.toHaveBeenCalled();
      expect(state.confirm).not.toHaveBeenCalled();
    },
  );
  it.each([
    [{ action: "enrollment" }, { origin: "https://evil.example" }],
    [{ action: "enrollment" }, { origin: "null" }],
    [{ action: "enrollment" }, { host: "evil.example" }],
    [{ action: "enrollment" }, { "sec-fetch-site": "cross-site" }],
    [{ action: "enrollment" }, { "content-type": "text/plain" }],
    [{ action: "recovery", code: "1234" }, {}],
    [{ action: "recovery", code, learnerId: owner.learnerId }, {}],
    ["x".repeat(1025), {}],
    [{ action: "recovery", code: "OTR1-" + "A".repeat(42) + "B" }, {}],
    [{ action: "enrollment" }, { "content-length": "9999" }],
  ])(
    "rejects malformed/oversized/cross-origin input before DB work",
    async (body, headers) => {
      expect((await POST(request(body, headers))).status).toBe(400);
      expect(state.start).not.toHaveBeenCalled();
      expect(state.limit).not.toHaveBeenCalled();
      expect(state.cleanup).not.toHaveBeenCalled();
    },
  );
  it("rejects forged matching origin/host outside the local allowlist and query secrets", async () => {
    expect(
      (
        await POST(
          request(
            { action: "enrollment" },
            { origin: "https://evil.example", host: "evil.example" },
            "https://evil.example/api/identity/credentials",
          ),
        )
      ).status,
    ).toBe(400);
    expect(
      (
        await POST(
          request(
            { action: "enrollment" },
            {},
            "http://localhost:3000/api/identity/credentials?code=secret",
          ),
        )
      ).status,
    ).toBe(400);
  });
  it("fails recovery closed without trusted network infrastructure", async () => {
    const result = await POST(request({ action: "recovery", code }));
    expect(result.status).toBe(503);
    expect(state.recover).not.toHaveBeenCalled();
    expect(state.limit).not.toHaveBeenCalled();
  });
  it("delivers successor once, no-store, via separate HttpOnly pending cookie", async () => {
    const result = await POST(request({ action: "enrollment" }));
    expect(result.headers.get("cache-control")).toBe("no-store");
    expect(await result.json()).toEqual({
      ok: true,
      operationId: "operation",
      code,
    });
    expect(state.set).toHaveBeenCalledWith(PENDING_COOKIE_NAME, secret, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      path: "/api/identity/credentials",
      maxAge: 600,
    });
  });
  it("sets browser cookie only after successful committed recovery, never exposes token in JSON", async () => {
    state.network.mockReturnValue("test-trusted-bucket");
    state.jar.set(PENDING_COOKIE_NAME, secret);
    const token = generateBearerSecret();
    state.confirm.mockResolvedValue({ owner, browserToken: token });
    const result = await POST(request({ action: "confirm-recovery", code }));
    expect(state.confirm).toHaveBeenCalledWith(secret, code, undefined);
    expect(state.set).toHaveBeenCalledWith(
      "browser",
      token,
      expect.objectContaining({ httpOnly: true, path: "/", sameSite: "lax" }),
    );
    expect(await result.json()).toEqual({ ok: true, owner });
    state.set.mockClear();
    state.confirm.mockRejectedValue(
      new Error(`DB failure ${code} ${secret} ${token}`),
    );
    const failed = await POST(request({ action: "confirm-recovery", code }));
    expect(await failed.json()).toEqual({ ok: false, error: "unavailable" });
    expect(state.set).not.toHaveBeenCalled();
  });
  it("requires ordinary browser authentication for enrollment confirmation despite pending cookie", async () => {
    state.jar.set(PENDING_COOKIE_NAME, secret);
    state.auth.mockRejectedValue(new Error("identity is unavailable"));
    expect(
      (await POST(request({ action: "confirm-authenticated", code }))).status,
    ).toBe(400);
    expect(state.confirm).not.toHaveBeenCalled();
  });
  it("clears pending cookie on successful cancellation without changing browser cookie", async () => {
    state.jar.set(PENDING_COOKIE_NAME, secret);
    expect((await POST(request({ action: "cancel" }))).status).toBe(200);
    expect(state.set).toHaveBeenCalledTimes(1);
    expect(state.set).toHaveBeenCalledWith(
      PENDING_COOKIE_NAME,
      "",
      expect.objectContaining({ maxAge: 0 }),
    );
  });
});
