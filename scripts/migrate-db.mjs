import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import pg from "pg";
import { migrationTarget } from "./migration-target.mjs";

const { connectionString } = migrationTarget(process.env, {
  requireReleaseGate: true,
});
const client = new pg.Client({ connectionString });
await client.connect();
try {
  await client.query("BEGIN");
  await client.query("SELECT pg_advisory_xact_lock(24199601)");
  await client.query(
    "CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY)",
  );
  const superseded = await client.query(
    "SELECT 1 FROM schema_migrations WHERE name = '0014_adaptive_finish_problem_identity.sql'",
  );
  if (superseded.rowCount)
    throw new Error(
      "Receipt-based 0014 was already applied; a forward migration is required.",
    );
  const receiptColumn = await client.query(
    "SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'practice_finish_receipts' AND column_name = 'adaptive_problem_id'",
  );
  if (receiptColumn.rowCount)
    throw new Error(
      "Receipt-based adaptive identity exists without the 0014 marker; inspect schema and use a forward migration.",
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
    "0013_learner_recovery_credentials.sql",
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
  const applied = async (name) =>
    (
      await client.query("SELECT 1 FROM schema_migrations WHERE name = $1", [
        name,
      ])
    ).rowCount > 0;
  const contracted = await applied("0014_adaptive_target_usage.sql");
  const expanded = await applied("0015_adaptive_compat_expand.sql");
  const captured = await applied("0016_adaptive_compat_capture.sql");
  const fullyContracted = await applied("0017_adaptive_compat_contract.sql");
  const shape = (
    await client.query(`SELECT
      to_regclass('practice_adaptive_target_usage') IS NOT NULL AS ledger,
      (SELECT count(*)::integer FROM information_schema.columns
       WHERE table_schema=current_schema() AND table_name='learners'
         AND column_name IN ('brothers_ages_attempted','brothers_ages_solution_exposed',
           'parrots_attempted','parrots_solution_exposed','pages_attempted',
           'pages_solution_exposed')) AS flags`)
  ).rows[0];
  if (contracted && expanded)
    throw new Error("Both adaptive schema histories are marked applied.");
  if (contracted && (!shape.ledger || shape.flags !== 0))
    throw new Error("Applied 0014 does not have its contracted schema.");
  if (expanded && (!shape.ledger || shape.flags !== (fullyContracted ? 0 : 6)))
    throw new Error("Applied 0015 does not have its expected schema.");
  if (fullyContracted && !captured)
    throw new Error("Contract marker exists without capture migration.");
  if (!contracted && !expanded) {
    if (shape.ledger || shape.flags !== 6)
      throw new Error("0013 schema is not eligible for additive expansion.");
    const name = "0015_adaptive_compat_expand.sql";
    await client.query(await readFile(resolve("db/migrations", name), "utf8"));
    await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [
      name,
    ]);
  }
  if (!captured) {
    const name = "0016_adaptive_compat_capture.sql";
    await client.query(await readFile(resolve("db/migrations", name), "utf8"));
    await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [
      name,
    ]);
  }
  if (process.env.MIGRATION_PHASE === "contract") {
    if (process.env.RELEASE_OLD_WRITERS_RETIRED !== "confirmed")
      throw new Error(
        "Contract requires explicit old-writer retirement confirmation.",
      );
    if (!fullyContracted) {
      const name = "0017_adaptive_compat_contract.sql";
      await client.query(
        await readFile(resolve("db/migrations", name), "utf8"),
      );
      await client.query("INSERT INTO schema_migrations (name) VALUES ($1)", [
        name,
      ]);
    }
  } else if (
    process.env.MIGRATION_PHASE !== undefined &&
    process.env.MIGRATION_PHASE !== "expand"
  ) {
    throw new Error("MIGRATION_PHASE must be expand or contract.");
  }
  await client.query("COMMIT");
} catch (error) {
  await client.query("ROLLBACK");
  throw error;
} finally {
  await client.end();
}
