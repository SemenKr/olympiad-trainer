export const SIMULATION_PROBLEM_IDS = [
  "exact-coin-payments",
  "knights-all-or-none",
  "truck-car-same-arrival",
  "largest-valid-eight-digit",
] as const;
export const SIMULATION_DURATION_MS = 45 * 60 * 1000;
export const MAX_DRAFT_LENGTH = 12000;
export type SimulationDrafts = readonly [string, string, string, string];
export type SimulationWork = Readonly<{
  drafts: SimulationDrafts;
  selectedIndex: number;
}>;
export type SimulationAttempt = SimulationWork &
  Readonly<{
    mode: "simulation";
    sessionId: string;
    revision: number;
    startedAt: number;
    deadlineAt: number;
    finishedAt: number | null;
    finishReason: "early" | "timeout" | null;
  }>;
export type SimulationSnapshot = Readonly<{
  attempt: SimulationAttempt | null;
  serverNow: number;
}>;
export type SimulationProblem = Readonly<{
  problemId: string;
  title: string;
  statement: string;
  options: readonly string[];
}>;
export type SimulationReference = Readonly<{
  problemId: string;
  text: string;
}>;

export function requireSimulationId(value: unknown): string {
  if (
    typeof value !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(
      value,
    )
  )
    throw new Error("Invalid simulation session ID.");
  return value;
}

export function requireSimulationWork(value: unknown): SimulationWork {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    throw new Error("Invalid simulation work.");
  const input = value as Record<string, unknown>;
  if (
    !Array.isArray(input.drafts) ||
    input.drafts.length !== 4 ||
    !input.drafts.every(
      (draft) => typeof draft === "string" && draft.length <= MAX_DRAFT_LENGTH,
    ) ||
    typeof input.selectedIndex !== "number" ||
    !Number.isInteger(input.selectedIndex) ||
    input.selectedIndex < 0 ||
    input.selectedIndex > 3
  )
    throw new Error("Invalid simulation work.");
  return {
    drafts: [
      input.drafts[0],
      input.drafts[1],
      input.drafts[2],
      input.drafts[3],
    ],
    selectedIndex: input.selectedIndex,
  };
}

export function requireSimulationRevision(value: unknown): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0)
    throw new Error("Invalid simulation revision.");
  return value;
}

export function newSimulation(
  sessionId: string,
  now: number,
): SimulationAttempt {
  return {
    mode: "simulation",
    sessionId,
    revision: 0,
    drafts: ["", "", "", ""],
    selectedIndex: 0,
    startedAt: now,
    deadlineAt: now + SIMULATION_DURATION_MS,
    finishedAt: null,
    finishReason: null,
  };
}

export function expireSimulation(
  attempt: SimulationAttempt,
  now: number,
): SimulationAttempt {
  return attempt.finishedAt === null && now >= attempt.deadlineAt
    ? {
        ...attempt,
        finishedAt: attempt.deadlineAt,
        finishReason: "timeout",
        revision: attempt.revision + 1,
      }
    : attempt;
}

export function sameSimulationWork(
  a: SimulationWork,
  b: SimulationWork,
): boolean {
  return (
    a.selectedIndex === b.selectedIndex &&
    a.drafts.every((draft, i) => draft === b.drafts[i])
  );
}

export function updateSimulation(
  attempt: SimulationAttempt,
  revision: number,
  work: SimulationWork,
  now: number,
  finish: boolean,
  confirmed: boolean,
): SimulationAttempt {
  const current = expireSimulation(attempt, now);
  if (current.finishedAt !== null) return current;
  // A lost save response may be retried without overwriting newer work.
  if (
    revision !== current.revision &&
    !(revision === current.revision - 1 && sameSimulationWork(current, work))
  )
    throw new Error(
      "Simulation changed in another tab. Reload before editing.",
    );
  if (finish && !confirmed)
    throw new Error("Early Finish requires confirmation.");
  if (!finish && revision === current.revision - 1) return current;
  return {
    ...current,
    ...work,
    revision: current.revision + 1,
    finishedAt: finish ? now : null,
    finishReason: finish ? "early" : null,
  };
}

export function remainingSimulationSeconds(
  attempt: SimulationAttempt,
  now: number,
): number {
  return attempt.finishedAt !== null
    ? 0
    : Math.max(0, Math.ceil((attempt.deadlineAt - now) / 1000));
}
