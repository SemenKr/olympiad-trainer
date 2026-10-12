import type { Metadata } from "next";
import { getSimulationProblems } from "../../modules/simulation/server/content";
import { SimulationSession } from "../../modules/simulation/ui/simulation-session";

export const metadata: Metadata = {
  title: "Пробная олимпиада",
  robots: { index: false, follow: false },
};

export default function SimulationPage() {
  return <SimulationSession problems={getSimulationProblems()} />;
}
