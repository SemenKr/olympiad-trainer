import { createHash, randomBytes, randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { and, eq } from "drizzle-orm";

vi.mock("server-only", () => ({}));
// This legacy Storage/real-DB fixture isolates the canonical existence check.
// Native Chrome rehearsals exercise the real IDB lifecycle separately.
vi.mock("../../learner/canonical-local-store", async (original) => ({
  ...(await original<typeof import("../../learner/canonical-local-store")>()),
  assertLegacyIdentityTransition: vi.fn(async () => {}),
}));

import {
  createTestLearner,
  learnerContext,
} from "../../../test/learner-fixture";
import {
  captureLearnerStorage,
  reconcileAuthenticatedLocalOwner,
} from "../../learner/local-ownership";
import {
  completeServerBackedPracticeSession,
  createPracticeSessionSnapshot,
  readVerifiedPracticeSessionSnapshot,
  type ServerPracticeFinishPayload,
} from "../ui/practice-session-storage";
import { createShortNumericAnswerState } from "../ui/short-numeric-answer-state";
import {
  finishPractice,
  getPracticeSummary,
} from "../application/practice-state";
import {
  importLegacyProgress,
  persistFinishContributions,
} from "./learner-progress-persistence";
import { CORE_PLAN_V1_PROBLEM_IDS } from "../application/completed-practice-episode";
import {
  readRecentPracticeEpisodes,
  readReviewAvailability,
  startReview,
} from "./learner-progress-persistence";
import { getProgressDb } from "./progress-db";
import {
  practiceCompletedEpisodes,
  practiceFinishReceipts,
  practiceJourneyAwards,
} from "./progress-schema";

const testUrl = process.env.DATABASE_TEST_URL;
beforeAll(() => {
  if (testUrl) process.env.DATABASE_URL = testUrl;
});

describe.skipIf(!testUrl)(
  "PostgreSQL Finish acknowledgement and browser reconciliation",
  () => {
    it.each([3, 5, 10])(
      "retains the %i-task plan through a lost response and Review selection",
      async (length) => {
        const context = learnerContext(
          await createTestLearner(
            createHash("sha256").update(randomBytes(32)).digest("hex"),
          ),
        );
        await importLegacyProgress(context, null);
        const plan = {
          version: 1,
          problemIds: CORE_PLAN_V1_PROBLEM_IDS.slice(0, length),
        };
        const problems = plan.problemIds.map((problemId) => ({
          problemId,
          outcome: "eventually-correct",
          skipped: false,
          validSubmissionCount: 1,
          hintLevelsExposed: [],
          solutionExposed: false,
          checkpoint: null,
        }));
        const episode = { mode: "core", facts: { version: 2, plan, problems } };
        const session = randomUUID();
        const finish = () =>
          persistFinishContributions(
            context,
            session,
            [],
            undefined,
            episode,
            2,
          );
        const award = await finish();
        expect(award).toMatchObject({
          earnedXp: length * 10,
          totalXp: length * 10,
        });
        expect(await finish()).toEqual(award);

        const early = {
          ...episode,
          facts: { ...episode.facts, problems: problems.slice(0, 1) },
        };
        const earlySession = randomUUID();
        expect(
          await persistFinishContributions(
            context,
            earlySession,
            [],
            undefined,
            early,
            2,
          ),
        ).toMatchObject({ earnedXp: 10, totalXp: length * 10 + 10 });
        const differentPlan = {
          ...early,
          facts: {
            ...early.facts,
            plan: {
              version: 1,
              problemIds: CORE_PLAN_V1_PROBLEM_IDS.slice(
                0,
                length === 10 ? 5 : 10,
              ),
            },
          },
        };
        await expect(
          persistFinishContributions(
            context,
            earlySession,
            [],
            undefined,
            differentPlan,
            2,
          ),
        ).rejects.toThrow();
        await expect(
          persistFinishContributions(
            context,
            randomUUID(),
            [],
            undefined,
            early,
          ),
        ).rejects.toThrow();
        expect(
          (await readRecentPracticeEpisodes(context)).map(
            ({ problems }) => problems.length,
          ),
        ).toEqual([1, length]);
        expect(await readReviewAvailability(context)).toBe(true);
        const review = await startReview(context);
        expect(review).toBeTruthy();
        expect(await startReview(context)).toBe(review);
      },
    );

    it.each(["lost-response", "local-write"])(
      "replays exact facts after %s, keeping one receipt, episode and XP award",
      async (failure) => {
        const id = await createTestLearner(
          createHash("sha256").update(randomBytes(32)).digest("hex"),
        );
        const context = learnerContext(id);
        await importLegacyProgress(context, null);
        const values = new Map<string, string>();
        const raw: Storage = {
          get length() {
            return values.size;
          },
          key: (i) => [...values.keys()][i] ?? null,
          getItem: (key) => values.get(key) ?? null,
          setItem: (key, value) => {
            values.set(key, value);
          },
          removeItem: (key) => {
            values.delete(key);
          },
          clear: () => values.clear(),
        };
        vi.stubGlobal("navigator", {
          locks: {
            request: async (
              _name: string,
              _options: unknown,
              callback: (lock: Lock) => unknown,
            ) => callback({ name: _name } as Lock),
          },
        });
        await reconcileAuthenticatedLocalOwner(
          { learnerId: id, generation: "0" },
          false,
          raw,
        );
        const storage = captureLearnerStorage();
        const session = {
          sessionId: randomUUID(),
          activeProblemIndex: 0 as const,
          completedResults: [],
        };
        const answer = createShortNumericAnswerState();
        const results = [
          {
            problemId: "coinciding-seats",
            problemTitle: "Совпадающие места",
            summary: getPracticeSummary(finishPractice(answer.practice)),
          },
        ];
        expect(
          await createPracticeSessionSnapshot(session, answer, storage),
        ).toBe(true);
        const requests: ServerPracticeFinishPayload[] = [];
        let first = true;
        const persist = async (request: ServerPracticeFinishPayload) => {
          requests.push(request);
          await persistFinishContributions(
            context,
            request.sessionId,
            request.contributions,
            request.adaptiveFacts,
            { mode: request.episodeMode, facts: request.episodeFacts },
            request.version,
          );
          if (failure === "lost-response" && first) {
            first = false;
            throw new Error("Response lost after actual PostgreSQL commit");
          }
        };
        const failingStorage: Storage = {
          ...storage,
          setItem: (key, value) => {
            if (
              failure === "local-write" &&
              first &&
              key === "olympiad-trainer:practice-latest-completed"
            ) {
              first = false;
              throw new Error(
                "Browser Summary write unavailable after server acknowledgement",
              );
            }
            storage.setItem(key, value);
          },
        };
        expect(
          await completeServerBackedPracticeSession(
            session,
            answer,
            results,
            failingStorage,
            persist,
          ),
        ).toBe(
          failure === "lost-response"
            ? "outcome-unknown"
            : "reconciliation-pending",
        );
        const requestKey = "olympiad-trainer:practice-server-finish-request";
        const exactRequest = storage.getItem(requestKey);
        expect(exactRequest).not.toBeNull();
        const verify = vi.fn(async () => ({ valid: false as const }));
        const restored = await readVerifiedPracticeSessionSnapshot(
          verify,
          storage,
        );
        expect(restored.value?.sessionId).toBe(session.sessionId);
        expect(storage.getItem(requestKey)).toBe(exactRequest);
        const receipt = () =>
          getProgressDb()
            .select()
            .from(practiceFinishReceipts)
            .where(
              and(
                eq(practiceFinishReceipts.learnerId, id),
                eq(practiceFinishReceipts.sessionId, session.sessionId),
              ),
            );
        expect(await receipt()).toHaveLength(1);
        expect(
          await completeServerBackedPracticeSession(
            session,
            answer,
            results,
            storage,
            persist,
          ),
        ).toBe("completed");
        expect(requests).toHaveLength(2);
        expect(requests[1]).toEqual(requests[0]);
        expect(await receipt()).toHaveLength(1);
        expect(
          await getProgressDb()
            .select()
            .from(practiceCompletedEpisodes)
            .where(
              and(
                eq(practiceCompletedEpisodes.learnerId, id),
                eq(practiceCompletedEpisodes.sessionId, session.sessionId),
              ),
            ),
        ).toHaveLength(1);
        expect(
          await getProgressDb()
            .select()
            .from(practiceJourneyAwards)
            .where(
              and(
                eq(practiceJourneyAwards.learnerId, id),
                eq(practiceJourneyAwards.sessionId, session.sessionId),
              ),
            ),
        ).toHaveLength(1);
        expect(storage.getItem(requestKey)).toBeNull();
        vi.unstubAllGlobals();
      },
    );
  },
);
