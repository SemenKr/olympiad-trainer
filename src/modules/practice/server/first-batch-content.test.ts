import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import {
  CORE_EPISODE_PROBLEM_IDS,
  EXPLORATION_EPISODE_PROBLEM_ID,
  PRACTICE_PACKS,
  TRANSFER_EPISODE_PROBLEM_IDS,
} from "../application/completed-practice-episode";
import { checkMultipleChoiceSetAnswer } from "../domain/multiple-choice-set-answer";
import { checkNonnegativeIntegerAnswer } from "../domain/numeric-answer";
import {
  getLearnerSafePackProblems,
  getLearnerSafePracticeProblem,
  getProblemDefinition,
  getRevealedPracticeHint,
  getRevealedPracticeSolution,
} from "./problem-catalog";

const school22 =
  "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2022-23/school/math/taskssol-math-4-11-msk-sch-22-23.pdf";
const school21Tasks =
  "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2021-22/school/math/tasks-math-4-11-msk-sch-21-22.pdf";
const school21Solutions =
  "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2021-22/school/math/sol-math-4-11-msk-sch-21-22.pdf";
const invitational23Tasks =
  "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2023-24/prigl/math/tasks-math-5-prigl-msk-23-24.pdf";
const invitational23Solutions =
  "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2023-24/prigl/math/sol-math-5-prigl-msk-23-24.pdf";
const invitational22Tasks =
  "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2022-23/prigl/math/tasks-math-5-prigl-msk-22-23.pdf";
const invitational22Solutions =
  "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2022-23/prigl/math/sol-math-5-prigl-msk-22-23.pdf";

