import type { ProblemDefinition } from "../problem-catalog";

export const bridgedGridSquareCountProblem = {
  id: "bridged-grid-square-count",
  grade: 5,
  subject: "mathematics",
  title: "Квадраты в фигуре с перемычкой",
  statement:
    "Есть клетчатая фигура из четырёх строк и семи столбцов. В первой и последней строках нет клетки в столбце 4. Во второй и третьей строках есть все семь клеток. Других пропусков нет.\n\nСколькими способами можно выбрать в этой фигуре четыре соседние клетки, составляющие квадрат 2 × 2 по линиям сетки?",
  provenance: {
    olympiad: "Всероссийская олимпиада школьников",
    subject: "mathematics",
    academicYear: "2024/25",
    stage: "invitational",
    region: "Moscow",
    sourceArchive: "vos.olimpiada.ru",
    grade: 5,
    problemNumber: 2,
    originalSource: {
      reference: "I",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2024-25/prigl/math/tasks-math-5-prigl-msk-24-25.pdf",
      page: 1,
    },
    officialSolution: {
      reference: "IS",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2024-25/prigl/math/sol-math-5-prigl-msk-24-25.pdf",
      page: 1,
    },
  },
  assessment: {
    kind: "nonnegative-integer",
    expectedAnswer: "14",
  },
  hints: [
    {
      id: "bridged-grid-square-count-hint-focus",
      level: "focus",
      text: "Каждый квадрат 2 × 2 определяется положением своей верхней левой клетки.",
    },
    {
      id: "bridged-grid-square-count-hint-strategy",
      level: "strategy",
      text: "Разбери три случая: квадрат занимает строки 1 и 2, строки 2 и 3 или строки 3 и 4.",
    },
    {
      id: "bridged-grid-square-count-hint-next-step",
      level: "next-step",
      text: "В паре строк, где отсутствует клетка в столбце 4, квадрат не может захватить этот столбец. Какие пары соседних столбцов тогда подходят?",
    },
  ],
  solution: {
    id: "bridged-grid-square-count-full-solution",
    kind: "training-adaptation",
    text: "Квадрат 2 × 2 занимает две соседние строки и два соседних столбца. Посчитаем варианты по паре строк.\n\nДля строк 1 и 2 нельзя использовать столбец 4. Подходят пары 1–2, 2–3, 5–6 и 6–7: четыре квадрата. Строки 2 и 3 полные, поэтому подходит любая из шести пар соседних столбцов. Для строк 3 и 4 снова нельзя использовать столбец 4, поэтому таких квадратов четыре.\n\nВсего 4 + 6 + 4 = 14. Каждый квадрат посчитан один раз, поскольку его пара строк и пара столбцов определены однозначно.",
  },
} as const satisfies ProblemDefinition;
