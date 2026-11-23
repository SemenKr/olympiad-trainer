import type { ProblemDefinition } from "../problem-catalog";

export const restoreGridRowSumsProblem = {
  id: "restore-grid-row-sums",
  grade: 5,
  subject: "mathematics",
  title: "Числа под буквами",
  statement:
    "В таблице 3 × 3 были записаны числа от 1 до 9, каждое один раз. Сумма каждой строки и каждого столбца была равна 15. Числа от 1 до 5 заменили буквами:\n\nВерхняя строка: 9, A, B.\nСредняя строка: C, 6, 7.\nНижняя строка: D, 8, E.\n\nВосстанови числа. Запиши их подряд в порядке A, B, C, D, E без пробелов.",
  provenance: {
    olympiad: "Всероссийская олимпиада школьников",
    subject: "mathematics",
    academicYear: "2020/21",
    stage: "invitational",
    region: "Moscow",
    sourceArchive: "vos.olimpiada.ru",
    grade: 5,
    problemNumber: 1,
    originalSource: {
      reference: "I",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2020-21/prigl/math/tasks-math-5-prigl-msk-20-21.pdf",
      page: 1,
    },
    officialSolution: {
      reference: "IS",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2020-21/prigl/math/ans-math-5-prigl-msk-20-21.pdf",
      page: 1,
    },
  },
  assessment: {
    kind: "nonnegative-integer",
    expectedAnswer: "15243",
  },
  hints: [
    {
      id: "restore-grid-row-sums-hint-focus",
      level: "focus",
      text: "Найди строку или столбец, где видны сразу два числа.",
    },
    {
      id: "restore-grid-row-sums-hint-strategy",
      level: "strategy",
      text: "Во второй строке уже видны 6 и 7, во втором столбце — 6 и 8. Из каких вычитаний можно узнать C и A?",
    },
    {
      id: "restore-grid-row-sums-hint-next-step",
      level: "next-step",
      text: "Подставь найденные числа на свои места. Используй верхнюю строку для B и первый столбец для D. Как после этого узнать E?",
    },
  ],
  solution: {
    id: "restore-grid-row-sums-full-solution",
    kind: "training-adaptation",
    text: "В средней строке C + 6 + 7 = 15, поэтому C = 2. Во втором столбце A + 6 + 8 = 15, поэтому A = 1.\n\nВ верхней строке 9 + 1 + B = 15, значит, B = 5. Первый столбец даёт 9 + 2 + D = 15, откуда D = 4. Внизу 4 + 8 + E = 15, поэтому E = 3.\n\nПолучилась таблица со строками 9, 1, 5; 2, 6, 7; 4, 8, 3. Все строки и столбцы дают 15, и каждое число использовано один раз. На каждом шаге неизвестное число определялось единственным образом. В порядке A, B, C, D, E ответ выглядит так: 15243.",
  },
} as const satisfies ProblemDefinition;
