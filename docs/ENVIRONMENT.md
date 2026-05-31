# Environment Variables

Create a local environment file and fill the values for your deployment. Do not commit local environment files or production secrets.

## Required for production

- `APP_URL`: canonical app URL.
- `DATABASE_URL`: managed Postgres/PostGIS connection URL.
- `NEXTAUTH_URL`: public auth callback URL.
- `NEXTAUTH_SECRET`: high-entropy session secret.

## Auth providers

- `GITHUB_ID`
- `GITHUB_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `EMAIL_SERVER`
- `EMAIL_FROM`
- `EMAIL_HTTP_ENDPOINT`: HTTPS endpoint that accepts `{ to, from, subject, text, html }` for magic-link delivery.
- `EMAIL_HTTP_TOKEN`: optional bearer token sent to `EMAIL_HTTP_ENDPOINT`.

Any provider without complete settings is skipped at runtime.

## Optional

- `BLOB_READ_WRITE_TOKEN`: Vercel Blob token for future media upload storage.
- `DATABASE_SSL`: set to `true` when the managed database requires SSL.
- `RATE_LIMIT_WINDOW_MS`
- `RATE_LIMIT_MAX`

## Local database

The Docker Compose file requires a `POSTGRES_PASSWORD` shell variable or local `.env` entry. After the database is running, set `DATABASE_URL` to the matching local connection URL in `.env.local`.
