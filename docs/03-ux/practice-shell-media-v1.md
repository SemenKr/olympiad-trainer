# Practice Shell + ProblemMedia — UX v1 slice

Implemented by `PRACTICE-UX-SHELL-MEDIA`, based on main `af740b0`.

## Design authority and scope

The [adopted Figma UX v1](https://www.figma.com/design/Dej1YI4SrTaISQ6bEAzq6L/?node-id=194-128) is authoritative for this slice: Desktop Default (`194:131`), Desktop Hints open (`194:132`), Mobile Hint open (`194:135`), Problem media spec (`201:177`), Desktop Media problem (`205:83`), Mobile Media problem (`205:115`), Responsive rules (`211:306`). These layouts supersede the older single-column desktop recommendation in [Practice Wireframes v0.1](practice-wireframes.md). Illustrative Figma statements, reasoning notes and diagrams are layout examples, not adopted problem content.

Only Practice layout and optional statement media change. Answer assessment, eligibility for help, hint progression, solution protection, reasoning checkpoints, Knowledge Support, storage/resume, session completion and evidence/XP policies retain their existing behavior. Home, Summary, Progress and Simulation are outside this slice.

## Responsive flow

- 320–767px: one column; statement → optional media → answer and feedback → revealed learning support. Navigation stays outside the task surface. Answer actions span the available width.
- 768–1023px: the same order in a centered column of at most 680px, with additional spacing.
- 1024–1279px: fluid learning canvas plus a 320px answer/status/action rail.
- 1280px and wider: fluid canvas plus a 340px rail, within a 1440px shell. The rail is sticky with a 24px top offset on viewports at least 800px high; short viewports keep it in normal flow.

Revealed hints, solutions, checkpoint questions/results and the Knowledge Support offer occupy the learning canvas. Active Knowledge Support uses that canvas as a dedicated surface while hiding the Practice controls, preserving its existing return/focus behavior. Mobile DOM order matches reading and keyboard order; desktop grid placement does not duplicate controls. Existing heading focus on hint/solution/checkpoint reveal remains intact. Fixed sessions display their actual position; adaptive/review sessions do not invent a fixed total.

## Authored media contract

`ProblemDefinition.media` is optional. Its server-only definition contains `presentation` and `provenance`. Presentation has `kind` (`diagram`, `image`, `pdf-excerpt`), a local `/problem-media/...` image path, positive intrinsic pixel dimensions, title, caption, non-solving alt text, and an explicit `enlarge` boolean. The learner projection whitelists those fields; provenance and protected assessment/help fields are not sent as media.

Assets belong in `public/problem-media/` when an actual authored problem needs them. Supported files are PNG, JPEG, WebP or SVG. SVGs must be trusted, authored/reviewed static files. Preserve intrinsic aspect ratio and legible labels. An excerpt is a stable image rendered and cropped from a PDF, never an embedded PDF viewer or a link to a full source/solution document. No PostgreSQL content/media migration, upload endpoint or external asset URL is introduced.

Provenance records an HTTPS source URL and the permission/authorship basis in `rightsNote`. A PDF excerpt additionally requires a positive source page and descriptive crop record. Before adding any asset, the content author must check provenance/permission, source correspondence and that the crop, filename, alt text and caption disclose only the statement, with no answer, solving strategy or protected solution. Structural validation cannot establish this editorial/mathematical property. Caption describes the image's role; alt gives necessary statement information without interpreting a method or answer.

`ProblemMedia` reserves the image ratio through intrinsic dimensions, announces loading/failure, and retains the caption on failure. When `enlarge` is true, the explicit “Открыть крупнее” button opens a named native modal dialog. Escape and the close button dismiss it; focus returns to the opener. The large view preserves ratio and fits the viewport without a learner-facing horizontal scroller. Controls are at least 44px, with visible keyboard focus.

## Content and validation limits

The current 42 problems have no adopted authored media. None receives an invented diagram from this implementation or from the Figma examples. Media tests use clearly separate synthetic fixtures; adding a genuine asset later requires the editorial checks above. Browser verification exercises production text Practice and support. The real media component was also checked through a temporary standalone synthetic fixture (removed before acceptance): preserved aspect ratio, mobile overflow, named modal, Escape dismissal, close control and focus return. It is not a production media problem or a production asset.
