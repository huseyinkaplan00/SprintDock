# ADR-0003: Demo-Only OTP_ECHO Flag

## Status

Accepted.

## Context

A hosted demo needs a way to complete the OTP login flow without integrating a real email or SMS delivery provider.

## Decision

- When `NODE_ENV != production`, OTP codes may be returned in the API response for local development convenience.
- When `NODE_ENV == production`, OTP codes are returned only when `OTP_ECHO=true`.
- `OTP_ECHO` is restricted to demo/testing environments and must remain disabled in real production usage.

## Consequences

- Demo environments remain easy to validate end to end
- The tradeoff is explicit and isolated behind a feature flag
- Real production environments must replace this with a proper delivery channel
