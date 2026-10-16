import { readFile, readdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import pg from "pg";
import { describe, expect, it } from "vitest";
import {
  emptyGuaranteeProgressEvidence,
  appendGuaranteeEvidence,
} from "../application/guarantee-progress-evidence";
import { emptyImpossibilityProgressEvidence } from "../application/impossibility-progress-evidence";
import {
  emptyEnumerationProgressEvidence,
  appendEnumerationEvidence,
} from "../application/enumeration-progress-evidence";

const url = process.env.DATABASE_TEST_URL;
const migration = "0014_adaptive_target_usage.sql";
const targets = [
  "brothers-ages-products",
  "parrots-guaranteed-colors",
  "pages-without-digit-one",
];
async function fixture(
  run: (client: pg.Client, migrate: () => Promise<unknown>) => Promise<void>,
) {
  const client = new pg.Client({ connectionString: url });
  const schema = `adaptive_migration_${randomUUID().replaceAll("-", "")}`;
  await client.connect();
  await client.query("BEGIN");
  try {
    await client.query(`CREATE SCHEMA "${schema}"`);
    await client.query(`SET LOCAL search_path TO "${schema}"`);
    for (const name of (await readdir("db/migrations"))
      .filter((name) => name.endsWith(".sql") && name < migration)
      .sort())
      await client.query(await readFile(`db/migrations/${name}`, "utf8"));
    await run(client, () => client.query(readFileSql));
  } finally {
    await client.query("ROLLBACK");
    expect(
      (
        await client.query(
          "SELECT 1 FROM information_schema.schemata WHERE schema_name=$1",
          [schema],
        )
      ).rowCount,
    ).toBe(0);
    await client.end();
  }
}
const readFileSql = await readFile(`db/migrations/${migration}`, "utf8");
async function learner(
  client: pg.Client,
  enumeration: unknown = emptyEnumerationProgressEvidence(),
) {
  const id = randomUUID();
  await client.query(
    "INSERT INTO learners(id,anonymous_token_hash,guarantee_evidence,impossibility_evidence,enumeration_evidence,browser_credential_expires_at) VALUES($1,$2,$3,$4,$5,now()+interval '1 day')",
    [
      id,
      randomUUID(),
      emptyGuaranteeProgressEvidence(),
      emptyImpossibilityProgressEvidence(),
      enumeration,
    ],
  );
  return id;
}
const episode = (target: string) => ({
  version: 1,
  problems: [
    {
      problemId: target,
      outcome: "no-valid-submissions",
      skipped: true,
      validSubmissionCount: 0,
      hintLevelsExposed: ["focus"],
      solutionExposed: false,
      checkpoint: null,
    },
  ],
});
async function receipt(
  client: pg.Client,
  owner: string,
  session: string,
  mode: string | null,
) {
  await client.query(
    "INSERT INTO practice_finish_receipts(learner_id,session_id,contribution_hash,episode_mode) VALUES($1,$2,$3,$4)",
    [owner, session, "0".repeat(64), mode],
  );
}
async function rejects(client: pg.Client, sql: string, parameters: unknown[]) {
  await client.query("SAVEPOINT expected_failure");
  await expect(client.query(sql, parameters)).rejects.toThrow();
  await client.query("ROLLBACK TO SAVEPOINT expected_failure");
}
describe.skipIf(!url)("0014 durable closure migration", () => {
  it("backfills every old marker without fabricating sessions, drops flags, and leaves hashes intact", async () =>
    fixture(async (client, migrate) => {
      const owner = await learner(client);
      await client.query(
        "UPDATE learners SET brothers_ages_solution_exposed=true,parrots_attempted=true,pages_attempted=true WHERE id=$1",
        [owner],
      );
      const session = randomUUID();
      await receipt(client, owner, session, null);
      await migrate();
      const rows = (
        await client.query(
          "SELECT problem_id,source_session_id FROM practice_adaptive_target_usage WHERE learner_id=$1 ORDER BY problem_id",
          [owner],
        )
      ).rows;
      expect(rows.map((row) => row.problem_id)).toEqual([...targets].sort());
      expect(rows.every((row) => row.source_session_id === null)).toBe(true);
      expect(
        (
          await client.query(
            "SELECT column_name FROM information_schema.columns WHERE table_schema=current_schema() AND table_name='learners' AND column_name LIKE '%attempted'",
          )
        ).rowCount,
      ).toBe(0);
      expect(
        (
          await client.query(
            "SELECT contribution_hash FROM practice_finish_receipts",
          )
        ).rows[0].contribution_hash,
      ).toBe("0".repeat(64));
    }));
  it("uses target checkpoint identity of either outcome without creating a receipt", async () =>
    fixture(async (client, migrate) => {
      const evidence = appendEnumerationEvidence(
        emptyEnumerationProgressEvidence(),
        {
          problemId: "pages-without-digit-one",
          observation: {
            checkpointId: "pages-without-digit-one-complete-enumeration",
            selectedOptionId: "B",
            outcome: "incorrect",
            validSubmissionCountAtSubmit: 1,
          },
          hintLevelsExposedBeforeCheckpoint: [],
          solutionExposedBeforeCheckpoint: false,
        },
      )!;
      const owner = await learner(client, evidence);
      const guarantee = appendGuaranteeEvidence(
        emptyGuaranteeProgressEvidence(),
        {
          problemId: "parrots-guaranteed-colors",
          observation: {
            checkpointId: "parrots-guaranteed-colors-guarantee-argument",
            selectedOptionId: "A",
            outcome: "correct",
            validSubmissionCountAtSubmit: 1,
          },
          hintLevelsExposedBeforeCheckpoint: ["focus"],
          solutionExposedBeforeCheckpoint: false,
        },
      )!;
      await client.query(
        "UPDATE learners SET guarantee_evidence=$2 WHERE id=$1",
        [owner, guarantee],
      );
      await migrate();
      expect(
        (
          await client.query(
            "SELECT problem_id FROM practice_adaptive_target_usage ORDER BY problem_id",
          )
        ).rows.map((row) => row.problem_id),
      ).toEqual(["pages-without-digit-one", "parrots-guaranteed-colors"]);
      expect(
        (await client.query("SELECT 1 FROM practice_finish_receipts")).rowCount,
      ).toBe(0);
    }));
  it.each(targets)(
    "uses exact surviving %s episode and chooses earliest supporting receipt",
    async (target) =>
      fixture(async (client, migrate) => {
        const owner = await learner(client),
          first = randomUUID(),
          second = randomUUID();
        const mode = target === targets[2] ? "exploration" : "transfer";
        for (const session of [second, first]) {
          await receipt(client, owner, session, null);
          await client.query(
            "INSERT INTO practice_completed_episodes(learner_id,session_id,mode,episode_facts) VALUES($1,$2,$3,$4)",
            [owner, session, mode, episode(target)],
          );
        }
        await client.query(
          "UPDATE practice_finish_receipts SET created_at=CASE WHEN session_id=$1 THEN '2000-01-01'::timestamptz ELSE '2001-01-01'::timestamptz END",
          [first],
        );
        await migrate();
        expect(
          (
            await client.query(
              "SELECT problem_id,source_session_id FROM practice_adaptive_target_usage",
            )
          ).rows,
        ).toEqual([{ problem_id: target, source_session_id: first }]);
      }),
  );
  it("does not guess from missing, malformed, contradictory or another learner's episode", async () =>
    fixture(async (client, migrate) => {
      const owner = await learner(client),
        other = await learner(client);
      const cross = randomUUID();
      await receipt(client, owner, cross, null);
      await client.query(
        "INSERT INTO practice_completed_episodes(learner_id,session_id,mode,episode_facts) VALUES($1,$2,'transfer',$3)",
        [other, cross, episode(targets[0])],
      );
      for (const [mode, facts] of [
        ["pack", episode(targets[0])],
        [null, { ...episode(targets[0]), extra: true }],
        [null, { version: 1, problems: [null] }],
      ] as const) {
        const session = randomUUID();
        await receipt(client, owner, session, mode);
        await client.query(
          "INSERT INTO practice_completed_episodes(learner_id,session_id,mode,episode_facts) VALUES($1,$2,'transfer',$3)",
          [owner, session, facts],
        );
      }
      await receipt(client, owner, randomUUID(), null);
      await migrate();
      expect(
        (await client.query("SELECT 1 FROM practice_adaptive_target_usage"))
          .rowCount,
      ).toBe(0);
    }));
  it("rejects invalid canonical evidence and rolls back schema changes and flag drops", async () =>
    fixture(async (client, migrate) => {
      const owner = await learner(client);
      await client.query(
        "UPDATE learners SET enumeration_evidence='{}', pages_attempted=true WHERE id=$1",
        [owner],
      );
      await client.query("SAVEPOINT before_migration");
      await expect(migrate()).rejects.toThrow();
      await client.query("ROLLBACK TO SAVEPOINT before_migration");
      expect(
        (
          await client.query(
            "SELECT pages_attempted FROM learners WHERE id=$1",
            [owner],
          )
        ).rows[0].pages_attempted,
      ).toBe(true);
      expect(
        (
          await client.query(
            "SELECT to_regclass('practice_adaptive_target_usage') AS name",
          )
        ).rows[0].name,
      ).toBeNull();
    }));
  it("enforces target, composite ownership, uniqueness and durable receipt constraints", async () =>
    fixture(async (client, migrate) => {
      const owner = await learner(client),
        other = await learner(client),
        session = randomUUID();
      await receipt(client, owner, session, "transfer");
      await migrate();
      const insert =
        "INSERT INTO practice_adaptive_target_usage(learner_id,problem_id,source_session_id) VALUES($1,$2,$3)";
      await rejects(client, insert, [owner, "unknown", null]);
      await rejects(client, insert, [other, targets[0], session]);
      await rejects(client, insert, [owner, targets[0], randomUUID()]);
      await client.query(insert, [owner, targets[0], session]);
      await rejects(client, insert, [owner, targets[0], null]);
      await rejects(client, insert, [owner, targets[1], session]);
      await rejects(
        client,
        "DELETE FROM practice_finish_receipts WHERE learner_id=$1",
        [owner],
      );
      await client.query(
        "DELETE FROM practice_completed_episodes WHERE learner_id=$1",
        [owner],
      );
      expect(
        (await client.query("SELECT 1 FROM practice_adaptive_target_usage"))
          .rowCount,
      ).toBe(1);
    }));
});
