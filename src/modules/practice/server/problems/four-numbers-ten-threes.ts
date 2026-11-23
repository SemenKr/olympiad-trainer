import type { ProblemDefinition } from "../problem-catalog";

export const fourNumbersTenThreesProblem = {
  id: "four-numbers-ten-threes",
  grade: 5,
  subject: "mathematics",
  title: "Десять троек в четырёх числах",
  statement:
    "Выписывают четыре четырёхзначных числа подряд. Во всех четырёх записях вместе должно встретиться ровно 10 цифр 3. Выбери все числа, с которых можно начать такую четвёрку.",
  provenance: {
    olympiad: "Всероссийская олимпиада школьников",
    subject: "mathematics",
    academicYear: "2026/27",
    stage: "school",
    region: "Moscow",
    sourceArchive: "vos.olimpiada.ru",
    grade: 5,
    problemNumber: 5,
    variant: 1,
    originalSource: {
      reference: "I",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2026-27/school/math/tasks-math-5-sch-msk-26-27.pdf",
      page: 6,
    },
    officialSolution: {
      reference: "IS",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2026-27/school/math/sol-math-5-sch-msk-26-27.pdf",
      page: 8,
    },
  },
  assessment: {
    kind: "multiple-choice-set",
    options: [
      {
        id: "start-3328",
        label: "3328",
      },
      {
        id: "start-3329",
        label: "3329",
      },
      {
        id: "start-3337",
        label: "3337",
      },
      {
        id: "start-3338",
        label: "3338",
      },
      {
        id: "start-3339",
        label: "3339",
      },
      {
        id: "start-3330",
        label: "3330",
      },
    ],
    expectedOptionIds: ["start-3328", "start-3338"],
  },
  hints: [
    {
      id: "four-numbers-ten-threes-hint-focus",
      level: "focus",
      text: "Рядом с каждым началом запиши ещё три следующих числа. Считай цифры 3 отдельно в каждом числе.",
    },
    {
      id: "four-numbers-ten-threes-hint-strategy",
      level: "strategy",
      text: "Если при переходе к следующему числу не меняется десяток, то первые три цифры остаются неизменными. Как это ограничивает общий результат?",
    },
    {
      id: "four-numbers-ten-threes-hint-next-step",
      level: "next-step",
      text: "Если десяток меняется посередине четвёрки, первые два числа могут дать одно количество троек, а последние два — другое. Какие два количества в таком случае дадут в сумме 10?",
    },
  ],
  solution: {
    id: "four-numbers-ten-threes-full-solution",
    kind: "training-adaptation",
    text: "Для 3328 получаем 3328, 3329, 3330, 3331: это 2 + 2 + 3 + 3 = 10 троек. Для 3338 получаем 3338, 3339, 3340, 3341: это 3 + 3 + 2 + 2 = 10. Остальные предложенные начала дают 11, 11, 9 и 13 троек соответственно для 3329, 3337, 3339 и 3330.\n\nПочему эти два начала исчерпывают даже все четырёхзначные числа? Если в четвёрке не меняется десяток, общих троек в первых трёх разрядах будет 4, 8, 12 или 0, а в единицах добавится не больше одной. При смене десятка единицы идут от 7, 8 или 9 до 0, 1 или 2, так что троек в единицах нет. Среди первых трёх разрядов число троек может измениться не больше чем на одну: перенос заменяет девятки нулями, а предыдущая цифра увеличивается на один. Для суммы 10 нужны два числа с двумя тройками и два с тремя, то есть смена десятка посередине. Префикс с тремя тройками бывает только 333, а его соседние префиксы — 332 и 334. Это и даёт два найденных начала.",
  },
} as const satisfies ProblemDefinition;
