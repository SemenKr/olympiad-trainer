import "server-only";

import { and, eq } from "drizzle-orm";
import {
  withAuthenticatedLearner,
  type AuthenticatedLearner,
} from "../../practice/server/learner-auth";
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
  context: AuthenticatedLearner,
  sessionId: string,
): Promise<SupportObservation | null> {
  return withAuthenticatedLearner(context, async (tx) => {
    const learnerId = context.learnerId;
    const [row] = await tx
      .select()
      .from(attempts)
      .where(key(learnerId, sessionId));
    return row ? observation(row) : null;
  });
}

export async function persistSupportStep(
  context: AuthenticatedLearner,
  sessionId: string,
  step: "diagnostic" | "lesson" | "micro-check",
  selectedOption: unknown,
  diagnosticEligible: boolean = false,
): Promise<SupportObservation> {
  const learnerId = context.learnerId;
  const where = key(learnerId, sessionId);
  const optionId = step === "lesson" ? null : requireOptionId(selectedOption);
  return withAuthenticatedLearner(context, async (tx) => {
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
