import type { ProblemDefinition } from "../problem-catalog";

export const threeCandyBoxBalancesProblem = {
  id: "three-candy-box-balances",
  grade: 5,
  subject: "mathematics",
  title: "Конфеты в третьей коробке",
  statement:
    "В трёх коробках есть леденцы, шоколадные конфеты и мармеладки. Если сложить содержимое коробок, каждого вида окажется поровну. В первой коробке шоколадных конфет столько же, сколько мармеладок, а леденцов на 7 больше, чем каждого из этих видов. Во второй леденцов столько же, сколько шоколадных, а мармеладок на 15 меньше. В третьей нет леденцов. Сколько всего конфет в третьей коробке?",
  provenance: {
    olympiad: "Всероссийская олимпиада школьников",
    subject: "mathematics",
    academicYear: "2020/21",
    stage: "school",
    region: "Moscow",
    sourceArchive: "vos.olimpiada.ru",
    grade: 5,
    problemNumber: 6,
    originalSource: {
      reference: "I",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2020-21/school/math/tasks-math-4-11-sch-msk-20-21.pdf",
      page: 5,
    },
    officialSolution: {
      reference: "IS",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2020-21/school/math/ans-math-4-11-sch-msk-20-21.pdf",
      page: 11,
    },
  },
  assessment: {
    kind: "nonnegative-integer",
    expectedAnswer: "29",
  },
  hints: [
    {
      id: "three-candy-box-balances-focus",
      level: "focus",
      text: "Точное число конфет в первых коробках неизвестно. Что известно о разностях между видами?",
    },
    {
      id: "three-candy-box-balances-strategy",
      level: "strategy",
      text: "Сравни общее количество леденцов в первых двух коробках отдельно с каждым другим видом.",
    },
    {
      id: "three-candy-box-balances-next-step",
      level: "next-step",
      text: "Для каждого вида вычисли, сколько конфет не хватает до числа леденцов. В какой коробке нужно восполнить эту недостачу?",
    },
  ],
  solution: {
    id: "three-candy-box-balances-full-solution",
    kind: "training-adaptation",
    text: "Шоколадных конфет в первой коробке на 7 меньше, чем леденцов, а во второй их столько же. Значит, в двух коробках вместе шоколадных на 7 меньше. Чтобы итоговые количества совпали, в третьей коробке без леденцов должно быть 7 шоколадных.\n\nМармеладок меньше, чем леденцов, на 7 в первой и на 15 во второй. Третья коробка добавляет 22 мармеладки. Всего в ней 7 + 22 = 29 конфет.",
  },
} as const satisfies ProblemDefinition;
