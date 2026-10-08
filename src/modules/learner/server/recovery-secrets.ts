import "server-only";

import { createHash, randomBytes } from "node:crypto";

export const PENDING_LIFETIME_SECONDS = 600;
export const BROWSER_LIFETIME_SECONDS = 60 * 60 * 24 * 365 * 2;

function canonicalBytes(value: string) {
  return (
    /^[A-Za-z0-9_-]{43}$/.test(value) &&
    Buffer.from(value, "base64url").toString("base64url") === value
  );
}

export function isRecoveryCode(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length === 48 &&
    value.startsWith("OTR1-") &&
    canonicalBytes(value.slice(5))
  );
}

export function isPendingSecret(value: unknown): value is string {
  return typeof value === "string" && canonicalBytes(value);
}

export function generateRecoveryCode() {
  return `OTR1-${randomBytes(32).toString("base64url")}`;
}

export function generateBearerSecret() {
  return randomBytes(32).toString("base64url");
}

export function recoveryCodeHash(code: string) {
  if (!isRecoveryCode(code)) throw new Error("Invalid credential input.");
  return operationalHash("recovery-code-v1", code);
}

export function pendingSecretHash(secret: string) {
  if (!isPendingSecret(secret)) throw new Error("Invalid credential input.");
  return operationalHash("pending-secret-v1", secret);
}

export function operationalHash(domain: string, value: string) {
  return createHash("sha256")
    .update(`olympiad-trainer:${domain}\0`)
    .update(value)
    .digest("hex");
}
