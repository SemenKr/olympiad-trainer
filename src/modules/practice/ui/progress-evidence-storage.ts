import {
  deriveGuaranteeProgressInterpretation,
  emptyGuaranteeProgressEvidence,
  validateGuaranteeProgressEvidence,
  type GuaranteeEvidenceFact,
  type GuaranteeProgressEvidenceV0,
} from "../application/guarantee-progress-evidence";
import type { ReasoningCheckpointInterpretation } from "../application/reasoning-checkpoint";

export const PROGRESS_EVIDENCE_STORAGE_KEY =
  "olympiad-trainer:progress-evidence-v0";

export async function readVerifiedGuaranteeProgressEvidence(
  verifyFacts: (facts: readonly GuaranteeEvidenceFact[]) => Promise<boolean>,
  storage?: Storage,
): Promise<{
  evidence: GuaranteeProgressEvidenceV0;
  interpretation: ReasoningCheckpointInterpretation;
}> {
  const store = storage ?? window.localStorage;
  const raw = store.getItem(PROGRESS_EVIDENCE_STORAGE_KEY);
  if (raw === null) {
    const evidence = emptyGuaranteeProgressEvidence();
    return {
      evidence,
      interpretation: deriveGuaranteeProgressInterpretation(evidence),
    };
  }

  let evidence: GuaranteeProgressEvidenceV0 | null;
  try {
    evidence = validateGuaranteeProgressEvidence(JSON.parse(raw));
  } catch {
    evidence = null;
  }
  const facts = evidence
    ? [
        evidence.latestCorrectWithoutHints,
        evidence.latestCorrectWithHints,
        evidence.latestIncorrect,
      ].filter((fact): fact is GuaranteeEvidenceFact => fact !== null)
    : [];
  const valid =
    evidence !== null && (facts.length === 0 || (await verifyFacts(facts)));
  if (store.getItem(PROGRESS_EVIDENCE_STORAGE_KEY) !== raw)
    throw new Error("Progress evidence changed during verification.");
  const verifiedEvidence =
    valid && evidence ? evidence : emptyGuaranteeProgressEvidence();
  if (!valid) {
    store.removeItem(PROGRESS_EVIDENCE_STORAGE_KEY);
  }
  return {
    evidence: verifiedEvidence,
    interpretation: deriveGuaranteeProgressInterpretation(verifiedEvidence),
  };
}
