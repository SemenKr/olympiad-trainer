import type { ProblemDefinition } from "../problem-catalog";

export const fruitWeightOrderProblem = {
  id: "fruit-weight-order",
  grade: 5,
  subject: "mathematics",
  title: "Фрукты по весу",
  statement:
    "Массы пяти фруктов — 100, 150, 170, 200 и 280 г. Каждая масса принадлежит ровно одному фрукту.\n\nАпельсин тяжелее персика. Персик тяжелее банана, а банан тяжелее яблока и мандарина. Вместе яблоко и банан весят больше апельсина.\n\nВ каком порядке идут фрукты от самого лёгкого к самому тяжёлому?",
  provenance: {
    olympiad: "Всероссийская олимпиада школьников",
    subject: "mathematics",
    academicYear: "2020/21",
    stage: "invitational",
    region: "Moscow",
    sourceArchive: "vos.olimpiada.ru",
    grade: 5,
    problemNumber: 2,
    originalSource: {
      reference: "I",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2021-22/prigl/math/tasks-math-5-prigl-msk-21-22.pdf",
      page: 1,
    },
    officialSolution: {
      reference: "IS",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2021-22/prigl/math/sol-math-3-10-prigl-msk-21-22.pdf",
      page: 9,
    },
  },
  assessment: {
    kind: "multiple-choice-set",
    instruction: "Выбери один порядок от лёгкого к тяжёлому.",
    options: [
      {
        id: "apple-first",
        label: "Яблоко, мандарин, банан, персик, апельсин",
      },
      {
        id: "mandarin-first",
        label: "Мандарин, яблоко, банан, персик, апельсин",
      },
      {
        id: "banana-before-apple",
        label: "Мандарин, банан, яблоко, персик, апельсин",
      },
      {
        id: "peach-last",
        label: "Мандарин, яблоко, банан, апельсин, персик",
      },
    ],
    expectedOptionIds: ["mandarin-first"],
  },
  hints: [
    {
      id: "fruit-weight-order-hint-focus",
      level: "focus",
      text: "Начни с отдельных сравнений: что тяжелее — апельсин, персик или банан?",
    },
    {
      id: "fruit-weight-order-hint-strategy",
      level: "strategy",
      text: "Запиши массы по порядку. Какие три массы можно распределить, пока не сравнивая яблоко с мандарином?",
    },
    {
      id: "fruit-weight-order-hint-next-step",
      level: "next-step",
      text: "Проверь два возможных веса яблока. В каждом случае прибавь массу банана и сравни сумму с массой апельсина.",
    },
  ],
  solution: {
    id: "fruit-weight-order-full-solution",
    kind: "training-adaptation",
    text: "Банан тяжелее и яблока, и мандарина. После него по возрастанию идут персик и апельсин. Значит, банан весит 170 г, персик — 200 г, а апельсин — 280 г. Для яблока и мандарина остаются массы 100 г и 150 г.\n\nЕсли бы яблоко весило 100 г, сумма с бананом была бы 270 г, меньше массы апельсина. Если яблоко весит 150 г, сумма составляет 320 г и условие выполняется. Поэтому мандарин весит 100 г, яблоко — 150 г. Перестановка только этих двух фруктов была единственной альтернативой, и она не подходит.",
  },
} as const satisfies ProblemDefinition;
