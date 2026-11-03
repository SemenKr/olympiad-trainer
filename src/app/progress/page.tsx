import { originalOnlyBeta } from "../../modules/practice/server/content-access";
import type { Metadata } from "next";
import { ProgressOverview } from "@/modules/practice/ui/progress-overview";
import { recoveryEnabled } from "../../modules/learner/server/recovery-security";

export const metadata: Metadata = {
  title: "Прогресс",
  robots: { index: false, follow: false },
};

export default function ProgressPage() {
  return (
    <ProgressOverview
      originalOnly={originalOnlyBeta()}
      recoveryAvailable={recoveryEnabled()}
    />
  );
}
