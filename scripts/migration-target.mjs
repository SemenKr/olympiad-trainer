function databaseAddress(value, name) {
  if (!value) throw new Error(`${name} is required.`);
  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error(`${name} must be a PostgreSQL URL.`);
  }
  if (url.protocol !== "postgresql:" && url.protocol !== "postgres:")
    throw new Error(`${name} must be a PostgreSQL URL.`);
  if (
    ["host", "port", "connectionString"].some((key) =>
      url.searchParams.has(key),
    )
  )
    throw new Error(`${name} may not override its connection target.`);
  return {
    host: url.hostname
      .toLowerCase()
      .replace(/\.$/, "")
      .replace(/-pooler(?=\.)/, ""),
    database: decodeURIComponent(url.pathname.slice(1)),
    pooled: url.hostname.includes("-pooler."),
  };
}

export function migrationTarget(env, { requireReleaseGate = false } = {}) {
  if (requireReleaseGate) {
    const phase = env.MIGRATION_PHASE ?? "expand";
    if (phase !== "expand" && phase !== "contract")
      throw new Error("MIGRATION_PHASE must be expand or contract.");
    if (phase === "contract" && env.RELEASE_OLD_WRITERS_RETIRED !== "confirmed")
      throw new Error(
        "Contract requires explicit old-writer retirement confirmation.",
      );
  }
  const target = env.MIGRATION_TARGET ?? "local";
  if (target === "local") {
    const connectionString = env.DATABASE_MIGRATION_URL ?? env.DATABASE_URL;
    const { host } = databaseAddress(
      connectionString,
      "DATABASE_MIGRATION_URL",
    );
    if (!new Set(["localhost", "127.0.0.1", "[::1]", "::1"]).has(host))
      throw new Error("Local migrations require a loopback database host.");
    return { target, connectionString };
  }
  if (target === "preview") {
    const connectionString = env.PREVIEW_DATABASE_MIGRATION_URL;
    const preview = databaseAddress(
      connectionString,
      "PREVIEW_DATABASE_MIGRATION_URL",
    );
    const productionHost = env.PRODUCTION_DATABASE_HOST?.toLowerCase().replace(
      /\.$/,
      "",
    );
    if (!productionHost)
      throw new Error("PRODUCTION_DATABASE_HOST is required.");
    if (preview.host === productionHost)
      throw new Error("Preview migrations require a distinct Neon endpoint.");
    if (preview.pooled)
      throw new Error("Preview migrations require a direct connection.");
    return { target, connectionString };
  }
  if (target === "production") {
    const connectionString = env.DATABASE_MIGRATION_URL;
    const address = databaseAddress(connectionString, "DATABASE_MIGRATION_URL");
    if (!env.PRODUCTION_DATABASE_HOST || !env.PRODUCTION_DATABASE_NAME)
      throw new Error("Production host and database identity are required.");
    if (
      address.host !==
        env.PRODUCTION_DATABASE_HOST.toLowerCase().replace(/\.$/, "") ||
      address.database !== env.PRODUCTION_DATABASE_NAME
    )
      throw new Error(
        "Production database identity does not match release target.",
      );
    if (address.pooled)
      throw new Error("Production migrations require a direct connection.");
    if (requireReleaseGate && !env.RELEASE_RECOVERY_POINT_ID?.trim())
      throw new Error("Recovery-point evidence ID is required.");
    if (
      requireReleaseGate &&
      env.MIGRATION_PHASE === "contract" &&
      !env.RELEASE_WRITER_DENY_ID?.trim()
    )
      throw new Error("Contract requires writer-deny evidence ID.");
    return { target, connectionString };
  }
  throw new Error("MIGRATION_TARGET must be local, preview or production.");
}
