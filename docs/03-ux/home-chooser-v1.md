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

The Home next-action card reserves a responsive loading footprint for its heading, explanation and action. While session and progress checks run, it shows a status message and non-interactive, decorative lines. The skeleton adds no focusable controls; loaded and error states retain their existing action precedence and focus handling. Real text may grow beyond the reserved space rather than clip.

## Learning Path v1 supersession

[Learning Path v1](learning-path-v1.md) supersedes the returning neutral fallback above: unfinished → adaptive recommendation → fresh core Practice → guided Pack. All-recorded learners receive a free-choice action. Choose Practice uses one freely selectable catalog in the adopted editorial sequence, with a compact Path summary above it; J/K/L learner names omit technical prefixes. Existing Pack entry/recovery guards remain authoritative.

## Stable chooser catalog — observed UX correction

The former chooser rendered 12 guided cards asynchronously above 12 static free-choice cards. This duplicated every Pack, mixed card visuals and displaced the catalog after loading. The adopted correction replaces those two lists with one 12-Pack catalog, present on the initial render in editorial order A → J → H → L → D → G → E → I → C → B → F → K. Each card reuses the existing chooser visuals, registry name/count/route and distinct “Начать набор «{name}»” accessible link name, with its static Path position and orientation copy. Loading never changes card order or replaces a card/link.

A compact “Путь тренировок” summary shows the count of recorded Pack Finishes and the earliest unrecorded Pack as “Следующий ориентир”, with “Продолжить путь”. All-recorded learners see factual repeat/free-choice wording. Loading and errors never imply zero completions. Retry, next-step and all-recorded states use the same reserved count, description and action slots; text may grow for accessibility rather than clip. All twelve catalog links remain available during every summary state. The single catalog keeps the chooser’s existing one-column layout below 1024px and three columns from 1024px, visible focus and practical targets.

This evidence-driven correction supersedes the duplicate-list chooser described in Learning Path v1 and the earlier registry-order-only chooser above. It does not claim new Figma approval. Path order/completion meaning, existing unfinished-session context/entry gate, Practice persistence, Finish and Recovery remain unchanged.
