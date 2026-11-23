import type { ProblemDefinition } from "../problem-catalog";

export const questTeammateMatchingProblem = {
  id: "quest-teammate-matching",
  grade: 5,
  subject: "mathematics",
  title: "Пары для квеста",
  statement:
    "На квест пришли четыре брата и четыре сестры. У брата и сестры одинаковая фамилия. В порядке от старшего к младшему участники идут так: Артём Соколов, Миша Волков, Катя Волкова, Илья Морозов, Лена Морозова, Кирилл Лебедев, Маша Лебедева, Оля Соколова. В каждой команде два человека: мальчик и девочка, причём мальчик старше. Брат и сестра не могут оказаться вместе. Отметь все четыре команды.",
  provenance: {
    olympiad: "Всероссийская олимпиада школьников",
    subject: "mathematics",
    academicYear: "2026/27",
    stage: "school",
    region: "Moscow",
    sourceArchive: "vos.olimpiada.ru",
    grade: 5,
    problemNumber: 3,
    variant: 1,
    originalSource: {
      reference: "I",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2026-27/school/math/tasks-math-5-sch-msk-26-27.pdf",
      page: 3,
    },
    officialSolution: {
      reference: "IS",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2026-27/school/math/sol-math-5-sch-msk-26-27.pdf",
      page: 5,
    },
  },
  assessment: {
    kind: "multiple-choice-set",
    options: [
      {
        id: "artem-katya",
        label: "Артём и Катя",
      },
      {
        id: "artem-lena",
        label: "Артём и Лена",
      },
      {
        id: "artem-masha",
        label: "Артём и Маша",
      },
      {
        id: "artem-olya",
        label: "Артём и Оля",
      },
      {
        id: "misha-katya",
        label: "Миша и Катя",
      },
      {
        id: "misha-lena",
        label: "Миша и Лена",
      },
      {
        id: "misha-masha",
        label: "Миша и Маша",
      },
      {
        id: "misha-olya",
        label: "Миша и Оля",
      },
      {
        id: "ilya-katya",
        label: "Илья и Катя",
      },
      {
        id: "ilya-lena",
        label: "Илья и Лена",
      },
      {
        id: "ilya-masha",
        label: "Илья и Маша",
      },
      {
        id: "ilya-olya",
        label: "Илья и Оля",
      },
      {
        id: "kirill-katya",
        label: "Кирилл и Катя",
      },
      {
        id: "kirill-lena",
        label: "Кирилл и Лена",
      },
      {
        id: "kirill-masha",
        label: "Кирилл и Маша",
      },
      {
        id: "kirill-olya",
        label: "Кирилл и Оля",
      },
    ],
    expectedOptionIds: [
      "artem-katya",
      "misha-lena",
      "ilya-masha",
      "kirill-olya",
    ],
  },
  hints: [
    {
      id: "quest-teammate-matching-hint-focus",
      level: "focus",
      text: "Начни с самой старшей девочки. Сколько мальчиков находятся в списке до неё?",
    },
    {
      id: "quest-teammate-matching-hint-strategy",
      level: "strategy",
      text: "Зачеркни брата среди возможных напарников Кати. Убери найденную пару из списка и переходи к самой старшей из оставшихся девочек.",
    },
    {
      id: "quest-teammate-matching-hint-next-step",
      level: "next-step",
      text: "После Кати займись Леной, затем Машей. Каждый раз оставляй только свободных мальчиков, которые старше и не являются братьями.",
    },
  ],
  solution: {
    id: "quest-teammate-matching-full-solution",
    kind: "training-adaptation",
    text: "Старше Кати только Артём и Миша. Миша её брат, поэтому Катя в команде с Артёмом. Старше Лены из свободных мальчиков только Миша и Илья. Илья её брат, и Лене подходит Миша. Старше Маши ещё свободны Илья и Кирилл, но Кирилл её брат. Значит, Маша в команде с Ильёй. Последние двое — Кирилл и Оля: Кирилл старше, фамилии разные, значит, они образуют четвёртую команду. На каждом шаге возможен ровно один выбор, поэтому другого распределения нет.",
  },
} as const satisfies ProblemDefinition;
