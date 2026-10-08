import "server-only";

import { eq, sql } from "drizzle-orm";
import { getProgressDb } from "./progress-db";
import { learners } from "./progress-schema";

export type AuthenticatedLearner = Readonly<{
  learnerId: string;
  tokenHash: string;
  generation: bigint;
}>;

export class LearnerIdentityUnavailable extends Error {
  constructor() {
    super("Learner identity is unavailable.");
    this.name = "LearnerIdentityUnavailable";
  }
}

type Transaction = Parameters<
  Parameters<ReturnType<typeof getProgressDb>["transaction"]>[0]
>[0];

// Every ownership operation holds this lock until its reads/writes complete.
// Check time after lock acquisition: a waiting transaction may outlive a credential.
export async function withAuthenticatedLearner<T>(
  context: AuthenticatedLearner,
  operation: (
    tx: Transaction,
    learner: typeof learners.$inferSelect,
  ) => Promise<T>,
): Promise<T> {
  return getProgressDb().transaction(async (tx) => {
    const [learner] = await tx
      .select()
      .from(learners)
      .where(eq(learners.id, context.learnerId))
      .for("update");
    if (
      !learner ||
      learner.anonymousTokenHash !== context.tokenHash ||
      learner.credentialGeneration !== context.generation
    )
      throw new LearnerIdentityUnavailable();
    const [{ valid }] = await tx
      .select({
        valid: sql<boolean>`${learners.browserCredentialExpiresAt} > clock_timestamp()`,
      })
      .from(learners)
      .where(eq(learners.id, context.learnerId));
    if (!valid) throw new LearnerIdentityUnavailable();
    return operation(tx, learner);
  });
}
