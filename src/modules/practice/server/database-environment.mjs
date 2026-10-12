function databaseHost(connectionString, name) {
  if (!connectionString) throw new Error(`${name} is required.`);
  let url;
  try {
    url = new URL(connectionString);
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
  return url.hostname
    .toLowerCase()
    .replace(/\.$/, "")
    .replace(/-pooler(?=\.)/, "");
}

export function runtimeDatabaseUrl(env) {
  if (env.VERCEL_ENV !== "preview") {
    databaseHost(env.DATABASE_URL, "DATABASE_URL");
    return env.DATABASE_URL;
  }

  const productionHost = env.PRODUCTION_DATABASE_HOST?.toLowerCase().replace(
    /\.$/,
    "",
  );
  if (!productionHost) throw new Error("PRODUCTION_DATABASE_HOST is required.");
  const previewHost = databaseHost(
    env.PREVIEW_DATABASE_URL,
    "PREVIEW_DATABASE_URL",
  );
  if (previewHost === productionHost)
    throw new Error("Preview database must use a distinct Neon endpoint.");
  return env.PREVIEW_DATABASE_URL;
}
