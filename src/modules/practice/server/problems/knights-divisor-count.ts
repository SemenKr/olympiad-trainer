import type { ProblemDefinition } from "../problem-catalog";

export const knightsDivisorCountProblem = {
  id: "knights-divisor-count",
  grade: 5,
  subject: "mathematics",
  title: "Кто сказал правду о делителях?",
  statement:
    "Среди десяти островитян есть и рыцари, которые всегда говорят правду, и лжецы, которые всегда лгут. Островитяне пронумерованы от 1 до 10. Каждый сказал одну фразу: «Число лжецов делится на мой номер». Сколько рыцарей в этой десятке?",
  provenance: {
    olympiad: "Всероссийская олимпиада школьников",
    subject: "mathematics",
    academicYear: "2026/27",
    stage: "invitational",
    region: "Moscow",
    sourceArchive: "vos.olimpiada.ru",
    grade: 5,
    problemNumber: 7,
    originalSource: {
      reference: "I",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2026-27/prigl/math/tasks-math-5-prigl-msk-26-27.pdf",
      page: 2,
    },
    officialSolution: {
      reference: "IS",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2026-27/prigl/math/sol-math-5-prigl-msk-26-27.pdf",
      page: 4,
    },
  },
  assessment: {
    kind: "nonnegative-integer",
    expectedAnswer: "4",
  },
  hints: [
    {
      id: "knights-divisor-count-hint-focus",
      level: "focus",
      text: "Какая фраза обязательно верна при любом числе лжецов?",
    },
    {
      id: "knights-divisor-count-hint-strategy",
      level: "strategy",
      text: "Представь, что лжецов, например, 4. Перечисли номера тех, кто тогда говорит правду.",
    },
    {
      id: "knights-divisor-count-hint-next-step",
      level: "next-step",
      text: "Для каждого числа лжецов от 1 до 9 посчитай его делители. При каком выборе сумма числа лжецов и числа верных фраз равна 10?",
    },
  ],
  solution: {
    id: "knights-divisor-count-full-solution",
    kind: "training-adaptation",
    text: "Если лжецов n, то правду скажут люди с номерами-делителями n. Каждый такой номер не больше 10, потому что n лежит между 1 и 9. Для n от 1 до 9 числа делителей по порядку равны 1, 2, 2, 3, 2, 4, 2, 4, 3. Прибавив к ним соответствующие n, получаем 2, 4, 5, 7, 7, 10, 9, 12, 12. Ровно 10 получается только при шести лжецах. При таком выборе делители 6 — это 1, 2, 3 и 6, и фразы именно этих четырёх людей правдивы. Остальные шесть фраз ложны, то есть такое распределение действительно возможно.",
  },
} as const satisfies ProblemDefinition;
