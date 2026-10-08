import { randomBytes } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const cleanup = vi.hoisted(() => vi.fn());
vi.mock("../../../../modules/learner/server/identity-rate-limit", () => ({
  scheduledCredentialCleanup: cleanup,
}));
import { GET } from "./route";
const secret = randomBytes(32).toString("base64url");
const request = (authorization?: string) =>
  new Request("https://trainer.vercel.app/api/internal/recovery-cleanup", {
    headers: authorization ? { authorization } : {},
  });
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("CRON_SECRET", secret);
  cleanup.mockResolvedValue({
    pendingDeleted: 2,
    rateDeleted: 3,
    complete: true,
  });
});
afterEach(() => vi.unstubAllEnvs());

describe("protected credential cleanup endpoint", () => {
  it.each([
    undefined,
    "Bearer undefined",
    "Bearer invalid",
    `bearer ${secret}`,
    `Bearer ${secret}extra`,
    `Basic ${secret}`,
  ])("rejects incorrect bearer auth before DB: %s", async (authorization) => {
    const result = await GET(request(authorization));
    expect(result.status).toBe(401);
    expect(cleanup).not.toHaveBeenCalled();
    expect(result.headers.get("cache-control")).toBe("no-store");
  });
  it.each([undefined, "", "short", "has spaces"])(
    "rejects missing/invalid configured CRON_SECRET before DB",
    async (config) => {
      if (config === undefined) vi.stubEnv("CRON_SECRET", undefined);
      else vi.stubEnv("CRON_SECRET", config);
      expect((await GET(request("Bearer undefined"))).status).toBe(401);
      expect(cleanup).not.toHaveBeenCalled();
    },
  );
  it("valid exact authorization executes operational cleanup without browser auth or learner disclosure", async () => {
    const result = await GET(request(`Bearer ${secret}`));
    expect(result.status).toBe(200);
    expect(await result.json()).toEqual({
      ok: true,
      pendingDeleted: 2,
      rateDeleted: 3,
      complete: true,
    });
    expect(cleanup).toHaveBeenCalledExactlyOnceWith();
  });
  it("returns scheduler-visible non-success for leftover backlog", async () => {
    cleanup.mockResolvedValue({
      pendingDeleted: 2000,
      rateDeleted: 2000,
      complete: false,
    });
    expect((await GET(request(`Bearer ${secret}`))).status).toBe(503);
  });
  it("database failures return non-success without logging or serializing secret error details", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => {});
    cleanup.mockRejectedValue(new Error(`sensitive ${secret}`));
    const result = await GET(request(`Bearer ${secret}`));
    expect(result.status).toBe(503);
    expect(await result.json()).toEqual({ ok: false });
    expect(log).not.toHaveBeenCalled();
    log.mockRestore();
  });
});
