import type { ProblemDefinition } from "../problem-catalog";

export const capSwapCycleProblem = {
  id: "cap-swap-cycle",
  grade: 5,
  subject: "mathematics",
  title: "Обмен кепками",
  statement:
    "У Серёжи синяя кепка, у Коли красная, у Жени жёлтая. Каждое утро Серёжа меняется кепками с Колей, а каждый вечер — с Женей. Какая кепка будет у каждого после вечернего обмена на 28-й день? Выбери три верных пары «мальчик — цвет».",
  provenance: {
    olympiad: "Всероссийская олимпиада школьников",
    subject: "mathematics",
    academicYear: "2026/27",
    stage: "school",
    region: "Moscow",
    sourceArchive: "vos.olimpiada.ru",
    grade: 5,
    problemNumber: 8,
    variant: 1,
    originalSource: {
      reference: "I",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2026-27/school/math/tasks-math-5-sch-msk-26-27.pdf",
      page: 9,
    },
    officialSolution: {
      reference: "IS",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2026-27/school/math/sol-math-5-sch-msk-26-27.pdf",
      page: 13,
    },
  },
  assessment: {
    kind: "multiple-choice-set",
    options: [
      {
        id: "seryozha-blue",
        label: "Серёжа — синяя",
      },
      {
        id: "seryozha-red",
        label: "Серёжа — красная",
      },
      {
        id: "seryozha-yellow",
        label: "Серёжа — жёлтая",
      },
      {
        id: "kolya-blue",
        label: "Коля — синяя",
      },
      {
        id: "kolya-red",
        label: "Коля — красная",
      },
      {
        id: "kolya-yellow",
        label: "Коля — жёлтая",
      },
      {
        id: "zhenya-blue",
        label: "Женя — синяя",
      },
      {
        id: "zhenya-red",
        label: "Женя — красная",
      },
      {
        id: "zhenya-yellow",
        label: "Женя — жёлтая",
      },
    ],
    expectedOptionIds: ["seryozha-yellow", "kolya-blue", "zhenya-red"],
  },
  hints: [
    {
      id: "cap-swap-cycle-hint-focus",
      level: "focus",
      text: "Записывай цвета в одном порядке: Серёжа, Коля, Женя. Сделай сначала два обмена первого дня.",
    },
    {
      id: "cap-swap-cycle-hint-strategy",
      level: "strategy",
      text: "Продолжи запись ещё на пару дней. Когда впервые вернутся исходные цвета?",
    },
    {
      id: "cap-swap-cycle-hint-next-step",
      level: "next-step",
      text: "Раздели 28 на длину цикла. Сколько полных дней остаётся выполнить после целых циклов?",
    },
  ],
  solution: {
    id: "cap-swap-cycle-full-solution",
    kind: "training-adaptation",
    text: "Записываем кепки в порядке Серёжа, Коля, Женя. Старт: синяя, красная, жёлтая. После утра первого дня: красная, синяя, жёлтая. После вечера: жёлтая, синяя, красная. Такой день сдвигает тройку на одно место: (первая, вторая, третья) становится (третья, первая, вторая). После второго дня имеем красную, жёлтую, синюю, после третьего — снова исходную тройку. В 28 днях девять полных троек дней и ещё один день. Поэтому результат совпадает с вечером первого дня.",
  },
} as const satisfies ProblemDefinition;
