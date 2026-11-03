import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import pg from "pg";
import { describe, expect, it } from "vitest";
import { emptyGuaranteeProgressEvidence } from "../application/guarantee-progress-evidence";
import { emptyImpossibilityProgressEvidence } from "../application/impossibility-progress-evidence";
import { emptyEnumerationProgressEvidence } from "../application/enumeration-progress-evidence";

const url = process.env.DATABASE_TEST_URL;
const episode = {
  version: 1,
  problems: [
    {
      problemId: "brothers-ages-products",
      outcome: "no-valid-submissions",
      skipped: true,
      validSubmissionCount: 0,
      hintLevelsExposed: ["focus"],
      solutionExposed: false,
      checkpoint: null,
    },
  ],
};

async function fixture(
  history: "0013" | "0014",
  run: (f: {
    client: pg.Client;
    connectionString: string;
    learnerId: string;
    app: string;
  }) => Promise<void>,
) {
  // The child runner deliberately uses its loopback-only target, never production.
  const address = new URL(url!);
  expect(["localhost", "127.0.0.1", "[::1]"]).toContain(address.hostname);
  const client = new pg.Client({ connectionString: url });
  await client.connect();
  const schema = `runner_${randomUUID().replaceAll("-", "")}`;
  try {
    await client.query(`CREATE SCHEMA "${schema}"`);
    await client.query(`SET search_path TO "${schema}"`);
    await client.query("CREATE TABLE schema_migrations(name text PRIMARY KEY)");
    const plan = JSON.parse(await readFile("db/migration-plan.json", "utf8"));
    for (const name of [
      ...plan.base.filter(
        (name: string) =>
          !name.startsWith("0020_") &&
          !name.startsWith("0021_") &&
          !name.startsWith("0022_") &&
          !name.startsWith("0023_"),
      ),
      ...(history === "0014" ? ["0014_adaptive_target_usage.sql"] : []),
    ]) {
      await client.query(await readFile(`db/migrations/${name}`, "utf8"));
      await client.query("INSERT INTO schema_migrations VALUES($1)", [name]);
    }
    const learnerId = randomUUID();
    await client.query(
      "INSERT INTO learners(id,anonymous_token_hash,guarantee_evidence,impossibility_evidence,enumeration_evidence,browser_credential_expires_at) VALUES($1,$2,$3,$4,$5,now()+interval '1 day')",
      [
        learnerId,
        randomUUID(),
        emptyGuaranteeProgressEvidence(),
        emptyImpossibilityProgressEvidence(),
        emptyEnumerationProgressEvidence(),
      ],
    );
    // Deliberately permissive startup settings must be overridden inside BEGIN.
    address.searchParams.set(
      "options",
      `-c search_path=${schema} -c lock_timeout=0 -c statement_timeout=0`,
    );
    await run({
      client,
      connectionString: address.toString(),
      learnerId,
      app: schema,
    });
  } finally {
    await client.query(`DROP SCHEMA "${schema}" CASCADE`);
    await client.end();
  }
}

function migrate(connectionString: string, app: string) {
  const child = spawn(process.execPath, ["scripts/migrate-db.mjs"], {
    env: {
      ...process.env,
      DATABASE_MIGRATION_URL: connectionString,
      MIGRATION_TARGET: "local",
      MIGRATION_PHASE: "expand",
      PGAPPNAME: app,
    },
    stdio: ["ignore", "pipe", "pipe"],
  });
  let output = "";
  child.stdout.on("data", (data) => {
    output += data;
  });
  child.stderr.on("data", (data) => {
    output += data;
  });
  return new Promise<{ code: number | null; output: string }>(
    (resolve, reject) => {
      child.on("error", reject);
      child.on("close", (code) => resolve({ code, output }));
    },
  );
}

async function shape(client: pg.Client) {
  return {
    markers: (
      await client.query("SELECT name FROM schema_migrations ORDER BY name")
    ).rows,
    schema: (
      await client.query(`SELECT
      to_regclass('practice_adaptive_target_usage') IS NOT NULL AS ledger,
      (SELECT count(*)::int FROM information_schema.columns WHERE table_schema=current_schema()
       AND table_name='learners' AND column_name IN ('brothers_ages_attempted',
       'brothers_ages_solution_exposed','parrots_attempted','parrots_solution_exposed',
       'pages_attempted','pages_solution_exposed')) AS flags,
      (SELECT count(*)::int FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid
       JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname=current_schema()
       AND t.tgname IN ('ot_compat_learner','ot_compat_episode')) AS capture`)
    ).rows,
  };
}

async function markerProbe(client: pg.Client, action: string) {
  await client.query(`CREATE FUNCTION runner_probe() RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN
      IF current_setting('lock_timeout')::interval <> interval '5 seconds'
        OR current_setting('statement_timeout')::interval <> interval '120 seconds'
        THEN RAISE EXCEPTION 'effective transaction timeouts incorrect'; END IF;
      ${action}
      RETURN NEW;
    END $$;
    CREATE TRIGGER runner_probe BEFORE INSERT ON schema_migrations
    FOR EACH ROW EXECUTE FUNCTION runner_probe()`);
}

