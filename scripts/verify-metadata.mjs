import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { readdir } from "node:fs/promises";
import { createServer } from "node:net";
import { createRequire } from "node:module";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout } from "node:timers/promises";
import { JSDOM } from "jsdom";

const repositoryRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const productionOrigin = "https://olympiadtrainer.vercel.app";
const require = createRequire(import.meta.url);

// Discover every current Practice page so new subroutes inherit this contract.
async function practiceRoutes(directory, route = "/practice") {
  const entries = await readdir(directory, { withFileTypes: true });
  const routes = entries.some((entry) => entry.name === "page.tsx")
    ? [route]
    : [];
  for (const entry of entries) {
    if (entry.isDirectory()) {
      routes.push(
        ...(await practiceRoutes(
          resolve(directory, entry.name),
          `${route}/${entry.name}`,
        )),
      );
    }
  }
  return routes;
}

const listener = createServer();
await new Promise((resolveReady) =>
  listener.listen(0, "127.0.0.1", resolveReady),
);
const port = listener.address().port;
await new Promise((resolveClosed) => listener.close(resolveClosed));
const localOrigin = `http://127.0.0.1:${port}`;
const server = spawn(
  process.execPath,
  [
    require.resolve("next/dist/bin/next"),
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    String(port),
  ],
  { cwd: repositoryRoot, windowsHide: true, stdio: ["ignore", "pipe", "pipe"] },
);
let serverOutput = "";
for (const stream of [server.stdout, server.stderr]) {
  stream.on("data", (chunk) => {
    serverOutput = (serverOutput + chunk.toString()).slice(-8000);
  });
}

async function get(path) {
  const response = await fetch(`${localOrigin}${path}`, {
    headers: { "User-Agent": "Googlebot" },
    signal: AbortSignal.timeout(15000),
  });
  assert.equal(response.status, 200, path);
  return response;
}

try {
  let ready = false;
  for (let attempt = 0; attempt < 100; attempt += 1) {
    assert.equal(server.exitCode, null, serverOutput);
    try {
      await get("/robots.txt");
      ready = true;
      break;
    } catch {
      await setTimeout(200);
    }
  }
  assert.ok(ready, `Production server did not start:\n${serverOutput}`);

  const routes = [
    "/",
    ...(await practiceRoutes(resolve(repositoryRoot, "src/app/practice"))),
    "/progress",
    "/restore",
    "/simulation",
  ];
  for (const route of routes) {
    const dom = new JSDOM(await (await get(route)).text());
    const document = dom.window.document;
    const meta = (name) =>
      document.querySelector(`meta[name="${name}"]`)?.content;
    const property = (name) =>
      document.querySelector(`meta[property="${name}"]`)?.content;
    const directives = meta("robots")?.split(/,\s*/).sort();
    assert.deepEqual(
      directives,
      route === "/" ? ["follow", "index"] : ["nofollow", "noindex"],
      `${route}: indexing policy`,
    );
    assert.ok(
      document.title.includes("Олимпиадный тренажёр"),
      `${route}: title`,
    );
    const canonical = document.querySelector('link[rel="canonical"]')?.href;
    if (route === "/") {
      assert.equal(new URL(canonical).href, `${productionOrigin}/`);
      assert.equal(new URL(property("og:url")).href, `${productionOrigin}/`);
      assert.ok(meta("description")?.includes("5 класса"));
      assert.equal(property("og:locale"), "ru_RU");
      assert.equal(meta("application-name"), "Олимпиадный тренажёр");
    } else {
      assert.equal(
        canonical,
        undefined,
        `${route}: must not inherit Home canonical`,
      );
    }
    assert.ok(property("og:title"));
    assert.ok(property("og:description"));
    assert.equal(meta("twitter:card"), "summary_large_image");
    const ogImage = new URL(property("og:image"));
    const twitterImage = new URL(meta("twitter:image"));
    assert.equal(ogImage.origin, productionOrigin);
    assert.equal(ogImage.pathname, "/opengraph-image.png");
    assert.equal(twitterImage.origin, productionOrigin);
    assert.equal(twitterImage.pathname, ogImage.pathname);
    if (route === "/") {
      const imageResponse = await get(ogImage.pathname + ogImage.search);
      assert.equal(imageResponse.headers.get("content-type"), "image/png");
      const png = Buffer.from(await imageResponse.arrayBuffer());
      assert.equal(png.subarray(1, 4).toString(), "PNG");
      assert.equal(png.readUInt32BE(16), 1200);
      assert.equal(png.readUInt32BE(20), 630);
      // Fetch the actual Home rendering assets as a regression check.
      const assets = document.querySelectorAll(
        'script[src], link[rel="stylesheet"][href]',
      );
      assert.ok(assets.length > 0);
      for (const asset of assets) {
        await get(asset.getAttribute("src") ?? asset.getAttribute("href"));
      }
    }
    dom.window.close();
    console.log(`[metadata] PASS ${route}`);
  }

  const robots = await (await get("/robots.txt")).text();
  assert.match(robots, /User-Agent: \*/i);
  assert.match(robots, /^Allow: \/$/m);
  assert.doesNotMatch(robots, /^Disallow:/m);
  assert.match(
    robots,
    /^Sitemap: https:\/\/olympiadtrainer\.vercel\.app\/sitemap\.xml$/m,
  );
  const sitemap = new JSDOM(await (await get("/sitemap.xml")).text(), {
    contentType: "application/xml",
  });
  assert.deepEqual(
    [...sitemap.window.document.querySelectorAll("loc")].map(
      (node) => node.textContent,
    ),
    [`${productionOrigin}/`],
  );
  sitemap.window.close();
  console.log("[metadata] PASS robots, sitemap, social image and Home assets");
} finally {
  server.kill();
  await new Promise((resolveExit) => {
    if (server.exitCode !== null || server.signalCode !== null) resolveExit();
    else server.once("exit", resolveExit);
  });
}
