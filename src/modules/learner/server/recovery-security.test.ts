import { createHmac, randomBytes } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import {
  canonicalClientAddress,
  credentialRequestOriginAllowed,
  recoveryEnabled,
  recoveryNetworkKey,
  trustedRecoveryNetworkBucket,
  validCronSecret,
} from "./recovery-security";

const key = randomBytes(32).toString("base64url");
const configured = {
  RECOVERY_ENABLED: "true",
  RECOVERY_NETWORK_HMAC_KEY: key,
  CRON_SECRET: randomBytes(32).toString("base64url"),
};
const vercel = {
  ...configured,
  NODE_ENV: "production",
  VERCEL: "1",
  VERCEL_ENV: "preview",
  VERCEL_URL: "trainer-preview.vercel.app",
};
const headers = (address?: string) =>
  new Headers(address === undefined ? {} : { "x-forwarded-for": address });

describe("recovery trusted network and configuration", () => {
  it.each([
    ["192.0.2.1", "192.0.2.1"],
    ["2001:0DB8:0000:0:0:0:0:1", "2001:db8::1"],
    ["::ffff:192.0.2.1", "192.0.2.1"],
    ["::FFFF:c000:0201", "192.0.2.1"],
    ["::1", "::1"],
  ])("canonicalizes valid Vercel IP input %s", (input, canonical) => {
    expect(canonicalClientAddress(input)).toBe(canonical);
    const bucket = trustedRecoveryNetworkBucket(headers(input), vercel);
    expect(bucket).toMatch(/^[0-9a-f]{64}$/);
    expect(bucket).toBe(
      createHmac("sha256", Buffer.from(key, "base64url"))
        .update("olympiad-trainer:recovery-network-v1\0")
        .update(canonical)
        .digest("hex"),
    );
  });
  it.each([
    undefined,
    "",
    "invalid",
    "192.0.2.1, 192.0.2.2",
    "192.000.2.1",
    "256.1.1.1",
    "192.0.2.1:443",
    "[2001:db8::1]",
    "fe80::1%eth0",
    "1".repeat(46),
  ])("fails closed on missing/malformed trusted header: %s", (input) => {
    expect(trustedRecoveryNetworkBucket(headers(input), vercel)).toBeNull();
  });
  it("same address/key yields same bucket; canonical aliases cannot evade it; changed key/address differs", () => {
    const first = trustedRecoveryNetworkBucket(headers("192.0.2.1"), vercel);
    expect(
      trustedRecoveryNetworkBucket(headers("::ffff:192.0.2.1"), vercel),
    ).toBe(first);
    expect(trustedRecoveryNetworkBucket(headers("192.0.2.1"), vercel)).toBe(
      first,
    );
    expect(trustedRecoveryNetworkBucket(headers("192.0.2.2"), vercel)).not.toBe(
      first,
    );
    expect(
      trustedRecoveryNetworkBucket(headers("192.0.2.1"), {
        ...vercel,
        RECOVERY_NETWORK_HMAC_KEY: randomBytes(32).toString("base64url"),
      }),
    ).not.toBe(first);
  });
  it.each([
    undefined,
    "",
    "short",
    randomBytes(31).toString("base64url"),
    `${key}=`,
    "A".repeat(42) + "B",
    "A".repeat(172),
  ])("invalid HMAC material fails closed", (material) => {
    const env = { ...vercel, RECOVERY_NETWORK_HMAC_KEY: material };
    expect(recoveryNetworkKey(env)).toBeNull();
    expect(recoveryEnabled(env)).toBe(false);
    expect(trustedRecoveryNetworkBucket(headers("192.0.2.1"), env)).toBeNull();
  });
  it("rejects direct cron-key reuse rather than accepting an unrelated secret as the HMAC key", () => {
    expect(recoveryEnabled({ ...configured, CRON_SECRET: key })).toBe(false);
  });
  it("accepts at least 32 decoded bytes, without accepting padded/alternate encodings", () => {
    expect(
      recoveryNetworkKey({
        RECOVERY_NETWORK_HMAC_KEY: randomBytes(64).toString("base64url"),
      }),
    ).toHaveLength(64);
  });
  it("ignores arbitrary local forwarding headers; only explicit in-process test address seam applies", () => {
    const local = { ...configured, NODE_ENV: "test" };
    expect(
      trustedRecoveryNetworkBucket(headers("192.0.2.1"), local),
    ).toBeNull();
    expect(
      trustedRecoveryNetworkBucket(headers("192.0.2.2"), local, "192.0.2.1"),
    ).toBe(trustedRecoveryNetworkBucket(headers("192.0.2.1"), vercel));
    expect(
      trustedRecoveryNetworkBucket(
        headers("192.0.2.1"),
        { ...local, NODE_ENV: "production" },
        "192.0.2.1",
      ),
    ).toBeNull();
    expect(
      trustedRecoveryNetworkBucket(
        headers("192.0.2.1"),
        { ...vercel, VERCEL_ENV: "development" },
        "192.0.2.1",
      ),
    ).toBeNull();
    expect(
      trustedRecoveryNetworkBucket(headers(), vercel, "192.0.2.1"),
    ).toBeNull();
  });
  it.each([undefined, "", "false", "1", "TRUE", "True", " true", "true "])(
    "gate only accepts exact true (%s)",
    (enabled) => {
      expect(
        recoveryEnabled({ ...configured, RECOVERY_ENABLED: enabled }),
      ).toBe(false);
    },
  );
  it("enabled requires HMAC and cron configuration and is independent of production/Preview environment branching", () => {
    expect(recoveryEnabled(configured)).toBe(true);
    expect(recoveryEnabled(vercel)).toBe(true);
    expect(recoveryEnabled({ ...vercel, VERCEL_ENV: "production" })).toBe(true);
    expect(recoveryEnabled({ ...configured, CRON_SECRET: undefined })).toBe(
      false,
    );
    expect(
      recoveryEnabled({ ...configured, CRON_SECRET: "Bearer undefined" }),
    ).toBe(false);
    expect(validCronSecret({ CRON_SECRET: "\nsecret" })).toBeNull();
  });
});