async function waitForLock(client: pg.Client, app: string) {
  const deadline = Date.now() + 3500;
  while (Date.now() < deadline) {
    const r = await client.query(
      "SELECT 1 FROM pg_stat_activity WHERE application_name=$1 AND wait_event_type='Lock'",
      [app],
    );
    if (r.rowCount) return;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  throw new Error(`Expected blocked test connection ${app}`);
}

describe.skipIf(!url)("atomic migration runner safety", () => {
  for (const history of ["0013", "0014"] as const) {
    it(
      `${history}: upgrades 0021 through 0023 to reusable Pack IDs without changing receipts`,
      async () =>
        fixture(
          history,
          async ({ client, connectionString, learnerId, app }) => {
            const oldPackIds = [
              "pack-a",
              "pack-b",
              "pack-c",
              "pack-d",
              "pack-e",
              "pack-f",
              "pack-g",
              "pack-h",
              "pack-i",
              "pack-j",
              "pack-k",
              "pack-l",
            ];
            const newPackIds = ["pack-s"];
            // Start from the released Batch 1 schema and retain every receipt.
            await client.query(
              await readFile(
                "db/migrations/0020_content_expansion_pack_receipts.sql",
                "utf8",
              ),
            );
            await client.query("INSERT INTO schema_migrations VALUES($1)", [
              "0020_content_expansion_pack_receipts.sql",
            ]);
            oldPackIds.push("pack-m", "pack-n", "pack-o");
            await client.query(
              await readFile(
                "db/migrations/0021_content_expansion_batch_2_pack_receipts.sql",
                "utf8",
              ),
            );
            await client.query("INSERT INTO schema_migrations VALUES($1)", [
              "0021_content_expansion_batch_2_pack_receipts.sql",
            ]);
            oldPackIds.push("pack-p", "pack-q", "pack-r");
            const insertReceipt = (
              packId: string | null,
              mode: string | null,
            ) =>
              client.query(
                "INSERT INTO practice_finish_receipts(learner_id,session_id,contribution_hash,episode_mode,pack_id) VALUES($1,$2,$3,$4,$5)",
                [learnerId, randomUUID(), "0".repeat(64), mode, packId],
              );
            const receipts = async () =>
              (
                await client.query(
                  "SELECT * FROM practice_finish_receipts WHERE learner_id=$1 ORDER BY session_id",
                  [learnerId],
                )
              ).rows;
            for (const packId of oldPackIds)
              await insertReceipt(packId, "pack");
            await insertReceipt(null, null);
            const before = await receipts();
            for (const packId of newPackIds)
              await expect(insertReceipt(packId, "pack")).rejects.toMatchObject(
                {
                  code: "23514",
                  constraint: "practice_finish_receipts_pack_id_check",
                },
              );

            await client.query(
              await readFile(
                "db/migrations/0022_original_visual_pack_receipts.sql",
                "utf8",
              ),
            );
            await client.query("INSERT INTO schema_migrations VALUES($1)", [
              "0022_original_visual_pack_receipts.sql",
            ]);
            expect(await receipts()).toEqual(before);
            for (const packId of newPackIds)
              await insertReceipt(packId, "pack");
            await expect(insertReceipt("pack-t", "pack")).rejects.toMatchObject(
              {
                code: "23514",
                constraint: "practice_finish_receipts_pack_id_check",
              },
            );
            const beforeStructural = await receipts();
            expect(await migrate(connectionString, app)).toMatchObject({
              code: 0,
            });
            expect(await receipts()).toEqual(beforeStructural);
            expect(
              (
                await client.query(
                  "SELECT name FROM schema_migrations WHERE name LIKE '002%' ORDER BY name",
                )
              ).rows.map((row) => row.name),
            ).toEqual([
              "0020_content_expansion_pack_receipts.sql",
              "0021_content_expansion_batch_2_pack_receipts.sql",
              "0022_original_visual_pack_receipts.sql",
              "0023_pack_id_format.sql",
            ]);
            expect(
              (await receipts())
                .map((row) => row.pack_id)
                .filter((id) => id !== null)
                .sort(),
            ).toEqual([...oldPackIds, ...newPackIds]);
            await insertReceipt("pack-future-2", "pack");
            for (const malformed of [
              "pack-",
              "pack--t",
              "pack-T",
              "pack-t_",
              "pack-t ",
              "other-t",
              `pack-${"a".repeat(60)}`,
            ])
              await expect(
                insertReceipt(malformed, "pack"),
              ).rejects.toMatchObject({
                code: "23514",
                constraint: "practice_finish_receipts_pack_id_check",
              });
            await expect(insertReceipt("pack-m", "core")).rejects.toMatchObject(
              {
                code: "23514",
                constraint: "practice_finish_receipts_pack_id_mode_check",
              },
            );
            const after = await receipts();
            expect(await migrate(connectionString, app)).toMatchObject({
              code: 0,
            });
            expect(await receipts()).toEqual(after);
          },
        ),
      15000,
    );

    it.each(["advisory", "table"] as const)(
      `${history}: bounds %s lock waits despite permissive session defaults`,
      async (lock) =>
        fixture(history, async ({ client, connectionString, app }) => {
          const before = await shape(client);
          await client.query("BEGIN");
          await client.query(
            lock === "advisory"
              ? "SELECT pg_advisory_xact_lock(24199601)"
              : "LOCK TABLE practice_completed_episodes IN ACCESS EXCLUSIVE MODE",
          );
          const start = Date.now();
          try {
            const result = await migrate(connectionString, app);
            expect(result.code).not.toBe(0);
            expect(result.output).toContain("lock timeout");
            expect(Date.now() - start).toBeGreaterThanOrEqual(4500);
            expect(Date.now() - start).toBeLessThan(12000);
          } finally {
            await client.query("ROLLBACK");
          }
          expect(await shape(client)).toEqual(before);
        }),
      20000,
    );

    it(
      `${history}: verifies timeouts and rolls back expansion/capture after late failure`,
      async () =>
        fixture(history, async ({ client, connectionString, app }) => {
          const before = await shape(client);
          await markerProbe(
            client,
            "IF NEW.name='0019_adaptive_compat_capture_basis.sql' THEN RAISE EXCEPTION 'forced late migration failure'; END IF;",
          );
          const result = await migrate(connectionString, app);
          expect(result.code).not.toBe(0);
          expect(result.output).toContain("forced late migration failure");
          expect(await shape(client)).toEqual(before);
        }),
      15000,
    );

    it(
      `${history}: captures a concurrent legacy Finish even when history is pruned before receipt`,
      async () =>
        fixture(
          history,
          async ({ client, connectionString, learnerId, app }) => {
            await markerProbe(
              client,
              "IF NEW.name='0016_adaptive_compat_capture.sql' THEN PERFORM pg_advisory_xact_lock(24199602); END IF;",
            );
            const blocker = new pg.Client({ connectionString });
            const writer = new pg.Client({
              connectionString,
              application_name: `${app}_writer`,
            });
            await blocker.connect();
            await writer.connect();
            let pending: ReturnType<typeof migrate> | undefined;
            let writing: Promise<void> | undefined;
            try {
              await blocker.query("BEGIN");
              await blocker.query("SELECT pg_advisory_xact_lock(24199602)");
              pending = migrate(connectionString, app);
              await waitForLock(client, app);
              const session = randomUUID();
              writing = (async () => {
                await writer.query("BEGIN");
                await writer.query(
                  "INSERT INTO practice_completed_episodes(learner_id,session_id,mode,episode_facts) VALUES($1,$2,'transfer',$3)",
                  [learnerId, session, episode],
                );
                await writer.query(
                  "DELETE FROM practice_completed_episodes WHERE learner_id=$1 AND session_id=$2",
                  [learnerId, session],
                );
                await writer.query(
                  "INSERT INTO practice_finish_receipts(learner_id,session_id,contribution_hash,episode_mode) VALUES($1,$2,$3,'transfer')",
                  [learnerId, session, "0".repeat(64)],
                );
                await writer.query("COMMIT");
              })();
              await waitForLock(client, `${app}_writer`);
              await blocker.query("COMMIT");
              const result = await pending;
              expect(result, result.output).toMatchObject({ code: 0 });
              await writing;
              expect(
                (
                  await client.query(
                    "SELECT problem_id,source_session_id FROM practice_adaptive_target_usage WHERE learner_id=$1",
                    [learnerId],
                  )
                ).rows,
              ).toEqual([
                {
                  problem_id: "brothers-ages-products",
                  source_session_id: session,
                },
              ]);
              expect(
                (
                  await client.query(
                    "SELECT count(*)::int AS n FROM practice_completed_episodes WHERE learner_id=$1",
                    [learnerId],
                  )
                ).rows[0].n,
              ).toBe(0);
              expect((await shape(client)).markers).toContainEqual({
                name: "0019_adaptive_compat_capture_basis.sql",
              });
              const after = await shape(client);
              expect(after.schema).toEqual([
                {
                  ledger: true,
                  flags: history === "0013" ? 6 : 0,
                  capture: history === "0013" ? 2 : 1,
                },
              ]);
              expect(after.markers).toHaveLength(20);
              expect(await migrate(connectionString, app)).toMatchObject({
                code: 0,
              });
              expect(await shape(client)).toEqual(after);
            } finally {
              await blocker.query("ROLLBACK");
              await pending;
              await writing?.catch(() => undefined);
              await writer.query("ROLLBACK");
              await writer.end();
              await blocker.end();
            }
          },
        ),
      20000,
    );
  }
});
