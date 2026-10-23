import type { ProblemDefinition } from "./problem-catalog";
import { originalTwoFramesProblem } from "./problems/original-two-frames";
import { originalNotchedSheetProblem } from "./problems/original-notched-sheet";
import { originalPathViaKProblem } from "./problems/original-path-via-k";

// Add reviewed modules here after replacing their draft with a complete definition.
// A draft in problems/drafts is never imported into the catalog.
export const NEW_PROBLEM_DEFINITIONS: readonly ProblemDefinition[] = [
  originalTwoFramesProblem,
  originalNotchedSheetProblem,
  originalPathViaKProblem,
];
