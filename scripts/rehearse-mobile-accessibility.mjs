// Bounded Chrome smoke; not WCAG certification or assistive-technology testing.
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve, join } from "node:path";
const require = createRequire(import.meta.url),
  { chromium } = require(process.env.PLAYWRIGHT_MODULE);
const origin = process.env.CANONICAL_TEST_ORIGIN,
  evidence = resolve(process.env.SMOKE_EVIDENCE);
assert(["localhost", "127.0.0.1"].includes(new URL(origin).hostname));
mkdirSync(evidence, { recursive: true });
const browser = await chromium.launch({
    executablePath: process.env.CHROME_EXECUTABLE,
    headless: true,
  }),
  results = [];
try {
  for (const width of [320, 390, 1280]) {
    const c = await browser.newContext({ viewport: { width, height: 844 } }),
      p = await c.newPage(),
      errors = [];
    p.on("pageerror", (e) => errors.push(String(e)));
    await p.goto(origin);
    await p
      .getByRole("button", {
        name: "Другие вкладки закрыты — перенести работу",
      })
      .click();
    await p
      .getByRole("link", { name: "Начать тренировку", exact: true })
      .waitFor();
    for (const route of [
      "/",
      "/practice",
      "/progress",
      "/restore",
      "/simulation",
      "/sources",
    ]) {
      await p.goto(origin + route);
      await p.getByRole("heading", { level: 1 }).waitFor();
      await p.waitForTimeout(150);
      assert.equal(
        await p.evaluate(
          () => document.documentElement.scrollWidth > innerWidth,
        ),
        false,
        `${width} ${route} overflow`,
      );
      const snapshot = await p.accessibility.snapshot();
      assert(snapshot);
      await p.keyboard.press("Tab");
      const focus = await p.evaluate(() => {
        const e = document.activeElement,
          r = e.getBoundingClientRect();
        return {
          tag: e.tagName,
          label:
            e.getAttribute("aria-label") ||
            e.textContent ||
            e.getAttribute("title"),
          width: r.width,
          height: r.height,
        };
      });
      assert(!["BODY", "HTML"].includes(focus.tag));
      assert(focus.label.trim());
      await p.screenshot({
        path: join(
          evidence,
          `${width}-${route.replaceAll("/", "_") || "home"}.png`,
        ),
        fullPage: true,
      });
      results.push({
        width,
        route,
        keyboardFocus: focus,
        overflow: false,
        heading: true,
        accessibilityTree: true,
      });
    }
    assert.deepEqual(errors, []);
    await c.close();
  }
} finally {
  writeFileSync(
    join(evidence, "results.json"),
    JSON.stringify(results, null, 2),
  );
  await browser.close();
}
console.log(
  "PASS",
  results.length,
  "route/viewport accessibility smoke checks",
);
