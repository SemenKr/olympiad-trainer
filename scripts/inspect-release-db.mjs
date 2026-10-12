import pg from "pg";
import { migrationTarget } from "./migration-target.mjs";

const expected = process.argv[2];
if (expected !== "before" && expected !== "after")
  throw new Error("Usage: node scripts/inspect-release-db.mjs before|after");

const { target, connectionString } = migrationTarget(process.env);
const client = new pg.Client({ connectionString });
await client.connect();
try {
  await client.query("BEGIN READ ONLY");
  const migrations = (
    await client.query("SELECT name FROM schema_migrations ORDER BY name")
  ).rows.map((row) => row.name);
  const shape = (
    await client.query(`SELECT
      (SELECT count(*)::integer FROM information_schema.columns
        WHERE table_schema = current_schema() AND table_name = 'learners'
          AND column_name IN ('brothers_ages_attempted','brothers_ages_solution_exposed',
            'parrots_attempted','parrots_solution_exposed','pages_attempted',
            'pages_solution_exposed')) AS old_flags,
      to_regclass('practice_adaptive_target_usage') IS NOT NULL AS ledger_exists,
      EXISTS (SELECT 1 FROM information_schema.columns
        WHERE table_schema = current_schema() AND table_name = 'practice_finish_receipts'
          AND column_name = 'adaptive_problem_id') AS old_receipt_column,
      (SELECT count(*) FROM learners) AS learner_count,
      (SELECT count(*) FROM practice_finish_receipts) AS receipt_count,
      (SELECT count(*) FROM practice_completed_episodes) AS episode_count`)
  ).rows[0];
  const base = [
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
  ];
  const validMigrations =
    migrations.length === base.length + (expected === "after" ? 1 : 0) &&
    base.every((name, index) => migrations[index] === name) &&
    (expected === "before" ||
      migrations.at(-1) === "0014_adaptive_target_usage.sql");
  const validShape =
    shape.old_flags === (expected === "before" ? 6 : 0) &&
    shape.ledger_exists === (expected === "after") &&
    !shape.old_receipt_column;
  const result = {
    target,
    expected,
    migrationCount: migrations.length,
    oldFlags: shape.old_flags,
    ledgerExists: shape.ledger_exists,
    learners: Number(shape.learner_count),
    receipts: Number(shape.receipt_count),
    episodes: Number(shape.episode_count),
    pass: validMigrations && validShape,
  };
  console.log(JSON.stringify(result));
  if (!result.pass) process.exitCode = 1;
  await client.query("ROLLBACK");
} finally {
  await client.end();
}
