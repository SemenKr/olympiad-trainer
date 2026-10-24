import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root =
  process.env.CONTENT_AUTHORING_ROOT ||
  resolve(dirname(fileURLToPath(import.meta.url)), "..");
const id = process.argv[2];
if (!id || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
  console.error("Usage: pnpm content:new <lowercase-kebab-case-id>");
  process.exit(1);
}

const approved = JSON.parse(
  readFileSync(
    resolve(root, "src/modules/practice/server/content-identities.json"),
    "utf8",
  ),
);
const generated = readFileSync(
  resolve(
    root,
    "src/modules/practice/ui/browser-problem-metadata.generated.ts",
  ),
  "utf8",
);
if (
  approved.problems.some((problem) => problem.id === id) ||
  generated.includes(`"${id}": {`)
) {
  console.error(`Problem ID already exists: ${id}`);
  process.exit(1);
}

const file = resolve(root, "src/modules/practice/server/problems", `${id}.ts`);
if (
  existsSync(file) ||
  existsSync(
    resolve(root, "src/modules/practice/server/problems/drafts", `${id}.ts`),
  )
) {
  console.error(`Draft already exists: ${id}`);
  process.exit(1);
}
mkdirSync(dirname(file), { recursive: true });
writeFileSync(
  file,
  `// Draft only. This incomplete object cannot be registered as a ProblemDefinition.\n// Complete and review the content before explicitly registering it.\nexport const draft = {\n  id: ${JSON.stringify(id)},\n  grade: 5,\n  subject: "mathematics",\n  title: "",\n  statement: "",\n} as const;\n`,
  { flag: "wx" },
);
console.log(file);
