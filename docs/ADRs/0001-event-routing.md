# ADR-0001: Rabbit Routing Keys to Socket Event Mapping

## Status

Accepted.

## Context

The application publishes domain events over RabbitMQ and forwards selected events to the frontend through Socket.io project rooms. The mapping needs to stay explicit and stable so the worker remains predictable and the frontend can invalidate queries consistently.

## Decision

- API publishes Rabbit routing keys with underscore format:
  - `task_created`
  - `task_assigned`
  - `comment_added`
- Worker consumes every routing key from `sprintdock.events` into `sprintdock.worker`
- Worker forwards events to the API internal realtime endpoint using dot-format socket event names:
  - `task.updated`
  - `comment.added`
- Project room lifecycle remains:
  - `join_project`
  - `leave_project`

## Consequences

- Broker contracts stay simple and explicit
- Frontend and worker use a stable normalization layer
- Realtime debugging is easier because broker and socket naming conventions are intentionally different by concern
