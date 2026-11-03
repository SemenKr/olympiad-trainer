import { packIdFromProblemIds } from "../application/completed-practice-episode";
import { browserProblemMetadata } from "./browser-problem-metadata.generated";

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function keys(value: Record<string, unknown>, expected: readonly string[]) {
  return (
    Object.keys(value).length === expected.length &&
    expected.every((key) => Object.hasOwn(value, key))
  );
}

function dense(value: unknown): value is unknown[] {
  return (
    Array.isArray(value) &&
    Array.from(value.keys()).every((index) => Object.hasOwn(value, index))
  );
}

function id(value: unknown): value is string {
  return typeof value === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value);
}

function sessionId(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(
      value,
    )
  );
}

function count(value: unknown, max = Number.MAX_SAFE_INTEGER): value is number {
  return (
    Number.isSafeInteger(value) &&
    (value as number) >= 0 &&
    (value as number) <= max
  );
}

function exposures(value: unknown, submissions: number) {
  return (
    dense(value) &&
    value.length <= 3 &&
    value.every(
      (item, index) =>
        record(item) &&
        keys(item, ["hintId", "level", "validSubmissionCountAtOpen"]) &&
        id(item.hintId) &&
        item.level === ["focus", "strategy", "next-step"][index] &&
        count(item.validSubmissionCountAtOpen, submissions) &&
        (index === 0 ||
          (item.validSubmissionCountAtOpen as number) >=
            (value[index - 1] as { validSubmissionCountAtOpen: number })
              .validSubmissionCountAtOpen),
    )
  );
}

function solution(value: unknown, submissions: number, hints: unknown[]) {
  return (
    value === null ||
    (record(value) &&
      keys(value, ["solutionId", "validSubmissionCountAtOpen"]) &&
      id(value.solutionId) &&
      hints.length === 3 &&
      submissions > 0 &&
      count(value.validSubmissionCountAtOpen, submissions) &&
      (value.validSubmissionCountAtOpen as number) > 0 &&
      (value.validSubmissionCountAtOpen as number) >=
        (hints[2] as { validSubmissionCountAtOpen: number })
          .validSubmissionCountAtOpen)
  );
}

function summary(value: unknown) {
  if (
    !record(value) ||
    !keys(value, [
      "outcome",
      "validSubmissionCount",
      "hintExposures",
      "solutionExposure",
    ]) ||
    !count(value.validSubmissionCount) ||
    !exposures(value.hintExposures, value.validSubmissionCount as number) ||
    !solution(
      value.solutionExposure,
      value.validSubmissionCount as number,
      value.hintExposures as unknown[],
    )
  )
    return false;
  if (value.validSubmissionCount === 0)
    return value.outcome === "no-valid-submissions";
  if (value.outcome === "incorrect-only") return true;
  return (
    value.outcome === "eventually-correct" &&
    (value.hintExposures as { validSubmissionCountAtOpen: number }[]).every(
      (hint) =>
        hint.validSubmissionCountAtOpen <
        (value.validSubmissionCount as number),
    ) &&
    (value.solutionExposure === null ||
      (value.solutionExposure as { validSubmissionCountAtOpen: number })
        .validSubmissionCountAtOpen < (value.validSubmissionCount as number))
  );
}

function result(value: unknown, expectedId: string, final: boolean) {
  if (!record(value)) return false;
  const checkpoint = Object.hasOwn(value, "reasoningCheckpointObservation");
  const expected = ["problemId", "problemTitle", "summary"];
  if (Object.hasOwn(value, "taskOutcome")) expected.push("taskOutcome");
  if (checkpoint)
    expected.push(
      "reasoningCheckpointObservation",
      "firstCorrectSubmissionCount",
    );
  if (
    !keys(value, expected) ||
    value.problemId !== expectedId ||
    typeof value.problemTitle !== "string" ||
    !value.problemTitle.trim() ||
    !summary(value.summary)
  )
    return false;
  const s = value.summary as {
    outcome: string;
    validSubmissionCount: number;
    solutionExposure: unknown;
    hintExposures: { validSubmissionCountAtOpen: number }[];
  };
  if (checkpoint) {
    const c = value.reasoningCheckpointObservation;
    if (
      value.taskOutcome !== undefined ||
      s.outcome !== "eventually-correct" ||
      s.solutionExposure !== null ||
      !count(value.firstCorrectSubmissionCount, s.validSubmissionCount) ||
      (value.firstCorrectSubmissionCount as number) === 0 ||
      s.hintExposures.some(
        (hint) =>
          hint.validSubmissionCountAtOpen >=
          (value.firstCorrectSubmissionCount as number),
      ) ||
      !record(c) ||
      !keys(c, [
        "checkpointId",
        "selectedOptionId",
        "outcome",
        "validSubmissionCountAtSubmit",
      ]) ||
      !id(c.checkpointId) ||
      !["A", "B", "C"].includes(c.selectedOptionId as string) ||
      !["correct", "incorrect"].includes(c.outcome as string) ||
      !count(c.validSubmissionCountAtSubmit, s.validSubmissionCount) ||
      (c.validSubmissionCountAtSubmit as number) <
        (value.firstCorrectSubmissionCount as number)
    )
      return false;
  }
  if (value.taskOutcome === "skipped")
    return s.outcome !== "eventually-correct" && s.solutionExposure === null;
  return (
    value.taskOutcome === undefined &&
    (final || s.outcome === "eventually-correct" || s.solutionExposure !== null)
  );
}

