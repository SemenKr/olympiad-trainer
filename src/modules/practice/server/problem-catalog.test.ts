import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  ADAPTIVE_TRANSFER_PROBLEM_ID,
  PARROTS_TRANSFER_PROBLEM_ID,
  ENUMERATION_EXPLORATION_PROBLEM_ID,
  CURRENT_PRACTICE_PROBLEM_ID,
  assessReasoningCheckpointOption,
  getLearnerSafePracticeProblem,
  getProblemDefinition,
  getRevealedReasoningCheckpoint,
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
const checkpointId = "guaranteed-sock-pair-guarantee-argument";
const checkpointOptions = [
  {
    id: "A",
    text: "Если нужной пары нет, целых носков каждого цвета может быть не больше одного. Значит, целых носков не больше 3, а вместе с тремя дырявыми можно вынуть не больше 6.",
  },
  {
    id: "B",
    text: "Среди любых 7 носков обязательно найдутся два носка одного цвета.",
  },
  {
    id: "C",
    text: "Дырявых носков всего три, значит остальные четыре обязательно будут одного цвета.",
  },
];

describe("practice problem catalog", () => {
  it("keeps parrots outside core with protected answer and canonical checkpoint", () => {
    const problem = getProblemDefinition(PARROTS_TRANSFER_PROBLEM_ID);
    expect(PRACTICE_SESSION_PROBLEM_IDS).not.toContain(
      PARROTS_TRANSFER_PROBLEM_ID,
    );
    expect(problem).toMatchObject({
      title: "Попугаи в зоопарке",
      provenance: {
        academicYear: "2020/21",
        stage: "invitational",
        region: "Moscow",
        problemNumber: 6,
        originalSource: { page: 2 },
        officialSolution: { page: 4 },
      },
      assessment: { kind: "nonnegative-integer", expectedAnswer: "19" },
      solution: {
        id: "parrots-guaranteed-colors-full-solution",
        kind: "training-adaptation",
      },
    });
    expect(
      problem.reasoningCheckpoint?.options.map((option) => option.id),
    ).toEqual(["A", "B", "C"]);
    expect(
      assessReasoningCheckpointOption(
        PARROTS_TRANSFER_PROBLEM_ID,
        problem.reasoningCheckpoint!.id,
        "A",
      ),
    ).toEqual({ outcome: "correct" });
    expect(
      assessReasoningCheckpointOption(
        PARROTS_TRANSFER_PROBLEM_ID,
        problem.reasoningCheckpoint!.id,
        "B",
      ),
    ).toEqual({ outcome: "incorrect" });
    expect(
      assessReasoningCheckpointOption(
        PARROTS_TRANSFER_PROBLEM_ID,
        problem.reasoningCheckpoint!.id,
        "C",
      ),
    ).toEqual({ outcome: "incorrect" });
    const learner = getLearnerSafePracticeProblem(PARROTS_TRANSFER_PROBLEM_ID);
    expect(JSON.stringify(learner)).not.toContain("expectedAnswer");
    expect(JSON.stringify(learner)).not.toContain("Если бы не-красных");
  });
  it("keeps the school-stage transfer problem outside the fixed core and protects its answer", () => {
    const problem = getProblemDefinition(ADAPTIVE_TRANSFER_PROBLEM_ID);
    expect(PRACTICE_SESSION_PROBLEM_IDS).toEqual([
      "coinciding-seats",
      "guaranteed-sock-pair",
      "table-impossible-sums",
    ]);
    expect(problem.provenance).toMatchObject({
      academicYear: "2024/25",
      stage: "school",
      problemNumber: 1,
    });
    expect(problem.provenance).not.toHaveProperty("variant");
    expect(problem.provenance.originalSource.url).toContain(
      "tasks-math-5-sch-msk-24-25.pdf",
    );
    expect(problem.provenance.officialSolution.url).toContain(
      "sol-math-5-sch-msk-24-25.pdf",
    );
    expect(problem.assessment).toEqual({
      kind: "nonnegative-integer",
      expectedAnswer: "2",
    });
    expect(problem.solution).toMatchObject({
      id: "brothers-ages-products-full-solution",
      kind: "training-adaptation",
    });
    const learner = getLearnerSafePracticeProblem(ADAPTIVE_TRANSFER_PROBLEM_ID);
    expect(learner.response.kind).toBe("short-numeric");
    expect(JSON.stringify(learner)).not.toContain("expectedAnswer");
    expect(JSON.stringify(learner)).not.toContain(
      "Тогда три разных натуральных возраста",
    );
    expect(
      assessReasoningCheckpointOption(
        ADAPTIVE_TRANSFER_PROBLEM_ID,
        problem.reasoningCheckpoint!.id,
        "A",
      ),
    ).toEqual({ outcome: "correct" });
    expect(
      assessReasoningCheckpointOption(
        ADAPTIVE_TRANSFER_PROBLEM_ID,
        problem.reasoningCheckpoint!.id,
        "B",
      ),
    ).toEqual({ outcome: "incorrect" });
  });
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
      reasoningCheckpoint: {
        id: checkpointId,
        heading: "Проверь рассуждение",
        question: "Почему 7 носков уже гарантируют нужную пару?",
        options: checkpointOptions,
        correctOptionId: "A",
      },
    });
  });

  it("defines the fixed production session order", () => {
    expect(PRACTICE_SESSION_PROBLEM_IDS).toEqual([
      "coinciding-seats",
      "guaranteed-sock-pair",
      "table-impossible-sums",
    ]);
  });

  it("reveals only the sock checkpoint and assesses each option on the server", () => {
    expect(
      getProblemDefinition(CURRENT_PRACTICE_PROBLEM_ID),
    ).not.toHaveProperty("reasoningCheckpoint");
    expect(getRevealedReasoningCheckpoint(sockProblemId, checkpointId)).toEqual(
      {
        checkpointId,
        heading: "Проверь рассуждение",
        question: "Почему 7 носков уже гарантируют нужную пару?",
        options: checkpointOptions,
      },
    );
    expect(
      getRevealedReasoningCheckpoint(sockProblemId, checkpointId),
    ).not.toHaveProperty("correctOptionId");
    expect(
      assessReasoningCheckpointOption(sockProblemId, checkpointId, "A"),
    ).toEqual({ outcome: "correct" });
    expect(
      assessReasoningCheckpointOption(sockProblemId, checkpointId, "B"),
    ).toEqual({ outcome: "incorrect" });
    expect(
      assessReasoningCheckpointOption(sockProblemId, checkpointId, "C"),
    ).toEqual({ outcome: "incorrect" });
    expect(() =>
      getRevealedReasoningCheckpoint(CURRENT_PRACTICE_PROBLEM_ID, checkpointId),
    ).toThrow();
    expect(() =>
      assessReasoningCheckpointOption(sockProblemId, checkpointId, "D"),
    ).toThrow();
  });
});

