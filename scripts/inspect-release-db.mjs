import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import pg from "pg";
import { migrationTarget } from "./migration-target.mjs";

const expected = process.argv[2];
if (!["before", "expanded", "contracted", "final"].includes(expected))
  throw new Error(
    "Usage: node scripts/inspect-release-db.mjs before|expanded|contracted|final",
  );

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
  const plan = JSON.parse(
    await readFile(resolve("db/migration-plan.json"), "utf8"),
  );
  const base = plan.base;
  const repairedExpansion = [
    [
      "0015_adaptive_compat_expand.sql",
      "0016_adaptive_compat_capture.sql",
      "0019_adaptive_compat_capture_basis.sql",
    ],
    plan.expansion,
  ];
  const repairedContracted = [
    "0014_adaptive_target_usage.sql",
    "0016_adaptive_compat_capture.sql",
    "0019_adaptive_compat_capture_basis.sql",
  ];
  const suffixes = {
    before: [[]],
    expanded: repairedExpansion,
    contracted: [repairedContracted],
    final: [
      [
        "0015_adaptive_compat_expand.sql",
        "0016_adaptive_compat_capture.sql",
        plan.contract,
      ],
      [
        "0014_adaptive_target_usage.sql",
        "0016_adaptive_compat_capture.sql",
        plan.contract,
      ],
      ...[...repairedExpansion, repairedContracted].map((history) => [
        ...history,
        plan.contract,
      ]),
    ],
  };
  const validMigrations = suffixes[expected].some(
    (suffix) =>
      migrations.length === base.length + suffix.length &&
      [...base, ...suffix]
        .sort()
        .every((name, index) => migrations[index] === name),
  );
  const validShape =
    shape.old_flags === (["contracted", "final"].includes(expected) ? 0 : 6) &&
    shape.ledger_exists === (expected !== "before") &&
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
