import type { ProblemDefinition } from "../problem-catalog";

export const sevenLineNumberPuzzleProblem = {
  id: "seven-line-number-puzzle",
  grade: 5,
  subject: "mathematics",
  title: "Семь линий с равной суммой",
  statement:
    "Даны девять обозначений: 7, 8, 9 и буквы A, B, C, D, E, F. Вместо каждой буквы поставь одну цифру от 1 до 6, каждую ровно один раз. Сумма чисел в каждой из семи троек должна быть равна 15:\n\n7, C, E\n7, D, F\nA, C, 9\nA, D, E\nA, 8, F\nB, D, 9\nB, 8, E\n\nЗапиши шесть цифр подряд в порядке A, B, C, D, E, F, без пробелов.",
  provenance: {
    olympiad: "Всероссийская олимпиада школьников",
    subject: "mathematics",
    academicYear: "2020/21",
    stage: "school",
    region: "Moscow",
    sourceArchive: "vos.olimpiada.ru",
    grade: 5,
    problemNumber: 4,
    originalSource: {
      reference: "I",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2020-21/school/math/tasks-math-4-11-sch-msk-20-21.pdf",
      page: 5,
    },
    officialSolution: {
      reference: "IS",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2020-21/school/math/ans-math-4-11-sch-msk-20-21.pdf",
      page: 9,
    },
  },
  assessment: {
    kind: "nonnegative-integer",
    expectedAnswer: "412563",
  },
  hints: [
    {
      id: "seven-line-number-puzzle-hint-focus",
      level: "focus",
      text: "Найди строку, в которой все три числа пока заменены буквами. Какую наибольшую сумму могут дать три разные цифры от 1 до 6?",
    },
    {
      id: "seven-line-number-puzzle-hint-strategy",
      level: "strategy",
      text: "Проверь, может ли A или D быть равно 6, используя две тройки с числом 9.",
    },
    {
      id: "seven-line-number-puzzle-hint-next-step",
      level: "next-step",
      text: "После того как найдёшь E, начни с тройки 7, C, E. Затем ищи тройки, где ещё неизвестно только одно число.",
    },
  ],
  solution: {
    id: "seven-line-number-puzzle-full-solution",
    kind: "training-adaptation",
    text: "Сумма A + D + E равна 15. Наибольшие три разные цифры здесь 4, 5, 6, а их сумма как раз 15. Если заменить любую из них меньшей цифрой, сумма уменьшится. Значит, A, D, E — это 4, 5, 6 в некотором порядке.\n\nВ тройке A, C, 9 цифра A не может быть 6: 6 + 9 уже равно 15, а C больше нуля. По той же причине D не может быть 6 в тройке B, D, 9. Поэтому E = 6.\n\nИз 7 + C + 6 = 15 получаем C = 2. Из A + 2 + 9 = 15 получаем A = 4, и оставшаяся из тройки цифра D = 5. Из B + 5 + 9 = 15 получаем B = 1, а из 4 + 8 + F = 15 находим F = 3.\n\nВсе цифры разные. Полная проверка троек: 7 + 2 + 6, 7 + 5 + 3, 4 + 2 + 9, 4 + 5 + 6, 4 + 8 + 3, 1 + 5 + 9 и 1 + 8 + 6 — в каждом случае 15. Ответ в требуемом порядке: 412563.",
  },
} as const satisfies ProblemDefinition;
