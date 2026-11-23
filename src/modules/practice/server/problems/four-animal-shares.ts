import type { ProblemDefinition } from "../problem-catalog";

export const fourAnimalSharesProblem = {
  id: "four-animal-shares",
  grade: 5,
  subject: "mathematics",
  title: "Угощение для четырёх зверей",
  statement:
    "Четыре зверя получили в сумме 2026 конфет. Крокодил получил меньше всех. Носорогу досталось на 2 конфеты больше, чем крокодилу, бегемоту — на 1 больше, чем носорогу, а слону — ещё на 2 больше, чем бегемоту. Сколько конфет получил слон?",
  provenance: {
    olympiad: "Всероссийская олимпиада школьников",
    subject: "mathematics",
    academicYear: "2026/27",
    stage: "school",
    region: "Moscow",
    sourceArchive: "vos.olimpiada.ru",
    grade: 5,
    problemNumber: 2,
    variant: 1,
    originalSource: {
      reference: "I",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2026-27/school/math/tasks-math-5-sch-msk-26-27.pdf",
      page: 3,
    },
    officialSolution: {
      reference: "IS",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2026-27/school/math/sol-math-5-sch-msk-26-27.pdf",
      page: 3,
    },
  },
  assessment: {
    kind: "nonnegative-integer",
    expectedAnswer: "509",
  },
  hints: [
    {
      id: "four-animal-shares-hint-focus",
      level: "focus",
      text: "Удобно сравнивать все четыре порции с одной и той же порцией. Чья порция самая маленькая?",
    },
    {
      id: "four-animal-shares-hint-strategy",
      level: "strategy",
      text: "Найди, сколько конфет сверх порции крокодила досталось каждому из остальных.",
    },
    {
      id: "four-animal-shares-hint-next-step",
      level: "next-step",
      text: "Мысленно убери все добавки. Останутся четыре равные порции. Как найти одну из них и затем вернуть добавку слона?",
    },
  ],
  solution: {
    id: "four-animal-shares-full-solution",
    kind: "training-adaptation",
    text: "Если порцию крокодила считать основной, добавка носорога равна 2, бегемота — 2 + 1 = 3, слона — 3 + 2 = 5. Всего добавок 2 + 3 + 5 = 10. Уберём их: останется 2026 − 10 = 2016 конфет, то есть четыре одинаковые порции по 504. Слон получил 504 + 5 = 509 конфет. Проверка: 504 + 506 + 507 + 509 = 2026, и все разности совпадают с условием.",
  },
} as const satisfies ProblemDefinition;
