// Native IDB build compatibility. Verification callbacks are synthetic here;
// live Next/PG transport is separately exercised by the UI rehearsals.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import { createServer } from "node:http";
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";
const require = createRequire(import.meta.url),
  { chromium } = require(process.env.PLAYWRIGHT_MODULE);
const vite = createRequire(require.resolve("vitest/package.json")).resolve(
  "vite",
);
const { build } = await import(
  pathToFileURL(createRequire(vite).resolve("rolldown"))
);
const root = mkdtempSync(join(tmpdir(), "ot-version-matrix-"));
const fallback = join(root, "fallback");
mkdirSync(fallback);
execFileSync("tar", ["-x", "-C", fallback], {
  input: execFileSync(
    "git",
    ["archive", "92552cf0f561e8c86825a0f47fce64b3ebcc0157", "src/modules"],
    { maxBuffer: 30 * 1024 * 1024 },
  ),
});
const paths = {
  control: resolve("."),
  fallback,
  future: process.env.FUTURE_SOURCE_ROOT,
};
assert(
  paths.future,
  "Set FUTURE_SOURCE_ROOT to the disposable 66-problem Pack T fixture",
);
const modules = {
  ownership: "learner/local-ownership",
  canonical: "learner/canonical-local-store",
  storage: "practice/ui/practice-session-storage",
  session: "practice/ui/fixed-practice-session-state",
  answer: "practice/ui/short-numeric-answer-state",
};
for (const [name, path] of Object.entries(paths)) {
  const input = join(root, name + ".ts");
  writeFileSync(
    input,
    Object.entries(modules)
      .map(
        ([key, file]) =>
          `import * as ${key} from ${JSON.stringify(join(path, "src/modules", file + ".ts"))};`,
      )
      .join("\n") + `\nglobalThis.app={${Object.keys(modules).join(",")}};`,
  );
  await build({
    input,
    platform: "browser",
    output: { file: join(root, name + ".js"), format: "iife" },
  });
}
const server = createServer((req, res) => {
  res.setHeader(
    "Content-Type",
    req.url.endsWith(".js")
      ? "application/javascript; charset=utf-8"
      : "text/html; charset=utf-8",
  );
  res.end(
    req.url.endsWith(".js")
      ? readFileSync(join(root, req.url.slice(1)))
      : "<!doctype html><title>Version matrix</title>",
  );
});
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const browser = await chromium.launch({
  executablePath: process.env.CHROME_EXECUTABLE,
  headless: true,
});
const results = [];
try {
  const context = await browser.newContext();
  const page = await context.newPage();
  const origin = `http://127.0.0.1:${server.address().port}`;
  async function load(name) {
    await page.goto(origin);
    await page.addScriptTag({ url: `/${name}.js` });
    await page.evaluate(() => {
      window.owner = {
        learnerId: "00000000-0000-4000-8000-000000000199",
        generation: "0",
      };
    });
  }
  async function prepare() {
    await page.evaluate(async () => {
      await app.ownership.reconcileAuthenticatedLocalOwner(owner, true);
      window.view = app.ownership.captureLearnerStorage();
    });
  }
  async function record() {
    return page.evaluate(
      () =>
        new Promise((resolve, reject) => {
          const q = indexedDB.open(app.canonical.CANONICAL_DB, 2);
          q.onsuccess = () => {
            const t = q.result.transaction("learner"),
              r = t.objectStore("learner").get("binding");
            r.onsuccess = () => {
              q.result.close();
              resolve(JSON.stringify(r.result));
            };
            r.onerror = () => reject(r.error);
          };
          q.onerror = () => reject(q.error);
        }),
    );
  }
  await load("control");
  await page.evaluate(async () => {
    localStorage.setItem(
      app.ownership.LOCAL_OWNER_KEY,
      JSON.stringify({ owner, legacyOwner: owner.learnerId }),
    );
    for (const key of app.canonical.CANONICAL_SLOTS)
      localStorage.setItem(
        app.ownership.ownerStorageKey(owner, key),
        JSON.stringify({ version: 2, owner, payload: null }),
      );
    await app.ownership.reconcileAuthenticatedLocalOwner(owner, true);
    await app.ownership.withIdentityBarrier(() =>
      app.canonical.confirmCanonicalHandoff(owner),
    );
  });
  await prepare();
  for (const [writer, older, pack] of [
    ["control", "fallback", "pack-s"],
    ["future", "control", "pack-t"],
  ]) {
    await load(writer);
    await prepare();
    assert.equal(
      await page.evaluate(
        async (pack) =>
          app.storage.createPracticeSessionSnapshot(
            app.session.startPackPracticeSession(pack),
            app.answer.createShortNumericAnswerState(),
            view,
          ),
        pack,
      ),
      true,
    );
    const before = await record();
    await load(older);
    await prepare();
    const probe = await page.evaluate(async () => {
      let callbacks = 0,
        blocked = false;
      try {
        await app.storage.readVerifiedPracticeSessionSnapshot(async () => {
          callbacks++;
          return { valid: true };
        }, view);
      } catch {
        blocked = true;
      }
      const create = await app.storage.createPracticeSessionSnapshot(
        app.session.startPracticeSession(),
        app.answer.createShortNumericAnswerState(),
        view,
      );
      const clear = await app.storage.clearPracticeSessionSnapshot(view);
      return { blocked, callbacks, create, clear };
    });
    assert.deepEqual(probe, {
      blocked: true,
      callbacks: 0,
      create: false,
      clear: false,
    });
    assert.equal(await record(), before);
    await page.reload();
    await page.addScriptTag({ url: `/${older}.js` });
    await page.evaluate(
      () =>
        (window.owner = {
          learnerId: "00000000-0000-4000-8000-000000000199",
          generation: "0",
        }),
    );
    await prepare();
    assert.equal(await record(), before);
    await load(writer);
    await prepare();
    const resumed = await page.evaluate(async () => {
      const r = await app.storage.readVerifiedPracticeSessionSnapshot(
        async () => ({ valid: true }),
        view,
      );
      return r.value.problemIds;
    });
    assert.equal(resumed.length, 3);
    assert.equal(await record(), before);
    assert.equal(
      await page.evaluate(() => app.storage.clearPracticeSessionSnapshot(view)),
      true,
    );
    results.push({
      writer,
      older,
      pack,
      unknownCallbacks: 0,
      exactCanonicalBytesPreserved: true,
      orderedSlots: resumed,
    });
    console.log("PASS", JSON.stringify(results.at(-1)));
  }
  await context.close();
  writeFileSync(join(root, "results.json"), JSON.stringify(results, null, 2));
  console.log("Evidence:", root);
} finally {
  await browser.close();
  server.close();
}
