import { createHash, randomBytes, randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { and, eq } from "drizzle-orm";

vi.mock("server-only", () => ({}));

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
