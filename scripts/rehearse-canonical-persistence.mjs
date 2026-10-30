// Local synthetic rehearsal: native Chrome/IDB/Web Locks, no remote transport.
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
if (!process.env.PLAYWRIGHT_MODULE || !process.env.CHROME_EXECUTABLE)
  throw Error(
    "Set PLAYWRIGHT_MODULE and CHROME_EXECUTABLE; nothing is installed or downloaded.",
  );
const { chromium } = require(process.env.PLAYWRIGHT_MODULE);
const vite = createRequire(require.resolve("vitest/package.json")).resolve(
  "vite",
);
const { build } = await import(
  pathToFileURL(createRequire(vite).resolve("rolldown"))
);
const root = mkdtempSync(join(tmpdir(), "ot-canonical-proof-"));
mkdirSync(join(root, "frozen"));
execFileSync("tar", ["-x", "-C", join(root, "frozen")], {
  input: execFileSync(
    "git",
    ["archive", "6e7376f073ed5bdef3d6879cf167d3ffb1333b47", "src/modules"],
    { cwd: repo, maxBuffer: 30 * 1024 * 1024 },
  ),
});
const modules = {
  ownership: "learner/local-ownership",
  storage: "practice/ui/practice-session-storage",
  session: "practice/ui/fixed-practice-session-state",
  answer: "practice/ui/short-numeric-answer-state",
  practice: "practice/application/practice-state",
  metadata: "practice/ui/browser-problem-metadata.generated",
};
for (const name of ["frozen", "current"]) {
  const selected =
    name === "current"
      ? { ...modules, canonical: "learner/canonical-local-store" }
      : modules;
  const source = name === "current" ? repo : join(root, "frozen");
  const input = join(root, name + ".ts");
  writeFileSync(
    input,
    Object.entries(selected)
      .map(
        ([key, path]) =>
          `import * as ${key} from ${JSON.stringify(join(source, "src/modules", path + ".ts"))};`,
      )
      .join("\n") +
      `\nglobalThis.${name}={${Object.keys(selected).join(",")}};`,
  );
  await build({
    input,
    platform: "browser",
    output: { file: join(root, name + ".js"), format: "iife" },
  });
}
const results = [];
const pass = (name, details = {}) => {
  results.push({ name, ...details });
  console.log("PASS", name, JSON.stringify(details));
};
const owner = {
  learnerId: "00000000-0000-4000-8000-000000000199",
  generation: "0",
};
const server = createServer((req, res) => {
  const name = req.url?.slice(1, -3);
  if (["frozen", "current"].includes(name)) {
    res.setHeader("Content-Type", "application/javascript; charset=utf-8");
    res.end(readFileSync(join(root, name + ".js")));
  } else {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(
      "<!doctype html><title>Canonical local persistence rehearsal</title>",
    );
  }
});
let browser;
try {
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  const url = "http://127.0.0.1:" + server.address().port;
  browser = await chromium.launch({
    executablePath: process.env.CHROME_EXECUTABLE,
    headless: true,
  });
  pass("environment", { chrome: browser.version(), node: process.version });
  async function page(context) {
    const p = await context.newPage();
    await p.goto(url);
    for (const name of ["frozen", "current"])
      await p.addScriptTag({ url: url + "/" + name + ".js" });
    await p.evaluate(async (o) => {
      window.owner = o;
      await frozen.ownership.reconcileAuthenticatedLocalOwner(o, true);
    }, owner);
    return p;
  }
  async function migrate(p) {
    await p.evaluate(async () => {
      await current.ownership.reconcileAuthenticatedLocalOwner(owner, true);
      await current.ownership.withIdentityBarrier(() =>
        current.canonical.confirmCanonicalHandoff(owner),
      );
      await current.ownership.reconcileAuthenticatedLocalOwner(owner, true);
      window.view = current.ownership.captureLearnerStorage();
    });
  }
  async function read(p) {
    return p.evaluate(() =>
      new current.canonical.CanonicalLocalStore(localStorage, indexedDB).read(
        owner,
      ),
    );
  }
  for (const scenario of ["race", "stale-revision", "stale-lease"]) {
    const c = await browser.newContext(),
      p = await page(c);
    await migrate(p);
    const result = await p.evaluate(async (scenario) => {
      const s = current.session.startPackPracticeSession("pack-a");
      const base = current.answer.createShortNumericAnswerState();
      const answer = current.metadata.browserProblemMetadata[s.problemIds[0]]
        .optionIds
        ? { selectedOptionIds: [], status: "typing", practice: base.practice }
        : base;
      if (
        !(await current.storage.createPracticeSessionSnapshot(s, answer, view))
      )
        throw Error("Admission failed");
      const snapshot = await current.storage.readPracticeSessionSnapshot(view);
      const results = [
        {
          problemId: s.problemIds[0],
          problemTitle: current.storage.getStoredProblemTitle(snapshot),
          summary: current.practice.getPracticeSummary(
            current.practice.finishPractice(answer.practice),
          ),
        },
      ];
      const second = current.ownership.captureLearnerStorage();
      const original = IDBObjectStore.prototype.put;
      let calls = 0;
      IDBObjectStore.prototype.put = function () {
        throw Error("Intent abort");
      };
      const aborted = await current.storage.completeServerBackedPracticeSession(
        s,
        answer,
        results,
        view,
        async () => {
          calls++;
        },
      );
      IDBObjectStore.prototype.put = original;
      const absent = view.getItem(
        "olympiad-trainer:practice-server-finish-request",
      );
      if (scenario === "race") {
        const outcomes = await Promise.all(
          [view, second].map((v) =>
            current.storage.completeServerBackedPracticeSession(
              s,
              answer,
              results,
              v,
              async () => {
                calls++;
                await new Promise((r) => setTimeout(r, 30));
              },
            ),
          ),
        );
        return { aborted, absent, outcomes, calls };
      }
      const status = await current.storage.completeServerBackedPracticeSession(
        s,
        answer,
        results,
        view,
        async () => {
          calls++;
          if (scenario === "stale-lease")
            current.canonical.suspendCanonicalOwner();
          else {
            const client = new current.canonical.CanonicalLocalStore(
              localStorage,
              indexedDB,
            );
            const r = await client.read(owner);
            const changed = await client.mutate(
              owner,
              r.value.revision,
              () => {},
            );
            if (changed.status !== "ok")
              throw Error("Revision injection failed");
            // A shared reader must not move the acknowledgement's pinned revision.
            await current.canonical.refreshCanonicalStorage(view);
          }
        },
      );
      await current.canonical.prepareCanonicalOwner(owner);
      window.view = current.ownership.captureLearnerStorage();
      const retained = view.getItem(
        "olympiad-trainer:practice-server-finish-request",
      );
      const unfinished = view.getItem("olympiad-trainer:practice-session");
      const summary = view.getItem(
        "olympiad-trainer:practice-latest-completed",
      );
      const retry = await current.storage.completeServerBackedPracticeSession(
        s,
        answer,
        results,
        view,
        async () => {
          calls++;
        },
      );
      return {
        aborted,
        absent,
        status,
        retained,
        unfinished,
        summary,
        retry,
        calls,
      };
    }, scenario);
    assert.equal(result.aborted, "blocked");
    assert.equal(result.absent, null);
    if (scenario === "race") {
      assert.deepEqual([...result.outcomes].sort(), ["blocked", "completed"]);
      assert.equal(result.calls, 1);
    } else {
      assert.equal(result.status, "reconciliation-pending");
      assert.notEqual(result.retained, null);
      assert.notEqual(result.unfinished, null);
      assert.equal(result.summary, null);
      assert.equal(result.retry, "completed");
      assert.equal(result.calls, 2);
    }
    pass(
      "canonical Finish " +
        scenario +
        " and pre-transport transaction abort (simulated transport)",
    );
    await c.close();
  }
  // Exact six-slot byte preservation, including whitespace and nulls. These are
  // opaque fixture payloads, never submitted or rendered as domain content.
  {
    const c = await browser.newContext(),
      p = await page(c);
    const before = await p.evaluate(() => {
      const s = frozen.ownership.captureLearnerStorage();
      frozen.ownership.LEARNER_LOCAL_KEYS.forEach((k, i) => {
        if (i % 2 === 0) s.setItem(k, `  {"fixture":${i}}\n`);
      });
      return frozen.ownership.LEARNER_LOCAL_KEYS.map((k) =>
        localStorage.getItem(frozen.ownership.ownerStorageKey(owner, k)),
      );
    });
    await migrate(p);
    const r = await read(p);
    assert.equal(r.status, "ok");
    assert.deepEqual(r.value.source.envelopes, before);
    assert.deepEqual(
      Object.values(r.value.payloads),
      before.map((x) => JSON.parse(x).payload),
    );
    assert.deepEqual(
      await p.evaluate(() =>
        frozen.ownership.LEARNER_LOCAL_KEYS.map((k) =>
          localStorage.getItem(frozen.ownership.ownerStorageKey(owner, k)),
        ),
      ),
      before,
    );
    pass("six original envelopes and inner bytes preserved");
    await c.close();
  }
  {
    const c = await browser.newContext(),
      a = await page(c);
    await migrate(a);
    const b = await page(c);
    await b.evaluate(async () => {
      await current.ownership.reconcileAuthenticatedLocalOwner(owner, true);
      window.view = current.ownership.captureLearnerStorage();
    });
    for (let i = 0; i < Number(process.env.CANONICAL_RACE_ROUNDS ?? 150); i++) {
      await a.evaluate(() => current.canonical.refreshCanonicalStorage(view));
      assert.equal(
        await a.evaluate(() =>
          current.storage.clearPracticeSessionSnapshot(view),
        ),
        true,
      );
      for (const p of [a, b])
        await p.evaluate(() => current.canonical.refreshCanonicalStorage(view));
      const attempts = await Promise.all(
        [a, b].map((p) =>
          p.evaluate(async () => {
            window.s = current.session.startPracticeSession();
            window.answer = current.answer.createShortNumericAnswerState();
            return current.storage.createPracticeSessionSnapshot(
              s,
              answer,
              view,
            );
          }),
        ),
      );
      assert.equal(attempts.filter(Boolean).length, 1);
    }
    pass("native concurrent Practice admission", {
      rounds: Number(process.env.CANONICAL_RACE_ROUNDS ?? 150),
      doubleSuccess: 0,
    });
    for (const p of [a, b])
      await p.evaluate(async () => {
        const saved = await current.storage.readVerifiedPracticeSessionSnapshot(
          async () => ({ valid: true }),
          view,
        );
        window.s = {
          sessionId: saved.value.sessionId,
          activeProblemIndex: 0,
          completedResults: [],
        };
        window.answer = current.storage.restoreAnswerState(saved.value);
      });
    assert.equal(
      await a.evaluate(() =>
        current.storage.savePracticeSessionSnapshot(
          s,
          current.answer.editShortNumericAnswer(answer, "123"),
          view,
        ),
      ),
      true,
    );
    assert.equal(
      await b.evaluate(() =>
        current.storage.savePracticeSessionSnapshot(
          s,
          current.answer.editShortNumericAnswer(answer, "456"),
          view,
        ),
      ),
      false,
    );
    assert.equal(
      JSON.parse(
        (await read(a)).value.payloads["olympiad-trainer:practice-session"],
      ).rawAnswer,
      "123",
    );
    pass("same-session stale save rejected");
    const prior = (await read(a)).value;
    assert.equal(
      await a.evaluate(async () => {
        const original = IDBObjectStore.prototype.put;
        IDBObjectStore.prototype.put = function () {
          throw new DOMException("Injected put failure", "AbortError");
        };
        try {
          return await current.storage.savePracticeSessionSnapshot(
            s,
            current.answer.editShortNumericAnswer(answer, "789"),
            view,
          );
        } finally {
          IDBObjectStore.prototype.put = original;
        }
      }),
      false,
    );
    assert.deepEqual((await read(a)).value, prior);
    pass("aborted transaction preserves complete canonical record");
    const transport = await a.evaluate(async () => {
      let calls = 0;
      const results = [
        {
          problemId: "coinciding-seats",
          problemTitle: "Совпадающие места",
          summary: current.practice.getPracticeSummary(
            current.practice.finishPractice(answer.practice),
          ),
        },
      ];
      const status = await current.storage.completeServerBackedPracticeSession(
        s,
        answer,
        results,
        view,
        async () => {
          calls++;
        },
      );
      return { status, calls };
    });
    assert.deepEqual(transport, { status: "blocked", calls: 0 });
    pass("stale Finish fails closed before simulated transport");
    const legacy = await b.evaluate(async () => {
      window.oldSession = frozen.session.startPracticeSession();
      return frozen.storage.createPracticeSessionSnapshot(
        oldSession,
        frozen.answer.createShortNumericAnswerState(),
      );
    });
    assert.equal(legacy, true);
    assert.equal((await read(a)).status, "conflict");
    assert.equal(
      await a.evaluate(() =>
        current.storage.savePracticeSessionSnapshot(s, answer, view),
      ),
      false,
    );
    pass(
      "frozen6e still writes legacy branch; canonical operations fail closed on visible divergence",
    );
    await c.close();
  }
  {
    const c = await browser.newContext(),
      p = await page(c);
    const failed = await p.evaluate(async () => {
      const set = Storage.prototype.setItem;
      Storage.prototype.setItem = function (k, v) {
        if (k === current.canonical.HANDOFF_KEY)
          throw Error("Injected witness write failure");
        return set.call(this, k, v);
      };
      try {
        return await new current.canonical.CanonicalLocalStore(
          localStorage,
          indexedDB,
        ).migrate(owner, true);
      } finally {
        Storage.prototype.setItem = set;
      }
    });
    assert.equal(failed.status, "unavailable");
    await migrate(p);
    assert.equal((await read(p)).status, "ok");
    pass("prepared migration resumes after witness-write failure");
    await p.reload();
    await p.addScriptTag({ url: url + "/current.js" });
    await p.evaluate(async (o) => {
      window.owner = o;
      await current.ownership.reconcileAuthenticatedLocalOwner(o, true);
    }, owner);
    assert.equal((await read(p)).status, "ok");
    pass("committed migration survives refresh without reimport");
    await p.evaluate(
      () =>
        new Promise((resolve, reject) => {
          const r = indexedDB.deleteDatabase(current.canonical.CANONICAL_DB);
          r.onsuccess = resolve;
          r.onerror = () => reject(r.error);
        }),
    );
    assert.equal((await read(p)).status, "unavailable");
    assert.equal(
      (
        await p.evaluate(() =>
          new current.canonical.CanonicalLocalStore(
            localStorage,
            indexedDB,
          ).migrate(owner, true),
        )
      ).status,
      "unavailable",
    );
    pass("evicted IDB with witness never reimports legacy bytes");
    await c.close();
  }
  {
    const c = await browser.newContext(),
      p = await page(c);
    await p.evaluate(async () => {
      window.s = frozen.session.startPackPracticeSession("pack-a");
      const base = frozen.answer.createShortNumericAnswerState();
      window.answer = frozen.metadata.browserProblemMetadata[s.problemIds[0]]
        .optionIds
        ? { selectedOptionIds: [], status: "typing", practice: base.practice }
        : base;
      window.created = await frozen.storage.createPracticeSessionSnapshot(
        s,
        answer,
      );
      const snap = await frozen.storage.readPracticeSessionSnapshot();
      window.results = [
        {
          problemId: snap.problemIds[0],
          problemTitle: frozen.storage.getStoredProblemTitle(snap),
          summary: frozen.practice.getPracticeSummary(
            frozen.practice.finishPractice(answer.practice),
          ),
        },
      ];
      window.oldFinish =
        await frozen.storage.completeServerBackedPracticeSession(
          s,
          answer,
          results,
          undefined,
          async () => {
            throw Error("Simulated lost response");
          },
        );
    });
    assert.deepEqual(await p.evaluate(() => ({ created, oldFinish })), {
      created: true,
      oldFinish: "outcome-unknown",
    });
    const before = await p.evaluate(() =>
      frozen.ownership
        .captureLearnerStorage()
        .getItem("olympiad-trainer:practice-server-finish-request"),
    );
    assert.notEqual(before, null);
    await migrate(p);
    const replay = await p.evaluate(async () => {
      let calls = 0;
      const payloads = [];
      const lost = await current.storage.completeServerBackedPracticeSession(
        s,
        answer,
        results,
        view,
        async (payload) => {
          calls++;
          payloads.push(payload);
          throw Error("Lost response");
        },
      );
      const retained = view.getItem(
        "olympiad-trainer:practice-server-finish-request",
      );
      await current.canonical.prepareCanonicalOwner(owner);
      window.view = current.ownership.captureLearnerStorage();
      const aborted = await current.storage.completeServerBackedPracticeSession(
        s,
        answer,
        results,
        view,
        async (payload) => {
          calls++;
          payloads.push(payload);
          const original = IDBObjectStore.prototype.put;
          IDBObjectStore.prototype.put = function () {
            throw Error("Reconciliation abort");
          };
          setTimeout(() => {
            IDBObjectStore.prototype.put = original;
          }, 100);
        },
      );
      await new Promise((r) => setTimeout(r, 150));
      const afterAbort = view.getItem(
        "olympiad-trainer:practice-server-finish-request",
      );
      const completed =
        await current.storage.completeServerBackedPracticeSession(
          s,
          answer,
          results,
          view,
          async (payload) => {
            calls++;
            payloads.push(payload);
          },
        );
      const repeated =
        await current.storage.completeServerBackedPracticeSession(
          s,
          answer,
          results,
          view,
          async () => {
            calls++;
          },
        );
      return {
        lost,
        retained,
        aborted,
        afterAbort,
        completed,
        repeated,
        calls,
        payloads,
        raw: view.getItem("olympiad-trainer:practice-server-finish-request"),
        snapshot: view.getItem("olympiad-trainer:practice-session"),
        summary: view.getItem("olympiad-trainer:practice-latest-completed"),
      };
    });
    assert.equal(replay.lost, "outcome-unknown");
    assert.equal(replay.retained, before);
    assert.equal(replay.aborted, "reconciliation-pending");
    assert.equal(replay.afterAbort, before);
    assert.equal(replay.completed, "completed");
    assert.equal(replay.repeated, "blocked");
    assert.equal(replay.calls, 3);
    assert.deepEqual(replay.payloads[0], replay.payloads[1]);
    assert.deepEqual(replay.payloads[0], replay.payloads[2]);
    assert.equal(replay.raw, null);
    assert.equal(replay.snapshot, null);
    assert.notEqual(replay.summary, null);
    pass(
      "pending Finish exact retry, refreshed lease, reconciliation abort and atomic Summary (simulated transport)",
    );
    await c.close();
  }
  {
    const c = await browser.newContext(),
      p = await page(c);
    await migrate(p);
    const checks = await p.evaluate(async () => {
      const client = new current.canonical.CanonicalLocalStore(
        localStorage,
        indexedDB,
      );
      const foreign = await client.read({
        ...owner,
        learnerId: "00000000-0000-4000-8000-000000000188",
      });
      const generation = await client.read({ ...owner, generation: "1" });
      const unavailable = await new current.canonical.CanonicalLocalStore(
        localStorage,
        {
          open() {
            throw Error("IDB unavailable");
          },
        },
      ).read(owner);
      let writes = false;
      try {
        view.setItem("olympiad-trainer:simulation-pending-v0", "replacement");
        writes = true;
      } catch {}
      let fresh = 0,
        recovery = 0;
      try {
        await current.ownership.startFreshLocalIdentity(async () => {
          fresh++;
          return owner;
        });
      } catch {}
      try {
        await current.ownership.transitionRecoveredLocalIdentity(
          { ...owner, generation: "1" },
          async () => {
            recovery++;
            return owner;
          },
        );
      } catch {}
      return {
        foreign: foreign.status,
        generation: generation.status,
        unavailable: unavailable.status,
        writes,
        fresh,
        recovery,
      };
    });
    assert.deepEqual(checks, {
      foreign: "conflict",
      generation: "conflict",
      unavailable: "unavailable",
      writes: false,
      fresh: 1,
      recovery: 1,
    });
    pass(
      "foreign owner/generation and direct writes fail closed; authenticated transition callbacks run",
    );
    assert.equal(
      await p.evaluate(async () => {
        const raw = localStorage.getItem(current.canonical.HANDOFF_KEY);
        localStorage.removeItem(current.canonical.HANDOFF_KEY);
        let calls = 0;
        try {
          await current.ownership.transitionRecoveredLocalIdentity(
            { ...owner, generation: "1" },
            async () => {
              calls++;
              return owner;
            },
          );
        } catch {}
        localStorage.setItem(current.canonical.HANDOFF_KEY, raw);
        return calls;
      }),
      0,
    );
    pass(
      "identity acknowledgement consults IDB even without a visible witness",
    );
    const blocked = await p.evaluate(async () => {
      const held = await new Promise((resolve) => {
        const r = indexedDB.open(current.canonical.CANONICAL_DB, 2);
        r.onsuccess = () => resolve(r.result);
      });
      const deletion = indexedDB.deleteDatabase(current.canonical.CANONICAL_DB);
      const waiting = new Promise((resolve) => (deletion.onblocked = resolve));
      await waiting;
      const result = await new current.canonical.CanonicalLocalStore(
        localStorage,
        indexedDB,
      ).read(owner);
      held.close();
      return result.status;
    });
    assert.equal(blocked, "unavailable");
    pass("blocked database request returns unavailable without admission");
    await c.close();
  }
  // M1: a transition request is paused before acquiring the identity barrier.
  // Migration wins that barrier. Hide the LS witness from the paused client to
  // prove the in-barrier IDB query, rather than an eventually visible marker.
  {
    const c = await browser.newContext(),
      a = await page(c),
      b = await page(c);
    await a.evaluate(async () => {
      await current.ownership.reconcileAuthenticatedLocalOwner(owner, true);
      const request = navigator.locks.request.bind(navigator.locks);
      let first = true;
      navigator.locks.request = function (name, options, callback) {
        if (
          first &&
          name === current.ownership.IDENTITY_LOCK &&
          options.ifAvailable
        ) {
          first = false;
          window.paused = true;
          return new Promise(
            (resolve) => (window.releaseTransition = resolve),
          ).then(() => request(name, options, callback));
        }
        return request(name, options, callback);
      };
      window.acknowledgements = 0;
      window.switching = current.ownership
        .transitionLocalIdentity({ ...owner, generation: "1" }, async () => {
          acknowledgements++;
          return { ...owner, generation: "1" };
        })
        .then(
          () => "unexpected-success",
          () => "blocked",
        );
    });
    await a.waitForFunction(() => window.paused === true);
    await migrate(b);
    const original = (await read(b)).value.source;
    const outcome = await a.evaluate(async () => {
      const get = Storage.prototype.getItem;
      Storage.prototype.getItem = function (key) {
        return key === current.canonical.HANDOFF_KEY
          ? null
          : get.call(this, key);
      };
      try {
        releaseTransition();
        return { outcome: await switching, acknowledgements };
      } finally {
        Storage.prototype.getItem = get;
      }
    });
    assert.deepEqual(outcome, { outcome: "blocked", acknowledgements: 0 });
    assert.deepEqual((await read(b)).value.source, original);
    pass(
      "M1 migration wins before transition barrier: no stale absence acknowledgement",
    );
    await c.close();
  }
  // M2: both prepared and active records fence legacy generation rewriting,
  // even when no witness is visible. Preserve binding and all six envelopes.
  for (const phase of ["prepared", "active"]) {
    const c = await browser.newContext(),
      p = await page(c);
    if (phase === "active") await migrate(p);
    else
      await p.evaluate(async () => {
        const set = Storage.prototype.setItem;
        Storage.prototype.setItem = function (key, value) {
          if (key === current.canonical.HANDOFF_KEY)
            throw Error("witness failure");
          return set.call(this, key, value);
        };
        try {
          await new current.canonical.CanonicalLocalStore(
            localStorage,
            indexedDB,
          ).migrate(owner, true);
        } finally {
          Storage.prototype.setItem = set;
        }
      });
    const result = await p.evaluate(async () => {
      localStorage.removeItem(current.canonical.HANDOFF_KEY);
      const before = JSON.stringify(
        Object.fromEntries(Object.entries(localStorage)),
      );
      let blocked = false;
      try {
        await current.ownership.reconcileAuthenticatedLocalOwner(
          { ...owner, generation: "1" },
          true,
        );
      } catch {
        blocked = true;
      }
      return {
        blocked,
        unchanged:
          before ===
          JSON.stringify(Object.fromEntries(Object.entries(localStorage))),
      };
    });
    assert.deepEqual(result, { blocked: true, unchanged: true });
    pass(
      "M2 missing witness preserves legacy source during generation reconcile",
      { phase },
    );
    await c.close();
  }
  {
    const c = await browser.newContext(),
      p = await page(c);
    await migrate(p);
    const original = (await read(p)).value;
    const asyncMutation = await p.evaluate(async () =>
      new current.canonical.CanonicalLocalStore(localStorage, indexedDB).mutate(
        owner,
        0,
        async (record) => {
          record.revision = 42;
          await Promise.resolve();
        },
      ),
    );
    assert.equal(asyncMutation.status, "unavailable");
    assert.deepEqual((await read(p)).value, original);
    pass("async low-level callback aborts its synchronous prefix");
    for (const variant of ["unknown-version", "contradictory-session"]) {
      await p.evaluate(
        async ({ original, variant }) => {
          const db = await new Promise((resolve) => {
            const r = indexedDB.open(current.canonical.CANONICAL_DB, 2);
            r.onsuccess = () => resolve(r.result);
          });
          const bad = structuredClone(original);
          if (variant === "unknown-version") bad.version = 99;
          else bad.sessionId = crypto.randomUUID();
          await new Promise((resolve, reject) => {
            const tx = db.transaction("learner", "readwrite");
            tx.objectStore("learner").put(bad, "binding");
            tx.oncomplete = resolve;
            tx.onabort = () => reject(tx.error);
          });
          db.close();
        },
        { original, variant },
      );
      assert.equal((await read(p)).status, "unavailable");
      assert.equal(
        (
          await p.evaluate(() =>
            new current.canonical.CanonicalLocalStore(
              localStorage,
              indexedDB,
            ).migrate(owner, true),
          )
        ).status,
        "unavailable",
      );
      pass("malformed canonical record preserved without reimport", {
        variant,
      });
    }
    await c.close();
  }
} finally {
  writeFileSync(join(root, "results.json"), JSON.stringify(results, null, 2));
  console.log("Evidence:", root);
  if (browser) await browser.close();
  await new Promise((r) => server.close(r));
}
