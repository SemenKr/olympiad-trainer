import type { ProblemDefinition } from "../problem-catalog";

export const filledCookieWeightRatioProblem = {
  id: "filled-cookie-weight-ratio",
  grade: 5,
  subject: "mathematics",
  title: "Пряники с начинкой",
  statement:
    "В коробке 150 пряников, часть с начинкой, остальные без неё. Все пряники без начинки весят одинаково, а каждый с начинкой вдвое тяжелее. Когда все пряники с начинкой съели, общая масса пряников стала в пять раз меньше. Сколько пряников съели?",
  provenance: {
    olympiad: "Всероссийская олимпиада школьников",
    subject: "mathematics",
    academicYear: "2026/27",
    stage: "invitational",
    region: "Moscow",
    sourceArchive: "vos.olimpiada.ru",
    grade: 5,
    problemNumber: 8,
    originalSource: {
      reference: "I",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2026-27/prigl/math/tasks-math-5-prigl-msk-26-27.pdf",
      page: 2,
    },
    officialSolution: {
      reference: "IS",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2026-27/prigl/math/sol-math-5-prigl-msk-26-27.pdf",
      page: 5,
    },
  },
  assessment: {
    kind: "nonnegative-integer",
    expectedAnswer: "100",
  },
  hints: [
    {
      id: "filled-cookie-weight-ratio-hint-focus",
      level: "focus",
      text: "Сравни массу всех пряников с массой тех, которые остались. Какую часть исходной массы съели?",
    },
    {
      id: "filled-cookie-weight-ratio-hint-strategy",
      level: "strategy",
      text: "Во сколько раз масса съеденных пряников больше массы оставшихся? Вспомни, что пряники двух видов весят по-разному.",
    },
    {
      id: "filled-cookie-weight-ratio-hint-next-step",
      level: "next-step",
      text: "Каждый съеденный пряник весит как два оставшихся. Как отношение масс 4 к 1 перевести в отношение количества штук?",
    },
  ],
  solution: {
    id: "filled-cookie-weight-ratio-full-solution",
    kind: "training-adaptation",
    text: "Оставшиеся пряники составляют одну пятую прежней массы, значит, съеденные весят столько, сколько четыре такие порции. Съеденный пряник весит вдвое больше одного оставшегося, поэтому съеденных по количеству в 4 : 2 = 2 раза больше. Разделим 150 пряников на три одинаковые по количеству доли: одна приходится на пряники без начинки, две на пряники с начинкой. В каждой доле 50, съели 100. Проверка: в единицах массы лёгкого пряника сначала было 50 + 2 · 100 = 250, осталось 50, ровно в пять раз меньше.",
  },
} as const satisfies ProblemDefinition;
