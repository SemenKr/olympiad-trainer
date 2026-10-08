import { randomUUID } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import pg from "pg";
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  vi,
} from "vitest";

vi.mock("server-only", () => ({}));
const cookie = vi.hoisted(() => ({ value: undefined as string | undefined }));
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: () =>
      cookie.value === undefined ? undefined : { value: cookie.value },
    set: (_name: string, value: string) => {
      cookie.value = value;
    },
  }),
}));
import {
  initializeAnonymousLearner,
  resolveLearnerFromCookie,
} from "../../practice/server/learner-identity";
import {
  importLegacyProgress,
  persistFinishContributions,
  readLearnerProgress,
  readRecentPracticeEpisodes,
  readPracticeJourneyTotal,
  readReviewAvailability,
  readNextUsefulProblem,
} from "../../practice/server/learner-progress-persistence";
import { transactSimulation } from "../../simulation/server/persistence";
import { POST } from "../../../app/api/identity/credentials/route";
import { GET as cleanupRequest } from "../../../app/api/internal/recovery-cleanup/route";

const testUrl = process.env.DATABASE_TEST_URL;
const schema = `recovery_rollout_${randomUUID().replaceAll("-", "")}`;
beforeAll(async () => {
  if (!testUrl) return;
  const client = new pg.Client({ connectionString: testUrl });
  await client.connect();
  try {
    await client.query(`CREATE SCHEMA "${schema}"`);
    await client.query(`SET search_path TO "${schema}"`);
    for (const name of (await readdir("db/migrations"))
      .filter((name) => name.endsWith(".sql") && name < "0013")
      .sort())
      await client.query(await readFile(`db/migrations/${name}`, "utf8"));
    const url = new URL(testUrl);
    url.searchParams.set("options", `-c search_path=${schema}`);
    process.env.DATABASE_URL = url.toString();
  } finally {
    await client.end();
  }
});
afterAll(async () => {
  if (!testUrl) return;
  const client = new pg.Client({ connectionString: testUrl });
  await client.connect();
  try {
    await client.query(`DROP SCHEMA "${schema}" CASCADE`);
  } finally {
    await client.end();
  }
});

afterEach(() => vi.unstubAllEnvs());

describe.skipIf(!testUrl)(
  "disabled recovery deployment on unmigrated 0012",
  () => {
    it("ordinary anonymous initialization, identity, Practice, Progress, Journey, Review and Simulation use no recovery columns", async () => {
      vi.stubEnv("RECOVERY_ENABLED", undefined);
      vi.stubEnv("CRON_SECRET", undefined);
      expect(
        (
          await POST(
            new Request("http://localhost:3000/api/identity/credentials", {
              method: "POST",
            }),
          )
        ).status,
      ).toBe(503);
      expect(
        (
          await cleanupRequest(
            new Request("http://localhost:3000/api/internal/recovery-cleanup"),
          )
        ).status,
      ).toBe(401);
      await initializeAnonymousLearner();
      const context = await resolveLearnerFromCookie();
      const browserToken = cookie.value;
      await importLegacyProgress(context, null);
      await persistFinishContributions(context, randomUUID(), []);
      await expect(readLearnerProgress(context)).resolves.toBeDefined();
      await expect(readRecentPracticeEpisodes(context)).resolves.toEqual([]);
      await expect(readPracticeJourneyTotal(context)).resolves.toBe(0);
      await expect(readReviewAvailability(context)).resolves.toBeDefined();
      await expect(readNextUsefulProblem(context)).resolves.toBeDefined();
      const started = (await transactSimulation(context, { kind: "start" }))
        .attempt!;
      const saved = await transactSimulation(context, {
        kind: "save",
        sessionId: started.sessionId,
        revision: 0,
        work: {
          drafts: ["unchanged learner work", "", "", ""],
          selectedIndex: 0,
        },
      });
      expect(saved.attempt?.drafts[0]).toBe("unchanged learner work");
      expect(
        (await transactSimulation(context, { kind: "read" })).attempt,
      ).toEqual(saved.attempt);
      await initializeAnonymousLearner();
      expect(cookie.value).toBe(browserToken);
      expect(await resolveLearnerFromCookie()).toEqual(context);
    });
  },
);
