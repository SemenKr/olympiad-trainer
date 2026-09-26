import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import pg from "pg";

const connectionString =
  process.env.DATABASE_MIGRATION_URL ?? process.env.DATABASE_URL;
if (!connectionString)
  throw new Error("DATABASE_MIGRATION_URL or DATABASE_URL is required.");
const client = new pg.Client({ connectionString });
await client.connect();
try {
  await client.query("BEGIN");
  await client.query("SELECT pg_advisory_xact_lock(24199601)");
  await client.query(
    "CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY)",
  );
  const name = "0001_learner_progress.sql";
  const prior = await client.query(
    "SELECT 1 FROM schema_migrations WHERE name = $1",
    [name],
  );
  if (prior.rowCount === 0) {
    const sql = await readFile(resolve("db/migrations", name), "utf8");
    await client.query(sql);
    await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [
      name,
    ]);
  }
  await client.query("COMMIT");
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  await client.end();
}
