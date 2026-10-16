import { readFile, readdir } from "node:fs/promises";
import { randomUUID } from "node:crypto";
import pg from "pg";
import { describe, expect, it } from "vitest";
import {
  validateGuaranteeProgressEvidence,
  emptyGuaranteeProgressEvidence,
} from "../application/guarantee-progress-evidence";
import {
  validateImpossibilityProgressEvidence,
  emptyImpossibilityProgressEvidence,
} from "../application/impossibility-progress-evidence";
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

function hintedBasis(bucket: "guarantee" | "impossibility") {
  const guarantee = bucket === "guarantee";
  const source = guarantee ? "guaranteed-sock-pair" : "table-impossible-sums";
  const target = guarantee
    ? "parrots-guaranteed-colors"
    : "brothers-ages-products";
  const sourceCheckpoint = guarantee
    ? `${source}-guarantee-argument`
    : `${source}-impossibility-argument`;
  const targetCheckpoint = guarantee
    ? `${target}-guarantee-argument`
    : `${target}-youngest-lower-bound`;
  const fact = (
    problemId: string,
    checkpointId: string,
    sequence: number,
    hints: string[],
  ) => ({
    sequence,
    problemId,
    observation: {
      checkpointId,
      selectedOptionId: "A",
      outcome: "correct",
      validSubmissionCountAtSubmit: 1,
    },
    hintLevelsExposedBeforeCheckpoint: hints,
    solutionExposedBeforeCheckpoint: false,
  });
  const sourceFact = fact(source, sourceCheckpoint, 1, ["focus"]);
  const slots = {
    latestCorrectWithoutHints: null,
    latestCorrectWithHints: null,
    latestIncorrect: null,
  };
  const basisKey = guarantee
    ? "sockBasisForParrotsWithoutHints"
    : "tableBasisForBrothersWithoutHints";
  const evidence = {
    version: 2,
    nextSequence: 3,
    [guarantee ? "sock" : "table"]: {
      ...slots,
      latestCorrectWithHints: sourceFact,
    },
    [guarantee ? "parrots" : "brothers"]: {
      ...slots,
      latestCorrectWithoutHints: fact(target, targetCheckpoint, 2, []),
    },
    [basisKey]: {
      sequence: 1,
      observation: sourceFact.observation,
      hintLevelsExposedBeforeCheckpoint: ["focus"],
    },
  };
  expect(
    guarantee
      ? validateGuaranteeProgressEvidence(evidence)
      : validateImpossibilityProgressEvidence(evidence),
  ).toEqual(evidence);
  return {
    evidence,
    target,
    basisKey,
    column: guarantee ? "guarantee_evidence" : "impossibility_evidence",
  };
}

