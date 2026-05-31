# Database Schema

The initial migration is `database/migrations/0001_initial_schema.sql`. It enables PostGIS, trigram search, and UUID support.

## Tables

- `users`: identity, profile, role, ban state, NextAuth-compatible columns.
- `accounts`, `sessions`, `verification_tokens`: NextAuth persistence.
- `datasets`: public map layer metadata, status, visibility, counters, color, search vector.
- `dataset_tags`: normalized tags for filtering and discovery.
- `dataset_members`: dataset-specific roles for collaborative editing.
- `locations`: map objects with `geometry(Geometry, 4326)`, metadata JSONB, soft deletion, search vector.
- `sources`, `location_sources`: citation model for claims and source reliability.
- `dataset_revisions`, `location_revisions`: Git-like parent revisions, diffs, snapshots, authors.
- `comments`: threaded dataset/location comments.
- `votes`: upvote/downvote records for datasets, locations, and comments.
- `favorites`, `dataset_follows`: saved and watched datasets.
- `media`: uploaded images or files attached to datasets, locations, or comments.
- `reports`: moderation queue.
- `audit_logs`: non-repudiable moderation and content events.
- `notifications`: user-facing change notifications.
- `import_jobs`: tracked import previews and summaries.

## Indexes

- `locations_geometry_gix`: `GIST` spatial index for BBOX and intersection queries.
- `locations_metadata_gin`: JSONB metadata filters.
- `datasets_search_idx`, `locations_search_idx`: full-text search.
- `dataset_tags_tag_idx`: tag filtering.
- moderation and notification indexes for queues.

## Revision Policy

Application code should never destructively overwrite history. Edits update the current row and append a revision row with:

- parent revision
- author
- change summary
- structured diff
- full snapshot
- timestamp

Restore operations create a new revision whose parent is the restored revision.

