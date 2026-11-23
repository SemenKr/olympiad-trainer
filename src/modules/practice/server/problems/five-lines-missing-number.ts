import type { ProblemDefinition } from "../problem-catalog";

export const fiveLinesMissingNumberProblem = {
  id: "five-lines-missing-number",
  grade: 5,
  subject: "mathematics",
  title: "Одно число осталось",
  statement:
    "Есть семь кружков: A, B, C, D, E, F, G. Пять линий проходят через такие группы кружков:\n\nA, B, C, D\nA, E\nD, F\nE, B, G\nF, C, G\n\nВ кружки вписали семь разных чисел от 1 до 8. Суммы на всех пяти линиях получились одинаковыми. Какое число осталось неиспользованным?",
  provenance: {
    olympiad: "Всероссийская олимпиада школьников",
    subject: "mathematics",
    academicYear: "2019/20",
    stage: "school",
    region: "Moscow",
    sourceArchive: "vos.olimpiada.ru",
    grade: 5,
    problemNumber: 8,
    originalSource: {
      reference: "I",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2019-20/school/math/tasks-math-5-sch-msk-19-20.pdf",
      page: 1,
    },
    officialSolution: {
      reference: "IS",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2019-20/school/math/ans-math-5-sch-msk-19-20.pdf",
      page: 3,
    },
  },
  assessment: {
    kind: "nonnegative-integer",
    expectedAnswer: "6",
  },
  hints: [
    {
      id: "five-lines-missing-number-hint-focus",
      level: "focus",
      text: "Посчитай по списку, на скольких линиях находится каждый кружок.",
    },
    {
      id: "five-lines-missing-number-hint-strategy",
      level: "strategy",
      text: "Сложи суммы пяти линий. С одной стороны ты получишь пять одинаковых слагаемых. С другой — каждое использованное число встретится дважды. Что это говорит об общей сумме семи чисел?",
    },
    {
      id: "five-lines-missing-number-hint-next-step",
      level: "next-step",
      text: "Вычти из суммы 1 + 2 + … + 8 по одному возможному пропущенному числу. Оставь случаи, когда разность делится на 5, и проверь две линии из двух кружков.",
    },
  ],
  solution: {
    id: "five-lines-missing-number-full-solution",
    kind: "training-adaptation",
    text: "Каждый кружок входит ровно в две линии. Поэтому сумма пяти одинаковых сумм равна удвоенной сумме семи вписанных чисел. Удвоенная сумма делится на 5, значит, сама сумма тоже делится на 5: удваивание числа с ненулевым остатком от деления на 5 не убирает этот остаток.\n\nВсе числа от 1 до 8 дают в сумме 36. Среди чисел от 28 до 35 только 30 и 35 делятся на 5. Поэтому пропущено либо 6, либо 1.\n\nЕсли пропущена 1, то на каждой линии должна быть сумма 35 × 2 : 5 = 14. Среди чисел 2–8 лишь пара 6 и 8 даёт 14. Но линии A, E и D, F состоят каждая из двух разных кружков и не имеют общих кружков. Использовать 6 и 8 на обеих нельзя.\n\nПроверим, что пропустить 6 действительно можно. Возьмём A = 4, B = 1, C = 2, D = 5, E = 8, F = 7, G = 3. На пяти линиях получим 4 + 1 + 2 + 5, 4 + 8, 5 + 7, 8 + 1 + 3 и 7 + 2 + 3. Все суммы равны 12. Ответ — 6.",
  },
} as const satisfies ProblemDefinition;
