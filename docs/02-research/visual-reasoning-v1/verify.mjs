// Read-only research verification: node docs/02-research/visual-reasoning-v1/verify.mjs
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { JSDOM } from "jsdom";

const load = (name) => {
  const text = readFileSync(new URL(name, import.meta.url), "utf8");
  assert(!/<(?:script|foreignObject|image|animate|set)\b|\bon\w+\s*=|https?:\/\/(?!www\.w3\.org\/2000\/svg)/i.test(text));
  const doc = new JSDOM(text, { contentType: "image/svg+xml" }).window.document;
  assert(!doc.querySelector("parsererror"));
  assert(doc.querySelector("title")?.textContent.trim());
  assert(doc.querySelector("desc")?.textContent.trim());
  const height = name === "two-frames.svg" ? 420 : 440;
  assert.equal(doc.documentElement.getAttribute("width"), "560");
  assert.equal(doc.documentElement.getAttribute("height"), String(height));
  assert.equal(doc.documentElement.getAttribute("viewBox"), `0 0 560 ${height}`);
  return doc;
};
const frames = load("two-frames.svg");
const rect = (id) => {
  const r = frames.getElementById(id);
  return ["x", "y", "width", "height"].map((key) => Number(r.getAttribute(key)));
};
const contains = ([x, y, w, h], cx, cy) => cx > x && cx < x + w && cy > y && cy < y + h;
const a = rect("frame-a"), b = rect("frame-b");
assert.deepEqual(a, [100, 80, 240, 160]);
assert.deepEqual(b, [180, 160, 240, 160]);
let exclusive = 0, both = 0, neither = 0;
for (let row = 0; row < 3; row++) for (let col = 0; col < 4; col++) {
  const ca = contains(a, 140 + 80 * col, 120 + 80 * row);
  const cb = contains(b, 140 + 80 * col, 120 + 80 * row);
  if (ca !== cb) exclusive++;
  else if (ca) both++;
  else neither++;
}
assert.deepEqual([exclusive, both, neither], [8, 2, 2]);

// Parse actual M/H/V/Z geometry, rather than a second hand-entered polygon/graph.
function segments(d) {
  const tokens = d.match(/[MHVZ]|-?\d+(?:\.\d+)?/g);
  let x = 0, y = 0, sx = 0, sy = 0;
  const result = [];
  for (let i = 0; i < tokens.length;) {
    const cmd = tokens[i++];
    const ox = x, oy = y;
    if (cmd === "M") { x = Number(tokens[i++]); y = Number(tokens[i++]); sx = x; sy = y; continue; }
    if (cmd === "H") x = Number(tokens[i++]);
    else if (cmd === "V") y = Number(tokens[i++]);
    else if (cmd === "Z") { x = sx; y = sy; }
    else throw new Error(`Unsupported research path command ${cmd}`);
    result.push([[ox, oy], [x, y]]);
  }
  return result;
}
const sheet = load("notched-sheet.svg");
const outline = segments(sheet.getElementById("sheet").getAttribute("d"));
const twiceArea = Math.abs(outline.reduce((sum, [[x1,y1],[x2,y2]]) => sum + x1*y2 - x2*y1, 0));
assert.equal(twiceArea / 2, 67500);
assert.equal(twiceArea / 2 / 50 ** 2, 27);
// Independent unit-cell membership of the whole rectangle minus the two cutouts.
let cells = 0;
for (let y = 0; y < 5; y++) for (let x = 0; x < 7; x++) {
  if (!(x >= 2 && x < 5 && y < 2) && !(x >= 1 && x < 3 && y >= 4)) cells++;
}
assert.equal(cells, 27);

const grid = load("path-via-k.svg");
const edges = new Set();
for (const path of grid.querySelectorAll('g[stroke="#596273"] path')) {
  for (const [[sx,sy],[ex,ey]] of segments(path.getAttribute("d"))) {
    assert(sx === ex || sy === ey);
    let x = (sx - 100) / 80, y = (320 - sy) / 80;
    const endX = (ex - 100) / 80, endY = (320 - ey) / 80;
    const dx = Math.sign(endX - x), dy = Math.sign(endY - y);
    while (x !== endX || y !== endY) {
      const nx = x + dx, ny = y + dy;
      const points = [[x,y],[nx,ny]].sort((p,q) => p[0]-q[0] || p[1]-q[1]);
      edges.add(points.map((p) => p.join(",")).join("|"));
      x = nx; y = ny;
    }
  }
}
assert.equal(grid.querySelectorAll("circle").length, 20);
assert.equal(edges.size, 30);
assert(!edges.has("2,1|3,1"));
for (let x = 0; x <= 4; x++) for (let y = 0; y <= 3; y++) {
  if (x < 4) assert.equal(edges.has(`${x},${y}|${x+1},${y}`), !(x === 2 && y === 1));
  if (y < 3) assert(edges.has(`${x},${y}|${x},${y+1}`));
}
let all = 0, via = 0, valid = 0;
for (let mask = 0; mask < 128; mask++) {
  if (mask.toString(2).replaceAll("0", "").length !== 3) continue;
  all++;
  let x = 0, y = 0, visited = false, open = true;
  for (let i = 0; i < 7; i++) {
    const nx = x + ((mask >> i & 1) ? 0 : 1), ny = y + ((mask >> i & 1) ? 1 : 0);
    if (!edges.has(`${x},${y}|${nx},${ny}`)) open = false;
    x = nx; y = ny;
    if (x === 2 && y === 1) visited = true;
  }
  if (visited) via++;
  if (visited && open) valid++;
}
assert.deepEqual([all, via, valid], [35, 18, 9]);

// Local links in the two design documents; fragment names are inspected editorially.
for (const path of ["../visual-reasoning-v1.md", "../../04-architecture/original-content-visual-slice-v1.md"]) {
  const url = new URL(path, import.meta.url);
  const md = readFileSync(url, "utf8");
  for (const match of md.matchAll(/\]\(([^)]+)\)/g)) {
    const target = match[1].split("#")[0];
    if (target && !/^[a-z]+:/i.test(target)) assert(existsSync(fileURLToPath(new URL(target, url))), target);
  }
}
console.log("PASS: three SVG XML/static-content checks; actual frame membership 8/2/2; polygon 27 cm² and cell audit; actual grid 20 vertices/30 edges; exhaustive 35 routes → 18 via К → 9 valid; local design links resolve.");
