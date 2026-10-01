import "server-only";
import { requireOptionId, type Outcome } from "../domain/knowledge-support";

export function assessDiagnostic(option: unknown): Outcome {
  return requireOptionId(option) === "A" ? "correct" : "incorrect";
}

export function assessMicroCheck(option: unknown): Outcome {
  return requireOptionId(option) === "A" ? "correct" : "incorrect";
}
