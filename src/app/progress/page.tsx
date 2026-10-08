import { ProgressOverview } from "@/modules/practice/ui/progress-overview";
import { recoveryEnabled } from "../../modules/learner/server/recovery-security";

export default function ProgressPage() {
  return <ProgressOverview recoveryAvailable={recoveryEnabled()} />;
}
