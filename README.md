# Olympiad Trainer

Web application for systematic preparation for school olympiads.

Current focus:

* Mathematics
* Grade 5
* VSOSh
* Fullstack MVP Deployed: completed — 3 production problems, 2 answer kinds, evidence-backed Progress and PostgreSQL learner persistence
* Adaptive Practice v1 — Two-Capability Transfer: completed
* Home Adaptive Availability: completed
* Current milestone: Durable Practice History v0

Durable Practice History v0 records one bounded completed-episode projection for each successful Finish. It preserves the Finish receipt as the idempotency source, leaves the latest Summary browser-local, and derives no mastery, progress or recommendation state. See [`docs/04-architecture/durable-practice-history-v0.md`](docs/04-architecture/durable-practice-history-v0.md) for the adopted contract.

Project documentation: `docs/`.
