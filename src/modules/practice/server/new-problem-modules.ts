import type { ProblemDefinition } from "./problem-catalog";
import { originalTwoFramesProblem } from "./problems/original-two-frames";
import { originalNotchedSheetProblem } from "./problems/original-notched-sheet";
import { originalPathViaKProblem } from "./problems/original-path-via-k";
import { originalLinkedCodeProblem } from "./problems/original-linked-code";
import { originalSignalFlagsProblem } from "./problems/original-signal-flags";
import { originalTwoColorPairsProblem } from "./problems/original-two-color-pairs";

// Add reviewed modules here after completing their unregistered draft.
export const NEW_PROBLEM_DEFINITIONS: readonly ProblemDefinition[] = [
  originalTwoFramesProblem,
  originalNotchedSheetProblem,
  originalPathViaKProblem,
  originalLinkedCodeProblem,
  originalSignalFlagsProblem,
  originalTwoColorPairsProblem,
];
