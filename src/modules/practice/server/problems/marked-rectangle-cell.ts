import type { ProblemDefinition } from "../problem-catalog";

export const markedRectangleCellProblem = {
  id: "marked-rectangle-cell",
  grade: 5,
  subject: "mathematics",
  title: "Одинокая клетка",
  statement:
    "Поле из четырёх столбцов A–D и семи строк 1–7 разрезали по линиям сетки на семь прямоугольников. В шести прямоугольниках записали их площади, по одной отметке на прямоугольник: A1 — 6, D1 — 5, B6 — 5, A7 — 5, C7 — 4, D7 — 2. Седьмой прямоугольник занимает одну клетку и не отмечен. Какая это клетка? Выбери один вариант.",
  provenance: {
    olympiad: "Всероссийская олимпиада школьников",
    subject: "mathematics",
    academicYear: "2023/24",
    stage: "school",
    region: "Moscow",
    sourceArchive: "vos.olimpiada.ru",
    grade: 5,
    problemNumber: 2,
    originalSource: {
      reference: "I",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2023-24/school/math/tasks-math-5-sch-msk-23-24.pdf",
      page: 1,
    },
    officialSolution: {
      reference: "IS",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2023-24/school/math/ans-math-5-sch-msk-23-24.pdf",
      page: 1,
    },
  },
  assessment: {
    kind: "multiple-choice-set",
    options: [
      {
        id: "b3",
        label: "B3",
      },
      {
        id: "c3",
        label: "C3",
      },
      {
        id: "c4",
        label: "C4",
      },
      {
        id: "d6",
        label: "D6",
      },
    ],
    expectedOptionIds: ["c3"],
  },
  hints: [
    {
      id: "marked-rectangle-cell-focus",
      level: "focus",
      text: "Какие целые длины сторон могут быть у прямоугольника из пяти клеток?",
    },
    {
      id: "marked-rectangle-cell-strategy",
      level: "strategy",
      text: "Начни с пятёрок в D1 и A7. Затем проверь, с какой стороны от D7 может быть вторая клетка.",
    },
    {
      id: "marked-rectangle-cell-next-step",
      level: "next-step",
      text: "После первых полос посмотри, какие клетки ещё доступны прямоугольнику с отметкой A1. Хватит ли там места для шести клеток?",
    },
  ],
  solution: {
    id: "marked-rectangle-cell-full-solution",
    kind: "training-adaptation",
    text: "Площадь 5 даёт полосу длиной 5. Горизонтально она не поместится, поэтому от D1 идёт полоса D1–D5, а от A7 — A3–A7. Прямоугольник с отметкой D7 не может включать C7, где есть своя отметка, поэтому занимает D6 и D7.\n\nПрямоугольнику с A1 теперь доступны только три столбца A–C и две верхние строки: ему нужно занять все шесть клеток. Пятёрка в B6 даёт полосу B3–B7. Четвёрка в C7 занимает C4–C7: по горизонтали она не поместится. После этого остаётся только C3.",
  },
} as const satisfies ProblemDefinition;
