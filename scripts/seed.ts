import { getPool } from "@/server/db/client";
import { sampleDatasets, sampleLocations, sampleRevisions, sampleUsers } from "@/database/seeds/sample-data";

async function main() {
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    for (const user of sampleUsers) {
      await client.query(
        `
          INSERT INTO users (id, name, email, image, bio, role, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, image = EXCLUDED.image, bio = EXCLUDED.bio, role = EXCLUDED.role
        `,
        [user.id, user.name, user.email, user.image, user.bio, user.role === "anonymous" ? "registered" : user.role, user.createdAt, user.updatedAt]
      );
    }

    for (const dataset of sampleDatasets) {
      await client.query(
        `
          INSERT INTO datasets (id, slug, name, description, cover_image, category, creator_id, visibility, status, object_count, followers, views, color, default_opacity, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
          ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, description = EXCLUDED.description, object_count = EXCLUDED.object_count, followers = EXCLUDED.followers, views = EXCLUDED.views
        `,
        [
          dataset.id,
          dataset.slug,
          dataset.name,
          dataset.description,
          dataset.coverImage,
          dataset.category,
          dataset.creatorId,
          dataset.visibility,
          dataset.status,
          dataset.objectCount,
          dataset.followers,
          dataset.views,
          dataset.color,
          dataset.defaultOpacity,
          dataset.createdAt,
          dataset.updatedAt
        ]
      );
      for (const tag of dataset.tags) {
        await client.query("INSERT INTO dataset_tags (dataset_id, tag) VALUES ($1, $2) ON CONFLICT DO NOTHING", [dataset.id, tag]);
      }
    }

    for (const location of sampleLocations) {
      await client.query(
        `
          INSERT INTO locations (id, dataset_id, title, description, geometry, geometry_type, metadata, created_by, updated_by, created_at, updated_at)
          VALUES ($1, $2, $3, $4, ST_SetSRID(ST_GeomFromGeoJSON($5), 4326), $6, $7, $8, $9, $10, $11)
          ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, description = EXCLUDED.description, metadata = EXCLUDED.metadata
        `,
        [
          location.id,
          location.datasetId,
          location.title,
          location.description,
          JSON.stringify(location.geometry),
          location.geometryType,
          location.metadata,
          location.createdBy,
          location.updatedBy,
          location.createdAt,
          location.updatedAt
        ]
      );
      for (const item of location.sources) {
        await client.query(
          `
            INSERT INTO sources (id, title, url, publication_date, notes, reliability_score, created_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (id) DO UPDATE SET title = EXCLUDED.title, url = EXCLUDED.url
          `,
          [item.id, item.title, item.url, item.publicationDate, item.notes, item.reliabilityScore, location.createdBy]
        );
        await client.query("INSERT INTO location_sources (location_id, source_id) VALUES ($1, $2) ON CONFLICT DO NOTHING", [location.id, item.id]);
      }
    }

    for (const revision of sampleRevisions) {
      await client.query(
        `
          INSERT INTO dataset_revisions (id, dataset_id, parent_revision_id, author_id, change_summary, diff, snapshot, created_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (id) DO NOTHING
        `,
        [revision.id, revision.targetId, revision.parentRevisionId, revision.authorId, revision.changeSummary, revision.diff, revision.snapshot, revision.createdAt]
      );
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