describe("learner-safe practice problem projection", () => {
  it("projects table choices without the protected expected set or checkpoint answer", () => {
    const projection = getLearnerSafePracticeProblem("table-impossible-sums");
    expect(projection.response).toEqual({
      kind: "multiple-choice-set",
      options: [
        { id: "sum-20", label: "20" },
        { id: "sum-21", label: "21" },
        { id: "sum-23", label: "23" },
        { id: "sum-25", label: "25" },
        { id: "sum-26", label: "26" },
      ],
    });
    expect(projection.reasoningCheckpoint).toEqual({
      checkpointId: "table-impossible-sums-impossibility-argument",
    });
    const serialized = JSON.stringify(projection);
    expect(serialized).not.toContain("expectedOptionIds");
    expect(serialized).not.toContain("correctOptionId");
    expect(serialized).not.toContain("training-adaptation");
    expect(serialized).not.toContain("provenance");
    expect(serialized).not.toContain("Минимальная сумма");
    expect(
      getProblemDefinition("table-impossible-sums").provenance,
    ).toMatchObject({
      problemNumber: 8,
      originalSource: { page: 5 },
      officialSolution: { page: 7 },
    });
  });

  it("contains only the learner data required by the current UI", () => {
    expect(getLearnerSafePracticeProblem(CURRENT_PRACTICE_PROBLEM_ID)).toEqual({
      problemId: "coinciding-seats",
      title: "Совпадающие места",
      statement:
        "В зале 102 места, пронумерованных от 1 до 102. Для одной группы отмечают каждое второе место, а для другой — каждое третье. Сколько мест окажутся отмечены для обеих групп?",
      response: { kind: "short-numeric" },
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
      "response",
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
      response: { kind: "short-numeric" },
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
      reasoningCheckpoint: { checkpointId },
    });
    expect(serialized).not.toContain("assessment");
    expect(serialized).not.toContain("expectedAnswer");
    expect(serialized).not.toContain(sockFocusText);
    expect(serialized).not.toContain(sockStrategyText);
    expect(serialized).not.toContain(sockNextStepText);
    expect(serialized).not.toContain(sockSolutionText);
    expect(serialized).not.toContain("training-adaptation");
    expect(serialized).not.toContain("provenance");
    expect(serialized).not.toContain("Почему 7 носков");
    expect(serialized).not.toContain("Если нужной пары нет");
    expect(serialized).not.toContain("correctOptionId");
    expect(serialized).not.toContain('"options"');
  });

  it("keeps pages content and canonical assessment server-only", () => {
    const id = ENUMERATION_EXPLORATION_PROBLEM_ID;
    const problem = getProblemDefinition(id);
    expect(PRACTICE_SESSION_PROBLEM_IDS).not.toContain(id);
    expect(problem).toMatchObject({
      title: "Страницы без цифры 1",
      statement:
        "У Оли тетрадь на 100 страниц. Она нумерует страницы по порядку, но пропускает все числа, в записи которых есть цифра 1. Поэтому первая страница получает номер 2, вторая — 3, …, восьмая — 9, девятая — 20. Какой номер будет у 100-й страницы?",
      provenance: {
        olympiad: "Всероссийская олимпиада школьников",
        subject: "mathematics",
        academicYear: "2024/25",
        stage: "school",
        region: "Moscow",
        grade: 5,
        problemNumber: 4,
        originalSource: {
          page: 2,
          url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2024-25/school/math/tasks-math-5-sch-msk-24-25.pdf",
        },
        officialSolution: {
          page: 3,
          url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2024-25/school/math/sol-math-5-sch-msk-24-25.pdf",
        },
      },
      assessment: { kind: "nonnegative-integer", expectedAnswer: "232" },
      hints: [
        {
          level: "focus",
          text: "Важно не просто найти число без цифры 1, а убедиться, что перед ним находится ровно 99 допустимых номеров.",
        },
        {
          level: "strategy",
          text: "Разбей подходящие номера на непересекающиеся блоки: сначала однозначные, затем двузначные, затем числа по сотням и десяткам. В каждом блоке посчитай все номера без цифры 1.",
        },
        {
          level: "next-step",
          text: "До 99 есть 80 допустимых номеров. Все числа от 100 до 199 пропускаются. Затем отдельно посчитай подходящие числа от 200 до 209 и от 220 до 229 — после этих блоков останется найти ещё два допустимых номера.",
        },
      ],
      solution: { kind: "training-adaptation" },
      reasoningCheckpoint: {
        id: "pages-without-digit-one-complete-enumeration",
        correctOptionId: "A",
      },
    });
    expect(problem.solution.text).toContain("230 — 99-й");
    expect(
      getRevealedReasoningCheckpoint(id, problem.reasoningCheckpoint!.id),
    ).toMatchObject({
      heading: "Проверь рассуждение",
      question:
        "Какой способ действительно доказывает, что найденный номер — именно 100-й подходящий, а в подсчёте ничего не пропущено и не посчитано дважды?",
      options: [
        {
          id: "A",
          text: "Разделить числа на непересекающиеся блоки, в каждом блоке посчитать все числа без цифры 1 и отдельно проверить, что пропущенные промежутки целиком содержат цифру 1.",
        },
        {
          id: "B",
          text: "Проверить несколько первых подходящих номеров и несколько номеров рядом с найденным ответом.",
        },
        {
          id: "C",
          text: "Проверить только, что найденное число не содержит цифру 1, а предыдущее неподходящее число содержит.",
        },
      ],
    });
    expect(
      assessReasoningCheckpointOption(id, problem.reasoningCheckpoint!.id, "A"),
    ).toEqual({ outcome: "correct" });
    expect(
      assessReasoningCheckpointOption(id, problem.reasoningCheckpoint!.id, "B"),
    ).toEqual({ outcome: "incorrect" });
    const safe = JSON.stringify(getLearnerSafePracticeProblem(id));
    expect(safe).not.toContain("232");
    expect(safe).not.toContain("Разбей подходящие номера");
    expect(safe).not.toContain("непересекающиеся блоки");
  });
});
