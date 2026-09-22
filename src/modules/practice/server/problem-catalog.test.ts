import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  CURRENT_PRACTICE_PROBLEM_ID,
  getLearnerSafePracticeProblem,
  getProblemDefinition,
} from "./problem-catalog";

const focusText =
  "Обрати внимание: место должно быть отмечено по обоим правилам одновременно.";
const strategyText =
  "Подумай, через сколько мест отметки по обоим правилам снова совпадут.";
const nextStepText =
  "Выпиши первые несколько мест, которые отмечены по обоим правилам. Затем продолжай тот же шаг, пока номер места не превысит 102.";

describe("practice problem catalog", () => {
  it("resolves the current problem by stable product ID", () => {
    expect(getProblemDefinition(CURRENT_PRACTICE_PROBLEM_ID)).toMatchObject({
      id: "coinciding-seats",
      grade: 5,
      subject: "mathematics",
      assessment: {
        kind: "nonnegative-integer",
        expectedAnswer: "17",
      },
    });
  });

  it("fails explicitly for an unknown product ID", () => {
    expect(() => getProblemDefinition("missing-problem")).toThrow(
      "Unknown practice problem: missing-problem",
    );
    expect(() => getProblemDefinition("toString")).toThrow(
      "Unknown practice problem: toString",
    );
  });

  it("retains the established I-01 source provenance", () => {
    expect(
      getProblemDefinition(CURRENT_PRACTICE_PROBLEM_ID).provenance,
    ).toEqual({
      olympiad: "Всероссийская олимпиада школьников",
      subject: "mathematics",
      academicYear: "2025/26",
      stage: "invitational",
      region: "Moscow",
      sourceArchive: "vos.olimpiada.ru",
      grade: 5,
      problemNumber: 1,
      variant: 1,
      originalSource: {
        reference: "I",
        url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2025-26/prigl/math/tasks-math-5-prigl-msk-25-26.pdf",
        page: 1,
      },
      officialSolution: {
        reference: "IS",
        url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2025-26/prigl/math/sol-math-5-prigl-msk-25-26.pdf",
        page: 1,
      },
    });
  });

  it("preserves the reviewed focus and strategy hints before next-step", () => {
    expect(getProblemDefinition(CURRENT_PRACTICE_PROBLEM_ID).hints).toEqual([
      {
        id: "coinciding-seats-focus-simultaneous-rules",
        level: "focus",
        text: focusText,
      },
      {
        id: "coinciding-seats-strategy-repeat-interval",
        level: "strategy",
        text: strategyText,
      },
      {
        id: "coinciding-seats-next-step-list-common-seats",
        level: "next-step",
        text: nextStepText,
      },
    ]);
  });

  it("keeps next-step learner text bounded", () => {
    expect(nextStepText).not.toMatch(/\b(?:6|17)\b/);
  });
});

describe("learner-safe practice problem projection", () => {
  it("contains only the learner data required by the current UI", () => {
    expect(getLearnerSafePracticeProblem(CURRENT_PRACTICE_PROBLEM_ID)).toEqual({
      problemId: "coinciding-seats",
      title: "Совпадающие места",
      statement:
        "В зале 102 места, пронумерованных от 1 до 102. Для одной группы отмечают каждое второе место, а для другой — каждое третье. Сколько мест окажутся отмечены для обеих групп?",
      hints: [
        {
          hintId: "coinciding-seats-focus-simultaneous-rules",
          level: "focus",
        },
        {
          hintId: "coinciding-seats-strategy-repeat-interval",
          level: "strategy",
        },
        {
          hintId: "coinciding-seats-next-step-list-common-seats",
          level: "next-step",
        },
      ],
    });
  });

  it("does not serialize assessment, expected answer, provenance, or hint text", () => {
    const projection = getLearnerSafePracticeProblem(
      CURRENT_PRACTICE_PROBLEM_ID,
    );
    const serialized = JSON.stringify(projection);

    expect(Object.keys(projection)).toEqual([
      "problemId",
      "title",
      "statement",
      "hints",
    ]);
    expect(serialized).not.toContain("assessment");
    expect(serialized).not.toContain("expectedAnswer");
    expect(serialized).not.toContain('"17"');
    expect(serialized).not.toContain("provenance");
    expect(serialized).not.toContain(focusText);
    expect(serialized).not.toContain(strategyText);
    expect(serialized).not.toContain(nextStepText);
  });
});
