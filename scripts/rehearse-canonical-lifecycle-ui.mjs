// Real browser -> existing HTTP/server actions -> disposable PostgreSQL only.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdtempSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { tmpdir } from "node:os";
const require = createRequire(import.meta.url),
  { chromium } = require(process.env.PLAYWRIGHT_MODULE),
  { Client } = require("pg");
const origin = process.env.CANONICAL_TEST_ORIGIN,
  database = process.env.DATABASE_TEST_URL;
for (const value of [origin, database])
  assert(["127.0.0.1", "localhost"].includes(new URL(value).hostname));
const evidence = mkdtempSync(join(tmpdir(), "ot-canonical-live-lifecycle-")),
  results = [];
const browser = await chromium.launch({
    executablePath: process.env.CHROME_EXECUTABLE,
    headless: true,
  }),
  db = new Client({ connectionString: database });
await db.connect();
const pass = (name) => {
  results.push(name);
  console.log("PASS", name);
  writeFileSync(
    join(evidence, "results.json"),
    JSON.stringify(results, null, 2),
  );
};
const record = (p) =>
  p.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const r = indexedDB.open("olympiad-trainer:learner-canonical-v1", 2);
        r.onsuccess = () => {
          const t = r.result.transaction("learner", "readonly"),
            q = t.objectStore("learner").get("binding");
          q.onsuccess = () => {
            resolve(q.result);
            r.result.close();
          };
        };
        r.onerror = () => reject(r.error);
      }),
  );
