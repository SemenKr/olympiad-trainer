import type { ProblemDefinition } from "../problem-catalog";

export const treasureAroundTableProblem = {
  id: "treasure-around-table",
  grade: 5,
  subject: "mathematics",
  title: "Сокровище за круглым столом",
  statement:
    "Шесть гномов сидят по кругу на местах с 1-го по 6-е. Два соседа всегда говорят правду, ещё два соседа всегда лгут. Оставшиеся двое могут отвечать как угодно и не сидят рядом. Гномы с 1-го по 5-е место назвали по порядку такие места, где спрятано одно сокровище: пещера, озеро, замок, лес, озеро. Ответ шестого неизвестен. Где сокровище? Выбери один вариант.",
  provenance: {
    olympiad: "Всероссийская олимпиада школьников",
    subject: "mathematics",
    academicYear: "2018/19",
    stage: "school",
    region: "Moscow",
    sourceArchive: "vos.olimpiada.ru",
    grade: 5,
    problemNumber: 5,
    originalSource: {
      reference: "I",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2018-19/school/math/tasks-math-5-sch-18-9.pdf",
      page: 1,
    },
    officialSolution: {
      reference: "IS",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2018-19/school/math/ans-math-5-sch-18-9.pdf",
      page: 3,
    },
  },
  assessment: {
    kind: "multiple-choice-set",
    options: [
      {
        id: "cave",
        label: "В пещере",
      },
      {
        id: "lake",
        label: "В озере",
      },
      {
        id: "castle",
        label: "В замке",
      },
      {
        id: "forest",
        label: "В лесу",
      },
    ],
    expectedOptionIds: ["cave"],
  },
  hints: [
    {
      id: "treasure-around-table-focus",
      level: "focus",
      text: "Как должны соотноситься ответы двух гномов, которые всегда говорят правду?",
    },
    {
      id: "treasure-around-table-strategy",
      level: "strategy",
      text: "Проверь пары соседей среди пяти известных ответов. Какие ещё пары есть в круге?",
    },
    {
      id: "treasure-around-table-next-step",
      level: "next-step",
      text: "Если правдивы пятый и шестой, попробуй разместить пару лжецов так, чтобы оставшиеся места не были соседними.",
    },
  ],
  solution: {
    id: "treasure-around-table-full-solution",
    kind: "training-adaptation",
    text: "Два правдивых соседа должны назвать одно место. Среди ответов с первого по пятый соседние ответы различаются. Поэтому правдивая пара включает шестого: это места 5 и 6 или места 6 и 1.\n\nЕсли правдивы пятый и шестой, два лжеца могут занять только 2 и 3: при парах 1 и 2 либо 3 и 4 оставшиеся двое сидели бы рядом. Но второй и пятый оба назвали озеро, поэтому один из них не может говорить правду, а другой лгать.\n\nОстаются первый и шестой, значит, сокровище в пещере. Такая рассадка возможна: лжецы на местах 3 и 4, а гномы на местах 2 и 5 могут назвать озеро.",
  },
} as const satisfies ProblemDefinition;
