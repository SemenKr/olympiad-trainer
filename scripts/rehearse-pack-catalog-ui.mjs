// Actual Chrome -> Next actions -> disposable PostgreSQL. Hint-only early Finish
// exercises registered ordered prefixes without publishing synthetic answers.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const require = createRequire(import.meta.url),
  { chromium } = require(process.env.PLAYWRIGHT_MODULE),
  { Client } = require("pg");
const origin = process.env.CANONICAL_TEST_ORIGIN,
  database = process.env.DATABASE_TEST_URL;
for (const value of [origin, database])
  assert(["localhost", "127.0.0.1"].includes(new URL(value).hostname));
const packs = (
  process.env.CATALOG_PACKS ?? "a,b,c,d,e,f,g,h,i,j,k,l,m,n,o,p,q,r,s"
)
  .split(",")
  .map((x) => `pack-${x}`);
const evidence = mkdtempSync(join(tmpdir(), "ot-pack-catalog-live-")),
  results = [];
const browser = await chromium.launch({
    executablePath: process.env.CHROME_EXECUTABLE,
    headless: true,
  }),
  db = new Client({ connectionString: database });
await db.connect();
const record = (p) =>
  p.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const q = indexedDB.open("olympiad-trainer:learner-canonical-v1", 2);
        q.onsuccess = () => {
          const r = q.result
            .transaction("learner")
            .objectStore("learner")
            .get("binding");
          r.onsuccess = () => {
            q.result.close();
            resolve(r.result);
          };
          r.onerror = () => reject(r.error);
        };
        q.onerror = () => reject(q.error);
      }),
  );
try {
  const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
    }),
    p = await context.newPage();
  await p.goto(origin);
  await p
    .getByRole("button", { name: "Другие вкладки закрыты — перенести работу" })
    .click();
  await p
    .getByRole("link", { name: "Начать тренировку", exact: true })
    .waitFor();
  let learner;
  for (const pack of ["core", ...packs]) {
    await p.goto(
      origin + (pack === "core" ? "/practice" : `/practice/pack?pack=${pack}`),
    );
    console.log("OPEN", pack);
    await p
      .getByRole("button", { name: "Подсказка", exact: true })
      .waitFor({ timeout: 60000 })
      .catch(async (error) => {
        console.log("PAGE", await p.locator("body").innerText());
        throw error;
      });
    const initial = await record(p);
    learner = initial.owner.learnerId;
    const session = JSON.parse(
      initial.payloads["olympiad-trainer:practice-session"],
    );
    if (pack !== "core") assert.equal(session.mode, "pack");
    // Refresh/Resume preserves exact snapshot bytes before assistance/Finish.
    await p.reload();
    await p.getByRole("button", { name: "Подсказка", exact: true }).waitFor();
    assert.equal(
      (await record(p)).payloads["olympiad-trainer:practice-session"],
      initial.payloads["olympiad-trainer:practice-session"],
    );
    await p.getByRole("button", { name: "Подсказка", exact: true }).click();
    await p.getByRole("button", { name: "Завершить", exact: true }).waitFor();
    let intercepted = false;
    if (["pack-s", "pack-t"].includes(pack))
      await p.route("**/*", async (route) => {
        const request = route.request();
        if (
          !intercepted &&
          request.method() === "POST" &&
          request.headers()["next-action"] &&
          (request.postData() ?? "").includes(session.sessionId) &&
          (request.postData() ?? "").includes('"facts"')
        ) {
          intercepted = true;
          await route.fetch();
          await route.abort("failed");
        } else await route.continue();
      });
    await p.getByRole("button", { name: "Завершить", exact: true }).click();
    if (["pack-s", "pack-t"].includes(pack)) {
      await p.waitForFunction(
        () =>
          document.body.innerText.includes("Повторить") ||
          document.body.innerText.includes("Не удалось"),
      );
      assert(intercepted);
      const pending = await record(p);
      assert(
        pending.payloads["olympiad-trainer:practice-server-finish-request"],
      );
      await p.unroute("**/*");
      await p.reload();
      await p.getByRole("button", { name: "Завершить", exact: true }).waitFor();
      assert.equal(
        (await record(p)).payloads[
          "olympiad-trainer:practice-server-finish-request"
        ],
        pending.payloads["olympiad-trainer:practice-server-finish-request"],
      );
      await p.getByRole("button", { name: "Завершить", exact: true }).click();
    }
    await p.waitForURL(/\/practice\/summary\?session=/, { timeout: 60000 });
    const receipt = await db.query(
      "SELECT pack_id,episode_mode FROM practice_finish_receipts WHERE learner_id=$1 AND session_id=$2",
      [learner, session.sessionId],
    );
    assert.equal(receipt.rowCount, 1);
    assert.equal(receipt.rows[0].pack_id, pack === "core" ? null : pack);
    for (const table of [
      "practice_completed_episodes",
      "practice_journey_awards",
    ])
      assert.equal(
        (
          await db.query(
            `SELECT 1 FROM ${table} WHERE learner_id=$1 AND session_id=$2`,
            [learner, session.sessionId],
          )
        ).rowCount,
        1,
      );
    const after = await record(p);
    assert.equal(after.payloads["olympiad-trainer:practice-session"], null);
    assert.equal(
      after.payloads["olympiad-trainer:practice-server-finish-request"],
      null,
    );
    assert.deepEqual(after.source, initial.source);
    results.push({
      pack,
      session: session.sessionId,
      orderedProblemIds: session.problemIds ?? null,
      refreshExact: true,
      lostResponseRetry: ["pack-s", "pack-t"].includes(pack),
      receiptCount: 1,
      episodeCount: 1,
      awardCount: 1,
    });
    writeFileSync(
      join(evidence, "results.json"),
      JSON.stringify(results, null, 2),
    );
    console.log("PASS", pack);
  }
  await p.goto(origin + "/progress");
  await p.getByRole("heading", { level: 1 }).waitFor({ timeout: 60000 });
  await p.screenshot({
    path: join(evidence, "progress-mobile.png"),
    fullPage: true,
  });
  writeFileSync(
    join(evidence, "results.json"),
    JSON.stringify(results, null, 2),
  );
  console.log("Evidence:", evidence);
  await context.close();
} finally {
  await db.end();
  await browser.close();
}