async function fixture(
  history: "expanded" | "legacy-expanded" | "contracted",
  run: (client: pg.Client) => Promise<void>,
  beforeExpansion?: (client: pg.Client) => Promise<void>,
) {
  const client = new pg.Client({ connectionString: url });
  const schema = `adaptive_compat_${randomUUID().replaceAll("-", "")}`;
  await client.connect();
  await client.query("BEGIN");
  try {
    await client.query(`CREATE SCHEMA "${schema}"`);
    await client.query(`SET LOCAL search_path TO "${schema}"`);
    for (const name of (await readdir("db/migrations"))
      .filter((name) => name.endsWith(".sql") && name < "0014_")
      .sort())
      await client.query(await readFile(`db/migrations/${name}`, "utf8"));
    await beforeExpansion?.(client);
    await client.query(
      await readFile(
        `db/migrations/${history === "expanded" ? "0018_adaptive_compat_expand_basis.sql" : history === "legacy-expanded" ? "0015_adaptive_compat_expand.sql" : "0014_adaptive_target_usage.sql"}`,
        "utf8",
      ),
    );
    await client.query(
      await readFile("db/migrations/0016_adaptive_compat_capture.sql", "utf8"),
    );
    await client.query(
      await readFile(
        "db/migrations/0019_adaptive_compat_capture_basis.sql",
        "utf8",
      ),
    );
    await run(client);
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

async function learner(client: pg.Client) {
  const id = randomUUID();
  await client.query(
    "INSERT INTO learners(id,anonymous_token_hash,guarantee_evidence,impossibility_evidence,enumeration_evidence,browser_credential_expires_at) VALUES($1,$2,$3,$4,$5,now()+interval '1 day')",
    [
      id,
      randomUUID(),
      emptyGuaranteeProgressEvidence(),
      emptyImpossibilityProgressEvidence(),
      emptyEnumerationProgressEvidence(),
    ],
  );
  return id;
}

describe.skipIf(!url)("adaptive compatibility migrations", () => {
  it.each(["guarantee", "impossibility"] as const)(
    "backfills and preserves a valid hinted %s basis from 0013",
    async (bucket) => {
      const { evidence, target, column } = hintedBasis(bucket);
      let id: string;
      await fixture(
        "expanded",
        async (client) => {
          expect(
            (
              await client.query(
                `SELECT ${column} AS evidence FROM learners WHERE id=$1`,
                [id],
              )
            ).rows[0].evidence,
          ).toEqual(evidence);
          expect(
            (
              await client.query(
                "SELECT problem_id FROM practice_adaptive_target_usage WHERE learner_id=$1",
                [id],
              )
            ).rows,
          ).toEqual([{ problem_id: target }]);
        },
        async (client) => {
          id = await learner(client);
          await client.query(`UPDATE learners SET ${column}=$1 WHERE id=$2`, [
            evidence,
            id,
          ]);
        },
      );
    },
  );

  it.each(["expanded", "legacy-expanded", "contracted"] as const)(
    "%s history repairs hinted bases while retaining canonical rejection",
    async (history) =>
      fixture(history, async (client) => {
        for (const bucket of ["guarantee", "impossibility"] as const) {
          const { evidence, target, basisKey, column } = hintedBasis(bucket);
          expect(
            (
              await client.query(
                "SELECT ot_compat_validate_evidence($1,$2) AS targets",
                [evidence, bucket],
              )
            ).rows[0].targets,
          ).toEqual([target]);
          const id = await learner(client);
          await client.query(`UPDATE learners SET ${column}=$1 WHERE id=$2`, [
            evidence,
            id,
          ]);
          const corrupt = JSON.parse(JSON.stringify(evidence));
          corrupt[basisKey].observation.selectedOptionId = "B";
          await client.query("SAVEPOINT corrupt_basis");
          await expect(
            client.query("SELECT ot_compat_validate_evidence($1,$2)", [
              corrupt,
              bucket,
            ]),
          ).rejects.toThrow("Invalid legacy basis ordering");
          await client.query("ROLLBACK TO SAVEPOINT corrupt_basis");
          if (history !== "contracted") {
            await client.query("SAVEPOINT corrupt_write");
            await expect(
              client.query(`UPDATE learners SET ${column}=$1 WHERE id=$2`, [
                corrupt,
                id,
              ]),
            ).rejects.toThrow("Invalid legacy basis ordering");
            await client.query("ROLLBACK TO SAVEPOINT corrupt_write");
          }
          expect(
            (
              await client.query(
                `SELECT ${column} AS evidence FROM learners WHERE id=$1`,
                [id],
              )
            ).rows[0].evidence,
          ).toEqual(evidence);
        }
      }),
  );
  it("keeps markers and atomically captures old marker updates", async () =>
    fixture("expanded", async (client) => {
      const id = await learner(client);
      await client.query(
        "UPDATE learners SET parrots_attempted=true WHERE id=$1",
        [id],
      );
      expect(
        (
          await client.query(
            "SELECT problem_id,source_session_id FROM practice_adaptive_target_usage WHERE learner_id=$1",
            [id],
          )
        ).rows,
      ).toEqual([
        { problem_id: "parrots-guaranteed-colors", source_session_id: null },
      ]);
      expect(
        (
          await client.query(
            "SELECT count(*)::integer AS n FROM information_schema.columns WHERE table_schema=current_schema() AND table_name='learners' AND column_name LIKE '%attempted'",
          )
        ).rows[0].n,
      ).toBe(3);
    }));

  it.each(["expanded", "contracted"] as const)(
    "%s history captures episode-before-receipt even after pruning",
    async (history) =>
      fixture(history, async (client) => {
        const id = await learner(client),
          session = randomUUID();
        await client.query(
          "INSERT INTO practice_completed_episodes(learner_id,session_id,mode,episode_facts) VALUES($1,$2,'transfer',$3)",
          [id, session, episode],
        );
        await client.query(
          "DELETE FROM practice_completed_episodes WHERE learner_id=$1 AND session_id=$2",
          [id, session],
        );
        await client.query(
          "INSERT INTO practice_finish_receipts(learner_id,session_id,contribution_hash,episode_mode) VALUES($1,$2,$3,'transfer')",
          [id, session, "0".repeat(64)],
        );
        await client.query("SET CONSTRAINTS ot_compat_episode IMMEDIATE");
        expect(
          (
            await client.query(
              "SELECT problem_id,source_session_id FROM practice_adaptive_target_usage WHERE learner_id=$1",
              [id],
            )
          ).rows,
        ).toEqual([
          {
            problem_id: episode.problems[0].problemId,
            source_session_id: session,
          },
        ]);
      }),
  );

  it("rejects a provable adaptive episode without a matching receipt", async () =>
    fixture("expanded", async (client) => {
      const id = await learner(client);
      await client.query("SAVEPOINT missing_receipt");
      await client.query(
        "INSERT INTO practice_completed_episodes(learner_id,session_id,mode,episode_facts) VALUES($1,$2,'transfer',$3)",
        [id, randomUUID(), episode],
      );
      await expect(
        client.query("SET CONSTRAINTS ot_compat_episode IMMEDIATE"),
      ).rejects.toThrow("matching Finish receipt");
      await client.query("ROLLBACK TO SAVEPOINT missing_receipt");
      expect(
        (
          await client.query(
            "SELECT 1 FROM practice_adaptive_target_usage WHERE learner_id=$1",
            [id],
          )
        ).rowCount,
      ).toBe(0);
    }));

  it.each(["expanded", "contracted"] as const)(
    "%s history contracts without losing closure",
    async (history) =>
      fixture(history, async (client) => {
        const id = await learner(client);
        if (history === "expanded")
          await client.query(
            "UPDATE learners SET pages_attempted=true WHERE id=$1",
            [id],
          );
        await client.query(
          await readFile(
            "db/migrations/0017_adaptive_compat_contract.sql",
            "utf8",
          ),
        );
        expect(
          (
            await client.query(
              "SELECT count(*)::integer AS n FROM information_schema.columns WHERE table_schema=current_schema() AND table_name='learners' AND column_name LIKE '%attempted'",
            )
          ).rows[0].n,
        ).toBe(0);
        expect(
          (
            await client.query(
              "SELECT count(*)::integer AS n FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname=current_schema() AND t.tgname IN ('ot_compat_learner','ot_compat_episode') AND NOT t.tgisinternal",
            )
          ).rows[0].n,
        ).toBe(0);
        expect(
          (
            await client.query(
              "SELECT problem_id FROM practice_adaptive_target_usage WHERE learner_id=$1",
              [id],
            )
          ).rows,
        ).toEqual(
          history === "expanded"
            ? [{ problem_id: "pages-without-digit-one" }]
            : [],
        );
      }),
  );
});
