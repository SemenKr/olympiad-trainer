# Olympiad Trainer — Codex Guide

## Mission

Olympiad Trainer is a portfolio-quality web application for systematic preparation of school students for olympiads.

Current product focus:

* mathematics;
* grade 5 first;
* VSOSh first;
* learning to solve problems independently, not merely obtaining answers.

The project serves two goals:

1. build a genuinely useful learning product;
2. demonstrate strong frontend/fullstack engineering.

---

## Source of truth

This file contains working rules for Codex. It is not complete project documentation.

Use:

* `README.md` — repository overview;
* `docs/README.md` — documentation index;
* `docs/00-project/project-vision.md` — product vision;
* relevant files under `docs/` for the current task.

Read only documentation relevant to the current task.

Do not rewrite or load unrelated documentation without a concrete reason.

When implementation and documentation conflict, report the conflict instead of silently choosing one.

---

## Current phase

The project is currently in:

**Product & Architecture Foundation**

Do not create:

* application code;
* dependencies;
* database schemas;
* framework configuration;
* deployment configuration;
* infrastructure;

unless the current task explicitly requests it.

Research findings are not automatically architecture decisions.

Mark uncertain classifications, assumptions and hypotheses as provisional.

---

## Working style

Before changing files:

1. inspect relevant existing files;
2. check `git status`;
3. understand the requested scope;
4. identify the smallest sufficient change.

Prefer:

* small reviewable diffs;
* simple production-like solutions;
* explicit trade-offs;
* existing project conventions;
* vertical slices;
* changes that can be explained clearly.

Do not:

* perform unrelated refactors;
* silently expand task scope;
* create speculative abstractions;
* create placeholder files for hypothetical future work;
* introduce dependencies without a concrete requirement;
* duplicate concepts already represented in the project.

If a requested approach is unnecessarily complex, prefer a simpler solution and briefly explain the trade-off.

---

## Architecture principles

Prefer a modular monolith until there is a demonstrated need for separate services.

Business and domain logic should not depend on:

* React;
* Next.js APIs;
* database clients;
* browser APIs.

Separate framework, application, domain and persistence concerns only when the separation provides real value.

Do not create architectural layers solely to satisfy a pattern.

Prefer vertical slices that produce working behavior over building many empty horizontal layers.

When Next.js is introduced:

* prefer Server Components by default;
* introduce Client Components only where interaction or browser APIs require them;
* do not turn large application areas into client-side applications without need.

Do not introduce without explicit need:

* Redux;
* Zustand;
* CQRS;
* event sourcing;
* microservices;
* repositories for every entity;
* generic service abstractions;
* complex dependency injection.

---

## Domain principles

Keep these concepts distinct:

### Source metadata

Facts belonging to the original olympiad source.

Examples:

* olympiad;
* academic year;
* stage;
* region/platform;
* grade;
* task number;
* original URL.

### Content

What the problem actually contains.

Examples:

* statement;
* media;
* answer options;
* official answer;
* official solution.

### Semantics

Our interpretation of the mathematical problem.

Examples:

* domain;
* skill;
* method;
* concepts.

These classifications are not official VSOSh metadata unless the source explicitly says so.

### Training data

Information created specifically for Olympiad Trainer.

Examples:

* training difficulty;
* progressive hints;
* mastery impact;
* recommendation weight;
* review priority.

Never mix these four categories without an explicit reason.

Preserve provenance for imported or referenced problems.

Do not infer training difficulty from the official problem number.

Do not assume every problem has one simple text answer.

AI must not be treated as the source of truth for mathematical correctness.

The product should help the learner think rather than solve the problem for them.

---

## Learning principles

The default learning flow is:

problem
→ independent attempt
→ feedback
→ retry
→ progressive hint
→ retry
→ solution if necessary
→ related or transfer problem
→ progress update.

Hints should progressively increase assistance.

Preferred semantic levels:

1. `focus` — direct attention to something important;
2. `strategy` — suggest a useful direction;
3. `next-step` — provide a concrete next action;
4. `solution` — complete explanation.

Do not expose the full solution earlier than necessary.

Training and olympiad simulation are different modes.

Training may include:

* hints;
* retries;
* explanations;
* recommendations.

Olympiad simulation should preserve competition constraints such as:

* no hints;
* no early solutions;
* time limits;
* official scoring rules where applicable.

---

## Code quality

When application code is introduced:

* use TypeScript strict mode;
* prefer readable names over clever abstractions;
* use English identifiers;
* avoid `any`;
* avoid unnecessary type assertions;
* prefer small focused functions;
* prefer pure domain functions when practical;
* make important boundaries explicit with types;
* avoid hidden magic values;
* avoid premature optimization.

Code should be understandable enough that the developer can explain its purpose and trade-offs in an interview.

Comments should explain **why**, not restate **what** the code already says.

Do not generate large amounts of boilerplate unless the task genuinely requires it.

Prefer the smallest implementation that correctly solves the current problem and leaves a clear path for extension.

---

## React and Next.js

When React/Next.js is introduced:

* keep components focused;
* separate business rules from UI rendering;
* avoid large components containing domain calculations;
* avoid unnecessary `useEffect`;
* derive state where possible instead of synchronizing duplicate state;
* keep client-side state local until shared state is actually required;
* prefer server data loading when appropriate;
* validate data at system boundaries.

Do not add a state management library because the project may need it later.

Add one only when a concrete state-management problem appears.

---

## Forms and validation

When forms are introduced:

