// SQL storage/index measurements on an already migrated disposable loopback DB.
// Domain Finish validation is exercised by the dedicated integration suite.
import assert from "node:assert/strict";
import { randomUUID, randomBytes } from "node:crypto";
import { writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import pg from "pg";
const url = process.env.DATABASE_TEST_URL;
assert(url && ["127.0.0.1", "localhost"].includes(new URL(url).hostname));
const db = new pg.Client({ connectionString: url });
await db.connect();
const evidence = mkdtempSync(join(tmpdir(), "ot-pg-scale-"));
const learner = randomUUID(),
  token = randomBytes(32).toString("hex");
try {
  await db.query(
    `INSERT INTO learners(id,anonymous_token_hash,guarantee_evidence,impossibility_evidence,enumeration_evidence,browser_credential_expires_at)
 SELECT $1,$2,guarantee_evidence,impossibility_evidence,enumeration_evidence,now()+interval '1 day' FROM learners LIMIT 1`,
    [learner, token],
  );
  assert.equal(
    (await db.query("SELECT 1 FROM learners WHERE id=$1", [learner])).rowCount,
    1,
    "Run integration suite first to supply a synthetic valid evidence template",
  );
  const rows = [];
  for (const count of [100, 1000, 10000, 100000]) {
    const existing = Number(
      (
        await db.query(
          "SELECT count(*) FROM practice_finish_receipts WHERE learner_id=$1",
          [learner],
        )
      ).rows[0].count,
    );
    await db.query(
      `INSERT INTO practice_finish_receipts(learner_id,session_id,contribution_hash,episode_mode,pack_id)
   SELECT $1,gen_random_uuid(),repeat('a',64),'pack','pack-a' FROM generate_series(1,$2::integer)`,
      [learner, count - existing],
    );
    await db.query(
      `INSERT INTO practice_journey_awards(learner_id,session_id,earned_xp,total_xp)
   SELECT learner_id,session_id,0,0 FROM practice_finish_receipts WHERE learner_id=$1 ON CONFLICT DO NOTHING`,
      [learner],
    );
    await db.query(
      `INSERT INTO practice_completed_episodes(learner_id,session_id,mode,episode_facts)
   SELECT learner_id,session_id,'pack','{"version":1,"problems":[]}'::jsonb FROM practice_finish_receipts WHERE learner_id=$1
   AND session_id NOT IN(SELECT session_id FROM practice_completed_episodes WHERE learner_id=$1) LIMIT 53`,
      [learner],
    );
    const pruneStart = performance.now();
    const pruned = await db.query(
      `DELETE FROM practice_completed_episodes WHERE learner_id=$1 AND session_id IN
   (SELECT session_id FROM practice_completed_episodes WHERE learner_id=$1 ORDER BY completed_at DESC,session_id DESC OFFSET 50)`,
      [learner],
    );
    const pruneMs = performance.now() - pruneStart;
    await db.query("ANALYZE practice_finish_receipts");
    await db.query("ANALYZE practice_completed_episodes");
    const queries = {
      history: `SELECT e.mode,e.episode_facts,e.completed_at,r.pack_id,r.episode_mode FROM practice_completed_episodes e
 LEFT JOIN practice_finish_receipts r ON r.learner_id=e.learner_id AND r.session_id=e.session_id
 WHERE e.learner_id=$1 ORDER BY e.completed_at DESC,e.session_id DESC LIMIT 10`,
      completedPacks: `SELECT pack_id FROM practice_finish_receipts WHERE learner_id=$1 AND pack_id IS NOT NULL`,
      idempotentReceipt: `SELECT * FROM practice_finish_receipts WHERE learner_id=$1 AND session_id=(SELECT session_id FROM practice_finish_receipts WHERE learner_id=$1 LIMIT 1)`,
    };
    const plans = {};
    for (const [name, query] of Object.entries(queries)) {
      const result = await db.query(
        "EXPLAIN (ANALYZE,BUFFERS,FORMAT JSON) " + query,
        [learner],
      );
      plans[name] = result.rows[0]["QUERY PLAN"][0];
    }
    const counts = await db.query(
      `SELECT (SELECT count(*)::integer FROM practice_finish_receipts WHERE learner_id=$1) receipts,
   (SELECT count(*)::integer FROM practice_completed_episodes WHERE learner_id=$1) episodes,
   (SELECT count(*)::integer FROM practice_journey_awards WHERE learner_id=$1) awards`,
      [learner],
    );
    assert.equal(counts.rows[0].episodes, 50);
    rows.push({
      count,
      ...counts.rows[0],
      pruned: pruned.rowCount,
      pruneMs,
      plans,
    });
    console.log(
      JSON.stringify({
        count,
        ...counts.rows[0],
        pruneMs,
        executionMs: Object.fromEntries(
          Object.entries(plans).map(([k, p]) => [k, p["Execution Time"]]),
        ),
      }),
    );
  }
  const indexes = (
    await db.query(
      `SELECT tablename,indexname,indexdef FROM pg_indexes WHERE tablename IN ('practice_completed_episodes','practice_finish_receipts','practice_journey_awards') ORDER BY indexname`,
    )
  ).rows;
  const start = performance.now();
  await Promise.all(
    Array.from({ length: 8 }, async () => {
      const client = new pg.Client({ connectionString: url });
      await client.connect();
      try {
        await client.query("BEGIN");
        await client.query("SELECT id FROM learners WHERE id=$1 FOR UPDATE", [
          learner,
        ]);
        await client.query("SELECT pg_sleep(0.005)");
        await client.query("COMMIT");
      } finally {
        await client.end();
      }
    }),
  );
  writeFileSync(
    join(evidence, "results.json"),
    JSON.stringify(
      {
        node: process.version,
        server: (await db.query("SHOW server_version")).rows[0],
        rows,
        indexes,
        eightSerializedSyntheticTransactionsMs: performance.now() - start,
      },
      null,
      2,
    ),
  );
  console.log("Evidence:", evidence);
} finally {
  await db.end();
}
