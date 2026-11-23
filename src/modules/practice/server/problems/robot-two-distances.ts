import type { ProblemDefinition } from "../problem-catalog";

export const robotTwoDistancesProblem = {
  id: "robot-two-distances",
  grade: 5,
  subject: "mathematics",
  title: "Где стоит робот?",
  statement:
    "Поле состоит из 8 строк и 8 столбцов, нумерация начинается в верхнем левом углу. Зелёная клетка находится в строке 3, столбце 5. Красная — в строке 6, столбце 3. Робот ходит по одной клетке за шаг: вверх, вниз, влево или вправо. От его начальной клетки кратчайший путь до зелёной занимает ровно 3 шага, а до красной — ровно 4. Отметь все возможные начальные клетки в виде «строка, столбец».",
  provenance: {
    olympiad: "Всероссийская олимпиада школьников",
    subject: "mathematics",
    academicYear: "2026/27",
    stage: "school",
    region: "Moscow",
    sourceArchive: "vos.olimpiada.ru",
    grade: 5,
    problemNumber: 4,
    variant: 2,
    originalSource: {
      reference: "I",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2026-27/school/math/tasks-math-5-sch-msk-26-27.pdf",
      page: 5,
    },
    officialSolution: {
      reference: "IS",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2026-27/school/math/sol-math-5-sch-msk-26-27.pdf",
      page: 6,
    },
  },
  assessment: {
    kind: "multiple-choice-set",
    options: [
      {
        id: "cell-1-4",
        label: "(1, 4)",
      },
      {
        id: "cell-1-6",
        label: "(1, 6)",
      },
      {
        id: "cell-2-3",
        label: "(2, 3)",
      },
      {
        id: "cell-2-7",
        label: "(2, 7)",
      },
      {
        id: "cell-3-2",
        label: "(3, 2)",
      },
      {
        id: "cell-3-8",
        label: "(3, 8)",
      },
      {
        id: "cell-4-3",
        label: "(4, 3)",
      },
      {
        id: "cell-4-7",
        label: "(4, 7)",
      },
      {
        id: "cell-5-4",
        label: "(5, 4)",
      },
      {
        id: "cell-5-6",
        label: "(5, 6)",
      },
      {
        id: "cell-6-5",
        label: "(6, 5)",
      },
    ],
    expectedOptionIds: ["cell-2-3", "cell-3-2", "cell-5-6"],
  },
  hints: [
    {
      id: "robot-two-distances-hint-focus",
      level: "focus",
      text: "Кратчайший путь можно посчитать даже без рисунка. Как узнать необходимое число шагов вверх или вниз по номерам строк?",
    },
    {
      id: "robot-two-distances-hint-strategy",
      level: "strategy",
      text: "Сложи разницы в номерах строк и столбцов, не учитывая их знак. Сначала отметь клетки на расстоянии 3 от зелёной.",
    },
    {
      id: "robot-two-distances-hint-next-step",
      level: "next-step",
      text: "В строке 2 до зелёной нужен один шаг по вертикали. Остаётся два по горизонтали. Проверь обе клетки этой строки по расстоянию до красной.",
    },
  ],
  solution: {
    id: "robot-two-distances-full-solution",
    kind: "training-adaptation",
    text: "Любой путь должен изменить номер строки и номер столбца на нужное число единиц. Сначала можно пройти по вертикали, затем по горизонтали без лишних движений. Значит, кратчайшее расстояние равно сумме двух разниц.\n\nОт зелёной на расстоянии 3 расположены (1,4), (1,6), (2,3), (2,7), (3,2), (3,8), (4,3), (4,7), (5,4), (5,6), (6,5). Для этих клеток расстояния до красной равны соответственно 6, 8, 4, 8, 4, 8, 2, 6, 2, 4, 2. Остаются (2,3), (3,2) и (5,6). Например, от (5,6) до красной нужен один шаг вниз и три влево.",
  },
} as const satisfies ProblemDefinition;
