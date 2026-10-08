import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import {
  generateRecoveryCode,
  generateBearerSecret,
  isRecoveryCode,
  isPendingSecret,
  pendingSecretHash,
  recoveryCodeHash,
} from "./recovery-secrets";

describe("canonical recovery credentials", () => {
  it("uses 32 random bytes, fixed versioned representation and separated hashes", () => {
    const code = generateRecoveryCode();
    expect(code).toMatch(/^OTR1-[A-Za-z0-9_-]{43}$/);
    expect(Buffer.from(code.slice(5), "base64url")).toHaveLength(32);
    expect(isRecoveryCode(code)).toBe(true);
    expect(generateRecoveryCode()).not.toBe(code);
    const secret = generateBearerSecret();
    expect(isPendingSecret(secret)).toBe(true);
    expect(recoveryCodeHash(`OTR1-${secret}`)).not.toBe(
      pendingSecretHash(secret),
    );
    expect(recoveryCodeHash(code)).toMatch(/^[0-9a-f]{64}$/);
  });
  it.each([
    null,
    42,
    "1234",
    " OTR1-" + "A".repeat(43),
    "OTR1-" + "A".repeat(42) + "B",
    "OTR2-" + "A".repeat(43),
    "OTR1-" + "A".repeat(43) + "\n",
    "OTR1-" + "A".repeat(43) + "=",
  ])("rejects noncanonical input without normalization: %s", (value) => {
    expect(isRecoveryCode(value)).toBe(false);
  });
});
