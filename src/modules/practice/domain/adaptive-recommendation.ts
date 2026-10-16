export const ADAPTIVE_RULES = [
  {
    purpose: "test-transfer",
    source: "table-impossible-sums",
    target: "brothers-ages-products",
    capability: "impossibility-argument-recognition",
  },
  {
    purpose: "test-transfer",
    source: "guaranteed-sock-pair",
    target: "parrots-guaranteed-colors",
    capability: "guarantee-argument-recognition",
  },
  {
    purpose: "explore-unknown-capability",
    source: null,
    target: "pages-without-digit-one",
    capability: "complete-enumeration-recognition",
  },
] as const;

export type AdaptiveTargetId = (typeof ADAPTIVE_RULES)[number]["target"];
export type AdaptivePurpose = (typeof ADAPTIVE_RULES)[number]["purpose"];
type SourceId = Exclude<(typeof ADAPTIVE_RULES)[number]["source"], null>;
type SourceCheckpoint = Readonly<{
  outcome: "correct" | "incorrect";
  hintsBeforeCheckpoint: boolean;
}>;
export type AdaptiveInput = Readonly<{
  latestSourceCheckpoints: Readonly<Record<SourceId, SourceCheckpoint | null>>;
  hasEnumerationObservation: boolean;
  hasDurablePracticeFinish: boolean;
  closedTargets: readonly AdaptiveTargetId[];
}>;
export type AdaptiveDecision =
  | Readonly<{
      kind: "recommendation";
      purpose: "test-transfer";
      problemId: "brothers-ages-products" | "parrots-guaranteed-colors";
      basis:
        | "correct-source-checkpoint-after-hints"
        | "correct-source-checkpoint-without-hints";
    }>
  | Readonly<{
      kind: "recommendation";
      purpose: "explore-unknown-capability";
      problemId: "pages-without-digit-one";
      basis: "no-retained-enumeration-observation";
    }>
  | Readonly<{
      kind: "none";
      reason: "no-eligible-target" | "all-targets-closed";
    }>;

export function isAdaptiveTargetId(value: unknown): value is AdaptiveTargetId {
  return ADAPTIVE_RULES.some((rule) => rule.target === value);
}

export function recommendAdaptiveWork(input: AdaptiveInput): AdaptiveDecision {
  const closed = new Set(input.closedTargets);
  const transfers = ADAPTIVE_RULES.flatMap((rule) => {
    if (rule.purpose !== "test-transfer" || closed.has(rule.target)) return [];
    const check = input.latestSourceCheckpoints[rule.source];
    return check?.outcome === "correct"
      ? [{ rule, hinted: check.hintsBeforeCheckpoint }]
      : [];
  });
  const selected =
    transfers.find((candidate) => candidate.hinted) ?? transfers[0];
  if (selected)
    return {
      kind: "recommendation",
      purpose: "test-transfer",
      problemId: selected.rule.target,
      basis: selected.hinted
        ? "correct-source-checkpoint-after-hints"
        : "correct-source-checkpoint-without-hints",
    };
  if (
    input.hasDurablePracticeFinish &&
    !input.hasEnumerationObservation &&
    !closed.has("pages-without-digit-one")
  )
    return {
      kind: "recommendation",
      purpose: "explore-unknown-capability",
      problemId: "pages-without-digit-one",
      basis: "no-retained-enumeration-observation",
    };
  return {
    kind: "none",
    reason: ADAPTIVE_RULES.every((rule) => closed.has(rule.target))
      ? "all-targets-closed"
      : "no-eligible-target",
  };
}
