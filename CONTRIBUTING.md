# Contributing

## Development

1. Install dependencies with `npm install`.
2. Configure `.env.local`.
3. Run `npm run db:migrate` and `npm run db:seed` when using PostGIS locally.
4. Start the app with `npm run dev`.

## Pull Request Checklist

- Keep data changes recoverable through revisions.
- Add citations for new seed objects.
- Validate all API inputs with Zod or equivalent structured validation.
- Use parameterized SQL.
- Preserve keyboard access and visible focus states.
- Add or update tests for changed behavior.
- Run `npm run typecheck`, `npm run lint`, and `npm run test`.

## Code Organization

- Shared UI belongs in `components`.
- Feature-owned UI and state belong in `features`.
- Server-only database/auth/moderation logic belongs in `server`.
- Format parsers and exporters belong in `services`.
- API handlers should stay thin and call repository/service functions.

