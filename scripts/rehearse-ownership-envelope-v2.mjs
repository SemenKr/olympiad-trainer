// Local-only rehearsal. Requires installed Playwright and Chrome; no dependency
// installation, external requests, real credentials, database or deployments.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createServer } from "node:http";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
const repo = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(import.meta.url);
const vite = createRequire(require.resolve("vitest/package.json")).resolve(
  "vite",
);
const { build } = await import(
  pathToFileURL(createRequire(vite).resolve("rolldown"))
);
if (!process.env.PLAYWRIGHT_MODULE || !process.env.CHROME_EXECUTABLE)
  throw Error(
    "Set PLAYWRIGHT_MODULE to an installed Playwright module and CHROME_EXECUTABLE to Chrome. Nothing is downloaded.",
  );
const { chromium } = require(process.env.PLAYWRIGHT_MODULE);
const root = mkdtempSync(join(tmpdir(), "ot-envelope-v2-"));
const revisions = {
  old: "5463382b42cef06f3f2e94bcd5af84ca72d3deac",
  m1: "2ccc420c4b529a5bd5dc223052e1daa26300f6e7",
  m2: "15daf851dafab6ffba8ecef93e607598b8d01ffc",
  fallback: "6e7376f073ed5bdef3d6879cf167d3ffb1333b47",
};
const modules = {
  storage: "practice/ui/practice-session-storage",
  ownership: "learner/local-ownership",
  session: "practice/ui/fixed-practice-session-state",
  answer: "practice/ui/short-numeric-answer-state",
  practice: "practice/application/practice-state",
  packs: "practice/application/completed-practice-episode",
  metadata: "practice/ui/browser-problem-metadata.generated",
};
for (const [name, revision] of Object.entries(revisions)) {
  const destination = join(root, name);
  mkdirSync(destination);
  const archive = execFileSync("git", ["archive", revision, "src/modules"], {
    cwd: repo,
    maxBuffer: 30 * 1024 * 1024,
  });
  execFileSync("tar", ["-x", "-C", destination], { input: archive });
}
// Prospective M2 propagation: replace only ownership in a disposable archive.
writeFileSync(
  join(root, "m2/src/modules/learner/local-ownership.ts"),
  readFileSync(join(repo, "src/modules/learner/local-ownership.ts")),
);
for (const name of ["old", "m1", "m2", "fallback", "current"]) {
  const source = name === "current" ? repo : join(root, name);
  const selected = Object.fromEntries(
    Object.entries(modules).filter(
      ([alias]) => name !== "old" || alias !== "metadata",
    ),
  );
  const entry =
    Object.entries(selected)
      .map(
        ([alias, path]) =>
          `import * as ${alias} from ${JSON.stringify(join(source, "src/modules", `${path}.ts`))};`,
      )
      .join("\n") +
    `\nglobalThis.harness={${Object.keys(selected).join(",")}};`;
  const input = join(root, `${name}.ts`);
  writeFileSync(input, entry);
  await build({
    input,
    platform: "browser",
    output: { file: join(root, `${name}.js`), format: "iife" },
  });
}
const results = [];
function pass(name, details = {}) {
  results.push({ name, ...details });
  console.log("PASS", name, JSON.stringify(details));
}
const owner = {
  learnerId: "00000000-0000-4000-8000-000000000171",
  generation: "0",
};
let browser;
const server = createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  const name = url.pathname.slice(1, -3);
  if (
    url.pathname.endsWith(".js") &&
    ["old", "m1", "m2", "fallback", "current"].includes(name)
  ) {
    res.setHeader("Content-Type", "application/javascript");
    res.end(readFileSync(join(root, `${name}.js`)));
    return;
  }
  res.setHeader("Content-Type", "text/html");
  res.end(
    "<!doctype html><html lang=en><title>Disposable ownership rehearsal</title><body>Local synthetic state only</body></html>",
  );
});
try {
  await new Promise((done) => server.listen(0, "127.0.0.1", done));
  const origin = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({
    executablePath: process.env.CHROME_EXECUTABLE,
    headless: true,
  });
  pass("environment", {
    chrome: browser.version(),
    revisions,
    current: "working tree",
    m2: "archive plus current ownership only",
    callbacks: "simulated",
  });
  async function page(context, revision) {
    const p = await context.newPage();
    await p.goto(origin);
    await p.addScriptTag({ url: `${origin}/${revision}.js` });
    await p.evaluate((o) => {
      window.owner = o;
    }, owner);
    return p;
  }
  async function bind(p) {
    return p.evaluate(() =>
      harness.ownership.reconcileAuthenticatedLocalOwner(owner, true),
    );
  }
  async function snapshot(p) {
    return p.evaluate(() => Object.fromEntries(Object.entries(localStorage)));
  }
  async function start(p, pack) {
    return p.evaluate(async (id) => {
      const session = id
        ? harness.session.startPackPracticeSession(id)
        : harness.session.startPracticeSession();
      const base = harness.answer.createShortNumericAnswerState();
      const answer = harness.metadata?.browserProblemMetadata[
        session.problemIds?.[0]
      ]?.optionIds
        ? { selectedOptionIds: [], status: "typing", practice: base.practice }
        : base;
      window.session = session;
      window.answer = answer;
      return harness.storage.createPracticeSessionSnapshot(session, answer);
    }, pack);
  }
  // Each case has an isolated browser context, sharing origin only among its tabs.
  for (const revision of ["old", "m1"]) {
    const ctx = await browser.newContext();
    const stale = await page(ctx, revision);
    await bind(stale);
    await stale.evaluate(() => {
      window.lease = harness.ownership.captureLearnerStorage();
    });
    const fresh = await page(ctx, "current");
    await bind(fresh);
    for (const empty of [false, true]) {
      await fresh.evaluate((empty) => {
        const s = harness.ownership.captureLearnerStorage();
        harness.ownership.LEARNER_LOCAL_KEYS.forEach((key, i) =>
          empty ? s.removeItem(key) : s.setItem(key, `  synthetic ${i}\n`),
        );
      }, empty);
      const before = await snapshot(fresh);
      assert.equal(
        await stale.evaluate(() => {
          let denied = 0;
          for (const key of harness.ownership.LEARNER_LOCAL_KEYS)
            for (const fn of [
              () => lease.getItem(key),
              () => lease.setItem(key, "old"),
              () => lease.removeItem(key),
            ]) {
              try {
                fn();
              } catch {
                denied++;
              }
            }
          return denied;
        }),
        18,
      );
      assert.equal(await start(stale), false);
      assert.equal(
        await stale.evaluate(() =>
          harness.storage.clearPracticeSessionSnapshot(),
        ),
        false,
      );
      assert.deepEqual(await snapshot(fresh), before);
    }
    const reloaded = await page(ctx, revision);
    await assert.rejects(() => bind(reloaded));
    pass(
      `${revision}: six slots, old leases, null slots, fresh starts, clear, reload`,
    );
    await ctx.close();
  }
  {
    const ctx = await browser.newContext();
    const p = await page(ctx, "current");
    await bind(p);
    const packs = await p.evaluate(() =>
      harness.packs.PRACTICE_PACKS.map((p) => p.id),
    );
    for (const pack of packs) {
      await p.evaluate(() =>
        harness.ownership
          .captureLearnerStorage()
          .removeItem(harness.storage.PRACTICE_SESSION_STORAGE_KEY),
      );
      assert.equal(await start(p, pack), true);
      const q = await page(ctx, "current");
      await bind(q);
      assert.equal(
        await q.evaluate(
          async () =>
            (await harness.storage.readPracticeSessionSnapshot()).mode,
        ),
        "pack",
      );
      await q.close();
    }
    pass("registered Packs create and refreshed read", { packs: packs.length });
    await p.evaluate(() =>
      harness.ownership
        .captureLearnerStorage()
        .removeItem(harness.storage.PRACTICE_SESSION_STORAGE_KEY),
    );
    const q = await page(ctx, "current");
    await bind(q);
    const attempts = await Promise.all([start(p), start(q)]);
    assert.equal(attempts.filter(Boolean).length, 1);
    pass("native concurrent new-session attempts", { attempts });
    await ctx.close();
  }
  {
    const ctx = await browser.newContext();
    const stale = await page(ctx, "old");
    await bind(stale);
    const fresh = await page(ctx, "current");
    // Hold real locks in an already-open tab; do not mock navigator.locks.
    for (const lock of ["IDENTITY_LOCK", "PRACTICE_LOCK", "SIMULATION_LOCK"]) {
      await stale.evaluate(async (name) => {
        let acquired;
        const ready = new Promise((resolve) => {
          acquired = resolve;
        });
        window.held = navigator.locks.request(
          harness.ownership[name],
          async () => {
            acquired();
            await new Promise((resolve) => {
              window.release = resolve;
            });
          },
        );
        await ready;
      }, lock);
      const before = await snapshot(fresh);
      await assert.rejects(() => bind(fresh));
      assert.deepEqual(await snapshot(fresh), before);
      await stale.evaluate(async () => {
        release();
        await held;
      });
    }
    await bind(fresh);
    pass(
      "native identity/Practice/Simulation locks block promotion without writes",
    );
    await ctx.close();
  }
  {
    const ctx = await browser.newContext();
    const stale = await page(ctx, "old");
    await bind(stale);
    const m2 = await page(ctx, "m2");
    await bind(m2);
    assert.equal(await start(m2, "pack-s"), true);
    const before = await snapshot(m2);
    await stale.evaluate(() => harness.storage.readPracticeSessionSnapshot());
    assert.deepEqual(await snapshot(m2), before);
    const fallback = await page(ctx, "fallback");
    await bind(fallback);
    await assert.rejects(() =>
      fallback.evaluate(() => harness.storage.readPracticeSessionSnapshot()),
    );
    assert.deepEqual(await snapshot(m2), before);
    const returned = await page(ctx, "m2");
    await bind(returned);
    assert.equal(
      await returned.evaluate(async () =>
        harness.packs.packIdFromProblemIds(
          (await harness.storage.readPracticeSessionSnapshot()).problemIds,
        ),
      ),
      "pack-s",
    );
    pass(
      "Pack S snapshot: stale main → A–R fallback → compatible M2 preserves bytes",
    );
    await m2.evaluate(async () => {
      const result = {
        problemId: session.problemIds[0],
        problemTitle: harness.storage.getStoredProblemTitle(
          await harness.storage.readPracticeSessionSnapshot(),
        ),
        summary: harness.practice.getPracticeSummary(
          harness.practice.finishPractice(answer.practice),
        ),
      };
      window.results = [result];
      await harness.storage.completeServerBackedPracticeSession(
        session,
        answer,
        results,
        undefined,
        async () => {
          throw Error("lost acknowledgement");
        },
      );
    });
    const pending = await snapshot(m2);
    assert.notDeepEqual(pending, before);
    await stale.evaluate(() => harness.storage.readPracticeSessionSnapshot());
    assert.deepEqual(await snapshot(m2), pending);
    await assert.rejects(() =>
      fallback.evaluate(() => harness.storage.readPracticeSessionSnapshot()),
    );
    assert.deepEqual(await snapshot(m2), pending);
    const outcome = await m2.evaluate(async () => {
      const store = harness.ownership.captureLearnerStorage();
      const expected = JSON.parse(
        store.getItem("olympiad-trainer:practice-server-finish-request"),
      );
      let exact = false;
      const outcome = await harness.storage.completeServerBackedPracticeSession(
        session,
        answer,
        results,
        undefined,
        async (request) => {
          exact = [
            "sessionId",
            "version",
            "contributions",
            "episodeMode",
            "episodeFacts",
          ].every(
            (key) =>
              JSON.stringify(request[key]) === JSON.stringify(expected[key]),
          );
          return { status: "persisted" };
        },
      );
      return {
        outcome,
        exact,
        request: store.getItem(
          "olympiad-trainer:practice-server-finish-request",
        ),
      };
    });
    assert.equal(outcome.outcome, "completed");
    assert.equal(outcome.exact, true);
    assert.equal(outcome.request, null);
    const summary = await snapshot(m2);
    assert.equal(await start(stale), false);
    assert.deepEqual(await snapshot(m2), summary);
    pass(
      "future pending Finish retry exact; Summary and empty slots remain fenced",
      outcome,
    );
    await ctx.close();
  }
  {
    const ctx = await browser.newContext();
    const stale = await page(ctx, "old");
    await bind(stale);
    await start(stale);
    await stale.evaluate(async () => {
      const snap = await harness.storage.readPracticeSessionSnapshot();
      window.results = [
        {
          problemId: snap.problemIds[0],
          problemTitle: harness.storage.getStoredProblemTitle(snap),
          summary: harness.practice.getPracticeSummary(
            harness.practice.finishPractice(answer.practice),
          ),
        },
      ];
      let entered;
      const ready = new Promise((resolve) => {
        entered = resolve;
      });
      window.finishing = harness.storage.completeServerBackedPracticeSession(
        session,
        answer,
        results,
        undefined,
        async () => {
          entered();
          await new Promise((resolve) => {
            window.releaseFinish = resolve;
          });
          throw Error("lost response");
        },
      );
      await ready;
    });
    const fresh = await page(ctx, "current");
    const before = await snapshot(fresh);
    await assert.rejects(() => bind(fresh));
    assert.deepEqual(await snapshot(fresh), before);
    await stale.evaluate(async () => {
      releaseFinish();
      await finishing;
    });
    const requestKey = await stale.evaluate(() =>
      harness.ownership.ownerStorageKey(
        owner,
        "olympiad-trainer:practice-server-finish-request",
      ),
    );
    const pending = JSON.parse((await snapshot(stale))[requestKey]).payload;
    assert(pending);
    await bind(fresh);
    assert.equal(
      JSON.parse((await snapshot(fresh))[requestKey]).payload,
      pending,
    );
    const fixture = await stale.evaluate(() => ({ session, answer, results }));
    const outcome = await fresh.evaluate(
      async ({ session, answer, results }) => {
        let calls = 0;
        const first = await harness.storage.completeServerBackedPracticeSession(
          session,
          answer,
          results,
          undefined,
          async () => {
            calls++;
          },
        );
        const second =
          await harness.storage.completeServerBackedPracticeSession(
            session,
            answer,
            results,
            undefined,
            async () => {
              calls++;
            },
          );
        return { first, second, calls };
      },
      fixture,
    );
    assert.equal(outcome.first, "completed");
    assert.equal(outcome.calls, 1);
    pass(
      "native in-flight old Finish prevents promotion; lost ack retained; retry acknowledges once",
      outcome,
    );
    await ctx.close();
  }
  for (let stop = 0; stop < 6; stop++) {
    const ctx = await browser.newContext();
    const stale = await page(ctx, "m1");
    await bind(stale);
    await stale.evaluate(() => {
      const s = harness.ownership.captureLearnerStorage();
      harness.ownership.LEARNER_LOCAL_KEYS.forEach((k, i) =>
        s.setItem(k, `payload ${i}`),
      );
    });
    const fresh = await page(ctx, "current");
    await fresh.evaluate(async (stop) => {
      const o = harness.ownership,
        raw = localStorage;
      const failing = {
        get length() {
          return raw.length;
        },
        key: (i) => raw.key(i),
        getItem: (k) => raw.getItem(k),
        removeItem: (k) => raw.removeItem(k),
        clear: () => {
          throw Error("forbidden");
        },
        setItem: (k, v) => {
          if (k === o.ownerStorageKey(owner, o.LEARNER_LOCAL_KEYS[stop]))
            throw Error("write failure");
          raw.setItem(k, v);
        },
      };
      let blocked = false;
      try {
        await o.reconcileAuthenticatedLocalOwner(owner, true, failing);
      } catch {
        blocked = true;
      }
      if (!blocked) throw Error("failure ignored");
      try {
        o.captureLearnerStorage();
        throw Error("activated early");
      } catch (e) {
        if (e.message === "activated early") throw e;
      }
    }, stop);
    await bind(fresh);
    assert.deepEqual(
      await fresh.evaluate(() =>
        harness.ownership.LEARNER_LOCAL_KEYS.map((k) =>
          harness.ownership.captureLearnerStorage().getItem(k),
        ),
      ),
      Array.from({ length: 6 }, (_, i) => `payload ${i}`),
    );
    await ctx.close();
  }
  pass("native storage: all six interrupted promotion positions resume");
  {
    const ctx = await browser.newContext();
    const stale = await page(ctx, "old");
    await bind(stale);
    const fresh = await page(ctx, "current");
    await bind(fresh);
    await assert.rejects(() =>
      stale.evaluate(() =>
        harness.ownership.transitionLocalIdentity(
          { ...owner, generation: "1" },
          async () => ({ ...owner, generation: "1" }),
        ),
      ),
    );
    await fresh.evaluate(() =>
      harness.ownership.reconcileAuthenticatedLocalOwner(
        { ...owner, generation: "1" },
        true,
      ),
    );
    assert.equal(
      await fresh.evaluate(() =>
        localStorage.getItem(harness.ownership.IDENTITY_SWITCH_KEY),
      ),
      null,
    );
    const before = await snapshot(fresh);
    await stale.evaluate(() =>
      harness.ownership.startFreshLocalIdentity(async () => ({
        learnerId: "00000000-0000-4000-8000-000000000172",
        generation: "0",
      })),
    );
    const after = await snapshot(fresh);
    for (const [key, value] of Object.entries(before))
      if (key.includes(":learner:")) assert.equal(after[key], value);
    await fresh.evaluate(() => {
      harness.ownership.suspendLocalLearner();
      return harness.ownership.transitionRecoveredLocalIdentity(
        { ...owner, generation: "1" },
        async () => ({ ...owner, generation: "1" }),
      );
    });
    pass(
      "old interrupted generation recovery; Start Fresh isolation; authenticated return",
    );
    await ctx.close();
  }
  pass("verdict", {
    notTested: [
      "real Next mixed-deployment assets/server-action transport",
      "real database receipts in this browser harness",
      "physical device/accessibility smoke",
      "Production bindings or recovery",
    ],
  });
} finally {
  writeFileSync(join(root, "results.json"), JSON.stringify(results, null, 2));
  console.log("Evidence:", join(root, "results.json"));
  if (browser) await browser.close();
  await new Promise((done) => server.close(done));
}
