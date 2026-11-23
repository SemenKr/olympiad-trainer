import type { ProblemDefinition } from "../problem-catalog";

export const cubeOppositeSumsProblem = {
  id: "cube-opposite-sums",
  grade: 5,
  subject: "mathematics",
  title: "Что может быть на кубике?",
  statement:
    "На шести гранях кубика написали разные числа от 1 до 6, по одному на каждой грани. У одной пары противоположных граней сумма чисел равна 11. Какие из предложенных сумм невозможны для любой из двух других пар противоположных граней?",
  provenance: {
    olympiad: "Всероссийская олимпиада школьников",
    subject: "mathematics",
    academicYear: "2021/22",
    stage: "invitational",
    region: "Moscow",
    sourceArchive: "vos.olimpiada.ru",
    grade: 5,
    problemNumber: 3,
    variant: 1,
    originalSource: {
      reference: "I",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2022-23/prigl/math/tasks-math-5-prigl-msk-22-23.pdf",
      page: 4,
    },
    officialSolution: {
      reference: "IS",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2022-23/prigl/math/sol-math-5-prigl-msk-22-23.pdf",
      page: 5,
    },
  },
  assessment: {
    kind: "multiple-choice-set",
    instruction: "Выбери все невозможные суммы.",
    options: [
      {
        id: "sum-5",
        label: "5",
      },
      {
        id: "sum-6",
        label: "6",
      },
      {
        id: "sum-7",
        label: "7",
      },
      {
        id: "sum-8",
        label: "8",
      },
      {
        id: "sum-9",
        label: "9",
      },
      {
        id: "sum-10",
        label: "10",
      },
    ],
    expectedOptionIds: ["sum-8", "sum-9", "sum-10"],
  },
  hints: [
    {
      id: "cube-opposite-sums-hint-focus",
      level: "focus",
      text: "Какие два разных числа от 1 до 6 дают в сумме 11?",
    },
    {
      id: "cube-opposite-sums-hint-strategy",
      level: "strategy",
      text: "Выпиши четыре оставшихся числа. С каждым из остальных чисел по очереди поставь в пару наименьшее.",
    },
    {
      id: "cube-opposite-sums-hint-next-step",
      level: "next-step",
      text: "После выбора первой пары два числа составят вторую пару. Запиши суммы обеих пар в каждом случае и сравни с вариантами ответа.",
    },
  ],
  solution: {
    id: "cube-opposite-sums-full-solution",
    kind: "training-adaptation",
    text: "Сумму 11 могут дать только числа 5 и 6, поэтому они уже стоят напротив друг друга. Остаются 1, 2, 3 и 4. Переберём, что может быть напротив 1.\n\nНапротив 1 стоит 2: суммы 1 + 2 = 3 и 3 + 4 = 7.\nНапротив 1 стоит 3: суммы 1 + 3 = 4 и 2 + 4 = 6.\nНапротив 1 стоит 4: суммы 1 + 4 = 5 и 2 + 3 = 5.\n\nЛюбое из этих разбиений можно разместить на двух оставшихся парах граней, так как дополнительных условий на порядок чисел нет. Таким образом, 5, 6 и 7 возможны, а 8, 9 и 10 — нет.",
  },
} as const satisfies ProblemDefinition;