* use schema-based validation where appropriate;
* keep UI validation and server validation consistent;
* never trust client-side validation alone;
* return understandable validation errors;
* preserve entered values where reasonable after recoverable errors.

React Hook Form and Zod are preferred when they solve the actual form requirements.

---

## Accessibility

Accessibility is part of the implementation, not final polish.

When building UI:

* use semantic HTML;
* support keyboard interaction;
* maintain visible focus states;
* associate labels with controls;
* provide accessible names;
* avoid interaction that depends only on color;
* ensure touch targets are practical on mobile;
* consider screen-reader behavior for dynamic feedback.

Do not replace semantic native elements with generic `div` elements without a reason.

---

## Responsive UI

Mobile experience is a first-class requirement.

Design and implementation must work at small widths without:

* horizontal overflow;
* clipped content;
* inaccessible controls;
* unreadably small text;
* overlapping fixed elements.

Do not treat responsive work as a final cleanup phase.

---

## UX principles

The primary user is a school student.

Prefer:

* one clear primary action;
* low cognitive load;
* short understandable text;
* visible progress;
* calm visual hierarchy;
* clear feedback;
* strong mobile behavior;
* subtle gamification.

Avoid:

* dashboard clutter;
* excessive metrics;
* childish visual treatment;
* punitive messaging;
* excessive animation;
* exposing a complete solution too early.

Wrong answers should encourage another attempt rather than feel like punishment.

---

## Testing

Test business behavior rather than implementation details.

Preferred strategy:

### Domain logic

Use unit tests for rules such as:

* answer evaluation;
* scoring;
* mastery calculation;
* recommendation logic;
* review priority;
* adaptive difficulty.

### UI behavior

Use component/integration tests for meaningful interaction.

### Critical flows

Use Playwright for important end-to-end journeys.

Examples:

* start practice;
* solve problem;
* use hint;
* finish session;
* view progress;
* olympiad simulation.

Every bug fix should include a regression test when practical.

Do not add meaningless tests purely to increase coverage.

---

## Data and persistence

PostgreSQL is the intended primary database unless an architecture decision changes this later.

Do not optimize persistence before requirements justify it.

Prefer source-of-truth records over duplicated counters.

For example, attempts and hint usage should normally be the source data from which progress can initially be calculated.

Introduce cached or aggregated progress only when there is a real need.

Do not implement full event sourcing unless explicitly decided later.

---

## External content

Do not bulk-copy olympiad archives without an explicit task and rights review.

For research documentation:

* prefer source URL;
* task number;
* short description;
* our analysis.

Avoid reproducing full copyrighted problem statements unless required and permitted.

Always distinguish:

* official source material;
* our interpretation;
* our training content.

---

## Git workflow

Do not create commits unless the task explicitly requests a commit.

Do not push unless explicitly requested.

Do not rewrite, amend or force-push history unless explicitly requested.

Do not change branches unless the task requires it.

Before completing any task:

1. inspect `git diff`;
2. inspect `git status`;
3. confirm only task-related files changed.

Keep changes PR-sized.

When a commit is requested, use a concise conventional-style message that describes the actual change.

Examples:

* `docs: audit VSOSh problem formats`
* `feat: persist practice attempts`
* `test: cover scoring rules`
* `fix: preserve answer after validation error`

Avoid meaningless messages such as:

* `changes`
* `update`
* `fix stuff`

---

## Documentation

Durable product and architecture knowledge belongs in `docs/`.

Use:

* research documents for observations and analysis;
* product documents for requirements and flows;
* architecture documents for system design;
* ADRs for important durable decisions.

Do not create an ADR for trivial implementation details.

When new research invalidates an earlier assumption:

* update the relevant document;
* explain the changed conclusion;
* avoid leaving contradictory documentation.

Documentation should explain decisions and trade-offs, not merely repeat code.

---

## ADR rules

Create an ADR only when a decision:

* has meaningful alternatives;
* affects future implementation;
* is difficult or expensive to reverse;
* benefits from preserving the reasoning.

A good ADR should contain:

* context;
* decision;
* alternatives considered;
* trade-offs;
* consequences.

Keep ADRs concise.

---

## Research tasks

For research work, clearly separate:

### Observed fact

Directly supported by a source or repository evidence.

### Interpretation

Our analysis of the observed material.

### Recommendation

What we think the project should do because of that analysis.

Do not convert an interpretation into a factual statement.

Do not present provisional taxonomy as final.

When possible, validate a proposed model against multiple real examples before formalizing it.

---

## Codex behavior

Do not guess when repository evidence can answer the question.

Do not invent:

* APIs;
* contracts;
* files;
* requirements;
* source behavior;
* completed work;
* test results.

If blocked:

1. identify the concrete blocker;
2. determine whether a safe minimal assumption allows progress;
3. if not, stop before destructive or speculative work.

Do not silently compensate for unclear requirements by building additional functionality.

If a task reveals an important architectural or product issue outside the current scope, report it rather than fixing it automatically.

---

## Task completion report

Keep completion reports concise.

Prefer:

1. what changed;
2. important decisions or findings;
3. validation performed;
4. unresolved issues or blockers.

Do not generate long generic summaries.

---

## Definition of done

A task is complete only when:

* requested scope is completed;
* unrelated files are untouched;
* relevant validation has been performed;
* documentation remains consistent;
* `git diff` contains no accidental work;
* limitations or unresolved questions are explicitly reported.

Quality is preferred over volume.

The project should remain understandable, maintainable and explainable at every stage.
