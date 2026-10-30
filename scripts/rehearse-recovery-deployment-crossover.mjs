// Actual production Next/PG/native IDB through a task-only trusted TLS ingress.
// No production application guards are changed. Local proxy simulates trusted
// Vercel ingress, overwrites forwarding headers, and only binds localhost.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:https";
import { request, createServer as createTunnelServer } from "node:http";
import { connect } from "node:net";
import { spawn } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, openSync } from "node:fs";
import { resolve, join } from "node:path";
import { randomBytes } from "node:crypto";
const require = createRequire(import.meta.url),
  { chromium } = require(process.env.PLAYWRIGHT_MODULE),
  { Client } = require("pg");
const database = process.env.DATABASE_TEST_URL,
  evidence = resolve(process.env.RECOVERY_CROSSOVER_EVIDENCE),
  roots = JSON.parse(process.env.RECOVERY_CROSSOVER_BUILDS);
assert(["localhost", "127.0.0.1"].includes(new URL(database).hostname));
assert(roots.ar && roots.rc);
mkdirSync(evidence, { recursive: true });
const results = [],
  children = [],
  ports = {};
let target, cleanupHeld;
const proxy = createServer(
  {
    key: readFileSync(process.env.LOCAL_TLS_KEY),
    cert: readFileSync(process.env.LOCAL_TLS_CERT),
  },
  (req, res) => {
    if (req.headers.host !== "localhost") {
      res.writeHead(400);
      res.end();
      return;
    }
    const upstream = request(
      {
        hostname: "localhost",
        port: target,
        path: req.url,
        method: req.method,
        headers: {
          ...req.headers,
          host: "localhost",
          "x-forwarded-host": "localhost",
          "x-forwarded-proto": "https",
          "x-forwarded-for": "127.0.0.1",
        },
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
  },
);
const tunnel = createTunnelServer();
tunnel.on("connect", (req, socket, head) => {
  if (req.url !== "localhost:443") {
    socket.destroy();
    return;
  }
  const upstream = connect(3160, "127.0.0.1", () => {
    socket.write("HTTP/1.1 200 Connection Established\r\n\r\n");
    if (head.length) upstream.write(head);
    upstream.pipe(socket);
    socket.pipe(upstream);
  });
  upstream.on("error", () => socket.destroy());
  socket.on("error", () => upstream.destroy());
});
const browser = await chromium.launch({
    proxy: { server: "http://127.0.0.1:3169" },
    args: ["--proxy-bypass-list=<-loopback>"],
    executablePath: process.env.CHROME_EXECUTABLE,
    headless: true,
  }),
  db = new Client({ connectionString: database });
await db.connect();
const origin = "https://localhost",
  key = "olympiad-trainer:practice-session";
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
const generation = async (id) =>
  (
    await db.query(
      "select credential_generation::text g from learners where id=$1",
      [id],
    )
  ).rows[0].g;
const count = async () =>
  (await db.query("select count(*)::int n from learners")).rows[0].n;
function pass(name, details = {}) {
  results.push({ name, ...details });
  writeFileSync(
    join(evidence, "results.json"),
    JSON.stringify(results, null, 2),
  );
  console.log("PASS", name);
}
async function home(p) {
  await p.goto(origin);
  await p
    .getByRole("button", { name: "Другие вкладки закрыты — перенести работу" })
    .click();
  await p
    .getByRole("link", { name: "Начать тренировку", exact: true })
    .waitFor();
}
async function draft(p) {
  await p.goto(origin + "/practice");
  await p.getByRole("textbox", { name: "Ответ", exact: true }).fill("1");
  for (let i = 0; i < 100; i++) {
    const r = await record(p);
    if (r.payloads[key] && JSON.parse(r.payloads[key]).rawAnswer === "1")
      return r;
    await p.waitForTimeout(50);
  }
  throw Error("draft not durable");
}
async function successor(p) {
  const code = await p
    .getByLabel("Новый код восстановления", { exact: true })
    .textContent();
  await p.getByLabel("Вставь сохранённую копию кода").fill(code);
  return code;
}
async function activate(p) {
  const code = await successor(p);
  await p
    .getByRole("button", { name: "Активировать восстановление", exact: true })
    .click();
  await p.getByRole("button", { name: "К истории" }).waitFor();
  return code;
}
async function beginRecovery(p, code) {
  await p.goto(origin + "/restore");
  await p.getByLabel("Код восстановления", { exact: true }).fill(code);
  await p.getByRole("button", { name: "Продолжить", exact: true }).click();
  return successor(p);
}
function preserved(before, after) {
  assert.equal(after.owner.learnerId, before.owner.learnerId);
  assert.deepEqual(after.payloads, before.payloads);
  assert.deepEqual(after.source, before.source);
  assert.deepEqual(after.retained ?? {}, before.retained ?? {});
}
try {
  let port = 3161;
  const secret = randomBytes(32).toString("base64url"),
    cron = randomBytes(32).toString("base64url");
  for (const [name, cwd] of Object.entries(roots)) {
    ports[name] = port;
    const log = openSync(join(evidence, `server-${name}.log`), "w");
    children.push(
      spawn(
        process.execPath,
        [
          "-e",
          `const app=require('next')({dev:false,hostname:'localhost',port:443}); app.prepare().then(()=>{const server=require('node:http').createServer(app.getRequestHandler()); server.listen(${port},'localhost');});`,
        ],
        {
          cwd,
          env: {
            ...process.env,
            NODE_ENV: "production",
            DATABASE_URL: database,
            RECOVERY_ENABLED: "true",
            RECOVERY_NETWORK_HMAC_KEY: secret,
            CRON_SECRET: cron,
            VERCEL: "1",
            VERCEL_ENV: "production",
            VERCEL_URL: "localhost",
          },
          stdio: ["ignore", log, log],
        },
      ),
    );
    let ready = false;
    for (let i = 0; i < 200; i++) {
      try {
        await fetch(`http://localhost:${port}/robots.txt`, {
          signal: AbortSignal.timeout(3000),
        });
        ready = true;
        break;
      } catch {
        await new Promise((r) => setTimeout(r, 100));
      }
    }
    assert(ready);
    port++;
  }
  target = ports.ar;
  await new Promise((resolve, reject) => {
    proxy.once("error", reject);
    proxy.listen(3160, "127.0.0.1", resolve);
  });
  await new Promise((resolve, reject) => {
    tunnel.once("error", reject);
    tunnel.listen(3169, "127.0.0.1", resolve);
  });
  for (const failure of ["lost-response", "local-activation-abort"]) {
    target = ports.ar;
    const c = await browser.newContext({ ignoreHTTPSErrors: true }),
      p = await c.newPage();
    console.log("OPEN", failure);
    p.on("response", (r) => {
      if (r.url().endsWith("/api/identity/credentials"))
        console.log("CREDENTIAL_RESPONSE", r.status());
    });
    await home(p);
    await draft(p);
    await p.goto(origin + "/restore");
    await p
      .getByRole("button", { name: "Сохранить доступ", exact: true })
      .click();
    let code = await activate(p);
    const before = await record(p),
      n = await count();
    assert.equal(
      await generation(before.owner.learnerId),
      before.owner.generation,
    );
    code = await beginRecovery(p, code);
    let intercepted = false,
      handled = false;
    target = failure === "lost-response" ? ports.rc : ports.ar;
    await p.route("**/api/identity/credentials", async (route) => {
      const req = route.request();
      if (!intercepted && (req.postData() ?? "").includes("confirm-recovery")) {
        intercepted = true;
        const response = await route.fetch();
        assert.equal(response.status(), 200);
        assert.equal(
          await generation(before.owner.learnerId),
          String(BigInt(before.owner.generation) + 1n),
        );
        if (failure === "lost-response") await route.abort("failed");
        else {
          await p.evaluate(() => {
            window.activationAbortHits = 0;
            IDBObjectStore.prototype.put = function () {
              window.activationAbortHits++;
              throw Error("Injected post-server-commit activation abort");
            };
          });
          await route.fulfill({ response });
        }
        handled = true;
      } else await route.continue();
    });
    await p
      .getByRole("button", { name: "Активировать восстановление", exact: true })
      .click();
    for (let i = 0; i < 200 && !handled; i++) await p.waitForTimeout(50);
    assert(handled, "Recovery request injection did not finish");
    await p.locator("p[role=alert]").waitFor();
    if (!intercepted)
      writeFileSync(
        join(evidence, "pre-confirm-failure.json"),
        JSON.stringify(
          {
            body: await p.locator("body").innerText(),
            record: await record(p),
            locks: await p.evaluate(() => navigator.locks.query()),
          },
          null,
          2,
        ),
      );
    assert(intercepted);
    if (failure === "local-activation-abort")
      assert((await p.evaluate(() => window.activationAbortHits)) > 0);
    const pending = await record(p);
    assert(pending.pendingTransition);
    preserved(before, pending);
    await p.unroute("**/api/identity/credentials");
    target = ports.rc;
    await p.reload();
    await p.waitForTimeout(500);
    await p.goto(origin);
    await p
      .getByRole("link", { name: "Продолжить тренировку", exact: true })
      .waitFor();
    const after = await record(p);
    preserved(before, after);
    assert.equal(
      after.owner.generation,
      String(BigInt(before.owner.generation) + 1n),
    );
    assert(!after.pendingTransition);
    assert.equal(await count(), n);
    pass(
      `925 pending Recovery -> RC production confirmation ${failure} -> RC reload preserves owner/generation/work/namespaces`,
      {
        generationBefore: before.owner.generation,
        generationAfter: after.owner.generation,
      },
    );
    await c.close();
  }
  console.log("OPEN held-finish-lock");
  // A held Finish keeps the identity shared lock. Real second-tab Recovery must
  // demonstrate whether the requested generation-before-callback schedule exists.
  target = ports.ar;
  const c = await browser.newContext({ ignoreHTTPSErrors: true }),
    p = await c.newPage();
  await home(p);
  await draft(p);
  await p.goto(origin + "/restore");
  await p
    .getByRole("button", { name: "Сохранить доступ", exact: true })
    .click();
  let code = await activate(p);
  console.log("ENROLLED held-finish-lock");
  await p.goto(origin + "/practice");
  await p.getByRole("button", { name: "Подсказка", exact: true }).click();
  await p.getByRole("button", { name: "Завершить", exact: true }).waitFor();
  for (let i = 0; i < 100; i++) {
    const r = await record(p);
    if (JSON.parse(r.payloads[key]).activePractice.hintExposures.length) break;
    await p.waitForTimeout(50);
  }
  assert(
    JSON.parse((await record(p)).payloads[key]).activePractice.hintExposures
      .length,
  );
  await p.waitForTimeout(100);

  const before = await record(p),
    sid = before.sessionId,
    n = await count();
  let release, committed;
  const held = new Promise((r) => (release = r)),
    committedPromise = new Promise((r) => (committed = r));
  cleanupHeld = release;
  await p.route("**/*", async (route) => {
    const req = route.request(),
      body = req.postData() ?? "";
    if (req.method() === "POST")
      console.log("OLD_POST", {
        sessionMatched: body.includes(sid),
        hasFacts: body.includes('"facts"'),
      });
    if (
      req.method() === "POST" &&
      body.includes(sid) &&
      body.includes('"facts"')
    ) {
      const response = await route.fetch();
      assert.equal(
        (
          await db.query(
            "select 1 from practice_finish_receipts where session_id=$1",
            [sid],
          )
        ).rowCount,
        1,
      );
      console.log("COMMITTED held-finish-lock");
      committed();
      await held;
      await route.fulfill({ response });
    } else await route.continue();
  });
  p.once("dialog", (dialog) => dialog.accept());
  await p.getByRole("button", { name: "Завершить", exact: true }).click();
  await Promise.race([
    committedPromise,
    new Promise((_, reject) =>
      setTimeout(() => reject(Error("Real Finish did not commit")), 10000),
    ),
  ]);
  const second = await c.newPage();
  await beginRecovery(second, code);
  console.log("RECOVERY PREPARED while held");
  const pending = await record(second),
    g = await generation(before.owner.learnerId);
  let confirmations = 0;
  second.on("request", (req) => {
    if ((req.postData() ?? "").includes("confirm-recovery")) confirmations++;
  });
  await second
    .getByRole("button", { name: "Активировать восстановление", exact: true })
    .click();
  await second.locator("p[role=alert]").waitFor();
  assert.equal(confirmations, 0);
  assert.equal(await generation(before.owner.learnerId), g);
  assert.deepEqual(await record(second), pending);
  const locks = await second.evaluate(() => navigator.locks.query());
  assert(
    locks.held.some(
      (l) =>
        l.name === "olympiad-trainer:identity-initialization" &&
        l.mode === "shared",
    ),
  );
  pass(
    "held real committed Finish excludes same-origin second-tab Recovery rotation before callback",
    { confirmations, generation: g, locks },
  );
  target = ports.rc;
  release();
  await p.waitForURL(/\/practice\/summary\?session=/);
  assert.equal(
    (
      await db.query(
        "select 1 from practice_finish_receipts where session_id=$1",
        [sid],
      )
    ).rowCount,
    1,
  );
  assert.equal(
    (
      await db.query(
        "select 1 from practice_completed_episodes where session_id=$1",
        [sid],
      )
    ).rowCount,
    1,
  );
  const completedBeforeRotation = await record(p);
  await second
    .getByRole("button", { name: "Активировать восстановление", exact: true })
    .click();
  for (let i = 0; i < 200; i++) {
    if ((await generation(before.owner.learnerId)) === String(BigInt(g) + 1n))
      break;
    await second.waitForTimeout(50);
  }
  assert.equal(
    await generation(before.owner.learnerId),
    String(BigInt(g) + 1n),
  );
  // The old deployment's post-confirm verification action may be unavailable
  // on RC. Preserve its transition intent and reload capable JavaScript.
  await second
    .locator('button:has-text("К истории"), p[role="alert"]')
    .first()
    .waitFor();
  await second.goto(origin);
  for (let i = 0; i < 200; i++) {
    const current = await record(second);
    if (
      current.owner.generation === String(BigInt(g) + 1n) &&
      !current.pendingTransition
    )
      break;
    await second.waitForTimeout(50);
  }
  const reconciled = await record(second);
  assert(!reconciled.pendingTransition);
  preserved(completedBeforeRotation, reconciled);
  assert.equal(reconciled.owner.generation, String(BigInt(g) + 1n));
  assert.equal(
    reconciled.payloads["olympiad-trainer:practice-server-finish-request"],
    null,
  );
  assert.equal(await count(), n);
  pass(
    "releasing old Finish callback after RC switch permits real generation rotation and capable reload with one receipt/episode",
    { generationAfter: reconciled.owner.generation },
  );
  await c.close();
} catch (error) {
  const pages = [];
  for (const context of browser.contexts()) {
    for (const page of context.pages()) {
      pages.push({
        url: page.url(),
        text: await page
          .locator("body")
          .innerText()
          .catch(() => "unavailable"),
        canonical: await record(page).catch(() => null),
      });
    }
  }
  writeFileSync(
    join(evidence, "failure-pages.json"),
    JSON.stringify(pages, null, 2),
  );
  writeFileSync(join(evidence, "error.txt"), String(error.stack));
  throw error;
} finally {
  cleanupHeld?.();
  writeFileSync(
    join(evidence, "results.json"),
    JSON.stringify(results, null, 2),
  );
  await browser.close();
  await db.end();
  proxy.close();
  tunnel.close();
  for (const child of children) child.kill("SIGTERM");
}
