import "server-only";

import { and, eq } from "drizzle-orm";
import { getProgressDb } from "../../practice/server/progress-db";
import { learners } from "../../practice/server/progress-schema";
import {
  CARRIER_PROBLEM_ID,
  TOPIC_ID,
  canRecommendLesson,
  requireOptionId,
  requireSessionId,
  type SupportObservation,
} from "../domain/knowledge-support";
import { assessDiagnostic, assessMicroCheck } from "./assessment";
import { knowledgeSupportAttempts as attempts } from "./schema";

function key(learnerId: string, sessionId: string) {
  return and(
    eq(attempts.learnerId, learnerId),
    eq(attempts.practiceSessionId, requireSessionId(sessionId)),
    eq(attempts.topicId, TOPIC_ID),
  );
}

function observation(row: typeof attempts.$inferSelect): SupportObservation {
  return {
    diagnosticSelectedOptionId: row.diagnosticSelectedOptionId,
    diagnosticOutcome: row.diagnosticOutcome,
    lessonOpened: row.lessonOpened,
    microCheckSelectedOptionId: row.microCheckSelectedOptionId,
    microCheckOutcome: row.microCheckOutcome,
  };
}

export async function readSupportObservation(
  learnerId: string,
  sessionId: string,
): Promise<SupportObservation | null> {
  const [row] = await getProgressDb()
    .select()
    .from(attempts)
    .where(key(learnerId, sessionId));
  return row ? observation(row) : null;
}

export async function persistSupportStep(
  learnerId: string,
  sessionId: string,
  step: "diagnostic" | "lesson" | "micro-check",
  selectedOption: unknown,
  diagnosticEligible: boolean = false,
): Promise<SupportObservation> {
  const where = key(learnerId, sessionId);
  const optionId = step === "lesson" ? null : requireOptionId(selectedOption);
  return getProgressDb().transaction(async (tx) => {
    // Serialize first inserts and retries as well as subsequent steps for this learner.
    const [learner] = await tx
      .select({ id: learners.id })
      .from(learners)
      .where(eq(learners.id, learnerId))
      .for("update");
    if (!learner) throw new Error("Unknown learner.");
    const [prior] = await tx.select().from(attempts).where(where);
    if (step === "diagnostic") {
      if (prior) {
        if (prior.diagnosticSelectedOptionId !== optionId)
          throw new Error("Diagnostic replacement conflicts.");
        return observation(prior);
      }
      if (!diagnosticEligible || !optionId)
        throw new Error("Diagnostic is not eligible.");
      const [inserted] = await tx
        .insert(attempts)
        .values({
          learnerId,
          practiceSessionId: sessionId,
          carrierProblemId: CARRIER_PROBLEM_ID,
          topicId: TOPIC_ID,
          diagnosticSelectedOptionId: optionId,
          diagnosticOutcome: assessDiagnostic(optionId),
        })
        .returning();
      return observation(inserted);
    }
    if (!prior || !canRecommendLesson(prior))
      throw new Error("An incorrect diagnostic is required.");
    if (step === "lesson") {
      if (prior.lessonOpened) return observation(prior);
      const [updated] = await tx
        .update(attempts)
        .set({ lessonOpened: true, lessonOpenedAt: new Date() })
        .where(where)
        .returning();
      return observation(updated);
    }
    if (!prior.lessonOpened || !optionId)
      throw new Error("Open the lesson first.");
    if (prior.microCheckSelectedOptionId) {
      if (prior.microCheckSelectedOptionId !== optionId)
        throw new Error("Micro-check replacement conflicts.");
      return observation(prior);
    }
    const [updated] = await tx
      .update(attempts)
      .set({
        microCheckSelectedOptionId: optionId,
        microCheckOutcome: assessMicroCheck(optionId),
        microCheckCompletedAt: new Date(),
      })
      .where(where)
      .returning();
    return observation(updated);
  });
}
