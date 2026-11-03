import {
  originalOnlyBeta,
  BETA_PROBLEM_IDS,
} from "../../../modules/practice/server/content-access";
import { LatestCompletedSummary } from "@/modules/practice/ui/latest-completed-summary";

export default function PracticeSummaryPage() {
  return (
    <LatestCompletedSummary
      allowedProblemIds={originalOnlyBeta() ? BETA_PROBLEM_IDS : undefined}
    />
  );
}
