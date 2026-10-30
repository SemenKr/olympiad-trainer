// Disposable source fixtures only; never registers synthetic content in this tree.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  cpSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
const source = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const root = mkdtempSync(join(tmpdir(), "ot-content-scale-"));
let baselineDefinitionSha256;
const counts = (process.env.SCALE_COUNTS ?? "63,66,100,500,1000")
  .split(",")
  .map(Number);
const read = (path) => readFileSync(join(source, path), "utf8");
const guardPath = "src/modules/practice/server/content-identities.json";
const original = read(guardPath),
  baseline = JSON.parse(original);
assert.equal(baseline.problems.length, 63);
assert.equal(baseline.packs.length, 19);
const fingerprint = createHash("sha256").update(original).digest("hex");
console.log(
  JSON.stringify({
    root,
    node: process.version,
    baselineSha256: fingerprint,
    counts,
  }),
);
for (const count of counts) {
  assert(Number.isInteger(count) && count >= 63);
  const fixture = join(root, String(count));
  mkdirSync(fixture);
  for (const name of [
    "src",
    "db",
    "public",
    "docs",
    "scripts",
    "package.json",
    "tsconfig.json",
    "next.config.ts",
    "eslint.config.mjs",
  ])
    cpSync(join(source, name), join(fixture, name), { recursive: true });
  symlinkSync(join(source, "node_modules"), join(fixture, "node_modules"));
  const definitions = [],
    identities = [],
    packs = [];
  for (let index = 0; index < count - 63; index++) {
    const id = `scale-task-${index + 1}`,
      hintIds = ["focus", "strategy", "next-step"].map(
        (level) => `${id}-${level}`,
      ),
      solutionId = `${id}-solution`;
    const choice = index % 2 === 1;
    definitions.push({
      id,
      grade: 5,
      subject: "mathematics",
      title: `Synthetic arithmetic ${index + 1}`,
      statement: `What is ${index + 1} plus 1?`,
      provenance: {
        kind: "original",
        grade: 5,
        subject: "mathematics",
        authorship: "Disposable synthetic acceptance fixture",
        rightsNote:
          "Test only. No publication or release authorization. PRIVATE_PROVENANCE_SENTINEL",
        dossierPath: "docs/02-research/synthetic-acceptance.md",
      },
      assessment: choice
        ? {
            kind: "multiple-choice-set",
            options: [
              { id: "one", label: String(index + 2) },
              { id: "two", label: String(index + 3) },
            ],
            expectedOptionIds: ["one"],
          }
        : { kind: "nonnegative-integer", expectedAnswer: String(index + 2) },
      hints: hintIds.map((hintId, i) => ({
        id: hintId,
        level: ["focus", "strategy", "next-step"][i],
        text: "PRIVATE_HINT_SENTINEL Count one step forward.",
      })),
      solution: {
        id: solutionId,
        kind: "original-explanation",
        text: "PRIVATE_SOLUTION_SENTINEL Adding one gives the next integer.",
      },
    });
    // Independent append-only author guard: IDs authored here, never contentIdentities().
    identities.push({
      id,
      responseKind: choice ? "multiple-choice-set" : "nonnegative-integer",
      optionIds: choice ? ["one", "two"] : [],
      hintIds,
      solutionId,
      checkpointId: null,
      checkpointOptionIds: [],
    });
    if (index % 3 === 2)
      packs.push({
        id: index === 2 ? "pack-t" : `pack-scale-${Math.floor(index / 3) + 1}`,
        name: `Synthetic Pack ${Math.floor(index / 3) + 1}`,
        problemIds: [`scale-task-${index - 1}`, `scale-task-${index}`, id],
      });
  }
  writeFileSync(
    join(fixture, "docs/02-research/synthetic-acceptance.md"),
    "Disposable original arithmetic fixture; not learner release content.\n",
  );
  if (count === 66)
    execFileSync(
      process.execPath,
      [join(source, "scripts/content-new.mjs"), "scale-task-1"],
      {
        cwd: fixture,
        env: { ...process.env, CONTENT_AUTHORING_ROOT: fixture },
        stdio: "pipe",
      },
    );
  definitions.forEach((definition, index) =>
    writeFileSync(
      join(
        fixture,
        `src/modules/practice/server/problems/scale-task-${index + 1}.ts`,
      ),
      `import type { ProblemDefinition } from '../problem-catalog';\nexport const definition = ${JSON.stringify(definition)} as const satisfies ProblemDefinition;\n`,
    ),
  );
  const modulePath = join(
    fixture,
    "src/modules/practice/server/new-problem-modules.ts",
  );
  writeFileSync(
    modulePath,
    definitions
      .map(
        (_, i) =>
          `import { definition as scale${i} } from './problems/scale-task-${i + 1}';`,
      )
      .join("\n") +
      "\n" +
      read("src/modules/practice/server/new-problem-modules.ts").replace(
        "  originalTwoFramesProblem,",
        definitions.map((_, i) => `  scale${i},`).join("\n") +
          "\n  originalTwoFramesProblem,",
      ),
  );
  const packPath =
    "src/modules/practice/application/completed-practice-episode.ts";
  writeFileSync(
    join(fixture, packPath),
    read(packPath).replace(
      "] as const satisfies readonly Readonly<{",
      packs.map((p) => JSON.stringify(p) + ",").join("\n") +
        "\n] as const satisfies readonly Readonly<{",
    ),
  );
  writeFileSync(
    join(fixture, guardPath),
    JSON.stringify(
      {
        problems: [...baseline.problems, ...identities],
        packs: [
          ...baseline.packs,
          ...packs.map(({ id, problemIds }) => ({ id, problemIds })),
        ],
      },
      null,
      2,
    ),
  );
  const test = `import { expect,it,vi } from 'vitest';
vi.mock('server-only',()=>({}));
import { writeFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { createHash } from 'node:crypto';
import { PRACTICE_PROBLEM_DEFINITIONS as problems,getProblemDefinition,getLearnerSafePackProblems } from './problem-catalog';
import { PRACTICE_PACKS as packs,packById,packIdFromCompletedProblemIds } from '../application/completed-practice-episode';
import guard from './content-identities.json';
import { validatePracticeContent } from './content-validation';
import {browserProblemMetadata,renderBrowserProblemMetadata} from './browser-problem-metadata';
it('measures actual registered fixture and independent append-only guard',()=>{
const baseline=${original};
expect(problems).toHaveLength(${count}); expect(packs).toHaveLength(${19 + packs.length});
expect(guard.problems.slice(0,63)).toEqual(baseline.problems);expect(guard.packs.slice(0,19)).toEqual(baseline.packs);
expect(validatePracticeContent(problems,packs,guard)).toEqual([]);
const metadata=renderBrowserProblemMetadata(problems);expect(Object.keys(browserProblemMetadata(problems))).toHaveLength(${count});
for(const sentinel of ['PRIVATE_PROVENANCE_SENTINEL','PRIVATE_HINT_SENTINEL','PRIVATE_SOLUTION_SENTINEL','expectedAnswer','correctOptionId'])expect(metadata).not.toContain(sentinel);
expect(validatePracticeContent([...problems,problems[0]],packs,guard)).toContain('content IDs must be stable and globally unique');
expect(validatePracticeContent(problems,[...packs,{id:'pack-missing',name:'Missing',problemIds:['missing','also-missing','third-missing']}],guard).length).toBeGreaterThan(0);
expect(validatePracticeContent(problems,packs.map((p,i)=>i===0?{...p,problemIds:[...p.problemIds].reverse()}:p),guard).length).toBeGreaterThan(0);
const measurements: Record<string, unknown>={};
function measure(name: string,run: () => unknown){for(let i=0;i<5;i++)run();const heap=process.memoryUsage().heapUsed,values=[];for(let i=0;i<30;i++){const start=performance.now();run();values.push(performance.now()-start)}values.sort((a,b)=>a-b);measurements[name]={medianMs:values[14],p95Ms:values[28],maxMs:values[29],heapDeltaBytes:process.memoryUsage().heapUsed-heap};}
measure('validationOriginalGuard',()=>validatePracticeContent(problems,packs,baseline));measure('validationAppendedGuard',()=>validatePracticeContent(problems,packs,guard));measure('metadata',()=>renderBrowserProblemMetadata(problems));measure('safeAllPackProjection',()=>getLearnerSafePackProblems());measure('lastProblemLookup1000',()=>{for(let i=0;i<1000;i++)getProblemDefinition(problems.at(-1)!.id)});measure('lastPackPrefix1000',()=>{for(let i=0;i<1000;i++)packIdFromCompletedProblemIds([packs.at(-1)!.problemIds[0]])});measure('lastPackLookup1000',()=>{for(let i=0;i<1000;i++)packById(packs.at(-1)!.id)});
const safe=JSON.stringify(getLearnerSafePackProblems());
writeFileSync('scale-result.json',JSON.stringify({count:problems.length,packs:packs.length,baselineDefinitionSha256:createHash('sha256').update(JSON.stringify(problems.filter(p=>baseline.problems.some(b=>b.id===p.id)))).digest('hex'),packIdGuardMismatch:problems.length>63 && validatePracticeContent(problems,packs.map((p,i)=>i===packs.length-1?{...p,id:'other-t'}:p),baseline).length===0,metadataBytes:Buffer.byteLength(metadata),metadataGzipBytes:gzipSync(metadata).length,safeProjectionBytes:Buffer.byteLength(safe),safeProjectionGzipBytes:gzipSync(safe).length,gcAvailable:typeof global.gc==='function',measurements},null,2));
writeFileSync('src/modules/practice/ui/browser-problem-metadata.generated.ts',metadata);
});`;
  writeFileSync(
    join(fixture, "src/modules/practice/server/scale-acceptance.test.ts"),
    test,
  );
  try {
    const out = execFileSync(
      process.execPath,
      [
        join(source, "node_modules/vitest/vitest.mjs"),
        "run",
        "src/modules/practice/server/scale-acceptance.test.ts",
      ],
      { cwd: fixture, encoding: "utf8", maxBuffer: 20 * 1024 * 1024 },
    );
    writeFileSync(join(fixture, "scale-test.log"), out);
    const result = JSON.parse(
      readFileSync(join(fixture, "scale-result.json"), "utf8"),
    );
    baselineDefinitionSha256 ??= result.baselineDefinitionSha256;
    assert.equal(result.baselineDefinitionSha256, baselineDefinitionSha256);
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    writeFileSync(
      join(fixture, "scale-test.log"),
      String(error.stdout) + "\n" + String(error.stderr),
    );
    throw error;
  }
  assert.equal(read(guardPath), original);
}
console.log("FIXTURES", root);
