import "server-only";

import { createHmac } from "node:crypto";
import { isIP } from "node:net";

type Environment = Readonly<Record<string, string | undefined>>;
type HeaderSource = Pick<Headers, "get">;

export function recoveryNetworkKey(
  env: Environment = process.env,
): Buffer | null {
  const encoded = env.RECOVERY_NETWORK_HMAC_KEY;
  // Dedicated canonical base64url material, 32–128 decoded random bytes.
  if (
    !encoded ||
    encoded === env.CRON_SECRET ||
    !/^[A-Za-z0-9_-]{43,171}$/.test(encoded)
  )
    return null;
  const key = Buffer.from(encoded, "base64url");
  if (
    key.length < 32 ||
    key.length > 128 ||
    key.toString("base64url") !== encoded
  )
    return null;
  return key;
}

export function validCronSecret(env: Environment = process.env): string | null {
  const secret = env.CRON_SECRET;
  // Generated printable bearer material only; reject header separators/whitespace.
  return secret && /^[A-Za-z0-9_-]{32,256}$/.test(secret) ? secret : null;
}

export function recoveryEnabled(env: Environment = process.env) {
  return (
    env.RECOVERY_ENABLED === "true" &&
    recoveryNetworkKey(env) !== null &&
    validCronSecret(env) !== null
  );
}

function vercelIngress(env: Environment) {
  return (
    env.VERCEL === "1" &&
    (env.VERCEL_ENV === "production" || env.VERCEL_ENV === "preview")
  );
}

export function canonicalClientAddress(value: string | null): string | null {
  if (
    !value ||
    value.length > 45 ||
    value !== value.trim() ||
    value.includes("%")
  )
    return null;
  const family = isIP(value);
  if (family === 4) return value;
  if (family !== 6) return null;
  // WHATWG IPv6 serialization normalizes case/compression and dotted tails.
  const normalized = new URL(`http://[${value}]/`).hostname.slice(1, -1);
  // IPv4-mapped IPv6 must share the same bucket as its IPv4 representation.
  const mapped = /^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/.exec(normalized);
  if (!mapped) return normalized;
  const high = parseInt(mapped[1], 16);
  const low = parseInt(mapped[2], 16);
  return `${high >> 8}.${high & 255}.${low >> 8}.${low & 255}`;
}

export function trustedRecoveryNetworkBucket(
  headers: HeaderSource,
  env: Environment = process.env,
  // Explicit in-process seam only. The HTTP route never supplies this argument.
  localTestAddress?: string,
): string | null {
  const key = recoveryNetworkKey(env);
  if (!key) return null;
  const source = vercelIngress(env)
    ? headers.get("x-forwarded-for")
    : env.NODE_ENV !== "production" && !env.VERCEL
      ? (localTestAddress ?? null)
      : null;
  const address = canonicalClientAddress(source);
  if (!address) return null;
  return createHmac("sha256", key)
    .update("olympiad-trainer:recovery-network-v1\0")
    .update(address)
    .digest("hex");
}

export function credentialRequestOriginAllowed(
  request: Request,
  env: Environment = process.env,
) {
  const url = new URL(request.url);
  if (
    url.search ||
    url.username ||
    url.password ||
    request.headers.get("origin") !== url.origin ||
    request.headers.get("host") !== url.host ||
    (request.headers.has("sec-fetch-site") &&
      request.headers.get("sec-fetch-site") !== "same-origin")
  )
    return false;
  if (!vercelIngress(env))
    return (
      !env.VERCEL &&
      env.NODE_ENV !== "production" &&
      url.protocol === "http:" &&
      ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname)
    );
  // Trusted server hosting configuration, never a caller-provided Host allowlist.
  const hosts = [
    env.VERCEL_URL,
    env.VERCEL_BRANCH_URL,
    env.VERCEL_PROJECT_PRODUCTION_URL,
  ];
  return (
    url.protocol === "https:" &&
    hosts.some(
      (host) =>
        host !== undefined &&
        /^[a-z0-9](?:[a-z0-9.-]*[a-z0-9])?$/i.test(host) &&
        host.toLowerCase() === url.host,
    )
  );
}
