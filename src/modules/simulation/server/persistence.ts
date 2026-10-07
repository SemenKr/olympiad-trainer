import "server-only";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import {
  withAuthenticatedLearner,
  type AuthenticatedLearner,
} from "../../practice/server/learner-auth";
import { simulationAttempts } from "./schema";
import {
  expireSimulation,
  newSimulation,
  updateSimulation,
  requireSimulationId,
  requireSimulationRevision,
  requireSimulationWork,
  type SimulationAttempt,
} from "../domain/simulation";

function fromRow(
  row: typeof simulationAttempts.$inferSelect,
): SimulationAttempt {
  return {
    mode: "simulation",
    sessionId: row.sessionId,
    revision: row.revision,
    ...requireSimulationWork(row),
    startedAt: row.startedAt.getTime(),
    deadlineAt: row.deadlineAt.getTime(),
    finishedAt: row.finishedAt?.getTime() ?? null,
    finishReason: row.finishReason,
  };
}

function toRow(attempt: SimulationAttempt) {
  return {
    sessionId: attempt.sessionId,
    revision: attempt.revision,
    drafts: attempt.drafts,
    selectedIndex: attempt.selectedIndex,
    startedAt: new Date(attempt.startedAt),
    deadlineAt: new Date(attempt.deadlineAt),
    finishedAt:
      attempt.finishedAt === null ? null : new Date(attempt.finishedAt),
    finishReason: attempt.finishReason,
  };
}

type Operation =
  | Readonly<{ kind: "read" | "start" }>
  | Readonly<{
      kind: "save" | "finish";
      sessionId: unknown;
      revision: unknown;
      work: unknown;
      confirmed?: unknown;
    }>;

export async function transactSimulation(
  context: AuthenticatedLearner,
  operation: Operation,
) {
  const learnerId = context.learnerId;
  const input =
    operation.kind === "save" || operation.kind === "finish"
      ? {
          sessionId: requireSimulationId(operation.sessionId),
          revision: requireSimulationRevision(operation.revision),
          work: requireSimulationWork(operation.work),
          confirmed: operation.confirmed === true,
        }
      : null;
  return withAuthenticatedLearner(context, async (tx) => {
    const [row] = await tx
      .select()
      .from(simulationAttempts)
      .where(eq(simulationAttempts.learnerId, learnerId));
    const now = Date.now();
    const previous = row ? fromRow(row) : null;
    let attempt = previous ? expireSimulation(previous, now) : null;
    if (operation.kind === "start" && attempt === null) {
      attempt = newSimulation(randomUUID(), now);
      await tx
        .insert(simulationAttempts)
        .values({ learnerId, ...toRow(attempt) });
    } else if (input) {
      if (!attempt || attempt.sessionId !== input.sessionId)
        throw new Error("Unknown simulation attempt.");
      attempt = updateSimulation(
        attempt,
        input.revision,
        input.work,
        now,
        operation.kind === "finish",
        input.confirmed,
      );
    }
    if (attempt && previous && attempt !== previous) {
      await tx
        .update(simulationAttempts)
        .set(toRow(attempt))
        .where(eq(simulationAttempts.learnerId, learnerId));
    }
    return { attempt, serverNow: now };
  });
}
