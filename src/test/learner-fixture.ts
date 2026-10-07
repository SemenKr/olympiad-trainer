import { getProgressDb } from "../modules/practice/server/progress-db";
import { learners } from "../modules/practice/server/progress-schema";
import { emptyGuaranteeProgressEvidence } from "../modules/practice/application/guarantee-progress-evidence";
import { emptyImpossibilityProgressEvidence } from "../modules/practice/application/impossibility-progress-evidence";
import { emptyEnumerationProgressEvidence } from "../modules/practice/application/enumeration-progress-evidence";
import type { AuthenticatedLearner } from "../modules/practice/server/learner-auth";

const contexts = new Map<string, AuthenticatedLearner>();
export function learnerContext(learnerId: string): AuthenticatedLearner {
  return (
    contexts.get(learnerId) ?? {
      learnerId,
      tokenHash: "test-token-hash",
      generation: BigInt(0),
    }
  );
}
export async function createTestLearner(tokenHash: string): Promise<string> {
  const [row] = await getProgressDb()
    .insert(learners)
    .values({
      anonymousTokenHash: tokenHash,
      browserCredentialExpiresAt: new Date(Date.now() + 86400000),
      guaranteeEvidence: emptyGuaranteeProgressEvidence(),
      impossibilityEvidence: emptyImpossibilityProgressEvidence(),
      enumerationEvidence: emptyEnumerationProgressEvidence(),
    })
    .returning({ id: learners.id });
  contexts.set(row.id, { learnerId: row.id, tokenHash, generation: BigInt(0) });
  return row.id;
}
