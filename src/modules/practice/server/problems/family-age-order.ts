import type { ProblemDefinition } from "../problem-catalog";

export const familyAgeOrderProblem = {
  id: "family-age-order",
  grade: 5,
  subject: "mathematics",
  title: "Возрасты в двух семьях",
  statement:
    "Андрей, Борис, Светлана и Лариса — четыре человека разного возраста. Каждый из двух мужчин женат на одной из двух женщин, и супруги в этих семьях разные. Муж Ларисы старше всех четверых. По возрасту Андрей находится между Ларисой и Светланой: он старше Ларисы и младше Светланы. Какие утверждения верны?",
  provenance: {
    olympiad: "Всероссийская олимпиада школьников",
    subject: "mathematics",
    academicYear: "2021/22",
    stage: "invitational",
    region: "Moscow",
    sourceArchive: "vos.olimpiada.ru",
    grade: 5,
    problemNumber: 2,
    variant: 1,
    originalSource: {
      reference: "I",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2022-23/prigl/math/tasks-math-5-prigl-msk-22-23.pdf",
      page: 2,
    },
    officialSolution: {
      reference: "IS",
      url: "https://vos.olimpiada.ru/upload/files/Arhive_tasks/2022-23/prigl/math/sol-math-5-prigl-msk-22-23.pdf",
      page: 3,
    },
  },
  assessment: {
    kind: "multiple-choice-set",
    instruction: "Выбери все верные утверждения.",
    options: [
      {
        id: "older-and-married",
        label: "Муж Светланы — Андрей, и Андрей старше Бориса.",
      },
      {
        id: "older-than-wife",
        label: "Светлана — жена Андрея и младше него.",
      },
      {
        id: "youngest-wife",
        label: "Лариса моложе всех, её муж — Борис.",
      },
      {
        id: "older-and-boris",
        label: "Светлана старше Ларисы и состоит в браке с Борисом.",
      },
      {
        id: "larisa-older",
        label: "Лариса замужем за Андреем и старше него.",
      },
      {
        id: "boris-not-svetlana",
        label: "Борис и Светлана не супруги.",
      },
    ],
    expectedOptionIds: ["youngest-wife", "boris-not-svetlana"],
  },
  hints: [
    {
      id: "family-age-order-hint-focus",
      level: "focus",
      text: "Запиши Ларису, Андрея и Светлану по возрасту от младшего к старшему.",
    },
    {
      id: "family-age-order-hint-strategy",
      level: "strategy",
      text: "Может ли Андрей быть самым старшим, если Светлана старше него? Кто из мужчин тогда может быть мужем Ларисы?",
    },
    {
      id: "family-age-order-hint-next-step",
      level: "next-step",
      text: "Когда определишь обе пары, дополни список возрастов четвёртым именем. В утверждениях с «и» проверь обе части.",
    },
  ],
  solution: {
    id: "family-age-order-full-solution",
    kind: "training-adaptation",
    text: "Среди Ларисы, Андрея и Светланы порядок такой: Лариса моложе Андрея, Андрей моложе Светланы. Раз Светлана старше Андрея, он не самый старший. Самый старший — муж Ларисы. Из мужчин остаётся только Борис, значит, он муж Ларисы, а Андрей — муж Светланы. Возраст по возрастанию: Лариса, Андрей, Светлана, Борис.\n\nВерны два утверждения: Лариса младше всех и замужем за Борисом, а Борис и Светлана не супруги. В остальных утверждениях есть ошибка. Андрей младше и Бориса, и своей жены. Борис не муж Светланы. Лариса не жена Андрея и младше него.",
  },
} as const satisfies ProblemDefinition;
