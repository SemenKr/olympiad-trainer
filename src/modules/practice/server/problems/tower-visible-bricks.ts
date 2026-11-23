import type { ProblemDefinition } from "../problem-catalog";

export const towerVisibleBricksProblem = {
  id: "tower-visible-bricks",
  grade: 5,
  subject: "mathematics",
  title: "Башня с двух сторон",
  statement:
    "Башню сложили из этажей высотой 1. Каждый этаж — квадрат 2 × 2, заполненный двумя одинаковыми брусочками длины 2 и ширины 1. Брусочки на этаже лежат параллельно. Если смотреть спереди, видно 25 брусочков, а если смотреть слева — 32. На каждом этаже дальний брусочек не виден, когда его полностью закрывает ближний. Какова высота башни?",
  provenance: {
    olympiad: "Всероссийская олимпиада школьников",
    subject: "mathematics",
    academicYear: "2026/27",
    stage: "school",
    region: "Moscow",
    sourceArchive: "vos.olimpiada.ru",
    grade: 5,
    problemNumber: 6,
    variant: 1,
    originalSource: {
      reference: "I",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2026-27/school/math/tasks-math-5-sch-msk-26-27.pdf",
      page: 7,
    },
    officialSolution: {
      reference: "IS",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2026-27/school/math/sol-math-5-sch-msk-26-27.pdf",
      page: 10,
    },
  },
  assessment: {
    kind: "nonnegative-integer",
    expectedAnswer: "19",
  },
  hints: [
    {
      id: "tower-visible-bricks-hint-focus",
      level: "focus",
      text: "Нарисуй один квадратный этаж и раздели его на два брусочка. Сколько видно с каждой стороны?",
    },
    {
      id: "tower-visible-bricks-hint-strategy",
      level: "strategy",
      text: "Поверни этот этаж на четверть оборота. Какие числа поменялись местами и что осталось прежним?",
    },
    {
      id: "tower-visible-bricks-hint-next-step",
      level: "next-step",
      text: "Сложи 25 и 32. Какое число добавляет в эту сумму каждый этаж?",
    },
  ],
  solution: {
    id: "tower-visible-bricks-full-solution",
    kind: "training-adaptation",
    text: "У каждого этажа два положения. В одном спереди виден один брусочек, а слева два. В другом спереди видно два, а слева один. Таким образом, в два подсчёта вместе любой этаж вносит 3. Всего получаем 25 + 32 = 57, поэтому этажей 57 : 3 = 19. Башня высотой 19 действительно подходит: 13 этажей дают спереди по одному и слева по два, остальные 6 этажей — наоборот. Получаются 13 + 12 = 25 и 26 + 6 = 32.",
  },
} as const satisfies ProblemDefinition;
