import type { ProblemDefinition } from "../problem-catalog";

export const housesAtEqualIntervalsProblem = {
  id: "houses-at-equal-intervals",
  grade: 5,
  subject: "mathematics",
  title: "Соседи на одной дороге",
  statement:
    "Вдоль дороги стоят шесть домов на равных расстояниях друг от друга. Таня живёт в доме № 1. Остальные дома занимают Дима, Боря, Аня, Вова и Коля, по одному человеку в каждом. От Бори до Димы идти втрое дальше, чем от Бори до Ани. Путь от Бори до Тани такой же длины, как от Бори до Вовы. Выбери все возможные размещения друзей: имена в каждом варианте даны по порядку от дома № 2 до дома № 6.",
  provenance: {
    olympiad: "Всероссийская олимпиада школьников",
    subject: "mathematics",
    academicYear: "2026/27",
    stage: "invitational",
    region: "Moscow",
    sourceArchive: "vos.olimpiada.ru",
    grade: 5,
    problemNumber: 6,
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
    kind: "multiple-choice-set",
    options: [
      {
        id: "anya-first",
        label: "Аня, Боря, Коля, Вова, Дима",
      },
      {
        id: "kolya-first",
        label: "Коля, Боря, Аня, Вова, Дима",
      },
      {
        id: "vova-third",
        label: "Аня, Вова, Коля, Боря, Дима",
      },
      {
        id: "borya-first",
        label: "Боря, Вова, Аня, Дима, Коля",
      },
      {
        id: "dima-third",
        label: "Коля, Боря, Дима, Вова, Аня",
      },
    ],
    expectedOptionIds: ["anya-first", "kolya-first"],
  },
  hints: [
    {
      id: "houses-at-equal-intervals-hint-focus",
      level: "focus",
      text: "Измеряй путь числом промежутков между домами. Какое самое большое расстояние возможно?",
    },
    {
      id: "houses-at-equal-intervals-hint-strategy",
      level: "strategy",
      text: "Расстояние от Бори до Димы в три раза больше ненулевого целого числа. Какое расстояние до Димы в пределах шести домов возможно?",
    },
    {
      id: "houses-at-equal-intervals-hint-next-step",
      level: "next-step",
      text: "Вова должен жить на таком же расстоянии от Бори, как Таня, но по другую сторону. Проверь, может ли Боря жить дальше дома № 3.",
    },
  ],
  solution: {
    id: "houses-at-equal-intervals-full-solution",
    kind: "training-adaptation",
    text: "От Бори до Ани хотя бы один промежуток. От Бори до Димы не больше пяти, поэтому эти расстояния равны 1 и 3. Вова должен быть справа от Бори, потому что Таня живёт слева, в первом доме, и другого дома на таком расстоянии слева нет. Если Боря живёт в доме № 4 или дальше, дом Вовы окажется за пределами шести домов.\n\nПри Боре в доме № 2 Вова живёт в № 3, а Дима в № 5. Ане нужен соседний с Борей дом, но № 1 занят Таней, № 3 — Вовой. Значит, Боря живёт в № 3. Тогда Вова в № 5, Дима в № 6, Аня в № 2 или № 4, а Коля в оставшемся доме. Обе расстановки удовлетворяют всем расстояниям.",
  },
} as const satisfies ProblemDefinition;
