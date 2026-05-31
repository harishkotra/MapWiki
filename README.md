# MapWiki

MapWiki is an open-source collaborative mapping platform for community-generated geographic datasets. It combines map overlays, cited objects, revision history, moderation, imports, exports, and a REST API in a Vercel-ready Next.js application.

## Stack

- Next.js App Router, TypeScript, TailwindCSS, ShadCN-style UI components
- TanStack Query, Zustand, MapLibre GL JS, OpenStreetMap tiles
- NextAuth with GitHub, Google, and email providers
- PostgreSQL with PostGIS, full-text search, spatial indexes, and revision tables
- Vitest, Playwright, Docker Compose, Vercel config

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Create `.env.local` from `.env.example` and fill provider-specific values.

3. Start PostGIS:

```bash
POSTGRES_PASSWORD=<local-password> docker compose up -d
```

4. Run migrations and seed data:

```bash
npm run db:migrate
npm run db:seed
```

5. Run the app:

```bash
npm run dev
```

The app also runs without a database by using the committed MVP seed data, which keeps previews and Vercel builds functional before infrastructure is attached.

## Main URLs

- `/` landing page
- `/map` interactive layer explorer
- `/datasets/new` dataset creation wizard
- `/datasets/[slug]` dataset pages
- `/moderation` moderation queue
- `/admin` admin overview
- `/api/openapi` OpenAPI document

## Quality Commands

```bash
npm run typecheck
npm run lint
npm run test
npm run build
npm run test:e2e
```

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Database](docs/DATABASE.md)
- [API](docs/API.md)
- [Design System](docs/DESIGN_SYSTEM.md)
- [Abuse Controls](docs/ABUSE_CONTROLS.md)
- [Environment](docs/ENVIRONMENT.md)
- [Contributing](CONTRIBUTING.md)
