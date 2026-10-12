# Olympiad Trainer

Olympiad Trainer helps Grade 5 students practise mathematics for school olympiads, starting with the All-Russian Olympiad for School Students (VSOSh). It brings problem selection, independent attempts, optional hints and a record of completed work into one Russian-language application.

**[Open the live production demo](https://olympiadtrainer.vercel.app)** — no registration required.

## Try the learner journey

1. Choose a three-problem training set from Home.
2. Attempt a problem, check an answer and retry. Open a hint or explanation when needed.
3. Finish the session, review its summary and explore saved history in Progress.
4. Try Simulation separately: four problems, 45 minutes, written reasoning and explanations after submission.

Use a modern browser with local storage and Web Locks. Each browser profile represents one learner. Simulation currently provides one attempt per learner; finishing it is irreversible.

### Screenshots and walkthrough

The live demo is the current visual walkthrough. Real desktop/mobile screenshots are a follow-up: Home and set selection → Practice with optional help → Summary/Progress → Simulation. No screenshot assets are committed yet.

## Product capabilities

- **Independent practice:** 42 sourced/adapted problems, twelve three-problem sets, numeric and multiple-selection answers, progressive hints and explicit explanation reveal.
- **Continuity:** resume unfinished Practice in the same browser; PostgreSQL-backed history and optional recovery codes for restoring access in another browser.
- **Next steps:** an editorial path through sets, selected follow-up problems and a separate review attempt. XP and badges describe participation.
- **Timed simulation:** editable reasoning drafts, autosave, server-owned timing and immutable submitted work; no automatic scoring.
- **Responsive interface:** CSS Modules and shared tokens, light/dark themes, keyboard focus handling and reduced-motion support.

## Engineering decisions

1. **Keep assistance behind the server boundary.** Client problem data excludes expected answers and explanation text. Server actions validate submissions and authorize hint/reference access, including restrictions during Simulation.
2. **Make Finish safe to retry.** The browser retains an immutable pending request; PostgreSQL transactions and receipts prevent duplicate history/evidence writes after a lost response. Local completion follows server acknowledgement.
3. **Recover identity without collecting contact details.** A random HttpOnly browser credential identifies the learner. Recovery codes are stored only as hashes; activating a replacement invalidates the old code, and recovery revokes the previous browser credential. Owner/generation checks and Web Locks protect local work during transitions.
4. **Separate observations from conclusions.** History, selected reasoning observations, recommendations and participation rewards have distinct rules. A completed set or XP level does not establish mastery.

## Architecture and stack

A modular monolith built with **Next.js App Router, React, strict TypeScript, PostgreSQL, Drizzle ORM and Sass/CSS Modules**, deployed on **Vercel**. Tests use **Vitest and jsdom**.

- [`src/app/`](src/app/) owns routes, server actions and HTTP boundaries.
- [`src/modules/practice/`](src/modules/practice/), [`simulation/`](src/modules/simulation/) and [`knowledge-support/`](src/modules/knowledge-support/) contain domain rules, application behavior, server persistence and UI.
- [`src/modules/learner/`](src/modules/learner/) coordinates identity and browser-local ownership; [`db/migrations/`](db/migrations/) defines database changes.

The main data path is **UI → validated server action → application/domain rules → PostgreSQL → derived UI view**. Practice drafts and the latest Summary remain browser-local; durable history lives on the server. Recovery restores server access, not unsent work from another device.

## Learner validation and reliability

[The learner study](docs/02-research/learner-validation-v0.md) evaluates usability and comprehension. Pilot observations exposed confusion between copying a recovery code and activating it; [the resulting UX](docs/04-architecture/learner-identity-recovery-v1.md#credential-lifecycle-foundation-ot-learner-recovery-credentials-01) makes saving, re-entry and activation explicit. Follow-up comprehension testing remains necessary. Learning effectiveness and mastery are not established.

The [production release record](docs/05-development/recovery-production-runbook.md#current-production-release-record) documents controlled Recovery checks, including lost-cookie restoration and old-browser revocation. Failure-path tests cover retries, conflicts and deadline enforcement. This evidence does not establish an uptime guarantee or continuous monitoring.

## Local quick start

Prerequisites: **Node.js 24**, **pnpm 12.5.1**, and an empty local PostgreSQL database. From the repository root:

```sh
pnpm install --frozen-lockfile
```

Create `.env.local` with your local database credentials:

```dotenv
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/olympiad_trainer
```

Then apply the committed migrations and start the app:

```sh
pnpm db:migrate
pnpm dev
```

Open [localhost:3000](http://localhost:3000). Set `DATABASE_MIGRATION_URL` as well if your provider requires a direct connection for migrations. Recovery is disabled locally by default; its optional secrets, gate and trusted-request configuration are described in the [Recovery runbook](docs/05-development/recovery-production-runbook.md).

## Verification

```sh
pnpm test       # unit/component tests; DB suites skip without DATABASE_TEST_URL
pnpm typecheck
pnpm lint
pnpm stylelint
pnpm format:check
pnpm build
pnpm test:metadata # production HTTP checks; run after build
pnpm verify     # all checks above, plus git diff --check
```

Public metadata uses `https://olympiadtrainer.vercel.app`. Home (`/`) is indexable
and is the only sitemap URL. All Practice routes, Progress, Restore and Simulation
declare `noindex, nofollow`; metadata contains no learner state. Crawling remains
allowed so search engines can read these directives and load Home assets.
The shared Russian social preview is owned by the repository at
`src/app/opengraph-image.png` (1200 × 630), using the product's light-theme colors.

To include PostgreSQL integration tests, create a **separate disposable test database**, migrate it, then pass its URL explicitly:

```sh
DATABASE_URL=postgresql://localhost:5432/olympiad_trainer_test DATABASE_MIGRATION_URL=postgresql://localhost:5432/olympiad_trainer_test pnpm db:migrate
DATABASE_TEST_URL=postgresql://localhost:5432/olympiad_trainer_test pnpm test
```

Adjust credentials for your installation. Test suites create and mutate fixtures. Current PR CI runs the standard checks without provisioning PostgreSQL, so DB integration coverage requires this separate run.

## Explore the implementation

- [Documentation index](docs/README.md) and [product goals](docs/00-project/project-vision.md).
- [Persistence and retry semantics](docs/04-architecture/server-backed-learner-persistence.md).
- [Identity, recovery and local ownership](docs/04-architecture/learner-identity-recovery-v1.md).
- [Simulation timing, submissions and protected assistance](docs/04-architecture/olympiad-simulation-v0.md).
- [Content provenance](docs/04-architecture/problem-content.md) and [responsive Practice design](docs/03-ux/practice-shell-media-v1.md).
