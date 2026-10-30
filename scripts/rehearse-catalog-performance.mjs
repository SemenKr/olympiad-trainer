// Actual production Next routes, synthetic disposable catalog sources and DB.
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, mkdtempSync, openSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { gzipSync } from "node:zlib";
const require = createRequire(import.meta.url),
  { chromium } = require(process.env.PLAYWRIGHT_MODULE);
assert(
  ["localhost", "127.0.0.1"].includes(
    new URL(process.env.DATABASE_TEST_URL).hostname,
  ),
);
const root = process.env.SCALE_FIXTURE_ROOT;
assert(root);
const evidence = mkdtempSync(join(tmpdir(), "ot-catalog-browser-scale-"));
const browser = await chromium.launch({
  executablePath: process.env.CHROME_EXECUTABLE,
  headless: true,
});
const results = [];
try {
  for (const count of (process.env.SCALE_COUNTS ?? "63,100,500,1000")
    .split(",")
    .map(Number)) {
    const cwd = join(root, String(count)),
      port = 3130 + results.length,
      origin = `http://localhost:${port}`;
    const log = openSync(join(evidence, `next-${count}.log`), "w");
    const server = spawn(
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
        env: {
          ...process.env,
          NODE_ENV: "production",
          DATABASE_URL: process.env.DATABASE_TEST_URL,
        },
        stdio: ["ignore", log, log],
      },
    );
    try {
      for (let i = 0; i < 100; i++) {
        try {
          await fetch(origin);
          break;
        } catch {
          await new Promise((r) => setTimeout(r, 100));
        }
      }
      const guard = JSON.parse(
        readFileSync(
          join(cwd, "src/modules/practice/server/content-identities.json"),
          "utf8",
        ),
      );
      const rows = [];
      for (const pack of [guard.packs[0], guard.packs.at(-1)]) {
        console.log("OPEN", count, pack.id);
        for (let sample = -1; sample < 5; sample++) {
          const context = await browser.newContext({
              viewport: { width: 390, height: 844 },
            }),
            page = await context.newPage(),
            errors = [];
          page.on("pageerror", (error) => errors.push(String(error)));
          await page.goto(origin);
          await page
            .getByRole("button", {
              name: "Другие вкладки закрыты — перенести работу",
            })
            .click();
          await page
            .getByRole("link", { name: "Начать тренировку", exact: true })
            .waitFor();
          // A fixed one-episode learner history satisfies the real first-run gate.
          await page
            .getByRole("link", { name: "Начать тренировку", exact: true })
            .click();
          await page
            .getByRole("button", { name: "Подсказка", exact: true })
            .click();
          await page
            .getByRole("button", { name: "Завершить", exact: true })
            .click();
          await page.waitForURL(/\/practice\/summary\?session=/);
          // Fixed 4x CPU throttling; no network throttling, localhost production server.
          const cdp = await context.newCDPSession(page);
          await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
          await cdp.send("Network.clearBrowserCache");
          await page.addInitScript(() => {
            window.scaleLongTasks = [];
            new PerformanceObserver((list) =>
              window.scaleLongTasks.push(
                ...list.getEntries().map((e) => e.duration),
              ),
            ).observe({ type: "longtask", buffered: true });
          });
          async function navigation(cache) {
            const start = performance.now(),
              response = await page.goto(
                origin + `/practice/pack?pack=${pack.id}`,
              );
            const input = page
              .getByRole("textbox", { name: "Ответ", exact: true })
              .or(page.getByRole("checkbox").first());
            await input.waitFor({ timeout: 20000 }).catch(async (error) => {
              console.log("PAGE", await page.locator("body").innerText());
              throw error;
            });
            const readyMs = performance.now() - start,
              body = await response.body(),
              inputStart = performance.now();
            if (
              await page
                .getByRole("textbox", { name: "Ответ", exact: true })
                .count()
            )
              await input.fill("1");
            else await input.check();
            const inputMs = performance.now() - inputStart;
            const actual = await page.evaluate(
              () =>
                new Promise((resolve) => {
                  const q = indexedDB.open(
                    "olympiad-trainer:learner-canonical-v1",
                    2,
                  );
                  q.onsuccess = () => {
                    const r = q.result
                      .transaction("learner")
                      .objectStore("learner")
                      .get("binding");
                    r.onsuccess = () => {
                      q.result.close();
                      resolve(
                        JSON.parse(
                          r.result.payloads[
                            "olympiad-trainer:practice-session"
                          ],
                        ).problemIds,
                      );
                    };
                  };
                }),
            );
            assert.deepEqual(actual, pack.problemIds);
            assert.deepEqual(errors, []);
            return {
              cache,
              pack: pack.id,
              sample,
              readyMs,
              inputMs,
              responseBytes: body.length,
              responseGzipBytes: gzipSync(body).length,
              ...(await page.evaluate(() => ({
                longTasks: window.scaleLongTasks,
                heapBytes: performance.memory?.usedJSHeapSize,
                jsTransferBytes: performance
                  .getEntriesByType("resource")
                  .filter((e) => e.initiatorType === "script")
                  .reduce((n, e) => n + e.transferSize, 0),
              }))),
            };
          }
          const row = await navigation("cold-browser-cache");
          if (sample >= 0) rows.push(row);
          if (sample === 4)
            for (let warm = 0; warm < 5; warm++)
              rows.push({
                ...(await navigation("warm-browser-cache")),
                sample: warm,
              });
          await context.close();
        }
      }
      results.push({ count, packs: guard.packs.length, rows });
      writeFileSync(
        join(evidence, "results.json"),
        JSON.stringify(
          {
            chrome: browser.version(),
            cpuThrottle: 4,
            networkThrottle: false,
            results,
          },
          null,
          2,
        ),
      );
      console.log(
        "PASS",
        count,
        JSON.stringify(
          rows.map(({ pack, cache, readyMs, responseBytes }) => ({
            pack,
            cache,
            readyMs,
            responseBytes,
          })),
        ),
      );
    } finally {
      if (server.exitCode === null)
        await new Promise((r) => {
          server.once("exit", r);
          server.kill("SIGTERM");
        });
    }
  }
  console.log("Evidence:", evidence);
} finally {
  await browser.close();
}
