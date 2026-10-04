import "server-only";
import { getProblemDefinition } from "../../practice/server/problem-catalog";
import {
  SIMULATION_PROBLEM_IDS,
  type SimulationProblem,
  type SimulationReference,
} from "../domain/simulation";

export function getSimulationProblems(): readonly SimulationProblem[] {
  return SIMULATION_PROBLEM_IDS.map((id) => {
    const problem = getProblemDefinition(id);
    return {
      problemId: id,
      title: problem.title,
      statement: problem.statement,
      options:
        problem.assessment.kind === "multiple-choice-set"
          ? problem.assessment.options.map((option) => option.label)
          : [],
    };
  });
}

export function getSimulationReferences(): readonly SimulationReference[] {
  return SIMULATION_PROBLEM_IDS.map((problemId) => ({
    problemId,
    text: getProblemDefinition(problemId).solution.text,
  }));
}
