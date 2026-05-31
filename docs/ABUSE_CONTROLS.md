# Abuse Controls

MapWiki is designed to stay open without requiring sign-in for ordinary contribution flows. Abuse controls are therefore based on anonymized request fingerprints, route policy, request shape, and content quality.

## Rate Limiting

Rate limits are enforced in route handlers and server actions through `lib/rate-limit.ts`.

The production path uses PostgreSQL/Neon tables:

- `abuse_rate_limit_counters`: fixed-window counters keyed by anonymized client fingerprint and policy.
- `abuse_rate_limit_penalties`: escalating temporary blocks after repeated limit violations.
- `abuse_events`: audit trail for blocked requests and spam rejections.

When `DATABASE_URL` is not configured, the limiter falls back to an in-process counter for local previews only.

Default policies:

- Public API reads: `600/minute`
- Search: `90/minute`
- Exports: `30/minute`
- Dataset creation: `3/10 minutes` and `12/day`
- Location creation: `30/10 minutes` and `250/day`
- Comments: `8/10 minutes` and `80/day`
- Import previews: `8/hour`
- Revision restore: `8/hour`

Rejected requests return HTTP `429` with `Retry-After` and standard `RateLimit-*` headers.

## Spam Checks

`lib/spam.ts` scores user-supplied content before write operations. It rejects:

- Hidden honeypot fields such as `website`, `homepage`, and `company`
- Executable HTML/script payloads
- Control characters and invisible characters
- Excessive links for the specific submission type
- Common spam phrases
- Repeated low-variety text
- Duplicate submissions from the same anonymized client inside a short window

Warnings and rejections are written to `abuse_events` without storing raw IP addresses.

## Open Contribution Identity

Unauthenticated write flows use a fixed `Anonymous contributor` user row:

```text
00000000-0000-4000-8000-000000000004
```

This keeps foreign-key constraints intact without requiring accounts. If authenticated sessions are enabled later, signed-in contributors are still used automatically.

## Operational Notes

- Rotate `RATE_LIMIT_SALT` if client fingerprints need to be invalidated. If unset, `NEXTAUTH_SECRET` is used as the salt.
- `DATABASE_SSL=true` should remain enabled for Neon.
- Old abuse counter rows can be pruned with a scheduled maintenance job once traffic volume warrants it.