const batch = [
  {
    id: "exact-coin-payments",
    title: "Пирожок без сдачи",
    year: "2022/23",
    stage: "school",
    number: 5,
    taskUrl: school22,
    taskPage: 10,
    solutionUrl: school22,
    solutionPage: 10,
    answer: "13",
    hints: [
      "Раздели все способы на два непересекающихся случая: десятирублёвая монета используется или не используется.",
      "Если 10 рублей уже набраны, остаётся получить 6 рублей монетами по 2 и 1. Без десятирублёвой монеты нужно набрать все 16 рублей этими двумя видами монет.",
      "В первом случае двухрублёвых монет может быть от 0 до 3, а во втором — от 0 до 8. После выбора их количества число однорублёвых монет определяется однозначно.",
    ],
    solutionMarkers: ["4 способа", "9 способов", "4 + 9 = 13"],
  },
  {
    id: "odd-neighbor-sugar-cubes",
    title: "Кубики с нечётным числом соседей",
    year: "2023/24",
    stage: "invitational",
    number: 5,
    variant: 1,
    taskUrl: invitational23Tasks,
    taskPage: 11,
    solutionUrl: invitational23Solutions,
    solutionPage: 7,
    answer: "62",
    hints: [
      "Число соседей зависит от положения кубика: внутри большого куба, на грани, на ребре или в вершине.",
      "Разбей все маленькие кубики на эти четыре непересекающихся типа и определи число соседей для каждого типа.",
      "Внутренний кубик имеет 6 соседей, кубик на грани вне рёбер — 5, на ребре вне вершин — 4, а в вершине — 3. Нужны только типы с нечётным числом соседей.",
    ],
    solutionMarkers: ["6 × 3 × 3 = 54", "8 вершин", "54 + 8 = 62"],
  },
  {
    id: "last-student-friends",
    title: "Сколько друзей у последнего?",
    year: "2022/23",
    stage: "school",
    number: 7,
    taskUrl: school22,
    taskPage: 11,
    solutionUrl: school22,
    solutionPage: 12,
    answer: "15",
    hints: [
      "Начни с трёх учеников, у каждого из которых по 30 друзей. С кем они обязаны дружить в классе из 31 человека?",
      "Мысленно убери этих троих. У каждого оставшегося число друзей уменьшится на 3. Что тогда произойдёт с учениками, у которых сначала было по 3 друга?",
      "После удаления трёх самых общительных и трёх учеников, оставшихся без друзей, возникает та же структура на 6 учеников меньше. Повтори такое сокращение несколько раз.",
    ],
    solutionMarkers: ["пять раз", "x − 15 = 0"],
  },
  {
    id: "lineup-six-hooligans",
    title: "Правдивые и лжецы в шеренге",
    year: "2022/23",
    stage: "school",
    number: 2,
    taskUrl: school22,
    taskPage: 8,
    solutionUrl: school22,
    solutionPage: 8,
    answer: "12",
    hints: [
      "Сначала посмотри на учеников на местах с 7-го по 12-е. Между каждым из них и Владом физически находится меньше шести человек.",
      "Их утверждение не может быть правдой. Определи их тип, а затем проверь, что говорит ученик на 6-м месте.",
      "Места 7–12 занимают шесть хулиганов. Поэтому между учеником №6 и Владом действительно ровно шесть хулиганов. После этого рассуждение продолжается к началу шеренги. Справа от Влада работает симметричный аргумент.",
    ],
    solutionMarkers: ["7–12", "14–19", "6 + 6 = 12"],
  },
  {
    id: "two-true-journalists",
    title: "Два правдивых журналиста",
    year: "2021/22",
    stage: "school",
    number: 7,
    taskUrl: school21Tasks,
    taskPage: 6,
    solutionUrl: school21Solutions,
    solutionPage: 11,
    answer: ["goals-11", "goals-12", "goals-14", "goals-16", "goals-17"],
    options: ["10", "11", "12", "13", "14", "15", "16", "17", "18"],
    hints: [
      "Разбей числа по границам 10, 11, 17 и 18. Отдельно учитывай чётность.",
      "Сначала проверь граничные значения 11 и 17. Затем рассмотри все числа от 12 до 16 вместе.",
      "Для чисел от 12 до 16 первые два утверждения истинны одновременно. Чтобы истинных утверждений осталось ровно два, третье должно быть ложным.",
    ],
    solutionMarkers: ["12, 14 и 16", "11, 12, 14, 16, 17"],
  },
  {
    id: "neighbor-comparison-codes",
    title: "Код соседних цифр",
    year: "2023/24",
    stage: "invitational",
    number: 6,
    variant: 1,
    taskUrl: invitational23Tasks,
    taskPage: 13,
    solutionUrl: invitational23Solutions,
    solutionPage: 8,
    answer: ["code-0112102011", "code-1021021020", "code-1101111111"],
    options: ["0112102011", "1021021020", "1101111111", "1201201020"],
    hints: [
      "У крайней цифры только один сосед, а у внутренней — два. Код 2 означает, что оба соседа меньше текущей цифры.",
      "Сначала проверь последовательность, начинающуюся с 120. Первые два символа уже задают два сравнения первой и второй цифр.",
      "Начальная 1 требует, чтобы первая цифра была больше второй. Следующая 2 требует, чтобы вторая цифра была больше обоих соседей, в том числе первой. Получается противоречие.",
    ],
    solutionMarkers: [
      "1201201020 невозможен",
      "2679108345",
      "5496382170",
      "9801234567",
    ],
  },
  {
    id: "five-piles-stones",
    title: "Пять кучек камней",
    year: "2021/22",
    stage: "school",
    number: 6,
    taskUrl: school21Tasks,
    taskPage: 5,
    solutionUrl: school21Solutions,
    solutionPage: 11,
    answer: "60",
    hints: [
      "Возьми количество камней в третьей кучке за одну условную часть.",
      "Вырази через эту часть пятую, затем вторую, первую и четвёртую кучки.",
      "Если в третьей кучке x камней, то в пятой 6x, во второй 14x, в первой 2x, а в четвёртой 7x. Используй условие о разнице 10 между первой и четвёртой.",
    ],
    solutionMarkers: ["14x", "5x = 10", "4, 28, 2, 14 и 12", "60"],
  },
  {
    id: "untouched-matchstick-figures",
    title: "Нетронутые фигурки",
    year: "2021/22",
    stage: "invitational",
    number: 1,
    variant: 1,
    taskUrl: invitational22Tasks,
    taskPage: 1,
    solutionUrl: invitational22Solutions,
    solutionPage: 1,
    answer: "6",
    hints: [
      "Фигура перестаёт быть нетронутой после первой же взятой из неё спички. Поэтому считай прежде всего число затронутых фигур, а не число спичек.",
      "После первого хода Петя может стараться брать спички только из уже затронутых фигур. Вася, наоборот, на каждом своём ходу может выбирать новую фигуру.",
      "После первого хода Петя берёт спичку из любой уже затронутой фигуры, в которой ещё есть спички. Если Вася начинает новую фигуру, в ней остаются спички для следующего хода Пети. Поэтому Петя вынужден начать новую фигуру только после хода Васи в уже затронутой фигуре. Сравни число таких ходов с числом новых фигур Васи.",
    ],
    solutionMarkers: [
      "1 + (5 − k)",
      "k + 1 + (5 − k) = 6",
      "не меньше 6",
      "12 − 6 = 6",
    ],
  },
  {
    id: "mountain-numbers-over-77777",
    title: "Сколько чисел-горок?",
    year: "2021/22",
    stage: "invitational",
    number: 8,
    variant: 1,
    taskUrl: invitational22Tasks,
    taskPage: 16,
    solutionUrl: invitational22Solutions,
    solutionPage: 17,
    answer: "36",
    hints: [
      "Сначала найди первые три цифры. Чтобы число было больше 77777, его первая цифра должна быть не меньше 7, но после неё ещё нужны две строго большие цифры.",
      "Проверь, может ли первая цифра быть 8 или 9. После этого станет ясно, какие три первые цифры вынуждены стоять в числе.",
      "Начало обязательно равно 789. Для двух последних мест нужно выбрать две разные цифры из 0–8 и расположить их в убывающем порядке.",
    ],
    solutionMarkers: ["789", "0–8", "C(9, 2) = 36"],
  },
] as const;

