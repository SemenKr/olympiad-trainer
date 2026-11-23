import type { ProblemDefinition } from "../problem-catalog";

export const footballLineEliminationProblem = {
  id: "football-line-elimination",
  grade: 5,
  subject: "mathematics",
  title: "После команды тренера",
  statement:
    "Футболисты встали в ряд. Номера слева направо: 3, 9, 11, 7, 10, 6, 2, 8, 5, 4, 1.\n\nПо команде одновременно уходят все, чей номер меньше номера каждого соседа. У стоящих с краю только один сосед. Оставшиеся смыкают ряд, потом тренер даёт следующую команду. Так продолжается, пока не останется один игрок.\n\nИгорь ушёл по той команде, после которой в ряду осталось ровно трое. Какой у него номер?",
  provenance: {
    olympiad: "Всероссийская олимпиада школьников",
    subject: "mathematics",
    academicYear: "2020/21",
    stage: "school",
    region: "Moscow",
    sourceArchive: "vos.olimpiada.ru",
    grade: 5,
    problemNumber: 1,
    originalSource: {
      reference: "I",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2020-21/school/math/tasks-math-4-11-sch-msk-20-21.pdf",
      page: 4,
    },
    officialSolution: {
      reference: "IS",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2020-21/school/math/ans-math-4-11-sch-msk-20-21.pdf",
      page: 8,
    },
  },
  assessment: {
    kind: "nonnegative-integer",
    expectedAnswer: "5",
  },
  hints: [
    {
      id: "football-line-elimination-hint-focus",
      level: "focus",
      text: "Проверь, кто уходит по первой команде. Сравнивай номера с соседями до того, как кто-либо ушёл.",
    },
    {
      id: "football-line-elimination-hint-strategy",
      level: "strategy",
      text: "Для каждой команды сначала отметь всех, кто уходит. Затем перепиши номера оставшихся подряд и ищи соседей уже в новом ряду.",
    },
    {
      id: "football-line-elimination-hint-next-step",
      level: "next-step",
      text: "После двух команд осталось четыре игрока. Сравни их номера с ближайшими соседями. Кто уйдёт следующим?",
    },
  ],
  solution: {
    id: "football-line-elimination-full-solution",
    kind: "training-adaptation",
    text: "Запишем ряд, который остаётся после каждой команды.\n\nПервая: уходят 3, 7, 2 и 1. Остаются 9, 11, 10, 6, 8, 5, 4.\nВторая: уходят 9, 6 и 4. Остаются 11, 10, 8, 5.\nТретья: уходит 5. Остаются 11, 10, 8.\n\nРовно трое остаются после третьей команды, и на ней ушёл только один игрок. Дальше число игроков уменьшается. Значит, номер Игоря — 5.",
  },
} as const satisfies ProblemDefinition;
