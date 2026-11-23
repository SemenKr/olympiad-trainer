import type { ProblemDefinition } from "../problem-catalog";

export const gymOutfitColorsProblem = {
  id: "gym-outfit-colors",
  grade: 5,
  subject: "mathematics",
  title: "Цвета спортивной формы",
  statement:
    "У Алины, Богдана, Вики и Гриши на уроке физкультуры были футболки и шорты. Каждый предмет одежды был либо красным, либо синим.\n\nФутболки Алины и Богдана красные, а их шорты разного цвета. У Вики и Гриши шорты синие, а футболки разных цветов. Футболки двух девочек разного цвета, и шорты девочек тоже различаются по цвету.\n\nДля каждого из четырёх ребят выбери подходящее описание его одежды.",
  provenance: {
    olympiad: "Всероссийская олимпиада школьников",
    subject: "mathematics",
    academicYear: "2020/21",
    stage: "school",
    region: "Moscow",
    sourceArchive: "vos.olimpiada.ru",
    grade: 5,
    problemNumber: 2,
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
    kind: "multiple-choice-set",
    instruction: "Отметь по одному описанию для каждого из ребят.",
    options: [
      {
        id: "alina-red-red",
        label: "Алина: красная футболка, красные шорты",
      },
      {
        id: "alina-red-blue",
        label: "Алина: красная футболка, синие шорты",
      },
      {
        id: "bogdan-red-red",
        label: "Богдан: красная футболка, красные шорты",
      },
      {
        id: "bogdan-red-blue",
        label: "Богдан: красная футболка, синие шорты",
      },
      {
        id: "vika-red-blue",
        label: "Вика: красная футболка, синие шорты",
      },
      {
        id: "vika-blue-blue",
        label: "Вика: синяя футболка, синие шорты",
      },
      {
        id: "grisha-red-blue",
        label: "Гриша: красная футболка, синие шорты",
      },
      {
        id: "grisha-blue-blue",
        label: "Гриша: синяя футболка, синие шорты",
      },
    ],
    expectedOptionIds: [
      "alina-red-red",
      "bogdan-red-blue",
      "vika-blue-blue",
      "grisha-red-blue",
    ],
  },
  hints: [
    {
      id: "gym-outfit-colors-hint-focus",
      level: "focus",
      text: "Раздели задачу на две части: выясни цвета футболок, потом цвета шорт.",
    },
    {
      id: "gym-outfit-colors-hint-strategy",
      level: "strategy",
      text: "У Алины точно красная футболка. Какого цвета футболка Вики, если цвета футболок у девочек различаются?",
    },
    {
      id: "gym-outfit-colors-hint-next-step",
      level: "next-step",
      text: "Шорты Вики синие. Определи цвет шорт Алины и воспользуйся тем, что у Алины и Богдана шорты разные.",
    },
  ],
  solution: {
    id: "gym-outfit-colors-full-solution",
    kind: "training-adaptation",
    text: "Алина и Богдан носят красные футболки. Футболки Алины и Вики различаются, поэтому у Вики она синяя. Футболка Гриши отличается от футболки Вики, значит, она красная.\n\nШорты Вики и Гриши синие. У Алины шорты другого цвета, чем у Вики, значит, они красные. У Богдана шорты отличаются от шорт Алины, поэтому они синие.\n\nПолучаем: Алина — всё красное, Вика — всё синее, Богдан и Гриша — красная футболка и синие шорты. Каждое решение о цвете было вынужденным, поэтому другой набор не подойдёт.",
  },
} as const satisfies ProblemDefinition;
