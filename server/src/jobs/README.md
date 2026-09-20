# Background jobs

Empty by design in Phase 1.

Planned (Phase 12): a small worker entry point that runs on an interval and

- dispatches PENDING `Notification` rows through their channel (with retry and attempt counts),
- enqueues scheduled reminders (lesson tomorrow, package expiring).

There is deliberately no Redis or external queue. If volume ever justifies it, `pg-boss`
(Postgres-backed) is the intended upgrade path.
