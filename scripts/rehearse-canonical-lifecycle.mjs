// Synthetic callbacks with native Chrome IDB/Web Locks. No server/PG claims.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { mkdtempSync, writeFileSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_MODULE);
const vite = createRequire(require.resolve("vitest/package.json")).resolve(
  "vite",
);
const { build } = await import(
  pathToFileURL(createRequire(vite).resolve("rolldown"))
);
const evidence = mkdtempSync(join(tmpdir(), "ot-canonical-lifecycle-"));
const modules = {
  ownership: "learner/local-ownership",
  canonical: "learner/canonical-local-store",
  simulation: "simulation/ui/simulation-storage",
  importer: "practice/ui/server-progress-import",
  storage: "practice/ui/practice-session-storage",
  session: "practice/ui/fixed-practice-session-state",
  answer: "practice/ui/short-numeric-answer-state",
  practice: "practice/application/practice-state",
  metadata: "practice/ui/browser-problem-metadata.generated",
  progress: "practice/application/practice-progress-evidence",
};
const input = join(evidence, "entry.ts"),
  mock = join(evidence, "progress-action.ts");
writeFileSync(
  mock,
  "export const importBrowserProgressEvidence = (...args) => globalThis.importLegacy(...args);\n",
);
writeFileSync(
  input,
  Object.entries(modules)
    .map(
      ([name, file]) =>
        `import * as ${name} from ${JSON.stringify(resolve("src/modules", file + ".ts"))};`,
    )
    .join("\n") + `\nglobalThis.app={${Object.keys(modules).join(",")}};`,
);
await build({
  input,
  platform: "browser",
  plugins: [
    {
      name: "synthetic-authenticated-import",
      resolveId(source) {
        if (source.endsWith("app/progress/actions")) return mock;
      },
    },
  ],
  output: { file: join(evidence, "app.js"), format: "iife" },
});
const server = createServer((req, res) => {
  res.setHeader(
    "Content-Type",
    req.url === "/app.js"
      ? "application/javascript; charset=utf-8"
      : "text/html; charset=utf-8",
  );
  res.end(
    req.url === "/app.js"
      ? readFileSync(join(evidence, "app.js"))
      : "<!doctype html><title>Lifecycle rehearsal</title>",
  );
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const browser = await chromium.launch({
  executablePath: process.env.CHROME_EXECUTABLE,
  headless: true,
});
const results = [];
const pass = (name, details) => {
  results.push({ name, details });
  console.log("PASS", name, JSON.stringify(details ?? {}));
};
async function fixture(payloads = {}) {
  const context = await browser.newContext(),
    page = await context.newPage();
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  await page.addScriptTag({ url: "/app.js" });
  await page.evaluate(async (payloads) => {
    window.owner = {
      learnerId: "00000000-0000-4000-8000-000000000199",
      generation: "0",
    };
    localStorage.setItem(
      app.ownership.LOCAL_OWNER_KEY,
      JSON.stringify({ owner, legacyOwner: owner.learnerId }),
    );
    for (const key of app.canonical.CANONICAL_SLOTS)
      localStorage.setItem(
        app.ownership.ownerStorageKey(owner, key),
        JSON.stringify({ version: 2, owner, payload: payloads[key] ?? null }),
      );
    await app.ownership.reconcileAuthenticatedLocalOwner(owner, true);
    await app.ownership.withIdentityBarrier(() =>
      app.canonical.confirmCanonicalHandoff(owner),
    );
    await app.ownership.reconcileAuthenticatedLocalOwner(owner, true);
    window.view = app.ownership.captureLearnerStorage();
    window.readRaw = () =>
      new Promise((resolve, reject) => {
        const r = indexedDB.open(app.canonical.CANONICAL_DB, 2);
        r.onsuccess = () => {
          const tx = r.result.transaction("learner", "readonly"),
            q = tx.objectStore("learner").get("binding");
          q.onsuccess = () => {
            resolve(q.result);
            r.result.close();
          };
        };
        r.onerror = () => reject(r.error);
      });
    window.importLegacy = async () => {};
  }, payloads);
  return { context, page };
}
try {
  {
    const { context, page } = await fixture();
    const result = await page.evaluate(async () => {
      const initial = await readRaw();
      await app.canonical.mutateCanonicalStorage(view, (draft) => {
        for (const k of app.canonical.CANONICAL_SLOTS)
          draft.setItem(k, ` exact bytes ${k} \n`);
      });
      const payloads = (await readRaw()).payloads;
      let sawIntent = false;
      const generation = { ...owner, generation: "1" };
      await app.ownership.transitionLocalIdentity(generation, async () => {
        const r = await readRaw();
        sawIntent =
          r.pendingTransition.target.generation === "1" &&
          r.pendingTransition.expectedRevision === r.revision;
        return generation;
      });
      const rebound = await readRaw();
      let stale = false;
      try {
        await app.canonical.mutateCanonicalStorage(view, (d) =>
          d.removeItem(app.canonical.CANONICAL_SLOTS[0]),
        );
      } catch {
        stale = true;
      }
      const foreign = {
        learnerId: "00000000-0000-4000-8000-000000000188",
        generation: "0",
      };
      await app.ownership.transitionLocalIdentity(foreign, async () => foreign);
      const empty = await readRaw();
      const targetView = app.ownership.captureLearnerStorage();
      await app.canonical.mutateCanonicalStorage(targetView, (d) =>
        d.setItem(app.simulation.SIMULATION_PENDING_KEY, "target-owned-bytes"),
      );
      await app.ownership.transitionLocalIdentity(
        { ...owner, generation: "2" },
        async () => ({ ...owner, generation: "2" }),
      );
      const restored = await readRaw();
      await app.ownership.transitionLocalIdentity(
        { ...foreign, generation: "1" },
        async () => ({ ...foreign, generation: "1" }),
      );
      const restoredTarget = await readRaw();
      return {
        sawIntent,
        stale,
        sameBytes:
          JSON.stringify(payloads) === JSON.stringify(rebound.payloads),
        originalProvenance:
          JSON.stringify(initial.source) ===
          JSON.stringify(restoredTarget.source),
        empty: Object.values(empty.payloads).every((x) => x === null),
        restored:
          JSON.stringify(payloads) === JSON.stringify(restored.payloads),
        target: restoredTarget.payloads[app.simulation.SIMULATION_PENDING_KEY],
        retainedSource: !!restoredTarget.retained[owner.learnerId],
      };
    });
    assert.deepEqual(result, {
      sawIntent: true,
      stale: true,
      sameBytes: true,
      originalProvenance: true,
      empty: true,
      restored: true,
      target: "target-owned-bytes",
      retainedSource: true,
    });
    pass(
      "generation exact bytes, durable intent, stale lease, cross-owner isolation and retained return",
      result,
    );
    await context.close();
  }
  {
    const { context, page } = await fixture({
      "olympiad-trainer:simulation-pending-v0": "source-bytes",
    });
    const result = await page.evaluate(async () => {
      const target = { ...owner, generation: "1" };
      try {
        await app.ownership.transitionRecoveredLocalIdentity(
          target,
          async () => {
            throw Error("Lost response");
          },
        );
      } catch {}
      const pending = await readRaw();
      const blocked = await new app.canonical.CanonicalLocalStore(
        localStorage,
        indexedDB,
      ).read(owner);
      const fresh = {
        learnerId: "00000000-0000-4000-8000-000000000177",
        generation: "0",
      };
      try {
        await app.ownership.startFreshLocalIdentity(async () => {
          throw Error("Lost response after cookie");
        });
      } catch {}
      const unknown = await readRaw();
      await app.ownership.reconcileAuthenticatedLocalOwner(fresh, true);
      const completed = await readRaw();
      return {
        blocked: blocked.status,
        recoveryPreserved:
          unknown.pendingTransition.previousTransition.operationId ===
          pending.pendingTransition.operationId,
        source:
          completed.retained[owner.learnerId].payloads[
            app.simulation.SIMULATION_PENDING_KEY
          ],
        empty: Object.values(completed.payloads).every((x) => x === null),
        pendingGone: !completed.pendingTransition,
      };
    });
    assert.deepEqual(result, {
      blocked: "conflict",
      recoveryPreserved: true,
      source: "source-bytes",
      empty: true,
      pendingGone: true,
    });
    pass(
      "unknown recovery/fresh outcomes retain intents; authenticated resume isolates new namespace",
      result,
    );
    await context.close();
  }
  {
    const { context, page } = await fixture();
    const result = await page.evaluate(async () => {
      const put = IDBObjectStore.prototype.put;
      let calls = 0;
      IDBObjectStore.prototype.put = function () {
        throw Error("intent abort");
      };
      try {
        await app.ownership.transitionRecoveredLocalIdentity(
          { ...owner, generation: "1" },
          async () => {
            calls++;
            return owner;
          },
        );
      } catch {}
      IDBObjectStore.prototype.put = put;
      const unchanged = await readRaw();
      await app.ownership.reconcileAuthenticatedLocalOwner(owner, true);
      const v = app.ownership.captureLearnerStorage();
      const attempt = {
        sessionId: crypto.randomUUID(),
        revision: 0,
        drafts: ["a", "", "", ""],
        selectedIndex: 0,
      };
      await Promise.all(
        Array.from({ length: 20 }, (_, i) =>
          app.simulation.storeSimulationDraft(
            { ...attempt, drafts: [String(i), "", "", ""] },
            null,
            v,
          ),
        ),
      );
      const final = await readRaw();
      await app.simulation.clearSimulationDraft(v);
      return {
        calls,
        noIntent: !unchanged.pendingTransition,
        final: JSON.parse(final.payloads[app.simulation.SIMULATION_PENDING_KEY])
          .drafts[0],
        cleared:
          (await readRaw()).payloads[app.simulation.SIMULATION_PENDING_KEY] ===
          null,
      };
    });
    assert.deepEqual(result, {
      calls: 0,
      noIntent: true,
      final: "19",
      cleared: true,
    });
    pass(
      "intent abort never invokes authentication; serialized Simulation drafts and clear commit",
      result,
    );
    await context.close();
  }
  {
    const { context, page } = await fixture();
    const fixturePayloads = await page.evaluate(async () => {
      const values = new Map();
      const memory = {
        get length() {
          return values.size;
        },
        key(i) {
          return [...values.keys()][i] ?? null;
        },
        getItem(k) {
          return values.get(k) ?? null;
        },
        setItem(k, v) {
          values.set(k, v);
        },
        removeItem(k) {
          values.delete(k);
        },
        clear() {
          values.clear();
        },
      };
      const first = {
        problemId: "coinciding-seats",
        problemTitle: "Совпадающие места",
        summary: {
          outcome: "eventually-correct",
          validSubmissionCount: 1,
          hintExposures: [],
          solutionExposure: null,
        },
      };
      const observation = {
        checkpointId: "guaranteed-sock-pair-guarantee-argument",
        selectedOptionId: "A",
        outcome: "correct",
        validSubmissionCountAtSubmit: 1,
      };
      const sock = {
        problemId: "guaranteed-sock-pair",
        problemTitle: "Носки в пакете",
        summary: first.summary,
        reasoningCheckpointObservation: observation,
        firstCorrectSubmissionCount: 1,
      };
      const id = crypto.randomUUID(),
        session = {
          sessionId: id,
          activeProblemIndex: 1,
          completedResults: [first],
        };
      const answer = {
        rawAnswer: "7",
        status: "correct",
        practice: app.practice.recordAnswerResult(
          app.practice.startPractice(),
          { status: "correct", normalizedAnswer: "7" },
        ),
      };
      await app.storage.createPracticeSessionSnapshot(
        { sessionId: id, activeProblemIndex: 0, completedResults: [] },
        app.answer.createShortNumericAnswerState(),
        memory,
      );
      await app.storage.savePracticeSessionSnapshot(
        session,
        answer,
        memory,
        observation,
      );
      const progress = app.progress.appendPracticeProgressEvidence(
        app.progress.emptyPracticeProgressEvidence(),
        app.progress.getPracticeProgressContribution(sock),
      );
      const unfinished = memory.getItem(app.canonical.CANONICAL_SLOTS[0]);
      if (!unfinished) throw Error("legacy fixture snapshot failed");

      return {
        id,
        unfinished,
        completed: JSON.stringify([first, sock]),
        progress: JSON.stringify(progress),
      };
    });
    await context.close();
    for (const scenario of [
      "before",
      "partial",
      "after",
      "lost-response",
      "commit-abort",
      "malformed",
    ]) {
      const f = fixturePayloads;
      const marker = JSON.stringify({
        sessionId: f.id,
        unfinishedBefore: f.unfinished,
        completedBefore: null,
        progressBefore: null,
        completedAfter: f.completed,
        progressAfter: f.progress,
      });
      const payloads = {
        "olympiad-trainer:practice-session":
          scenario === "after" ? null : f.unfinished,
        "olympiad-trainer:practice-latest-completed": [
          "partial",
          "after",
        ].includes(scenario)
          ? f.completed
          : null,
        "olympiad-trainer:progress-evidence-v0":
          scenario === "after" ? f.progress : null,
        "olympiad-trainer:practice-progress-finish-pending":
          scenario === "malformed" ? "{malformed" : marker,
      };
      const fixtureState = await fixture(payloads);
      const result = await fixtureState.page.evaluate(
        async ({ scenario, expected }) => {
          const original = await readRaw(),
            put = IDBObjectStore.prototype.put;
          let calls = 0;
          importLegacy = async (raw) => {
            calls++;
            if (raw !== expected) throw Error("wrong legacy baseline");
            if (scenario === "lost-response") throw Error("lost response");
            if (scenario === "commit-abort")
              IDBObjectStore.prototype.put = function () {
                throw Error("abort");
              };
          };
          let failed = false,
            recovered = null,
            errorText = null;
          try {
            recovered = await app.importer.ensureServerProgressImported(view);
          } catch (error) {
            failed = true;
            errorText = error.message;
          } finally {
            IDBObjectStore.prototype.put = put;
          }
          const after = await readRaw();
          return {
            calls,
            failed,
            errorText,
            recovered,
            unchanged:
              JSON.stringify(original.payloads) ===
              JSON.stringify(after.payloads),
            finished:
              after.payloads[app.canonical.CANONICAL_SLOTS[0]] === null &&
              after.payloads[app.canonical.CANONICAL_SLOTS[3]] === null &&
              after.payloads[app.canonical.CANONICAL_SLOTS[2]] === null,
            provenance:
              JSON.stringify(original.source) === JSON.stringify(after.source),
          };
        },
        { scenario, expected: f.progress },
      );
      const failed = ["lost-response", "commit-abort", "malformed"].includes(
        scenario,
      );
      assert.equal(result.failed, failed, JSON.stringify(result));
      assert.equal(result.calls, scenario === "malformed" ? 0 : 1);
      assert.equal(result.unchanged, failed);
      assert.equal(result.provenance, true);
      if (!failed) {
        assert.equal(result.finished, true);
        assert.equal(result.recovered, f.id);
      }
      pass(`legacy multi-key Finish ${scenario}`, result);
      await fixtureState.context.close();
    }
  }
  {
    const { context, page } = await fixture();
    const result = await page.evaluate(async () => {
      const original = await readRaw();
      await new Promise((resolve, reject) => {
        const r = indexedDB.deleteDatabase(app.canonical.CANONICAL_DB);
        r.onsuccess = resolve;
        r.onerror = () => reject(r.error);
      });
      const old = await new Promise((resolve, reject) => {
        const r = indexedDB.open(app.canonical.CANONICAL_DB, 1);
        r.onupgradeneeded = () => r.result.createObjectStore("learner");
        r.onsuccess = () => resolve(r.result);
        r.onerror = () => reject(r.error);
      });
      await new Promise((resolve, reject) => {
        const t = old.transaction("learner", "readwrite");
        t.objectStore("learner").put(original, "binding");
        t.oncomplete = resolve;
        t.onabort = () => reject(t.error);
      });
      old.close();
      const upgraded = await new app.canonical.CanonicalLocalStore(
        localStorage,
        indexedDB,
      ).read(owner);
      const blocked = await new Promise((resolve) => {
        const r = indexedDB.open(app.canonical.CANONICAL_DB, 1);
        r.onerror = () => resolve(r.error.name);
        r.onsuccess = () => {
          r.result.close();
          resolve("unexpected-success");
        };
      });
      return {
        status: upgraded.status,
        exact: JSON.stringify(upgraded.value) === JSON.stringify(original),
        blocked,
      };
    });
    assert.deepEqual(result, {
      status: "ok",
      exact: true,
      blocked: "VersionError",
    });
    pass(
      "v1 singleton upgrades byte-exactly; old schema1 client receives VersionError",
      result,
    );
    await context.close();
  }
  for (const scenario of [
    "ack",
    "lost-response",
    "stale-revision",
    "commit-abort",
  ]) {
    const evidenceRaw =
      '{"version":1,"problemId":"socks-three-colors","slots":{}}';
    const { context, page } = await fixture({
      "olympiad-trainer:progress-evidence-v0": evidenceRaw,
    });
    const result = await page.evaluate(async (scenario) => {
      const original = await readRaw();
      let calls = 0;
      const put = IDBObjectStore.prototype.put;
      importLegacy = async (raw, authenticated) => {
        calls++;
        if (
          raw !== original.payloads[app.canonical.CANONICAL_SLOTS[2]] ||
          authenticated.learnerId !== owner.learnerId
        )
          throw Error("wrong import");
        if (scenario === "lost-response") throw Error("lost response");
        if (scenario === "stale-revision")
          await app.canonical.mutateCanonicalStorage(view, () => {});
        if (scenario === "commit-abort")
          IDBObjectStore.prototype.put = function () {
            throw Error("abort reconciliation");
          };
      };
      let failed = false;
      try {
        await app.importer.ensureServerProgressImported(view);
      } catch {
        failed = true;
      } finally {
        IDBObjectStore.prototype.put = put;
      }
      const after = await readRaw();
      return {
        calls,
        failed,
        preserved:
          after.payloads[app.canonical.CANONICAL_SLOTS[2]] ===
          original.payloads[app.canonical.CANONICAL_SLOTS[2]],
        source:
          JSON.stringify(original.source) === JSON.stringify(after.source),
      };
    }, scenario);
    assert.deepEqual(result, {
      calls: 1,
      failed: scenario !== "ack",
      preserved: scenario !== "ack",
      source: true,
    });
    pass(`legacy authenticated baseline ${scenario}`, result);
    await context.close();
  }
} finally {
  await browser.close();
  await new Promise((r) => server.close(r));
  writeFileSync(
    join(evidence, "results.json"),
    JSON.stringify(results, null, 2),
  );
  console.log("Evidence:", evidence);
}
