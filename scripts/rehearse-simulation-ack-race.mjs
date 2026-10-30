// Actual Chrome UI -> Next actions -> disposable PG. Pause only the browser's
// canonical acknowledgement callback after its native transaction commits.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdtempSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE);
const { Client } = require("pg");
const origin = process.env.CANONICAL_TEST_ORIGIN;
const database = process.env.DATABASE_TEST_URL;
for (const value of [origin, database])
  assert(["localhost", "127.0.0.1"].includes(new URL(value).hostname));
const evidence = mkdtempSync(join(tmpdir(), "ot-simulation-ack-race-"));
const browser = await chromium.launch({
  executablePath: process.env.CHROME_EXECUTABLE,
  headless: true,
});
const db = new Client({ connectionString: database });
await db.connect();
const results = [];
try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto(origin);
  await page
    .getByRole("button", { name: "Другие вкладки закрыты — перенести работу" })
    .click();
  await page
    .getByRole("link", { name: "Начать тренировку", exact: true })
    .waitFor();
  await page.goto(origin + "/simulation");
  await page
    .getByRole("button", { name: "Начать · 45 минут", exact: true })
    .click();
  const editor = page.getByRole("textbox", {
    name: "Твой ответ и ход решения",
    exact: true,
  });
  await editor.waitFor();
  await page.evaluate(() => {
    const key = "olympiad-trainer:simulation-pending-v0";
    window.readCanonicalRace = () =>
      new Promise((resolve, reject) => {
        const request = indexedDB.open(
          "olympiad-trainer:learner-canonical-v1",
          2,
        );
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result,
            tx = db.transaction("learner", "readonly"),
            query = tx.objectStore("learner").get("binding");
          query.onsuccess = () => {
            db.close();
            resolve(JSON.parse(query.result.payloads[key]));
          };
        };
      });
    const put = IDBObjectStore.prototype.put;
    window.originalRacePut = put;
    IDBObjectStore.prototype.put = function (value, ...args) {
      const raw = value?.payloads?.[key],
        draft = raw ? JSON.parse(raw) : null;
      const pause =
        !window.acknowledgementPaused &&
        draft?.revision === 1 &&
        draft.pending === null &&
        draft.drafts[0] === "proof A";
      const result = put.call(this, value, ...args);
      if (pause) {
        const tx = this.transaction,
          complete = tx.oncomplete;
        tx.oncomplete = (event) => {
          window.acknowledgementPaused = true;
          window.releaseAcknowledgement = () => complete.call(tx, event);
        };
      }
      return result;
    };
  });
  await editor.fill("proof A");
  await page.waitForFunction(() => window.acknowledgementPaused === true);
  assert.equal(await editor.isEnabled(), true);
  await editor.fill("proof B");
  await page.getByRole("button", { name: /Задача 2 ·/ }).click();
  await editor.fill("navigation B");
  await page.evaluate(() => window.releaseAcknowledgement());
  // The editor must retain B even before the next autosave reaches PostgreSQL.
  assert.equal(await editor.inputValue(), "navigation B");
  await page.waitForFunction(async () => {
    const value = await window.readCanonicalRace();
    return (
      value.drafts[0] === "proof B" &&
      value.drafts[1] === "navigation B" &&
      value.selectedIndex === 1 &&
      value.revision >= 1
    );
  });
  assert.equal(await editor.inputValue(), "navigation B");
  assert.equal(
    await page.locator('nav [aria-current="step"]').getAttribute("aria-label"),
    "Задача 2 · есть черновик",
  );
  await page.reload();
  await editor.waitFor();
  assert.equal(await editor.inputValue(), "navigation B");
  assert.equal(
    await page.locator('nav [aria-current="step"]').getAttribute("aria-label"),
    "Задача 2 · есть черновик",
  );
  const local = await page.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const request = indexedDB.open(
          "olympiad-trainer:learner-canonical-v1",
          2,
        );
        request.onerror = () => reject(request.error);
        request.onsuccess = () => {
          const db = request.result,
            tx = db.transaction("learner", "readonly"),
            query = tx.objectStore("learner").get("binding");
          query.onsuccess = () => {
            db.close();
            resolve(
              JSON.parse(
                query.result.payloads["olympiad-trainer:simulation-pending-v0"],
              ),
            );
          };
        };
      }),
  );
  assert.deepEqual(local.drafts, ["proof B", "navigation B", "", ""]);
  assert.equal(local.selectedIndex, 1);
  let durable;
  for (let i = 0; i < 60; i++) {
    durable = (
      await db.query(
        "select revision, drafts, selected_index from simulation_attempts where session_id=$1",
        [local.sessionId],
      )
    ).rows[0];
    if (
      durable?.revision >= 2 &&
      durable.drafts[0] === "proof B" &&
      durable.drafts[1] === "navigation B" &&
      durable.selected_index === 1
    )
      break;
    await page.waitForTimeout(100);
  }
  assert(durable?.revision >= 2);
  assert.deepEqual(durable.drafts, ["proof B", "navigation B", "", ""]);
  assert.equal(durable.selected_index, 1);
  assert.equal(await editor.inputValue(), "navigation B");

  await page.screenshot({
    path: join(evidence, "accepted-work-retained.png"),
    fullPage: true,
  });
  results.push({
    scenario:
      "paused native local acknowledgement retains newer typing and navigation in UI, canonical IDB, reload and next real PG sync",
    status: "PASS",
    serverRevision: durable.revision,
  });
  console.log("PASS", results[0].scenario);
  await context.close();
} finally {
  await db.end();
  await browser.close();
  writeFileSync(
    join(evidence, "results.json"),
    JSON.stringify(results, null, 2),
  );
  console.log("Evidence:", evidence);
}