async function home(p) {
  await p.goto(origin);
  await Promise.race([
    p
      .getByRole("button", {
        name: "Другие вкладки закрыты — перенести работу",
      })
      .waitFor({ timeout: 30000 }),
    p
      .getByRole("link", {
        name: /Начать тренировку|Продолжить тренировку/,
        exact: true,
      })
      .waitFor({ timeout: 30000 }),
  ]);
  const handoff = p.getByRole("button", {
    name: "Другие вкладки закрыты — перенести работу",
  });
  if (await handoff.isVisible().catch(() => false)) await handoff.click();
  await p
    .getByRole("link", {
      name: /Начать тренировку|Продолжить тренировку/,
      exact: true,
    })
    .waitFor({ timeout: 30000 });
}
async function activate(p) {
  const code = await p
    .getByLabel("Новый код восстановления", { exact: true })
    .textContent();
  await p.getByLabel("Вставь сохранённую копию кода").fill(code);
  await p
    .getByRole("button", { name: "Активировать восстановление", exact: true })
    .click();
  try {
    await p
      .getByRole("button", { name: "К истории" })
      .waitFor({ timeout: 10000 });
  } catch (error) {
    console.log("ALERT", await p.getByRole("alert").allTextContents());
    throw error;
  }
  return code;
}
try {
  const c = await browser.newContext({ viewport: { width: 390, height: 844 } }),
    p = await c.newPage();
  await home(p);
  await p.getByRole("link", { name: "Начать тренировку", exact: true }).click();
  await p.getByRole("textbox", { name: "Ответ", exact: true }).fill("1");
  await p.getByRole("button", { name: "Проверить", exact: true }).click();
  await p.getByText("Завершить", { exact: true }).waitFor();
  await p.goto(origin + "/restore");
  const draft = await record(p);
  assert(draft.sessionId);
  await p
    .getByRole("button", { name: "Сохранить доступ", exact: true })
    .click();
  const code = await activate(p),
    enrolled = await record(p);
  const oldCookies = await c.cookies();
  assert.equal(enrolled.owner.learnerId, draft.owner.learnerId);
  assert.deepEqual(enrolled.payloads, draft.payloads);
  assert.deepEqual(enrolled.source, draft.source);
  await home(p);
  await p
    .getByRole("link", { name: "Продолжить тренировку", exact: true })
    .click();
  assert.equal((await record(p)).sessionId, draft.sessionId);
  pass(
    "mobile Recovery enrollment preserves canonical Practice bytes and Resume",
  );
  await p.goto(origin + "/restore");
  await p.getByLabel("Код восстановления", { exact: true }).fill(code);
  await p.getByRole("button", { name: "Продолжить", exact: true }).click();
  const nextCode = await activate(p),
    recovered = await record(p);
  assert.equal(recovered.owner.learnerId, draft.owner.learnerId);
  assert.notEqual(recovered.owner.generation, enrolled.owner.generation);
  assert.deepEqual(recovered.payloads, draft.payloads);
  assert.deepEqual(recovered.source, draft.source);
  pass(
    "same-owner recovery rotates generation and preserves exact canonical work",
  );
  const revoked = await browser.newContext();
  await revoked.addCookies(oldCookies);
  const revokedPage = await revoked.newPage(),
    learnerCountBefore = (
      await db.query("select count(*)::int n from learners")
    ).rows[0].n;
  await revokedPage.goto(origin);
  await revokedPage
    .getByRole("button", { name: "Начать заново", exact: true })
    .waitFor();
  assert.equal(
    (await db.query("select count(*)::int n from learners")).rows[0].n,
    learnerCountBefore,
  );
  assert.equal(
    await revokedPage
      .getByRole("link", { name: "Начать тренировку", exact: true })
      .count(),
    0,
  );
  await revoked.close();
  pass("revoked cookie blocks learning and never silently creates a learner");
  // Explicit lost browser credential, synthetic identity only. Retain browser DB.
  await c.clearCookies();
  await p.goto(origin);
  let freshIntercepted = false,
    countAtAcknowledgement = null;
  await p.route("**/*", async (route) => {
    const request = route.request();
    if (
      !freshIntercepted &&
      request.method() === "POST" &&
      request.headers()["next-action"] &&
      request.postData() === "[true]"
    ) {
      freshIntercepted = true;
      const response = await route.fetch();
      countAtAcknowledgement = (
        await db.query("select count(*)::int n from learners")
      ).rows[0].n;
      // Deliver the real server response/cookie; abort only local activation.
      await p.evaluate(() => {
        window.originalTransitionPut = IDBObjectStore.prototype.put;
        IDBObjectStore.prototype.put = function () {
          throw Error(
            "Injected local activation abort after authenticated ack",
          );
        };
      });
      await route.fulfill({ response });
    } else await route.continue();
  });
  await p.getByRole("button", { name: "Начать заново", exact: true }).click();
  await p
    .getByRole("button", { name: "Подтверждаю: начать заново", exact: true })
    .click();
  await p
    .getByRole("alert")
    .filter({ hasText: "Не удалось проверить доступ" })
    .waitFor();
  assert(freshIntercepted);
  assert.equal((await record(p)).pendingTransition.kind, "fresh");
  await p.unroute("**/*");
  await p.evaluate(() => {
    IDBObjectStore.prototype.put = window.originalTransitionPut;
  });
  await p.reload();
  await p
    .getByRole("link", { name: "Начать тренировку", exact: true })
    .waitFor();
  assert.equal(
    (await db.query("select count(*)::int n from learners")).rows[0].n,
    countAtAcknowledgement,
  );
  const fresh = await record(p);
  assert.notEqual(fresh.owner.learnerId, draft.owner.learnerId);
  assert(Object.values(fresh.payloads).every((v) => v === null));
  assert.deepEqual(
    fresh.retained[draft.owner.learnerId].payloads,
    draft.payloads,
  );
  pass(
    "Start Fresh activation abort preserves intent; authenticated reload creates no learner and retains source",
  );
  // Simulate expiry of only this synthetic learner's confirmation rate window
  // between independent rapid recovery cases; application limits remain enabled.
  await db.query(
    "update identity_rate_limit_buckets set expires_at=clock_timestamp()-interval '1 second' where bucket_key=$1",
    [
      createHash("sha256")
        .update("olympiad-trainer:rate-limit:confirm-learner\0")
        .update(draft.owner.learnerId)
        .digest("hex"),
    ],
  );
  await p.goto(origin + "/restore");
  await p.getByLabel("Код восстановления", { exact: true }).fill(nextCode);
  await p.getByRole("button", { name: "Продолжить", exact: true }).click();
  await activate(p);
  const restored = await record(p);
  assert.equal(restored.owner.learnerId, draft.owner.learnerId);
  assert.deepEqual(restored.payloads, draft.payloads);
  assert(restored.retained[fresh.owner.learnerId]);
  pass("cross-owner recovery restores only target's retained namespace");
  await p.goto(origin + "/simulation");
  await p
    .getByRole("button", { name: "Начать · 45 минут", exact: true })
    .click();
  const input = p.getByRole("textbox", {
    name: "Твой ответ и ход решения",
    exact: true,
  });
  await input.fill("Синтетическое решение: 12 + 7 = 19.");
  await p.waitForTimeout(1000);
  const sim = await record(p),
    pendingKey = "olympiad-trainer:simulation-pending-v0",
    sid = JSON.parse(sim.payloads[pendingKey]).sessionId;
  let server = await db.query(
    "select * from simulation_attempts where session_id=$1",
    [sid],
  );
  assert.equal(server.rowCount, 1);
  let saveIntercepted = false;
  await p.route("**/*", async (route) => {
    const request = route.request(),
      body = request.postData() ?? "";
    if (
      !saveIntercepted &&
      request.method() === "POST" &&
      request.headers()["next-action"] &&
      body.includes(sid) &&
      body.includes("потерянный ответ")
    ) {
      saveIntercepted = true;
      await route.fetch();
      await route.abort("failed");
    } else await route.continue();
  });
  await input.fill("Синтетическое решение: потерянный ответ.");
  await p.getByText("Не удалось сохранить работу.", { exact: false }).waitFor();
  assert(saveIntercepted);
  const uncertain = await record(p);
  assert(JSON.parse(uncertain.payloads[pendingKey]).pending);
  await p.unroute("**/*");
  await p.reload();
  await input.waitFor();
  assert.equal(
    await input.inputValue(),
    "Синтетическое решение: потерянный ответ.",
  );
  pass(
    "Simulation lost real server response retains canonical pending copy and reload reconciles",
  );
  await p
    .getByRole("button", { name: "Завершить раньше", exact: true })
    .click();
  await p
    .getByRole("button", { name: "Да, завершить и сдать", exact: true })
    .click();
  await p
    .getByRole("heading", { name: "Работа завершена", exact: true })
    .waitFor();
  server = await db.query(
    "select * from simulation_attempts where session_id=$1",
    [sid],
  );
  assert.equal(server.rowCount, 1);
  assert(server.rows[0].finished_at);
  assert.equal((await record(p)).payloads[pendingKey], null);
  assert.equal(
    await p.evaluate(() => document.documentElement.scrollWidth > innerWidth),
    false,
  );
  await p.screenshot({
    path: join(evidence, "simulation-finished-mobile.png"),
    fullPage: true,
  });
  pass(
    "mobile Simulation canonical draft -> real PG save -> reload -> finish -> atomic local clear",
  );
  await c.close();
} finally {
  await db.end();
  await browser.close();
  writeFileSync(
    join(evidence, "results.json"),
    JSON.stringify(results, null, 2),
  );
  console.log("Evidence:", evidence);
}
