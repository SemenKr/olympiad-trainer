// Integrated React/browser regression with real chooser markup and compiled app CSS.
// Reads are deferred at the client boundaries; no database or server actions run.
// Use installed tools, or set ESBUILD_MODULE / PLAYWRIGHT_MODULE to their package paths.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdtemp, readFile, writeFile, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve, basename } from "node:path";
import { createServer } from "node:http";
const require = createRequire(import.meta.url);
const { build } = require(process.env.ESBUILD_MODULE || "esbuild");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
const sass = require("sass");
const root = process.cwd();
const temp = await mkdtemp(resolve(tmpdir(), "chooser-layout-"));
// Reuse next/font output from a local Next build; never substitute browser fonts.
const fontBuild = resolve(
  root,
  process.env.APP_FONT_BUILD_DIR || ".next/static",
);
let fontRules;
let fontClass;
for (const file of await readdir(resolve(fontBuild, "chunks"))) {
  if (!file.endsWith(".css")) continue;
  const source = await readFile(resolve(fontBuild, "chunks", file), "utf8");
  const variable = source.match(/\.([\w-]+)\{--font-onest:[^}]+\}/);
  if (!variable) continue;
  fontClass = variable[1];
  fontRules =
    [...source.matchAll(/@font-face\{[^}]*Onest[^}]*\}/g)]
      .map((m) => m[0])
      .join("\n") + variable[0];
  break;
}
assert.ok(
  fontRules && fontClass,
  "Build the app first: Onest next/font CSS is required (APP_FONT_BUILD_DIR may override .next/static).",
);
const css = [fontRules, sass.compile("src/app/globals.scss").css];
const mocks = {
  "next/link": `export default function Link({children, ...props}) { return <a {...props}>{children}</a> }`,
  "progress-client": `export const readServerLearningPath = () => window.readFixture('path');`,
  "server-progress-import": `export const ensureServerProgressImported = async () => {};`,
  "practice-session-storage": `export { getStoredProblemTitle } from ${JSON.stringify(resolve(root, "src/modules/practice/ui/practice-session-storage.ts"))}; export const readVerifiedPracticeSessionSnapshot = () => window.readFixture('session');`,
  actions: `export const verifyPersistedReasoningCheckpointObservation = async () => {};`,
};
let browser;
let server;
try {
  await build({
    stdin: {
      contents: `import React from 'react'; import {createRoot} from 'react-dom/client';
        import Page from './src/app/practice/choose/page';
        import {PRACTICE_PACKS} from './src/modules/practice/application/completed-practice-episode';
        import {LOCAL_IDENTITY_EVENT} from './src/modules/learner/local-ownership';
        if (location.search) PRACTICE_PACKS[0].name = 'Разные способы рассуждать, сравнивать условия и объяснять выбранные решения';
        window.packs = PRACTICE_PACKS; window.identityEvent = LOCAL_IDENTITY_EVENT;
        window.reads = {session:[],path:[]};
        window.readFixture = kind => new Promise((resolve,reject)=>window.reads[kind].push({resolve,reject}));
        createRoot(document.getElementById('root')).render(<Page/>);`,
      resolveDir: root,
      loader: "tsx",
    },
    bundle: true,
    outfile: resolve(temp, "app.js"),
    jsx: "automatic",
    define: { "process.env.NODE_ENV": '"production"' },
    plugins: [
      {
        name: "chooser-fixture",
        setup(b) {
          b.onResolve(
            {
              filter:
                /^(next\/link)$|\/(progress-client|server-progress-import|practice-session-storage|actions)$/,
            },
            (args) => {
              const name =
                args.path === "next/link" ? args.path : basename(args.path);
              return { path: name, namespace: "fixture" };
            },
          );
          b.onLoad({ filter: /.*/, namespace: "fixture" }, (args) => ({
            contents: mocks[args.path],
            loader: "tsx",
            resolveDir: root,
          }));
          b.onLoad({ filter: /\.module\.scss$/ }, async (args) => {
            const source = sass.compile(args.path).css;
            const names = [...source.matchAll(/\.([a-z][\w-]*)/gi)].map(
              (m) => m[1],
            );
            const map = Object.fromEntries(
              names.map((n) => [
                n,
                `${basename(args.path).replaceAll(".", "-")}-${n}`,
              ]),
            );
            css.push(
              source.replace(
                /\.([a-z][\w-]*)/gi,
                (all, name) => `.${map[name]}`,
              ),
            );
            return {
              contents: `export default ${JSON.stringify(map)}`,
              loader: "js",
            };
          });
        },
      },
    ],
  });
  await writeFile(resolve(temp, "app.css"), css.join("\n"));
  server = createServer(async (req, res) => {
    if (req.url.startsWith("/media/")) {
      res.setHeader("Content-Type", "font/woff2");
      res.end(await readFile(resolve(fontBuild, "media", basename(req.url))));
    } else if (req.url === "/app.js" || req.url === "/app.css") {
      res.setHeader(
        "Content-Type",
        req.url.endsWith(".js") ? "text/javascript" : "text/css",
      );
      res.end(await readFile(resolve(temp, req.url.slice(1))));
    } else
      res.end(
        `<!doctype html><html class="${fontClass}" lang="ru"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="/app.css"><div id="root"></div><script src="/app.js"></script></html>`,
      );
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  browser = await chromium.launch({ channel: "chrome", headless: true });
  for (const width of [320, 768, 1440]) {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const summary = page.locator('[aria-labelledby="learning-path-title"]');
    async function start(longLabels = false) {
      await page.goto(
        `http://127.0.0.1:${server.address().port}/practice/choose${longLabels ? "?long=1" : ""}`,
      );
      await page.waitForFunction(
        () => window.reads.session.length && window.reads.path.length,
      );
      const fonts = await page.evaluate(async () => {
        await Promise.all(
          [400, 600, 700].map((weight) =>
            document.fonts.load(`${weight} 16px Onest`, "Тренировка Resume"),
          ),
        );
        await document.fonts.ready;
        return {
          family: getComputedStyle(document.body).fontFamily,
          loaded: [...document.fonts].filter(
            (face) => face.family === "Onest" && face.status === "loaded",
          ).length,
        };
      });
      assert.match(fonts.family, /^Onest,/);
      assert.ok(
        fonts.loaded >= 3,
        `Onest weights must load: ${JSON.stringify(fonts)}`,
      );
      await page.evaluate(() => {
        window.cards = [
          ...document.querySelectorAll(
            'ol[aria-label="Все наборы задач"] > li',
          ),
        ];
        window.catalogTop =
          document.querySelector("ol").getBoundingClientRect().top + scrollY;
      });
      await stable("loading");
    }
    async function settle(kind, value, reject = false, index = 0) {
      await page.evaluate(
        ({ kind, value, reject, index }) => {
          const read = window.reads[kind][index];
          if (reject) read.reject(Error("offline"));
          else
            read.resolve(
              kind === "session" ? { value, interpretation: null } : value,
            );
        },
        { kind, value, reject, index },
      );
      await page.evaluate(
        () =>
          new Promise((r) =>
            requestAnimationFrame(() => requestAnimationFrame(r)),
          ),
      );
    }
    async function stable(label) {
      const metrics = await page.evaluate(() => {
        const list = document.querySelector("ol");
        const section = document.querySelector(
          '[aria-labelledby="learning-path-title"]',
        );
        return {
          shift: Math.abs(
            list.getBoundingClientRect().top + scrollY - window.catalogTop,
          ),
          same: window.cards.every((card, i) => list.children[i] === card),
          count: list.children.length,
          overflow: document.documentElement.scrollWidth > innerWidth,
          clipped: [...section.querySelectorAll("p,a,button")].some(
            (el) => el.scrollHeight > el.clientHeight + 1,
          ),
          controls: [...section.querySelectorAll("a,button")].every(
            (el) => el.getBoundingClientRect().height >= 44,
          ),
        };
      });
      assert.ok(
        metrics.shift <= 1,
        `${width}px ${label}: catalog moved ${metrics.shift}px`,
      );
      assert.deepEqual(
        { ...metrics, shift: 0 },
        {
          shift: 0,
          same: true,
          count: 12,
          overflow: false,
          clipped: false,
          controls: true,
        },
      );
      console.log(`PASS ${width}px ${label}: displacement ${metrics.shift}px`);
    }
    const pack = await (async () => {
      await start();
      return page.evaluate(() => window.packs[0]);
    })();
    const unfinished = {
      mode: "pack",
      problemIds: pack.problemIds,
      activeProblemIndex: 0,
    };
    const long = {
      mode: "review",
      problemIds: ["pages-without-digit-one"],
      activeProblemIndex: 0,
    };
    for (const [label, snapshot] of [
      ["no session", null],
      ["unfinished Pack", unfinished],
      ["Review", long],
      ["adaptive", { ...long, mode: "adaptive" }],
      [
        "no-next",
        { status: "no-next", mode: "adaptive", completedResults: [] },
      ],
    ]) {
      for (const order of [
        ["path", "session"],
        ["session", "path"],
      ]) {
        await start();
        for (const kind of order) {
          await settle(kind, kind === "path" ? ["pack-a"] : snapshot);
          await stable(
            `${label}: ${kind} resolved (${order.join(" first, then ")})`,
          );
          if (kind === "path" && order[0] === "path")
            assert.equal(await summary.locator("a").count(), 0);
        }
        const href = await summary.locator("a").getAttribute("href");
        assert.equal(
          href,
          snapshot ? "/practice" : "/practice/pack?pack=pack-j",
        );
        assert.match(
          await summary.innerText(),
          /Сохранённые завершения: 1 из 12/,
        );
      }
    }
    await start();
    await settle(
      "path",
      await page.evaluate(() => window.packs.map((p) => p.id)),
    );
    await settle("session", null);
    await stable("all recorded");
    assert.equal(await summary.locator("a").count(), 0);
    for (const failure of ["session", "path", "both"]) {
      await start();
      await settle("path", [], failure !== "session");
      await settle("session", null, failure !== "path");
      await stable(`${failure} error`);
      assert.equal(await summary.locator("a").count(), 0);
      assert.equal(await summary.locator("button").count(), 1);
      if (failure !== "session")
        assert.doesNotMatch(await summary.innerText(), /0 из 12/);
      await summary.locator("button").focus();
      await summary.locator("button").click();
      await page.waitForFunction(
        () =>
          window.reads.session.length === 2 && window.reads.path.length === 2,
      );
      await stable(`${failure} Retry loading`);
      assert.equal(
        await summary
          .locator("button")
          .evaluate((el) => document.activeElement === el),
        true,
      );
      await settle("session", unfinished, false, 1);
      await stable(`${failure} Retry session first`);
      await settle("path", ["pack-a"], false, 1);
      await stable(`${failure} Retry recovered`);
      assert.equal(
        await summary
          .locator("h2")
          .evaluate((el) => document.activeElement === el),
        true,
      );
      assert.equal(
        await summary.locator("a").getAttribute("href"),
        "/practice",
      );
    }
    await start(true);
    await settle("path", []);
    await settle("session", null);
    await stable("long Russian Path label");
    await start(true);
    await settle("path", []);
    await settle("session", unfinished);
    await stable("long Russian unfinished Pack label");
    await start();
    await settle("session", unfinished);
    await settle("path", null, true);
    await stable("Path error preserves Resume and Retry");
    assert.equal(await summary.locator("a").getAttribute("href"), "/practice");
    assert.equal(await summary.locator("button").count(), 1);
    for (const event of [
      "storage",
      "focus",
      await page.evaluate(() => window.identityEvent),
    ]) {
      await start();
      await settle("session", unfinished);
      await settle("path", ["pack-a"]);
      await page.evaluate(
        (event) => window.dispatchEvent(new Event(event)),
        event,
      );
      await page.waitForFunction(
        () =>
          window.reads.session.length === 2 && window.reads.path.length === 2,
      );
      await stable(`${event} refresh loading`);
      assert.equal(await summary.locator("a").count(), 0);
      await settle("session", null, false, 1);
      await settle("path", [], false, 1);
      await stable(`${event} refreshed`);
      assert.match(await summary.innerText(), /0 из 12/);
    }
    await start();
    await page.evaluate(() =>
      window.dispatchEvent(new Event(window.identityEvent)),
    );
    await page.waitForFunction(
      () => window.reads.session.length === 2 && window.reads.path.length === 2,
    );
    await settle("session", unfinished, false, 1);
    await settle("path", ["pack-a"], false, 1);
    await settle("session", null);
    await settle("path", []);
    await stable("stale pre-ownership responses ignored");
    assert.equal(await summary.locator("a").getAttribute("href"), "/practice");
    assert.match(await summary.innerText(), /Сохранённые завершения: 1 из 12/);
    assert.deepEqual(errors, []);
    await page.close();
  }
} finally {
  await browser?.close();
  if (server) await new Promise((r) => server.close(r));
  await rm(temp, { recursive: true, force: true });
}