describe("trusted origin independent of SameSite", () => {
  function request(
    url: string,
    origin: string = new URL(url).origin,
    host: string = new URL(url).host,
  ) {
    return new Request(url, { headers: { origin, host } });
  }
  it("accepts only matching HTTPS origins from server Vercel deployment configuration", () => {
    expect(
      credentialRequestOriginAllowed(
        request("https://trainer-preview.vercel.app/api/identity/credentials"),
        vercel,
      ),
    ).toBe(true);
    expect(
      credentialRequestOriginAllowed(
        request("https://evil.vercel.app/api/identity/credentials"),
        vercel,
      ),
    ).toBe(false);
    expect(
      credentialRequestOriginAllowed(
        request("http://trainer-preview.vercel.app/api/identity/credentials"),
        vercel,
      ),
    ).toBe(false);
    expect(
      credentialRequestOriginAllowed(
        request(
          "https://trainer-preview.vercel.app/api/identity/credentials",
          "https://evil.example",
        ),
        vercel,
      ),
    ).toBe(false);
    expect(
      credentialRequestOriginAllowed(
        request(
          "https://trainer-preview.vercel.app/api/identity/credentials",
          undefined,
          "evil.example",
        ),
        vercel,
      ),
    ).toBe(false);
  });
  it("has no production fallback to arbitrary Host or local test addresses", () => {
    expect(
      credentialRequestOriginAllowed(
        request("http://localhost:3000/api/identity/credentials"),
        { NODE_ENV: "production" },
      ),
    ).toBe(false);
    expect(
      credentialRequestOriginAllowed(
        request("https://trainer-preview.vercel.app/api/identity/credentials"),
        { ...vercel, VERCEL_URL: undefined },
      ),
    ).toBe(false);
    expect(
      credentialRequestOriginAllowed(
        request("http://localhost:3000/api/identity/credentials"),
        { NODE_ENV: "test" },
      ),
    ).toBe(true);
  });
});
