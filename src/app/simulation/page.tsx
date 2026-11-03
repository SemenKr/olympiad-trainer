import { originalOnlyBeta } from "../../modules/practice/server/content-access";
import { BetaUnavailable } from "../beta-practice";
import type { Metadata } from "next";
import { getSimulationProblems } from "../../modules/simulation/server/content";
import { SimulationSession } from "../../modules/simulation/ui/simulation-session";

export const metadata: Metadata = {
  title: "Пробная олимпиада",
  robots: { index: false, follow: false },
};

export default function SimulationPage() {
  if (originalOnlyBeta()) return <BetaUnavailable />;
  return <SimulationSession problems={getSimulationProblems()} />;
}
