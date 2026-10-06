import {
  PRACTICE_PACKS,
  packById,
  type PackId,
} from "./completed-practice-episode";

export const LEARNING_PATH_V1 = [
  {
    packId: "pack-a",
    description:
      "Логика, площади и подсчёт: три разные идеи в одной тренировке.",
  },
  {
    packId: "pack-j",
    description:
      "Цена, школьные уроки и фигурки: переводим условия в точный счёт.",
  },
  {
    packId: "pack-h",
    description:
      "Сравниваем количества, средние значения и зависимости между величинами.",
  },
  {
    packId: "pack-l",
    description:
      "Календарь, круг и распределения: замечаем порядок и допустимые варианты.",
  },
  {
    packId: "pack-d",
    description: "Разбиваем подсчёт на случаи и ищем устройство задачи.",
  },
  {
    packId: "pack-g",
    description:
      "Ищем границы и считаем варианты так, чтобы ничего не пропустить.",
  },
  {
    packId: "pack-e",
    description:
      "Проверяем утверждения и отсекаем варианты через условия и противоречия.",
  },
  {
    packId: "pack-i",
    description: "Разбираем порядок, расстояния и связи между частями задачи.",
  },
  {
    packId: "pack-c",
    description: "Работаем с цифрами, ограничениями и подсчётом связей.",
  },
  {
    packId: "pack-b",
    description:
      "Связываем события во времени, логические утверждения и цепочки сравнений.",
  },
  {
    packId: "pack-f",
    description:
      "Строим модель задачи и выбираем стратегию для необычных условий.",
  },
  {
    packId: "pack-k",
    description: "Собираем несколько условий в одно доказательное рассуждение.",
  },
] as const satisfies readonly Readonly<{
  packId: PackId;
  description: string;
}>[];

export type LearningPathEntry = Readonly<{
  packId: PackId;
  name: string;
  description: string;
  position: number;
  completed: boolean;
  suggested: boolean;
}>;

function completedSet(completedPackIds: readonly PackId[]) {
  return new Set(completedPackIds);
}

export function getLearningPathProjection(
  completedPackIds: readonly PackId[],
): Readonly<{
  entries: readonly LearningPathEntry[];
  completedCount: number;
  totalCount: number;
  nextPackId: PackId | null;
  allRecorded: boolean;
}> {
  const completed = completedSet(completedPackIds);
  const next = LEARNING_PATH_V1.find(({ packId }) => !completed.has(packId));
  const entries = LEARNING_PATH_V1.map((entry, index) => {
    const pack = packById(entry.packId);
    if (!pack) throw new Error("Learning Path references an unknown Pack.");
    return {
      packId: entry.packId,
      name: pack.name,
      description: entry.description,
      position: index + 1,
      completed: completed.has(entry.packId),
      suggested: next?.packId === entry.packId,
    };
  });
  const completedCount = entries.filter((entry) => entry.completed).length;
  return {
    entries,
    completedCount,
    totalCount: PRACTICE_PACKS.length,
    nextPackId: next?.packId ?? null,
    allRecorded: next === undefined,
  };
}

export function isLearningPathPackId(value: unknown): value is PackId {
  return (
    typeof value === "string" &&
    LEARNING_PATH_V1.some(({ packId }) => packId === value)
  );
}
