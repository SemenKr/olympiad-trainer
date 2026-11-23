import { treasureAroundTableProblem } from "./problems/treasure-around-table";
import { markedRectangleCellProblem } from "./problems/marked-rectangle-cell";
import { streetCrossingCoverageProblem } from "./problems/street-crossing-coverage";
import { squareColumnsPerimeterProblem } from "./problems/square-columns-perimeter";
import { raisedCellTilingsProblem } from "./problems/raised-cell-tilings";
import { twoOutlinesRectangleAreaProblem } from "./problems/two-outlines-rectangle-area";
import { threeCandyBoxBalancesProblem } from "./problems/three-candy-box-balances";
import { fruitWeightOrderProblem } from "./problems/fruit-weight-order";
import { danceAttendanceProblem } from "./problems/dance-attendance";
import { hiddenDoubleToppingProblem } from "./problems/hidden-double-topping";
import { familyAgeOrderProblem } from "./problems/family-age-order";
import { cubeOppositeSumsProblem } from "./problems/cube-opposite-sums";
import { originalBoxTotalsProblem } from "./problems/original-box-totals";
import { originalFourteenCardsProblem } from "./problems/original-fourteen-cards";
import { originalBeadBadgesProblem } from "./problems/original-bead-badges";
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
  originalBoxTotalsProblem,
  originalFourteenCardsProblem,
  originalBeadBadgesProblem,
  treasureAroundTableProblem,
  markedRectangleCellProblem,
  streetCrossingCoverageProblem,
  squareColumnsPerimeterProblem,
  raisedCellTilingsProblem,
  twoOutlinesRectangleAreaProblem,
  threeCandyBoxBalancesProblem,
  fruitWeightOrderProblem,
  danceAttendanceProblem,
  hiddenDoubleToppingProblem,
  familyAgeOrderProblem,
  cubeOppositeSumsProblem,
];