function active(value: unknown) {
  if (
    !record(value) ||
    !keys(value, [
      "status",
      "submissions",
      "hintExposures",
      "solutionExposure",
    ]) ||
    value.status !== "active" ||
    !dense(value.submissions) ||
    !value.submissions.every(
      (submission) =>
        record(submission) &&
        keys(submission, ["answer", "outcome"]) &&
        typeof submission.answer === "string" &&
        ["correct", "incorrect"].includes(submission.outcome as string),
    ) ||
    !exposures(value.hintExposures, value.submissions.length) ||
    !solution(
      value.solutionExposure,
      value.submissions.length,
      value.hintExposures as unknown[],
    )
  )
    return false;
  const firstCorrect = value.submissions.findIndex(
    (submission) => (submission as { outcome: string }).outcome === "correct",
  );
  if (
    firstCorrect >= 0 &&
    (value.hintExposures as { validSubmissionCountAtOpen: number }[]).some(
      (hint) => hint.validSubmissionCountAtOpen >= firstCorrect + 1,
    )
  )
    return false;
  return (
    value.solutionExposure === null ||
    firstCorrect < 0 ||
    (value.solutionExposure as { validSubmissionCountAtOpen: number })
      .validSubmissionCountAtOpen <= firstCorrect
  );
}

function activeCheckpoint(value: unknown, practice: Record<string, unknown>) {
  if (
    !record(value) ||
    !keys(value, [
      "checkpointId",
      "selectedOptionId",
      "outcome",
      "validSubmissionCountAtSubmit",
    ]) ||
    !id(value.checkpointId) ||
    !["A", "B", "C"].includes(value.selectedOptionId as string) ||
    !["correct", "incorrect"].includes(value.outcome as string) ||
    practice.solutionExposure !== null ||
    !Array.isArray(practice.submissions)
  )
    return false;
  const firstCorrect = practice.submissions.findIndex(
    (submission) => record(submission) && submission.outcome === "correct",
  );
  return (
    firstCorrect >= 0 &&
    count(value.validSubmissionCountAtSubmit, practice.submissions.length) &&
    (value.validSubmissionCountAtSubmit as number) >= firstCorrect + 1
  );
}

// This only identifies state that a newer Pack could have written. It never
// authorizes rendering, Finish, evidence, or an old-build interpretation.
export function isUnsupportedFuturePackSnapshot(value: unknown): boolean {
  if (!record(value) || value.mode !== "pack" || !sessionId(value.sessionId))
    return false;
  if (value.status === "no-next") {
    if (
      !keys(value, ["sessionId", "mode", "status", "completedResults"]) ||
      !dense(value.completedResults) ||
      value.completedResults.length !== 3
    )
      return false;
    const ids = value.completedResults.map((item) =>
      record(item) ? item.problemId : null,
    );
    return (
      ids.every(id) &&
      new Set(ids).size === 3 &&
      packIdFromProblemIds(ids as string[]) === null &&
      value.completedResults.every((item, index) =>
        result(item, ids[index] as string, index === 2),
      ) &&
      (value.completedResults[2] as { taskOutcome?: string }).taskOutcome ===
        "skipped"
    );
  }
  if (
    !dense(value.problemIds) ||
    value.problemIds.length !== 3 ||
    !value.problemIds.every(id) ||
    new Set(value.problemIds).size !== 3 ||
    packIdFromProblemIds(value.problemIds as string[]) !== null ||
    !count(value.activeProblemIndex, 2) ||
    !dense(value.completedResults) ||
    value.completedResults.length !== value.activeProblemIndex ||
    !value.completedResults.every((item, index) =>
      result(item, (value.problemIds as string[])[index], false),
    ) ||
    !active(value.activePractice)
  )
    return false;
  const answerKey = Object.hasOwn(value, "rawAnswer")
    ? "rawAnswer"
    : "selectedOptionIds";
  const expected = [
    "sessionId",
    "mode",
    "problemIds",
    "activeProblemIndex",
    "completedResults",
    "activePractice",
    answerKey,
  ];
  if (Object.hasOwn(value, "reasoningCheckpointObservation"))
    expected.push("reasoningCheckpointObservation");
  if (!keys(value, expected)) return false;
  if (answerKey === "rawAnswer") {
    if (typeof value.rawAnswer !== "string") return false;
  } else if (
    !dense(value.selectedOptionIds) ||
    !value.selectedOptionIds.every(id) ||
    new Set(value.selectedOptionIds).size !== value.selectedOptionIds.length
  )
    return false;
  if (
    Object.hasOwn(value, "reasoningCheckpointObservation") &&
    (!record(value.activePractice) ||
      !activeCheckpoint(
        value.reasoningCheckpointObservation,
        value.activePractice,
      ))
  )
    return false;
  const activeId = value.problemIds[
    value.activeProblemIndex as number
  ] as string;
  const known = Object.hasOwn(browserProblemMetadata, activeId)
    ? browserProblemMetadata[activeId as keyof typeof browserProblemMetadata]
    : undefined;
  if (known && (answerKey === "rawAnswer") === "optionIds" in known)
    return false;
  return true;
}

export function isUnsupportedFuturePackSummary(value: unknown): boolean {
  const results = Array.isArray(value)
    ? value
    : record(value) &&
        keys(value, ["sessionId", "results"]) &&
        sessionId(value.sessionId)
      ? value.results
      : null;
  if (!dense(results) || results.length < 1 || results.length > 3) return false;
  const ids = results.map((item) => (record(item) ? item.problemId : null));
  return (
    ids.every(id) &&
    new Set(ids).size === ids.length &&
    results.every((item, index) =>
      result(item, ids[index] as string, index === results.length - 1),
    ) &&
    (results.length === 3
      ? packIdFromProblemIds(ids as string[]) === null
      : ids.some(
          (item) => !Object.hasOwn(browserProblemMetadata, item as string),
        ))
  );
}
