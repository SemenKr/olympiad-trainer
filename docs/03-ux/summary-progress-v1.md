# Summary + Progress — UX v1

Design authority: [Figma UX v1](https://www.figma.com/design/Dej1YI4SrTaISQ6bEAzq6L/?node-id=194-128), Summary Desktop `211:247`, Summary Mobile `211:281`, Progress Desktop `194:133`, Progress Mobile `194:136`, Responsive rules `211:306`. Prototype outcomes, XP and capability claims are illustrative; screens render existing verified data.

## Summary

Summary describes a completed episode, not the learner's ability or a score. It retains the existing success/remaining-work summaries, result-label precedence (skipped, solution exposure, supported or independent success), checkpoint interpretations and Review disclaimer. Problem titles precede their factual outcomes. Attempts without a result label retain their existing remaining-work text rather than a fabricated success label.

Journey appears separately from episode facts and checkpoint evidence. Existing nonzero earned XP, total XP and newly reached milestone are retained, with explicit participation-only copy. Zero awards remain hidden. Existing next actions are Home (primary) and Progress (secondary); no new recommendation is calculated.

## Progress

All three existing capability interpretations remain visible, including uncertainty and reconfirmation wording. State badges repeat existing evidence groups without numeric mastery, grades or confidence scores. Available Review remains the existing useful next action; unavailable Review adds no substitute primary action. Its independent availability failure/retry remains intact. Choose Practice and Home are secondary destinations.

Journey totals and every existing milestone remain in a separate card, explicitly unrelated to knowledge level. Durable recent activity retains episode modes, dates, outcomes and checkpoint results. Fetching, verification, import, persistence, eligibility and reward policies are unchanged.

## Responsive hierarchy and accessibility

- Below 1024px, one centered column up to 680px; Summary facts precede Journey and actions. Progress places the existing Review entry before evidence, then Journey, secondary navigation and recent history.
- From 1024px, the learning/evidence column sits beside a compact 320px side column (360px from 1280px). Summary's side column holds Journey/actions; Progress's holds Review/Journey/navigation.
- Cards grow to fit real conclusions and milestone/history data. Mobile controls span available width with 48px targets. Existing heading focus, loading announcements and retry controls remain; focus indicators and forced-color outlines are preserved.

This presentation slice supersedes the corresponding layout hierarchy in the earlier Summary and Progress wireframes. It changes no Practice Shell, Home/Chooser or Simulation screen and introduces no new learner data or scoring logic.

## Learning Path and Journey v1 extensions

[Journey v1](../04-architecture/practice-journey-v1.md) supersedes milestone presentation with participation levels/badges. [Learning Path v1](learning-path-v1.md) adds Pack-only Summary continuation when a matching durable marker exists, with Home fallback for other modes or unknown Path data. Progress adds a separate Path card between evidence and Journey in mobile reading order; it never converts completion markers into capability evidence.
