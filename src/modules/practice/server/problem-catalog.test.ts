import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  CURRENT_PRACTICE_PROBLEM_ID,
  getLearnerSafePracticeProblem,
  getProblemDefinition,
  PRACTICE_SESSION_PROBLEM_IDS,
} from "./problem-catalog";

const focusText =
  "Обрати внимание: место должно быть отмечено по обоим правилам одновременно.";
const strategyText =
  "Подумай, через сколько мест отметки по обоим правилам снова совпадут.";
const nextStepText =
  "Выпиши первые несколько мест, которые отмечены по обоим правилам. Затем продолжай тот же шаг, пока номер места не превысит 102.";
const solutionText =
  "Подходят места, номер которых делится и на 2, и на 3. Такие места идут через 6: 6, 12, 18, …, 102. Число 102 равно 6 × 17, значит, совпадающих мест 17. Ответ: 17.";
const sockProblemId = "guaranteed-sock-pair";
const sockStatement =
  "В пакете лежат 4 красных, 3 синих и 5 жёлтых носков. Ровно три из них дырявые. Какое наименьшее число носков нужно достать не глядя, чтобы среди вынутых наверняка нашлись два целых носка одного цвета?";
const sockFocusText =
  "Обрати внимание на слово «наверняка»: нужная пара должна получиться при любом возможном наборе вынутых носков.";
const sockStrategyText =
  "Рассмотри самый неудачный случай: сколько носков можно вынуть и всё ещё остаться без двух целых носков одного цвета?";
const sockNextStepText =
  "Если нужной пары нет, целых носков каждого цвета может быть не больше одного. Учти ещё три дырявых носка и проверь, можно ли такой предельный набор действительно составить.";
const sockSolutionText =
  "Шесть носков ещё недостаточно: можно вынуть по два носка каждого цвета, причём по одному носку каждого цвета окажется дырявым. Тогда целых носков одного цвета будет не больше одного. Теперь рассмотрим семь вынутых носков. Если бы среди них не было двух целых носков одного цвета, то целых носков было бы не больше трёх — по одному каждого цвета. Дырявых носков всего три, значит, всего можно было бы вынуть не больше шести носков. Противоречие. Поэтому семь носков гарантируют нужную пару, а шесть — нет. Ответ: 7.";

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

  it("stores the approved full solution as a training adaptation", () => {
    expect(getProblemDefinition(CURRENT_PRACTICE_PROBLEM_ID).solution).toEqual({
      id: "coinciding-seats-full-solution",
      kind: "training-adaptation",
      text: solutionText,
    });
  });

  it("keeps the training solution separate from official provenance", () => {
    const problem = getProblemDefinition(CURRENT_PRACTICE_PROBLEM_ID);

    expect(problem.solution.kind).toBe("training-adaptation");
    expect(problem.solution).not.toHaveProperty("reference");
    expect(problem.solution).not.toHaveProperty("url");
    expect(problem.provenance.officialSolution).toEqual({
      reference: "IS",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2025-26/prigl/math/sol-math-5-prigl-msk-25-26.pdf",
      page: 1,
    });
  });

  it("resolves the audited sock problem with exact content and provenance", () => {
    expect(getProblemDefinition(sockProblemId)).toEqual({
      id: sockProblemId,
      grade: 5,
      subject: "mathematics",
      title: "Носки в пакете",
      statement: sockStatement,
      provenance: {
        olympiad: "Всероссийская олимпиада школьников",
        subject: "mathematics",
        academicYear: "2025/26",
        stage: "invitational",
        region: "Moscow",
        sourceArchive: "vos.olimpiada.ru",
        grade: 5,
        problemNumber: 5,
        variant: 1,
        originalSource: {
          reference: "I",
          url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2025-26/prigl/math/tasks-math-5-prigl-msk-25-26.pdf",
          page: 4,
        },
        officialSolution: {
          reference: "IS",
          url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2025-26/prigl/math/sol-math-5-prigl-msk-25-26.pdf",
          page: 4,
        },
      },
      assessment: {
        kind: "nonnegative-integer",
        expectedAnswer: "7",
      },
      hints: [
        {
          id: "guaranteed-sock-pair-focus-guarantee",
          level: "focus",
          text: sockFocusText,
        },
        {
          id: "guaranteed-sock-pair-strategy-worst-case",
          level: "strategy",
          text: sockStrategyText,
        },
        {
          id: "guaranteed-sock-pair-next-step-bound-without-pair",
          level: "next-step",
          text: sockNextStepText,
        },
      ],
      solution: {
        id: "guaranteed-sock-pair-full-solution",
        kind: "training-adaptation",
        text: sockSolutionText,
      },
    });
  });

  it("defines the fixed production session order", () => {
    expect(PRACTICE_SESSION_PROBLEM_IDS).toEqual([
      "coinciding-seats",
      "guaranteed-sock-pair",
    ]);
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
      solution: {
        solutionId: "coinciding-seats-full-solution",
      },
    });
  });

  it("does not serialize protected assessment, provenance, or support text", () => {
    const projection = getLearnerSafePracticeProblem(
      CURRENT_PRACTICE_PROBLEM_ID,
    );
    const serialized = JSON.stringify(projection);

    expect(Object.keys(projection)).toEqual([
      "problemId",
      "title",
      "statement",
      "hints",
      "solution",
    ]);
    expect(serialized).not.toContain("assessment");
    expect(serialized).not.toContain("expectedAnswer");
    expect(serialized).not.toContain('"17"');
    expect(serialized).not.toContain("provenance");
    expect(serialized).not.toContain(focusText);
    expect(serialized).not.toContain(strategyText);
    expect(serialized).not.toContain(nextStepText);
    expect(serialized).not.toContain(solutionText);
    expect(serialized).not.toContain("training-adaptation");
  });

  it("projects only learner-safe sock problem data", () => {
    const projection = getLearnerSafePracticeProblem(sockProblemId);
    const serialized = JSON.stringify(projection);

    expect(projection).toEqual({
      problemId: sockProblemId,
      title: "Носки в пакете",
      statement: sockStatement,
      hints: [
        {
          hintId: "guaranteed-sock-pair-focus-guarantee",
          level: "focus",
        },
        {
          hintId: "guaranteed-sock-pair-strategy-worst-case",
          level: "strategy",
        },
        {
          hintId: "guaranteed-sock-pair-next-step-bound-without-pair",
          level: "next-step",
        },
      ],
      solution: { solutionId: "guaranteed-sock-pair-full-solution" },
    });
    expect(serialized).not.toContain("assessment");
    expect(serialized).not.toContain("expectedAnswer");
    expect(serialized).not.toContain(sockFocusText);
    expect(serialized).not.toContain(sockStrategyText);
    expect(serialized).not.toContain(sockNextStepText);
    expect(serialized).not.toContain(sockSolutionText);
    expect(serialized).not.toContain("training-adaptation");
    expect(serialized).not.toContain("provenance");
  });
});
