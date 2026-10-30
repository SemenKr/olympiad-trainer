// Real UI -> authenticated Next action -> disposable PostgreSQL. No downloads.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE);
const { Client } = require("pg");
const origin = process.env.CANONICAL_TEST_ORIGIN;
const database = process.env.DATABASE_TEST_URL;
for (const value of [origin, database]) {
  assert(value, "Explicit disposable loopback origin/database required");
  assert(["127.0.0.1", "localhost"].includes(new URL(value).hostname));
}
const evidence = mkdtempSync(join(tmpdir(), "ot-canonical-finish-"));
const results = [];
const db = new Client({ connectionString: database });
await db.connect();
const browser = await chromium.launch({
  executablePath: process.env.CHROME_EXECUTABLE,
  headless: true,
});
const record = (page) =>
  page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const r = indexedDB.open("olympiad-trainer:learner-canonical-v1", 1);
        r.onerror = () => reject(r.error);
        r.onsuccess = () => {
          const tx = r.result.transaction("learner", "readonly");
          const q = tx.objectStore("learner").get("binding");
          q.onsuccess = () => {
            resolve(q.result);
            r.result.close();
          };
        };
      }),
  );
async function counts(sessionId) {
  const receipt = await db.query(
    "select count(*)::int as n from practice_finish_receipts where session_id=$1",
    [sessionId],
  );
  const episode = await db.query(
    "select count(*)::int as n from practice_completed_episodes where session_id=$1",
    [sessionId],
  );
  return [receipt.rows[0].n, episode.rows[0].n];
}
try {
  for (const scenario of [
    "normal",
    "lost-response",
    "concurrent-tabs",
    "intent-abort",
    "reconciliation-abort",
    "stale-callback",
  ]) {
    const context = await browser.newContext();
    let page = await context.newPage();
    await page.goto(origin);
    await page
      .getByRole("button", {
        name: "Другие вкладки закрыты — перенести работу",
      })
      .click();
    await page
      .getByRole("link", { name: "Начать тренировку", exact: true })
      .click();
    await page.getByRole("textbox", { name: "Ответ", exact: true }).fill("1");
    await page.getByRole("button", { name: "Проверить", exact: true }).click();
    await page.getByText("Завершить", { exact: true }).waitFor();
    const before = await record(page);
    const sessionId = before.sessionId;
    assert(sessionId);
    assert.deepEqual(await counts(sessionId), [0, 0]);
    let intercepted = false;
    if (
      ["lost-response", "reconciliation-abort", "stale-callback"].includes(
        scenario,
      )
    ) {
      await page.route("**/*", async (route) => {
        const request = route.request();
        const body = request.postData() ?? "";
        if (
          !intercepted &&
          request.method() === "POST" &&
          request.headers()["next-action"] &&
          body.includes(sessionId) &&
          body.includes('"facts"')
        ) {
          intercepted = true;
          const response = await route.fetch(); // Real server/DB commit precedes injected browser failure.
          assert.deepEqual(await counts(sessionId), [1, 1]);
          if (scenario === "lost-response") await route.abort("failed");
          else {
            await page.evaluate(async (scenario) => {
              if (scenario === "reconciliation-abort") {
                IDBObjectStore.prototype.put = function () {
                  throw Error("Injected acknowledgement transaction abort");
                };
              } else {
                await new Promise((resolve, reject) => {
                  const r = indexedDB.open(
                    "olympiad-trainer:learner-canonical-v1",
                    1,
                  );
                  r.onsuccess = () => {
                    const tx = r.result.transaction("learner", "readwrite");
                    const store = tx.objectStore("learner"),
                      q = store.get("binding");
                    q.onsuccess = () => {
                      const value = q.result;
                      value.revision++;
                      store.put(value, "binding");
                    };
                    tx.oncomplete = () => {
                      r.result.close();
                      resolve();
                    };
                    tx.onabort = () => reject(tx.error);
                  };
                });
              }
            }, scenario);
            await route.fulfill({ response });
          }
        } else await route.continue();
      });
    }
    if (scenario === "intent-abort") {
      await page.evaluate(() => {
        window.originalPut = IDBObjectStore.prototype.put;
        IDBObjectStore.prototype.put = function () {
          throw Error("Injected intent abort");
        };
      });
      await page
        .getByRole("button", { name: "Завершить", exact: true })
        .click();
      await page.waitForTimeout(1000);
      assert.deepEqual(await counts(sessionId), [0, 0]);
      assert.equal(
        (await record(page)).payloads[
          "olympiad-trainer:practice-server-finish-request"
        ],
        null,
      );
      await page.evaluate(() => {
        IDBObjectStore.prototype.put = window.originalPut;
      });
    }
    if (scenario === "concurrent-tabs") {
      const other = await context.newPage();
      await other.goto(origin + "/practice");
      await other
        .getByRole("button", { name: "Завершить", exact: true })
        .waitFor();
      await Promise.all(
        [page, other].map((p) =>
          p.getByRole("button", { name: "Завершить", exact: true }).click(),
        ),
      );
      await Promise.race(
        [page, other].map((p) => p.waitForURL(/\/practice\/summary\?session=/)),
      );
      await page.waitForTimeout(1000);
      const winners = [page, other].filter((p) =>
        p.url().includes("/practice/summary?session="),
      );
      assert.equal(
        winners.length,
        1,
        "Only one competing UI Finish may report completion",
      );
      page = winners[0];
    } else {
      await page
        .getByRole("button", { name: "Завершить", exact: true })
        .click();
    }
    if (
      ["lost-response", "reconciliation-abort", "stale-callback"].includes(
        scenario,
      )
    ) {
      await page.waitForFunction(
        () =>
          document.body.innerText.includes("Повторить") ||
          document.body.innerText.includes("Не удалось"),
      );
      assert(intercepted, "Real Finish response was not intercepted");
      const pending = await record(page);
      const key = "olympiad-trainer:practice-server-finish-request";
      assert(pending.payloads[key]);
      assert(pending.payloads["olympiad-trainer:practice-session"]);
      assert.equal(
        pending.payloads["olympiad-trainer:practice-latest-completed"],
        null,
      );
      await page.unroute("**/*");
      await page.reload();
      await page
        .getByRole("button", { name: "Завершить", exact: true })
        .waitFor();
      assert.equal((await record(page)).payloads[key], pending.payloads[key]);
      await page
        .getByRole("button", { name: "Завершить", exact: true })
        .click();
    }
    await page.waitForURL(/\/practice\/summary\?session=/);
    await page.getByText("Тренировка завершена", { exact: true }).waitFor();
    const after = await record(page);
    assert.deepEqual(await counts(sessionId), [1, 1]);
    assert.equal(after.sessionId, null);
    assert.equal(after.payloads["olympiad-trainer:practice-session"], null);
    assert.equal(
      after.payloads["olympiad-trainer:practice-server-finish-request"],
      null,
    );
    assert.equal(
      after.payloads["olympiad-trainer:practice-progress-finish-pending"],
      null,
    );
    assert.deepEqual(after.source, before.source);
    assert.equal(
      JSON.parse(after.payloads["olympiad-trainer:practice-latest-completed"])
        .sessionId,
      sessionId,
    );
    await page.reload();
    await page.getByText("Тренировка завершена", { exact: true }).waitFor();
    await page.goto(origin + "/progress");
    await page.waitForTimeout(1000);
    assert(
      !(await page
        .getByText("Перенос сохранённой работы", { exact: true })
        .count()),
    );
    await page.screenshot({
      path: join(evidence, scenario + ".png"),
      fullPage: true,
    });
    results.push({
      scenario,
      sessionId,
      receipts: 1,
      episodes: 1,
      result: "PASS",
    });
    console.log("PASS", scenario);
    await context.close();
  }
} finally {
  writeFileSync(
    join(evidence, "results.json"),
    JSON.stringify({ chrome: browser.version(), results }, null, 2),
  );
  console.log("Evidence:", evidence);
  await browser.close();
  await db.end();
}
