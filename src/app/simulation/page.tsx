import { getSimulationProblems } from "../../modules/simulation/server/content";
import { SimulationSession } from "../../modules/simulation/ui/simulation-session";

export default function SimulationPage() {
  return <SimulationSession problems={getSimulationProblems()} />;
}
