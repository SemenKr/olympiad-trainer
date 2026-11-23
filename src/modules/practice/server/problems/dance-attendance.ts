import type { ProblemDefinition } from "../problem-catalog";

export const danceAttendanceProblem = {
  id: "dance-attendance",
  grade: 5,
  subject: "mathematics",
  title: "Кто пришёл на дискотеку?",
  statement:
    "На школьной дискотеке мальчиков было вдвое больше, чем девочек. Маша не посчитала себя и заметила: остальных девочек на восемь меньше, чем мальчиков. Сколько мальчиков было на дискотеке?",
  provenance: {
    olympiad: "Всероссийская олимпиада школьников",
    subject: "mathematics",
    academicYear: "2020/21",
    stage: "invitational",
    region: "Moscow",
    sourceArchive: "vos.olimpiada.ru",
    grade: 5,
    problemNumber: 4,
    originalSource: {
      reference: "I",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2021-22/prigl/math/tasks-math-5-prigl-msk-21-22.pdf",
      page: 2,
    },
    officialSolution: {
      reference: "IS",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2021-22/prigl/math/sol-math-3-10-prigl-msk-21-22.pdf",
      page: 10,
    },
  },
  assessment: {
    kind: "nonnegative-integer",
    expectedAnswer: "14",
  },
  hints: [
    {
      id: "dance-attendance-hint-focus",
      level: "focus",
      text: "Для первого сравнения Маша входит в число девочек, а для второго — нет. На сколько отличаются эти два числа?",
    },
    {
      id: "dance-attendance-hint-strategy",
      level: "strategy",
      text: "Узнай, на сколько мальчиков больше, чем всех девочек вместе с Машей.",
    },
    {
      id: "dance-attendance-hint-next-step",
      level: "next-step",
      text: "Представь число мальчиков в виде двух групп, в каждой из которых столько же человек, сколько всего девочек. Что показывает разница между мальчиками и девочками?",
    },
  ],
  solution: {
    id: "dance-attendance-full-solution",
    kind: "training-adaptation",
    text: "Когда Маша возвращает себя в подсчёт, девочек становится на одну больше. Разница с мальчиками уменьшается с восьми до семи.\n\nМальчиков можно разделить пополам: в каждой половине столько же человек, сколько девочек. Если из числа всех мальчиков вычесть число девочек, останется ровно одна такая половина. Мы уже знаем, что эта разница равна семи. Значит, всего девочек семь, а мальчиков 2 × 7 = 14.\n\nПроверим оба условия: 14 вдвое больше 7, а других девочек, кроме Маши, 6. Разница 14 − 6 = 8.",
  },
} as const satisfies ProblemDefinition;
