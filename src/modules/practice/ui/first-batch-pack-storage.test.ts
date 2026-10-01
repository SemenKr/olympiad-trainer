import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  PRACTICE_PACKS,
  validateCompletedEpisode,
} from "../application/completed-practice-episode";
import { getPracticeProgressContribution } from "../application/practice-progress-evidence";
import {
  finishPractice,
  getPracticeSummary,
  recordAnswerResult,
  recordHintExposure,
  recordSolutionExposure,
  startPractice,
} from "../application/practice-state";
import { normalizeMultipleChoiceSetAnswer } from "../domain/multiple-choice-set-answer";
import {
  getLearnerSafePackProblems,
  getProblemDefinition,
} from "../server/problem-catalog";
import { createPracticeAnswerState } from "./practice-answer-state";
import {
  advancePracticeSession,
  createPracticeSessionResult,
  skipFinalPracticeSession,
  startPackPracticeSession,
} from "./fixed-practice-session-state";
import { installImmediatePracticeSessionLock } from "./practice-session-lock.test-helper";
import {
  completePracticeSession,
  createPracticeSessionSnapshot,
  getStoredProblemTitle,
  PRACTICE_LATEST_COMPLETED_STORAGE_KEY,
  PRACTICE_SESSION_STORAGE_KEY,
  readPracticeSessionSnapshot,
  readVerifiedLatestCompletedResults,
  restoreAnswerState,
  saveNoNextPracticeSessionSnapshot,
  savePracticeSessionSnapshot,
  validateLatestCompletedResults,
  validatePracticeSessionSnapshot,
  type ServerPracticeFinishPayload,
} from "./practice-session-storage";

beforeEach(installImmediatePracticeSessionLock);

function storage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => {
      values.delete(key);
    },
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
}

const emptySummary = getPracticeSummary(finishPractice(startPractice()));
const newPacks = PRACTICE_PACKS.slice(3);

