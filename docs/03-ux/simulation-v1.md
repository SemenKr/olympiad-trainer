# Simulation — UX v1

Design authority: [Figma UX v1](https://www.figma.com/design/Dej1YI4SrTaISQ6bEAzq6L/?node-id=194-128). Desktop Start/Active/Finish confirmation/Completed/Timeout: `220:123`, `220:139`, `220:171`, `220:188`, `220:215`; matching Mobile frames: `220:228`, `220:241`, `220:269`, `220:283`, `220:301`; Responsive rules: `211:306`.

## Presentation hierarchy

Start describes the fixed four-task, 45-minute independent attempt. It keeps every required rule visible on mobile as well as desktop: free navigation and editable reasoning drafts, autosave in this browser and on the server, no hints or solutions before Finish, a timer that continues after closing the page, and no automatic checking, score or XP. Mobile therefore retains more rule text than the abbreviated prototype. Real problem statements and protected references are reused unchanged; prototype reasoning and abbreviated statements are never substituted.

Active shows timer/save status first, then the learning canvas. Desktop places four task cards above the statement/editor; mobile/tablet places compact numbered navigation after it. Accessible task names include the number and empty/draft status even when the compact visual presentation omits those words. The reasoning textarea retains its label and a linked description of autosave, the existing 12,000-character limit and absence of automatic checking.

Finish confirmation presents the existing empty-drafts/immutability warning and separate Continue/Submit actions. The editor is hidden and disabled while confirming; desktop keeps a compact current-task/time context. Continue and Escape return focus to Finish after the working view is restored. Confirmation remains an inline named section, not a modal with a new focus trap; its initial focus is Continue. The timer, pending saves and deadline continue unchanged behind this presentation.

Completed shows all four immutable server submissions, including empty drafts, paired with separate protected reference cards. Desktop has a secondary task index and the existing Practice link in a compact side column; mobile stacks all four pairs and puts the Practice link below. The prototype's single illustrative task does not remove the other submitted tasks. Cards grow with actual statements, reasoning and reference text rather than clipping to fixed prototype heights.

Timeout first states that only drafts received by the server before the deadline were submitted and that finished work cannot change. A presentation-only action opens the submitted-work comparison; it performs no Save or Finish request. If unsent local work exists, its warning and download stay separate from the frozen submission. Protected reference loading still starts only after the existing server-finished state is received; its failure/retry does not resubmit work. Completion and timeout move focus to the result heading; opening the timeout comparison focuses that heading again.

## Responsive and visual system

Below 1024px, screens use one centered column up to 680px with 16px padding. From 1024px, the canvas expands to 1440px with 40px padding; Start and confirmation remain bounded to 900px and 640px respectively. Completed uses a 320px secondary column, increasing to 360px from 1280px. The active canvas remains wide. Existing Onest typography, color/spacing tokens, light/dark themes, visible focus and forced-color outlines are reused. Action controls have at least 48px targets; navigation links at least 44px, task controls at least 60px. No new static assets or dependencies are needed.

## Preserved contracts and limitations

This is a presentation change to [Simulation v0](../04-architecture/olympiad-simulation-v0.md). Server deadline/revisions, conflict handling, request serialization, autosave, local mirror, resume, Web Locks editor guard, assistance restrictions, immutable Finish and reference authorization remain unchanged. There is no contribution to capability evidence, adaptive facts, Review or Journey XP, and no new scoring or recommendation logic.

Timer trust remains bounded: the server deadline controls acceptance, while the monotonic client countdown can lag during latency or browser suspension. Closing the page does not pause time; expiry is materialized on the next server operation. Unsent offline text cannot replace finished server work. Cookie/storage loss and unavailable Web Locks retain the v0 recovery limitations. No Simulation schema, timing policy, domain architecture or other product screen is changed.
