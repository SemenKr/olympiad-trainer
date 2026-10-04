import { validateCompletedEpisode } from "./completed-practice-episode";

export function isEligibleReviewSource(mode: unknown, facts: unknown): boolean {
  const episode =
    mode === "core" ? validateCompletedEpisode(mode, facts) : null;
  const carrier = episode?.problems[0];
  return (
    carrier?.problemId === "coinciding-seats" &&
    carrier.outcome === "eventually-correct" &&
    !carrier.solutionExposed
  );
}