describe("first batch content", () => {
  it("brings the production corpus to 24 distinct problem definitions", () => {
    const ids = [
      ...CORE_EPISODE_PROBLEM_IDS,
      ...TRANSFER_EPISODE_PROBLEM_IDS,
      EXPLORATION_EPISODE_PROBLEM_ID,
      ...PRACTICE_PACKS.flatMap((pack) => pack.problemIds),
    ];
    expect(ids).toHaveLength(24);
    expect(new Set(ids).size).toBe(24);
    for (const id of ids) expect(getProblemDefinition(id).id).toBe(id);
  });
  it("adds exactly nine protected Grade-5 definitions and resolves them through the generic Pack projection", () => {
    const packs = getLearnerSafePackProblems();
    const selected = PRACTICE_PACKS.slice(3);
    expect(selected.map((pack) => pack.id)).toEqual([
      "pack-d",
      "pack-e",
      "pack-f",
    ]);
    expect(selected.flatMap((pack) => pack.problemIds)).toEqual(
      batch.map((item) => item.id),
    );
    for (const pack of selected)
      expect(packs[pack.id].map((problem) => problem.problemId)).toEqual(
        pack.problemIds,
      );
    for (const item of batch) {
      const problem = getProblemDefinition(item.id);
      const learner = getLearnerSafePracticeProblem(item.id);
      expect(problem.id).toBe(item.id);
      expect(problem.title).toBe(item.title);
      expect(problem.provenance).toEqual({
        olympiad: "Всероссийская олимпиада школьников",
        subject: "mathematics",
        academicYear: item.year,
        stage: item.stage,
        region: "Moscow",
        sourceArchive: "vos.olimpiada.ru",
        grade: 5,
        problemNumber: item.number,
        ...("variant" in item ? { variant: item.variant } : {}),
        originalSource: {
          reference: "I",
          url: item.taskUrl,
          page: item.taskPage,
        },
        officialSolution: {
          reference: "IS",
          url: item.solutionUrl,
          page: item.solutionPage,
        },
      });
      expect(problem.reasoningCheckpoint).toBeUndefined();
      expect(problem.hints.map((hint) => hint.text)).toEqual(item.hints);
      expect(problem.hints.map((hint) => hint.level)).toEqual([
        "focus",
        "strategy",
        "next-step",
      ]);
      problem.hints.forEach((hint) =>
        expect(getRevealedPracticeHint(item.id, hint.id).text).toBe(hint.text),
      );
      expect(problem.solution.kind).toBe("training-adaptation");
      expect(
        getRevealedPracticeSolution(item.id, problem.solution.id).text,
      ).toBe(problem.solution.text);
      item.solutionMarkers.forEach((marker) =>
        expect(problem.solution.text).toContain(marker),
      );
      expect(learner).toEqual({
        problemId: item.id,
        title: item.title,
        statement: problem.statement,
        response:
          typeof item.answer !== "string"
            ? {
                kind: "multiple-choice-set",
                instruction: "Выбери все подходящие варианты.",
                options:
                  problem.assessment.kind === "multiple-choice-set"
                    ? problem.assessment.options
                    : [],
              }
            : { kind: "short-numeric" },
        hints: problem.hints.map((hint) => ({
          hintId: hint.id,
          level: hint.level,
        })),
        solution: { solutionId: problem.solution.id },
      });
      const serialized = JSON.stringify(learner);
      for (const protectedField of [
        "expectedAnswer",
        "expectedOptionIds",
        problem.solution.text,
        ...item.hints,
      ])
        expect(serialized).not.toContain(protectedField);
      if (typeof item.answer !== "string") {
        const expectedOptionIds: readonly string[] = item.answer;
        expect(problem.assessment.kind).toBe("multiple-choice-set");
        if (problem.assessment.kind !== "multiple-choice-set") continue;
        expect(
          problem.assessment.options.map((option) => option.label),
        ).toEqual(item.options);
        expect(problem.assessment.expectedOptionIds).toEqual(item.answer);
        expect(learner.response.kind).toBe("multiple-choice-set");
        const known = problem.assessment.options.map((option) => option.id);
        expect(
          checkMultipleChoiceSetAnswer(
            [...item.answer].reverse(),
            known,
            problem.assessment.expectedOptionIds,
          ).status,
        ).toBe("correct");
        expect(
          checkMultipleChoiceSetAnswer(
            item.answer.slice(0, -1),
            known,
            problem.assessment.expectedOptionIds,
          ).status,
        ).toBe("incorrect");
        expect(
          checkMultipleChoiceSetAnswer(
            [
              ...item.answer,
              known.find((id) => !expectedOptionIds.includes(id))!,
            ],
            known,
            problem.assessment.expectedOptionIds,
          ).status,
        ).toBe("incorrect");
        expect(
          checkMultipleChoiceSetAnswer(
            [item.answer[0], item.answer[0]],
            known,
            problem.assessment.expectedOptionIds,
          ).status,
        ).toBe("invalid");
      } else {
        expect(problem.assessment).toEqual({
          kind: "nonnegative-integer",
          expectedAnswer: item.answer,
        });
        expect(
          checkNonnegativeIntegerAnswer(item.answer, item.answer).status,
        ).toBe("correct");
        expect(
          checkNonnegativeIntegerAnswer(
            String(Number(item.answer) + 1),
            item.answer,
          ).status,
        ).toBe("incorrect");
      }
    }
  });
});
