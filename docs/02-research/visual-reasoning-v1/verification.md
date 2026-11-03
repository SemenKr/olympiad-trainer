# Visual prototype — verification record

Historical research evidence (superseded gate status below): research task `VISUAL-REASONING-V1`, 18 October 2026; baseline `5463382`. This records local artifact checks, not content approval or runtime acceptance. [Content dossier](../visual-reasoning-v1.md); [implementation proposal](../../04-architecture/original-content-visual-slice-v1.md).

## Author evidence

Read-only reproducible check: `node docs/02-research/visual-reasoning-v1/verify.mjs` (Node 24.21.0, installed jsdom; no new dependency). Checks actual SVG XML, dimensions/geometry and content restrictions, not a production catalog fixture. The first run reached the final link check and failed because this verification note had not yet been created; all mathematical assertions had passed. The completed artifact run is recorded below.

- Frame rectangle geometry: exactly-one/both/neither counts **8 / 2 / 2** across all 12 cell centres; independently explained by row partition and inclusion/exclusion.
- Sheet: actual SVG polygon shoelace area **67,500 drawing units²**, at 50 units/cm **27 cm²**; independent unit-square exclusion and two written decompositions agree.
- Paths: actual SVG graph **20 vertices / 30 open edges**, all expected edges present except (2,1)–(3,1); exhaustive **35** monotone sequences, **18** through К before closure, **9** after closure. Written prefix/suffix counting and independent counting by vertices agree. Text describes the same junction/closed edge and seven-step route length.
- Three SVG files parse as XML and have nonempty title/description; check excludes scripts, foreignObject, external images/URLs, event handlers and animation. This is a bounded static-asset check, not a general SVG security sanitizer. Editorial review checks that no answer/help is encoded in titles, descriptions, labels or filenames.
- Relative file links in both design documents resolve; linked fragments are inspected editorially. Markdown whitespace/diff and scope checked separately. No production file, catalog identity, SQL or dependency changes.

Visual author inspection: headless installed Edge rendered all three SVGs at intrinsic size into a temporary local contact sheet; labels, boundaries, dashed edges, hatch fill, dimensions and blocked edge are visible with no clipping or colour dependency. Rendering is a prototype check, not a test of the actual Practice component, dialog, screen reader or app layout. Small preview labels need the existing enlarge option and visible condition text; real 320/375px Practice/browser and assistive-technology checks remain mandatory in implementation.

Completed research verifier: **PASS**, all assertions above and local design links. No `pnpm verify`, database migration, app/browser flow test or child session was run for these documentation/static-figure changes. Tests in the implementation proposal remain future work. Mathematical correctness, age suitability, accessibility with a real learner and intended rights/distribution still need named human approval of the exact revision.

## Independent read-only review

Completed by the separate `visual_review` agent using `tools/codex/skills/review-task/SKILL.md`, strictly read-only. Reviewer confirmed branch/HEAD and all eight supplied file SHA256 fingerprints, independently read the actual draft files and relevant source contracts, ran the inspected read-only verifier, inspected the retained Edge contact sheet and checked `git diff --check`.

**Critical: 0. Major: 0. Minor: 0. Verdict: PASS for this local research/design deliverable.** Independent derivations: row partition 3 + 2 + 3 = 8; whole sheet minus cutouts 35 − 6 − 2 = 27; three prefixes to К times three forced-up continuations = 9. SVG geometry/text and proposed provenance, attribution and receipt changes matched inspected repository contracts. Reviewer made no file, index, branch or external mutations.

Non-blocking research gaps: educator approval, owner adoption and authorship/distribution clearance are open; actual mobile Practice rendering, assistive technology, new/old Pack flows and database migration tests remain implementation gates. PASS does not approve implementation, child use, publication or Git actions.

Readiness: **READY as a research/design handoff; NEEDS DECISION before dependent implementation.** Exact next scope is the single three-problem slice in the linked proposal. No automatic correction cycle was needed (0/2 used). Root appended only this review record after the reviewed content was frozen; problem text, figures, proposal, verifier and index were not changed after review.

## Gate status update — 2026-10-19

The [owner decision](../visual-reasoning-v1.md#owner-distribution-and-credit-decision--2026-10-19) supersedes the pending owner adoption/distribution/credit statements above; the [implementation record](../../05-development/visual-reasoning-v1-implementation.md) records later technical checks. Owner permission is limited to the three Pack S items and their stated distribution. Human mathematics, educator sign-off and learner/assistive-technology validation remain open; all 60 VSOSh-derived items retain unresolved rights status. The historical research PASS is not a content approval or a new test run.