describe("first batch through generic Pack storage and Finish", () => {
  it.each(
    newPacks.flatMap((pack) =>
      pack.problemIds.map((problemId, index) => ({ pack, problemId, index })),
    ),
  )(
    "restores revealed hints and solution for $problemId",
    async ({ pack, index }) => {
      const store = storage();
      const problems = getLearnerSafePackProblems()[pack.id];
      let session = startPackPracticeSession(pack.id);
      expect(
        await createPracticeSessionSnapshot(
          session,
          createPracticeAnswerState(problems[0]),
          store,
        ),
      ).toBe(true);
      for (let previous = 0; previous < index; previous++) {
        session = advancePracticeSession(
          session,
          createPracticeSessionResult(
            problems[previous],
            emptySummary,
            "skipped",
          ),
        )!;
        expect(
          await savePracticeSessionSnapshot(
            session,
            createPracticeAnswerState(problems[previous + 1]),
            store,
          ),
        ).toBe(true);
      }

      const problem = problems[index];
      const initialAnswer =
        problem.response.kind === "multiple-choice-set"
          ? { selectedOptionIds: [problem.response.options[0].id] }
          : { rawAnswer: "0" };
      const normalizedAnswer =
        problem.response.kind === "multiple-choice-set"
          ? normalizeMultipleChoiceSetAnswer(
              [problem.response.options[0].id],
              problem.response.options.map((option) => option.id),
            )!
          : "0";
      let practice = recordAnswerResult(startPractice(), {
        status: "incorrect",
        normalizedAnswer,
      });
      for (const hint of problem.hints) {
        practice = recordHintExposure(practice, hint);
      }
      expect(practice.hintExposures).toHaveLength(3);
      for (const supportedPractice of [
        practice,
        recordSolutionExposure(practice, problem.solution),
      ]) {
        const answer = {
          ...initialAnswer,
          status: "incorrect" as const,
          practice: supportedPractice,
        };
        expect(await savePracticeSessionSnapshot(session, answer, store)).toBe(
          true,
        );
        const restored = await readPracticeSessionSnapshot(store);
        expect(restored).toMatchObject({
          problemIds: pack.problemIds,
          activeProblemIndex: index,
          activePractice: supportedPractice,
        });
        expect(
          restored && !("status" in restored) && restoreAnswerState(restored),
        ).toEqual(answer);
        const raw = store.getItem(PRACTICE_SESSION_STORAGE_KEY)!;
        expect(raw).not.toContain('"text"');
        expect(raw).not.toContain("expectedAnswer");
        expect(raw).not.toContain("expectedOptionIds");
      }
    },
  );

  it.each(newPacks)(
    "restores $id, advances, and retries its immutable Finish",
    async (pack) => {
      const store = storage();
      const problems = getLearnerSafePackProblems()[pack.id];
      const first = startPackPracticeSession(pack.id);
      const initialAnswer = createPracticeAnswerState(problems[0]);
      expect(
        await createPracticeSessionSnapshot(first, initialAnswer, store),
      ).toBe(true);
      expect(await readPracticeSessionSnapshot(store)).toMatchObject({
        mode: "pack",
        problemIds: pack.problemIds,
      });
      expect(
        JSON.parse(store.getItem(PRACTICE_SESSION_STORAGE_KEY)!),
      ).not.toHaveProperty("packId");

      const firstResult = createPracticeSessionResult(
        problems[0],
        emptySummary,
        "skipped",
      );
      const second = advancePracticeSession(first, firstResult)!;
      const draft = createPracticeAnswerState(problems[1]);
      expect(await savePracticeSessionSnapshot(second, draft, store)).toBe(
        true,
      );
      const restored = await readPracticeSessionSnapshot(store);
      expect(restored).toMatchObject({
        problemIds: pack.problemIds,
        activeProblemIndex: 1,
      });
      expect(
        restored && !("status" in restored) && getStoredProblemTitle(restored),
      ).toBe(problems[1].title);
      expect(
        restored && !("status" in restored) && restoreAnswerState(restored),
      ).toEqual(draft);
      for (const invalid of [
        pack.problemIds.slice(0, 2),
        [...pack.problemIds].reverse(),
        [
          pack.problemIds[0],
          newPacks.find((other) => other.id !== pack.id)!.problemIds[1],
          pack.problemIds[2],
        ],
      ])
        expect(
          validatePracticeSessionSnapshot({ ...restored, problemIds: invalid }),
        ).toBeNull();

      const secondResult = createPracticeSessionResult(
        problems[1],
        emptySummary,
        "skipped",
      );
      const third = advancePracticeSession(second, secondResult)!;
      const assessment = getProblemDefinition(problems[2].problemId).assessment;
      const canonical =
        assessment.kind === "multiple-choice-set"
          ? normalizeMultipleChoiceSetAnswer(
              assessment.expectedOptionIds,
              assessment.options.map((option) => option.id),
            )!
          : assessment.expectedAnswer;
      const finalPractice = recordAnswerResult(startPractice(), {
        status: "correct",
        normalizedAnswer: canonical,
      });
      const finalAnswer =
        assessment.kind === "multiple-choice-set"
          ? {
              selectedOptionIds: [...assessment.expectedOptionIds],
              status: "correct" as const,
              practice: finalPractice,
            }
          : {
              rawAnswer: canonical,
              status: "correct" as const,
              practice: finalPractice,
            };
      expect(await savePracticeSessionSnapshot(third, finalAnswer, store)).toBe(
        true,
      );
      const results = [
        ...third.completedResults,
        createPracticeSessionResult(
          problems[2],
          getPracticeSummary(finishPractice(finalPractice)),
        ),
      ];
      expect(validateLatestCompletedResults(results)).toEqual(results);
      expect(results.map(getPracticeProgressContribution)).toEqual([
        null,
        null,
        null,
      ]);
      const requests: ServerPracticeFinishPayload[] = [];
      expect(
        await completePracticeSession(
          third,
          finalAnswer,
          results,
          store,
          async (request) => {
            requests.push(request);
            throw new Error("response lost");
          },
        ),
      ).toBe(false);
      expect(requests[0]).toMatchObject({
        episodeMode: "pack",
        contributions: [],
        episodeFacts: {
          problems: pack.problemIds.map((problemId) => ({
            problemId,
            checkpoint: null,
          })),
        },
      });
      expect(requests[0]).not.toHaveProperty("adaptiveFacts");
      expect(JSON.stringify(requests[0])).not.toContain("packId");
      expect(
        validateCompletedEpisode("pack", requests[0].episodeFacts),
      ).toEqual(requests[0].episodeFacts);
      expect(
        await completePracticeSession(
          third,
          finalAnswer,
          results,
          store,
          async (request) => {
            requests.push(request);
          },
        ),
      ).toBe(true);
      expect(requests[1]).toEqual(requests[0]);
      expect(store.getItem(PRACTICE_SESSION_STORAGE_KEY)).toBeNull();
      expect(
        JSON.parse(store.getItem(PRACTICE_LATEST_COMPLETED_STORAGE_KEY)!),
      ).toEqual({ sessionId: third.sessionId, results });
      expect(
        (
          await readVerifiedLatestCompletedResults(
            async () => ({ valid: false }),
            store,
          )
        ).value,
      ).toEqual(results);
    },
  );

  it.each(newPacks)(
    "keeps $id final skip in a no-next snapshot and finishes without evidence",
    async (pack) => {
      const store = storage();
      const problems = getLearnerSafePackProblems()[pack.id];
      const first = startPackPracticeSession(pack.id);
      expect(
        await createPracticeSessionSnapshot(
          first,
          createPracticeAnswerState(problems[0]),
          store,
        ),
      ).toBe(true);
      const second = advancePracticeSession(
        first,
        createPracticeSessionResult(problems[0], emptySummary, "skipped"),
      )!;
      expect(
        await savePracticeSessionSnapshot(
          second,
          createPracticeAnswerState(problems[1]),
          store,
        ),
      ).toBe(true);
      const third = advancePracticeSession(
        second,
        createPracticeSessionResult(problems[1], emptySummary, "skipped"),
      )!;
      expect(
        await savePracticeSessionSnapshot(
          third,
          createPracticeAnswerState(problems[2]),
          store,
        ),
      ).toBe(true);
      const noNext = skipFinalPracticeSession(
        third,
        createPracticeSessionResult(problems[2], emptySummary, "skipped"),
      )!;
      expect(await saveNoNextPracticeSessionSnapshot(noNext, store)).toBe(true);
      expect(await readPracticeSessionSnapshot(store)).toEqual(noNext);
      expect(JSON.stringify(noNext)).not.toContain("packId");
      expect(
        await completePracticeSession(
          noNext,
          null,
          noNext.completedResults,
          store,
          async (request) => {
            expect(request.episodeMode).toBe("pack");
            expect(request.contributions).toEqual([]);
            expect(request).not.toHaveProperty("adaptiveFacts");
            expect(
              validateCompletedEpisode("pack", request.episodeFacts),
            ).toEqual(request.episodeFacts);
          },
        ),
      ).toBe(true);
    },
  );
});
