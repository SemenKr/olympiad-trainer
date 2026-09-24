import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  revealReasoningCheckpoint,
  revealPracticeHint,
  revealPracticeSolution,
  submitReasoningCheckpointOption,
  verifyPersistedReasoningCheckpointObservation,
  submitPracticeAnswer,
} from "./actions";

const problemId = "coinciding-seats";
const sockProblemId = "guaranteed-sock-pair";
const sockSolutionText =
  "Шесть носков ещё недостаточно: можно вынуть по два носка каждого цвета, причём по одному носку каждого цвета окажется дырявым. Тогда целых носков одного цвета будет не больше одного. Теперь рассмотрим семь вынутых носков. Если бы среди них не было двух целых носков одного цвета, то целых носков было бы не больше трёх — по одному каждого цвета. Дырявых носков всего три, значит, всего можно было бы вынуть не больше шести носков. Противоречие. Поэтому семь носков гарантируют нужную пару, а шесть — нет. Ответ: 7.";
const checkpointId = "guaranteed-sock-pair-guarantee-argument";
const correctSummary = {
  outcome: "eventually-correct",
  validSubmissionCount: 1,
  hintExposures: [],
  solutionExposure: null,
};

describe("reasoning checkpoint server boundary", () => {
  it("reveals prompt and options only on request, without the correct option", async () => {
    const revealed = await revealReasoningCheckpoint(
      sockProblemId,
      checkpointId,
    );
    expect(revealed).toMatchObject({
      checkpointId,
      heading: "Проверь рассуждение",
      question: "Почему 7 носков уже гарантируют нужную пару?",
    });
    expect(revealed.options.map((option) => option.id)).toEqual([
      "A",
      "B",
      "C",
    ]);
    expect(JSON.stringify(revealed)).not.toContain("correctOptionId");
    await expect(
      revealReasoningCheckpoint(problemId, checkpointId),
    ).rejects.toThrow();
  });

  it("returns only a safe outcome for A, B, and C", async () => {
    await expect(
      submitReasoningCheckpointOption(
        sockProblemId,
        checkpointId,
        "A",
        correctSummary,
      ),
    ).resolves.toMatchObject({ outcome: "correct" });
    await expect(
      submitReasoningCheckpointOption(
        sockProblemId,
        checkpointId,
        "B",
        correctSummary,
      ),
    ).resolves.toMatchObject({ outcome: "incorrect" });
    await expect(
      submitReasoningCheckpointOption(
        sockProblemId,
        checkpointId,
        "C",
        correctSummary,
      ),
    ).resolves.toMatchObject({ outcome: "incorrect" });
    await expect(
      submitReasoningCheckpointOption(
        sockProblemId,
        checkpointId,
        "D",
        correctSummary,
      ),
    ).rejects.toThrow();
    await expect(
      submitReasoningCheckpointOption(sockProblemId, null, "A", correctSummary),
    ).rejects.toThrow();
  });

  it.each([
    ["A", "correct", true],
    ["B", "incorrect", true],
    ["C", "incorrect", true],
    ["A", "incorrect", false],
    ["B", "correct", false],
    ["C", "correct", false],
  ] as const)(
    "reconciles stored %s + %s as %s",
    async (selectedOptionId, outcome, valid) => {
      const verified = await verifyPersistedReasoningCheckpointObservation(
        sockProblemId,
        {
          checkpointId,
          selectedOptionId,
          outcome,
          validSubmissionCountAtSubmit: 1,
        },
        correctSummary,
      );
      expect(verified.valid).toBe(valid);
      if (!valid) expect(verified).not.toHaveProperty("interpretation");
    },
  );
});

describe("practice answer server boundary", () => {
  it("checks a correct answer through the catalog", async () => {
    await expect(submitPracticeAnswer(problemId, " 017 ")).resolves.toEqual({
      status: "correct",
      normalizedAnswer: "17",
    });
  });

  it("checks an incorrect answer through the catalog", async () => {
    await expect(submitPracticeAnswer(problemId, "16")).resolves.toEqual({
      status: "incorrect",
      normalizedAnswer: "16",
    });
  });

  it("keeps invalid learner input invalid", async () => {
    await expect(submitPracticeAnswer(problemId, "12,5")).resolves.toEqual({
      status: "invalid",
    });
    await expect(submitPracticeAnswer(problemId, null)).resolves.toEqual({
      status: "invalid",
    });
  });

  it("rejects an unknown or invalid problem identity as a boundary failure", async () => {
    await expect(submitPracticeAnswer("missing-problem", "17")).rejects.toThrow(
      "Unknown practice problem",
    );
    await expect(submitPracticeAnswer(null, "17")).rejects.toThrow(
      "Invalid practice problem ID",
    );
  });
});

