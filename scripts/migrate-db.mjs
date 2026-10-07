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
  for (const name of [
    "0001_learner_progress.sql",
    "0002_adaptive_transfer_status.sql",
    "0003_parrots_transfer_status.sql",
    "0004_practice_completed_episodes.sql",
    "0005_enumeration_exploration.sql",
    "0006_content_scale_pack_a.sql",
    "0007_knowledge_support.sql",
    "0008_practice_journey.sql",
    "0009_practice_review.sql",
    "0010_simulation.sql",
    "0011_learning_path_pack_receipts.sql",
    "0012_learner_identity_boundary.sql",
  ]) {
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
  }
  await client.query("COMMIT");
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  await client.end();
}
