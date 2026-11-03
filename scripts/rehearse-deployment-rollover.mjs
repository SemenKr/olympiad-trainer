// Actual running Next deployments behind one disposable loopback origin.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer, request } from "node:http";
import { spawn } from "node:child_process";
import { openSync, mkdirSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
const require = createRequire(import.meta.url),
  { chromium } = require(process.env.PLAYWRIGHT_MODULE),
  { Client } = require("pg");
const database = process.env.DATABASE_TEST_URL;
assert(["127.0.0.1", "localhost"].includes(new URL(database).hostname));
const evidence = resolve(process.env.ROLLOVER_EVIDENCE),
  roots = JSON.parse(process.env.ROLLOVER_BUILDS);
mkdirSync(evidence, { recursive: true });
let target;
const children = [],
  results = [];
const proxy = createServer((req, res) => {
  const upstream = request(
    {
      hostname: "localhost",
      port: target,
      path: req.url,
      method: req.method,
      headers: req.headers,
    },
    (r) => {
      res.writeHead(r.statusCode, r.headers);
      r.pipe(res);
    },
  );
  upstream.on("error", () => {
    res.writeHead(502);
    res.end();
  });
  req.pipe(upstream);
});
const db = new Client({ connectionString: database });
await db.connect();
const browser = await chromium.launch({
  executablePath: process.env.CHROME_EXECUTABLE,
  headless: true,
});
const record = (p) =>
  p.evaluate(
    () =>
      new Promise((resolve, reject) => {
        const r = indexedDB.open("olympiad-trainer:learner-canonical-v1", 2);
        r.onerror = () => reject(r.error);
        r.onsuccess = () => {
          const q = r.result
            .transaction("learner")
            .objectStore("learner")
            .get("binding");
          q.onsuccess = () => {
            resolve(q.result);
            r.result.close();
          };
        };
      }),
  );
const save = (name, detail = {}) => {
  results.push({ name, ...detail });
  console.log("PASS", name);
  writeFileSync(
    join(evidence, "results.json"),
    JSON.stringify(results, null, 2),
  );
};
try {
  let port = 3151;
  const ports = {};
  for (const [name, cwd] of Object.entries(roots)) {
    ports[name] = port;
    const log = openSync(join(evidence, `server-${name}.log`), "w");
    const child = spawn(
      process.execPath,
      [
        "node_modules/next/dist/bin/next",
        "start",
        "--hostname",
        "localhost",
        "--port",
        String(port),
      ],
      {
        cwd,
        env: { ...process.env, DATABASE_URL: database },
        stdio: ["ignore", log, log],
      },
    );
    children.push(child);
    let ready = false;
    for (let i = 0; i < 200; i++) {
      try {
        await fetch(`http://localhost:${port}`);
        ready = true;
        break;
      } catch {
        await new Promise((r) => setTimeout(r, 100));
      }
    }
    assert(ready, name);
    port++;
  }
  await new Promise((r) => proxy.listen(3150, "localhost", r));
  const origin = "http://localhost:3150";
  async function home(p, name) {
    target = ports[name];
    await p.goto(origin);
    const handoff = p.getByRole("button", {
      name: "Другие вкладки закрыты — перенести работу",
    });
    await Promise.race([
      handoff.waitFor(),
      p.getByRole("link", { name: "Начать тренировку", exact: true }).waitFor(),
    ]);
    if (await handoff.isVisible()) await handoff.click();
    await p
      .getByRole("link", {
        name: /Начать тренировку|Продолжить тренировку/,
        exact: true,
      })
      .waitFor();
  }
  const c = await browser.newContext({ viewport: { width: 390, height: 844 } }),
    p = await c.newPage();
  await home(p, "ar");
  await p.goto(origin + "/practice");
  await p.getByRole("textbox", { name: "Ответ", exact: true }).fill("1");
  await p.getByRole("button", { name: "Проверить", exact: true }).click();
  await p.getByRole("button", { name: "Завершить", exact: true }).waitFor();
  let draft;
  for (let i = 0; i < 100; i++) {
    draft = await record(p);
    if (
      JSON.parse(draft.payloads["olympiad-trainer:practice-session"])
        .activePractice.submissions.length === 1
    )
      break;
    await p.waitForTimeout(50);
  }
  assert.equal(
    JSON.parse(draft.payloads["olympiad-trainer:practice-session"])
      .activePractice.submissions.length,
    1,
  );
  target = ports.rc;
  await p.reload();
  await p.getByRole("button", { name: "Завершить", exact: true }).waitFor();
  assert.deepEqual((await record(p)).payloads, draft.payloads);
  save("A–R running deployment -> RC preserves exact Practice draft");
  target = ports.ar;
  await p.reload();
  await p.getByRole("button", { name: "Завершить", exact: true }).waitFor();
  assert.deepEqual((await record(p)).payloads, draft.payloads);
  save(
    "RC -> protocol-aware A–R rollback preserves exact supported Practice draft",
  );
  target = ports.rc;
  await p.reload();
  await p.getByRole("button", { name: "Завершить", exact: true }).waitFor();
  let intercepted = false;
  await p.route("**/*", async (route) => {
    const req = route.request();
    if (
      !intercepted &&
      req.method() === "POST" &&
      (req.postData() ?? "").includes(draft.sessionId) &&
      (req.postData() ?? "").includes('"facts"')
    ) {
      intercepted = true;
      await route.fetch();
      await route.abort("failed");
    } else await route.continue();
  });
  await p.getByRole("button", { name: "Завершить", exact: true }).click();
  await p.waitForFunction(
    () =>
      document.body.innerText.includes("Повторить") ||
      document.body.innerText.includes("Не удалось"),
  );
  assert(intercepted);
  const pending = await record(p),
    key = "olympiad-trainer:practice-server-finish-request";
  assert(pending.payloads[key]);
  await p.unroute("**/*");
  target = ports.ar;
  await p.reload();
  await p.getByRole("button", { name: "Завершить", exact: true }).waitFor();
  assert.equal((await record(p)).payloads[key], pending.payloads[key]);
  await p.getByRole("button", { name: "Завершить", exact: true }).click();
  await p.waitForURL(/\/practice\/summary\?session=/);
  for (const table of [
    "practice_finish_receipts",
    "practice_completed_episodes",
  ])
    assert.equal(
      (
        await db.query(`select 1 from ${table} where session_id=$1`, [
          draft.sessionId,
        ])
      ).rowCount,
      1,
    );
  save(
    "RC committed/lost Finish response -> actual A–R rollback exact retry, one receipt/episode",
  );
  target = ports.ar;
  await p.goto(origin + "/simulation");
  await p
    .getByRole("button", { name: "Начать · 45 минут", exact: true })
    .click();
  const input = p.getByRole("textbox", {
    name: "Твой ответ и ход решения",
    exact: true,
  });
  await input.fill("Disposable rollover draft 19");
  await p.waitForTimeout(1000);
  const sim = await record(p),
    simKey = "olympiad-trainer:simulation-pending-v0";
  assert(sim.payloads[simKey]);
  target = ports.rc;
  await p.reload();
  await input.waitFor();
  assert.equal(await input.inputValue(), "Disposable rollover draft 19");
  await p
    .getByRole("button", { name: "Завершить раньше", exact: true })
    .click();
  await p
    .getByRole("button", { name: "Да, завершить и сдать", exact: true })
    .click();
  await p
    .getByRole("heading", { name: "Работа завершена", exact: true })
    .waitFor();
  const simId = JSON.parse(sim.payloads[simKey]).sessionId;
  const simRows = await db.query(
    "select finished_at from simulation_attempts where session_id=$1",
    [simId],
  );
  assert.equal(simRows.rowCount, 1);
  assert(simRows.rows[0].finished_at);
  assert.equal((await record(p)).payloads[simKey], null);
  save("A–R running Simulation draft -> RC resume and real server Finish");
  const retained = await record(p),
    countBefore = (await db.query("select count(*)::int n from learners"))
      .rows[0].n;
  await c.clearCookies();
  await p.goto(origin);
  await p.getByRole("button", { name: "Начать заново", exact: true }).waitFor();
  assert.deepEqual((await record(p)).payloads, retained.payloads);
  assert.equal(
    (await db.query("select count(*)::int n from learners")).rows[0].n,
    countBefore,
  );
  save(
    "post-rollover missing identity credential preserves canonical work and blocks automatic identity creation",
  );
  await c.close();
  if (ports.future) {
    const fc = await browser.newContext(),
      fp = await fc.newPage();
    await home(fp, "rc");
    await fp.goto(origin + "/practice");
    await fp.getByRole("button", { name: "Подсказка", exact: true }).click();
    await fp.getByRole("button", { name: "Завершить", exact: true }).click();
    await fp.waitForURL(/\/practice\/summary\?session=/);
    target = ports.future;
    await fp.goto(origin + "/practice/pack?pack=pack-t");
    await fp.getByRole("button", { name: "Подсказка", exact: true }).click();
    const futureDraft = await record(fp);
    let lost = false;
    await fp.route("**/*", async (route) => {
      const req = route.request(),
        body = req.postData() ?? "";
      if (
        !lost &&
        req.method() === "POST" &&
        body.includes(futureDraft.sessionId) &&
        body.includes('"facts"')
      ) {
        lost = true;
        await route.fetch();
        await route.abort("failed");
      } else await route.continue();
    });
    await fp.getByRole("button", { name: "Завершить", exact: true }).click();
    await fp.waitForFunction(
      () =>
        document.body.innerText.includes("Повторить") ||
        document.body.innerText.includes("Не удалось"),
    );
    assert(lost);
    const unknown = await record(fp);
    await fp.unroute("**/*");
    target = ports.rc;
    await fp.reload();
    await fp.waitForTimeout(1000);
    assert.deepEqual(await record(fp), unknown);
    assert.equal(
      await fp.getByRole("button", { name: "Завершить", exact: true }).count(),
      0,
    );
    save(
      "content-only T pending Finish -> older RC blocks and preserves exact canonical aggregate",
    );
    target = ports.future;
    await fp.reload();
    await fp.getByRole("button", { name: "Завершить", exact: true }).click();
    await fp.waitForURL(/\/practice\/summary\?session=/);
    assert.equal(
      (
        await db.query(
          "select 1 from practice_finish_receipts where session_id=$1",
          [futureDraft.sessionId],
        )
      ).rowCount,
      1,
    );
    save(
      "restored T-capable deployment retries preserved committed outbox exactly once",
    );
    await fc.close();
  }
  const oldc = await browser.newContext(),
    old = await oldc.newPage();
  await home(old, "legacy");
  await old.goto(origin + "/practice");
  await old.getByRole("textbox", { name: "Ответ", exact: true }).fill("1");
  await old.getByRole("button", { name: "Проверить", exact: true }).click();
  await old.getByRole("button", { name: "Завершить", exact: true }).waitFor();
  const current = await oldc.newPage();
  await home(current, "rc");
  const canonical = await record(current),
    before = await old.evaluate(() =>
      JSON.stringify(Object.entries(localStorage)),
    );
  // Draft input is a frozen old-client local write, with no new-build action ID.
  await old.getByRole("textbox", { name: "Ответ", exact: true }).fill("2");
  await old.waitForTimeout(500);
  const after = await old.evaluate(() =>
    JSON.stringify(Object.entries(localStorage)),
  );
  assert.notEqual(after, before);
  assert.deepEqual((await record(current)).payloads, canonical.payloads);
  await current.reload();
  await current.waitForTimeout(800);
  const body = await current.locator("body").innerText();
  assert(
    !(await current
      .getByRole("link", { name: "Продолжить тренировку", exact: true })
      .count()),
  );
  save(
    "frozen pre-IDB tab still writes after handoff; canonical bytes preserved and new page blocks",
    { body },
  );
  await oldc.close();
} finally {
  writeFileSync(
    join(evidence, "results.json"),
    JSON.stringify(results, null, 2),
  );
  await browser.close();
  await db.end();
  proxy.close();
  for (const child of children) child.kill("SIGTERM");
}
