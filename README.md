# Olympiad Trainer

A portfolio-quality web application for systematic school-olympiad preparation. The current product focuses on Grade 5 mathematics and VSOSh; learners solve independently with optional support.

## Project state

**Completed:** The deployed product has 42 sourced and adapted problems in twelve repository-authored, learner-chosen three-problem Packs; two supported answer kinds; PostgreSQL-backed learner progress and durable Practice history; two explicit adaptive transfer paths plus one exploration path; bounded Knowledge Support; engagement-only Practice Journey XP, levels and badges; Review/Reconfirmation for one carrier with server-owned provenance; and a fixed four-problem, 45-minute Grade 5 Olympiad Simulation with free-form reasoning drafts, server-owned timing, resume/recovery and protected references after Finish.

The main learner-facing UX has also been aligned as UX v1 across Home and Pack selection, the Practice learning shell, Summary and Progress, and Simulation. These presentation changes preserve the existing learning, evidence, adaptive, persistence and reward contracts. See the adopted architecture contracts in [`docs/04-architecture/`](docs/04-architecture/) and UX contracts in [`docs/03-ux/`](docs/03-ux/).

**Current:** The repository contains this bounded Grade 5 VSOSh training experience, including ordinary Practice, adaptive transfer/exploration, Review and Simulation. Existing safeguards remain in force: learner-safe support, explicit solution/reference reveal, sourced content, server-owned integrity boundaries where adopted, and clear separation between participation, observed evidence and skill claims. Learning Path v1 is adopted and implemented on the feature branch: an optional editorial sequence through existing Packs with durable Finish markers, separate from Journey and learning evidence. It is not yet merged or deployed. See [its contract](docs/04-architecture/learning-path-v1.md).

**Future / not yet adopted:** Plausible directions include validating the current learning journeys with real learners, extending Grade 5 content or evidence coverage, or considering other grades, olympiad stages, subjects, and parent-facing capabilities. These are options, not commitments. A new milestone should be chosen from product evidence rather than by extending architecture speculatively.

Project goals and boundaries: [`docs/00-project/project-vision.md`](docs/00-project/project-vision.md). Documentation index: [`docs/README.md`](docs/README.md).