describe("practice hint reveal server boundary", () => {
  it("reveals the exact focus hint on explicit request", async () => {
    await expect(
      revealPracticeHint(
        problemId,
        "coinciding-seats-focus-simultaneous-rules",
      ),
    ).resolves.toEqual({
      hintId: "coinciding-seats-focus-simultaneous-rules",
      level: "focus",
      text: "Обрати внимание: место должно быть отмечено по обоим правилам одновременно.",
    });
  });

  it("reveals the exact strategy hint on explicit request", async () => {
    await expect(
      revealPracticeHint(
        problemId,
        "coinciding-seats-strategy-repeat-interval",
      ),
    ).resolves.toEqual({
      hintId: "coinciding-seats-strategy-repeat-interval",
      level: "strategy",
      text: "Подумай, через сколько мест отметки по обоим правилам снова совпадут.",
    });
  });

  it("reveals the exact next-step hint on explicit request", async () => {
    await expect(
      revealPracticeHint(
        problemId,
        "coinciding-seats-next-step-list-common-seats",
      ),
    ).resolves.toEqual({
      hintId: "coinciding-seats-next-step-list-common-seats",
      level: "next-step",
      text: "Выпиши первые несколько мест, которые отмечены по обоим правилам. Затем продолжай тот же шаг, пока номер места не превысит 102.",
    });
  });

  it("fails safely for unknown problem and hint IDs", async () => {
    await expect(
      revealPracticeHint("missing-problem", "missing-hint"),
    ).rejects.toThrow("Unknown practice problem");
    await expect(revealPracticeHint(problemId, "missing-hint")).rejects.toThrow(
      "Unknown hint for practice problem",
    );
  });
});

describe("practice solution reveal server boundary", () => {
  it("reveals the exact approved training solution on explicit request", async () => {
    await expect(
      revealPracticeSolution(problemId, "coinciding-seats-full-solution"),
    ).resolves.toEqual({
      solutionId: "coinciding-seats-full-solution",
      text: "Подходят места, номер которых делится и на 2, и на 3. Такие места идут через 6: 6, 12, 18, …, 102. Число 102 равно 6 × 17, значит, совпадающих мест 17. Ответ: 17.",
    });
  });

  it("fails safely for unknown problem and solution IDs", async () => {
    await expect(
      revealPracticeSolution(
        "missing-problem",
        "coinciding-seats-full-solution",
      ),
    ).rejects.toThrow("Unknown practice problem");
    await expect(
      revealPracticeSolution(problemId, "missing-solution"),
    ).rejects.toThrow("Unknown solution for practice problem");
    await expect(revealPracticeSolution(problemId, null)).rejects.toThrow(
      "Invalid solution ID",
    );
  });
});

describe("sock problem server boundaries", () => {
  it("checks correct, incorrect, and invalid numeric answers", async () => {
    await expect(submitPracticeAnswer(sockProblemId, " 007 ")).resolves.toEqual(
      {
        status: "correct",
        normalizedAnswer: "7",
      },
    );
    await expect(submitPracticeAnswer(sockProblemId, "6")).resolves.toEqual({
      status: "incorrect",
      normalizedAnswer: "6",
    });
    await expect(submitPracticeAnswer(sockProblemId, "семь")).resolves.toEqual({
      status: "invalid",
    });
  });

  it.each([
    {
      hintId: "guaranteed-sock-pair-focus-guarantee",
      level: "focus",
      text: "Обрати внимание на слово «наверняка»: нужная пара должна получиться при любом возможном наборе вынутых носков.",
    },
    {
      hintId: "guaranteed-sock-pair-strategy-worst-case",
      level: "strategy",
      text: "Рассмотри самый неудачный случай: сколько носков можно вынуть и всё ещё остаться без двух целых носков одного цвета?",
    },
    {
      hintId: "guaranteed-sock-pair-next-step-bound-without-pair",
      level: "next-step",
      text: "Если нужной пары нет, целых носков каждого цвета может быть не больше одного. Учти ещё три дырявых носка и проверь, можно ли такой предельный набор действительно составить.",
    },
  ] as const)("reveals the protected $level hint", async (hint) => {
    await expect(
      revealPracticeHint(sockProblemId, hint.hintId),
    ).resolves.toEqual(hint);
  });

  it("does not resolve another problem's hint through the sock problem", async () => {
    await expect(
      revealPracticeHint(
        sockProblemId,
        "coinciding-seats-focus-simultaneous-rules",
      ),
    ).rejects.toThrow("Unknown hint for practice problem");
  });

  it("reveals only the matching protected sock solution", async () => {
    await expect(
      revealPracticeSolution(
        sockProblemId,
        "guaranteed-sock-pair-full-solution",
      ),
    ).resolves.toEqual({
      solutionId: "guaranteed-sock-pair-full-solution",
      text: sockSolutionText,
    });
    await expect(
      revealPracticeSolution(sockProblemId, "coinciding-seats-full-solution"),
    ).rejects.toThrow("Unknown solution for practice problem");
  });
});
