import type { ProblemDefinition } from "../problem-catalog";

export const gelPenPriceRatioProblem = {
  id: "gel-pen-price-ratio",
  grade: 5,
  subject: "mathematics",
  title: "Две цены на ручки",
  statement:
    "Влад купил несколько шариковых и несколько гелевых ручек. Все шариковые ручки имеют одну цену, и все гелевые — свою общую цену.\n\nЕсли бы при том же числе ручек все они были гелевыми, покупка стоила бы в четыре раза больше. Если бы все были шариковыми, она стоила бы половину уплаченной суммы. Во сколько раз дороже одна гелевая ручка?",
  provenance: {
    olympiad: "Всероссийская олимпиада школьников",
    subject: "mathematics",
    academicYear: "2020/21",
    stage: "school",
    region: "Moscow",
    sourceArchive: "vos.olimpiada.ru",
    grade: 5,
    problemNumber: 3,
    originalSource: {
      reference: "I",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2020-21/school/math/tasks-math-4-11-sch-msk-20-21.pdf",
      page: 4,
    },
    officialSolution: {
      reference: "IS",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2020-21/school/math/ans-math-4-11-sch-msk-20-21.pdf",
      page: 9,
    },
  },
  assessment: {
    kind: "nonnegative-integer",
    expectedAnswer: "8",
  },
  hints: [
    {
      id: "gel-pen-price-ratio-hint-focus",
      level: "focus",
      text: "Во всех трёх покупках количество ручек одинаковое. Меняется только их вид.",
    },
    {
      id: "gel-pen-price-ratio-hint-strategy",
      level: "strategy",
      text: "Представь цену покупки одних шариковых ручек как одну часть. Сколько таких частей Влад заплатил на самом деле?",
    },
    {
      id: "gel-pen-price-ratio-hint-next-step",
      level: "next-step",
      text: "Цена покупки одних гелевых ручек в четыре раза больше реальной. Вырази её в тех же частях, а затем сравни цены одной ручки.",
    },
  ],
  solution: {
    id: "gel-pen-price-ratio-full-solution",
    kind: "training-adaptation",
    text: "Примем цену набора из одних шариковых ручек за одну часть. Реальная покупка стоит две такие части, ведь набор из одних шариковых стоит половину уплаченной суммы.\n\nНабор из одних гелевых ручек стоит в четыре раза больше реальной покупки: 4 × 2 = 8 частей. В обоих наборах ровно столько же ручек, сколько на самом деле купил Влад. Деление обеих цен наборов на одно и то же число даёт цены за одну ручку и сохраняет отношение. Значит, гелевая ручка стоит в 8 раз дороже.",
  },
} as const satisfies ProblemDefinition;
