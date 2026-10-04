# Home + Choose Practice — UX v1

The design authority is [Figma UX v1](https://www.figma.com/design/Dej1YI4SrTaISQ6bEAzq6L/?node-id=194-128): Home Desktop `194:130`, Home Mobile `194:134`, Choose Practice Desktop `211:84`, Choose Practice Mobile `211:168`, Responsive rules `211:306`. Prototype XP and capability claims are illustrative, not learner facts.

## Primary-action precedence and adopted fallback

Home retains the existing precedence: unfinished Practice (Resume or explicit Finish for no-next), then an available adaptive recommendation, then first Practice for a fresh learner. Review remains secondary and unavailable on Home while a local Practice session is unfinished. Existing recovery/retry behavior remains intact.

For a returning learner without unfinished work or a new recommendation, Home displays a calm neutral state with **no primary CTA**. Progress and Choose Practice remain secondary; Review is not promoted. This `HOME-FALLBACK-v1` decision was explicitly adopted by the user for `HOME-CHOOSER-UX-V1`. It supersedes earlier primary-Progress fallback guidance in Dashboard/Progress Flow and Home Wireframes. No substitute recommendation, completion, mastery or weakness claim is introduced.

## Secondary destinations and chooser

Ordinary Pack cards move to `/practice/choose`, rendered directly from all 12 `PRACTICE_PACKS` in registry order. Names, problem counts and existing `packHref` URLs come from the registry; metadata is not copied into UI code. Pack J–L retain their full registry names even though Figma abbreviates them. The chooser does not start or replace a session itself. Existing Pack entry gates and unfinished-session precedence still apply: a fresh learner is offered first Practice, and an existing draft survives choosing another Pack.

Simulation retains its separate secondary entry and unchanged `/simulation` route. Progress and Journey are secondary: desktop uses the side column; mobile offers Progress inside the secondary actions, with Journey available through the unchanged Progress screen. Latest-summary links retain their stored session identity. No Summary, Progress, Practice Shell or Simulation screen is redesigned; persistence, adaptive selection, Review eligibility and XP policies are unchanged.

## Responsive and accessibility behavior

- Below 1024px: one centered column up to 680px; Home puts the next-action region before secondary choices. Mobile controls span available width.
- From 1024px: Home separates the action area from a 320px secondary side column (360px from 1280px); chooser uses three columns.
- Cards grow with real registry titles instead of clipping to prototype heights. Targets are at least 44px, links have visible focus, each Pack has a distinct accessible action name, and learner content has no horizontal scroll.

Existing data loading and route guards are reused. The next-action region announces state changes; secondary loading/availability failures do not replace the primary action. No fabricated learner statistics or new content assets are added.
