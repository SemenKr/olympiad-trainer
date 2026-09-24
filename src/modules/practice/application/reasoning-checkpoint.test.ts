import { describe, expect, it } from "vitest";
import { vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  recordAnswerResult,
  recordHintExposure,
  recordSolutionExposure,
  startPractice,
} from "./practice-state";
import {
  canAttemptReasoningCheckpoint,
  SOCK_REASONING_CHECKPOINT_ID,
  type ReasoningCheckpointObservation,
} from "./reasoning-checkpoint";
import { getReasoningCheckpointInterpretation } from "../server/reasoning-checkpoint-interpretation";

const correct = recordAnswerResult(startPractice(), {
  status: "correct",
  normalizedAnswer: "7",
});
const observation: ReasoningCheckpointObservation = {
  checkpointId: SOCK_REASONING_CHECKPOINT_ID,
  selectedOptionId: "A",
  outcome: "correct",
  validSubmissionCountAtSubmit: 1,
};

describe("optional reasoning checkpoint", () => {
  it("opens only after numeric correct, once, without prior solution exposure", () => {
    expect(canAttemptReasoningCheckpoint(startPractice(), null)).toBe(false);
    expect(
      canAttemptReasoningCheckpoint(
        recordAnswerResult(startPractice(), {
          status: "incorrect",
          normalizedAnswer: "6",
        }),
        null,
      ),
    ).toBe(false);
    expect(canAttemptReasoningCheckpoint(correct, null)).toBe(true);
    expect(canAttemptReasoningCheckpoint(correct, observation)).toBe(false);

    let exposed = recordAnswerResult(startPractice(), {
      status: "incorrect",
      normalizedAnswer: "6",
    });
    for (const [hintId, level] of [
      ["guaranteed-sock-pair-focus-guarantee", "focus"],
      ["guaranteed-sock-pair-strategy-worst-case", "strategy"],
      ["guaranteed-sock-pair-next-step-bound-without-pair", "next-step"],
    ] as const) {
      exposed = recordHintExposure(exposed, { hintId, level });
    }
    exposed = recordSolutionExposure(exposed, {
      solutionId: "guaranteed-sock-pair-full-solution",
    });
    exposed = recordAnswerResult(exposed, {
      status: "correct",
      normalizedAnswer: "7",
    });
    expect(canAttemptReasoningCheckpoint(exposed, null)).toBe(false);
  });

  it("bounds positive recognition by hint and solution evidence", () => {
    const summary = {
      outcome: "eventually-correct" as const,
      validSubmissionCount: 1,
      hintExposures: [],
      solutionExposure: null,
    };
    expect(
      getReasoningCheckpointInterpretation(summary, observation.outcome),
    ).toMatchObject({
      capability:
        "Обосновывать гарантированный результат при неблагоприятном выборе",
      learnerLabel: "Как гарантировать результат",
      progressGroup: "Начинаю разбираться",
      conclusion:
        "Ты сам верно выбрал объяснение, почему 7 носков уже гарантируют нужную пару. Пока рано сказать, сможешь ли ты сам построить такое доказательство в новой задаче.",
    });
    expect(
      getReasoningCheckpointInterpretation(
        {
          ...summary,
          hintExposures: [
            {
              hintId: "guaranteed-sock-pair-focus-guarantee",
              level: "focus" as const,
              validSubmissionCountAtOpen: 0,
            },
          ],
        },
        observation.outcome,
      ),
    ).toMatchObject({
      progressGroup: "Начинаю разбираться",
      conclusion:
        "В этой задаче ты открывал подсказку и верно выбрал объяснение, почему 7 носков гарантируют нужную пару. Самостоятельный выбор такого обоснования пока не проверен.",
    });
    expect(
      getReasoningCheckpointInterpretation(summary, "incorrect"),
    ).toMatchObject({
      progressGroup: null,
      conclusion: "Пока рано сказать",
    });
    expect(
      getReasoningCheckpointInterpretation(
        {
          ...summary,
          solutionExposure: {
            solutionId: "guaranteed-sock-pair-full-solution",
            validSubmissionCountAtOpen: 1,
          },
        },
        observation.outcome,
      ),
    ).toMatchObject({
      progressGroup: null,
      conclusion: "Пока рано сказать",
    });
  });
});
