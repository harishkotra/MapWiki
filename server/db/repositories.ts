import { randomUUID } from "crypto";
import type { Comment, Dataset, FeatureCollection, Geometry, Location, Revision, SearchResult, Source, User } from "@/types/domain";
import { sampleComments, sampleDatasets, sampleLocations, sampleRevisions, sampleUsers } from "@/database/seeds/sample-data";
import { getPool, hasDatabaseUrl } from "./client";

type ListDatasetsParams = {
  q?: string;
  category?: string;
  tag?: string;
  featured?: boolean;
  limit?: number;
  offset?: number;
};

type ListLocationsParams = {
  datasetIds?: string[];
  bbox?: [number, number, number, number];
  q?: string;
  limit?: number;
};

type CreateDatasetInput = Pick<Dataset, "name" | "description" | "category" | "tags" | "visibility"> & {
  geometryType?: string;
  coverImage?: string | null;
};

type CreateLocationInput = Pick<Location, "datasetId" | "title" | "description" | "geometry" | "metadata"> & {
  sources?: Array<Omit<Source, "id">>;
};

const toIso = (value: unknown) => {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "string") return value;
  return new Date().toISOString();
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

function datasetFromRow(row: Record<string, unknown>): Dataset {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    description: String(row.description ?? ""),
    coverImage: (row.cover_image as string | null) ?? null,
    category: String(row.category ?? "General"),
    tags: Array.isArray(row.tags) ? (row.tags as string[]) : [],
    creatorId: String(row.creator_id),
    creatorName: String(row.creator_name ?? "Unknown"),
    visibility: row.visibility as Dataset["visibility"],
    status: row.status as Dataset["status"],
    objectCount: Number(row.object_count ?? 0),
    followers: Number(row.followers ?? 0),
    views: Number(row.views ?? 0),
    color: String(row.color ?? "#0f766e"),
    defaultOpacity: Number(row.default_opacity ?? 0.8),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at)
  };
}

function locationFromRow(row: Record<string, unknown>): Location {
  const sources = Array.isArray(row.sources) ? (row.sources as Source[]) : [];
  return {
    id: String(row.id),
    datasetId: String(row.dataset_id),
    title: String(row.title),
    description: String(row.description ?? ""),
    geometry: row.geometry as Geometry,
    geometryType: row.geometry_type as Location["geometryType"],
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    sources,
    createdBy: String(row.created_by),
    updatedBy: String(row.updated_by),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at)
  };
}

export async function listDatasets(params: ListDatasetsParams = {}): Promise<Dataset[]> {
  const limit = Math.min(params.limit ?? 50, 100);
  const offset = params.offset ?? 0;

  if (!hasDatabaseUrl()) {
    let rows = [...sampleDatasets];
    if (params.q) {
      const needle = params.q.toLowerCase();
      rows = rows.filter((dataset) =>
        [dataset.name, dataset.description, dataset.category, ...dataset.tags].some((value) => value.toLowerCase().includes(needle))
      );
    }
    if (params.category) rows = rows.filter((dataset) => dataset.category.toLowerCase() === params.category?.toLowerCase());
    if (params.tag) rows = rows.filter((dataset) => dataset.tags.includes(params.tag ?? ""));
    if (params.featured) rows = rows.sort((a, b) => b.views - a.views);
    return rows.slice(offset, offset + limit);
  }

  const pool = getPool();
  const values: unknown[] = [];
  const where = ["d.visibility = 'public'", "d.status IN ('published', 'locked')"];

  if (params.q) {
    values.push(`%${params.q}%`);
    where.push(`(d.name ILIKE $${values.length} OR d.description ILIKE $${values.length} OR d.category ILIKE $${values.length})`);
  }
  if (params.category) {
    values.push(params.category);
    where.push(`LOWER(d.category) = LOWER($${values.length})`);
  }
  if (params.tag) {
    values.push(params.tag);
    where.push(`EXISTS (SELECT 1 FROM dataset_tags dt2 WHERE dt2.dataset_id = d.id AND dt2.tag = $${values.length})`);
  }

  values.push(limit, offset);
  const result = await pool.query(
    `
      SELECT d.*, u.name AS creator_name, COALESCE(array_agg(dt.tag) FILTER (WHERE dt.tag IS NOT NULL), '{}') AS tags
      FROM datasets d
      JOIN users u ON u.id = d.creator_id
      LEFT JOIN dataset_tags dt ON dt.dataset_id = d.id
      WHERE ${where.join(" AND ")}
      GROUP BY d.id, u.name
      ORDER BY ${params.featured ? "d.views DESC, d.followers DESC" : "d.updated_at DESC"}
      LIMIT $${values.length - 1} OFFSET $${values.length}
    `,
    values
  );

  return result.rows.map(datasetFromRow);
}

export async function getDatasetBySlug(slug: string): Promise<Dataset | null> {
  if (!hasDatabaseUrl()) {
    return sampleDatasets.find((dataset) => dataset.slug === slug) ?? null;
  }

  const pool = getPool();
  const result = await pool.query(
    `
      SELECT d.*, u.name AS creator_name, COALESCE(array_agg(dt.tag) FILTER (WHERE dt.tag IS NOT NULL), '{}') AS tags
      FROM datasets d
      JOIN users u ON u.id = d.creator_id
      LEFT JOIN dataset_tags dt ON dt.dataset_id = d.id
      WHERE d.slug = $1 AND d.visibility = 'public'
      GROUP BY d.id, u.name
      LIMIT 1
    `,
    [slug]
  );
  return result.rows[0] ? datasetFromRow(result.rows[0]) : null;
}

export async function listLocations(params: ListLocationsParams = {}): Promise<Location[]> {
  const limit = Math.min(params.limit ?? 2000, 5000);

  if (!hasDatabaseUrl()) {
    let rows = [...sampleLocations];
    if (params.datasetIds?.length) rows = rows.filter((location) => params.datasetIds?.includes(location.datasetId));
    if (params.q) {
      const needle = params.q.toLowerCase();
      rows = rows.filter((location) =>
        [location.title, location.description, JSON.stringify(location.metadata)].some((value) => value.toLowerCase().includes(needle))
      );
    }
    if (params.bbox) {
      const [west, south, east, north] = params.bbox;
      rows = rows.filter((location) => {
        const [lng, lat] = location.geometry.type === "Point" ? location.geometry.coordinates : [0, 0];
        return Number(lng) >= west && Number(lng) <= east && Number(lat) >= south && Number(lat) <= north;
      });
    }
    return rows.slice(0, limit);
  }

  const pool = getPool();
  const values: unknown[] = [];
  const where = ["l.deleted_at IS NULL"];

  if (params.datasetIds?.length) {
    values.push(params.datasetIds);
    where.push(`l.dataset_id = ANY($${values.length}::uuid[])`);
  }
  if (params.q) {
    values.push(`%${params.q}%`);
    where.push(`(l.title ILIKE $${values.length} OR l.description ILIKE $${values.length})`);
  }
  if (params.bbox) {
    const start = values.length + 1;
    values.push(...params.bbox);
    where.push(`ST_Intersects(l.geometry, ST_MakeEnvelope($${start}, $${start + 1}, $${start + 2}, $${start + 3}, 4326))`);
  }
  values.push(limit);

  const result = await pool.query(
    `
      SELECT
        l.*,
        ST_AsGeoJSON(l.geometry)::json AS geometry,
        COALESCE(
          json_agg(DISTINCT jsonb_build_object(
            'id', s.id,
            'title', s.title,
            'url', s.url,
            'publicationDate', s.publication_date,
            'notes', s.notes,
            'reliabilityScore', s.reliability_score
          )) FILTER (WHERE s.id IS NOT NULL),
          '[]'
        ) AS sources
      FROM locations l
      LEFT JOIN location_sources ls ON ls.location_id = l.id
      LEFT JOIN sources s ON s.id = ls.source_id
      WHERE ${where.join(" AND ")}
      GROUP BY l.id
      ORDER BY l.updated_at DESC
      LIMIT $${values.length}
    `,
    values
  );

  return result.rows.map(locationFromRow);
}

export async function getLocationsForDataset(datasetId: string): Promise<Location[]> {
  return listLocations({ datasetIds: [datasetId], limit: 5000 });
}

export function toFeatureCollection(locations: Location[], datasets = sampleDatasets): FeatureCollection {
  const datasetById = new Map(datasets.map((dataset) => [dataset.id, dataset]));
  return {
    type: "FeatureCollection",
    features: locations.map((location) => {
      const dataset = datasetById.get(location.datasetId);
      return {
        type: "Feature",
        geometry: location.geometry,
        properties: {
          id: location.id,
          datasetId: location.datasetId,
          datasetName: dataset?.name,
          color: dataset?.color ?? "#0f766e",
          title: location.title,
          description: location.description,
          geometryType: location.geometryType,
          metadata: location.metadata,
          sources: location.sources
        }
      };
    })
  };
}

export async function createDataset(input: CreateDatasetInput, userId: string): Promise<Dataset> {
  const slug = slugify(input.name);
  const now = new Date().toISOString();

  if (!hasDatabaseUrl()) {
    const creator = sampleUsers.find((user) => user.id === userId) ?? sampleUsers[0];
    return {
      id: randomUUID(),
      slug,
      name: input.name,
      description: input.description,
      coverImage: input.coverImage ?? null,
      category: input.category,
      tags: input.tags,
      creatorId: creator.id,
      creatorName: creator.name,
      visibility: input.visibility,
      status: "draft",
      objectCount: 0,
      followers: 0,
      views: 0,
      color: "#0f766e",
      defaultOpacity: 0.8,
      createdAt: now,
      updatedAt: now
    };
  }

  const pool = getPool();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      `
        INSERT INTO datasets (slug, name, description, cover_image, category, creator_id, visibility, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'draft')
        RETURNING *
      `,
      [slug, input.name, input.description, input.coverImage ?? null, input.category, userId, input.visibility]
    );
    for (const tag of input.tags) {
      await client.query("INSERT INTO dataset_tags (dataset_id, tag) VALUES ($1, $2) ON CONFLICT DO NOTHING", [result.rows[0].id, tag]);
    }
    await client.query(
      `
        INSERT INTO dataset_revisions (dataset_id, author_id, change_summary, diff, snapshot)
        VALUES ($1, $2, $3, $4, $5)
      `,
      [result.rows[0].id, userId, "Created dataset", { op: "create" }, result.rows[0]]
    );
    await client.query("COMMIT");
    return datasetFromRow({ ...result.rows[0], creator_name: "You", tags: input.tags });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function createLocation(input: CreateLocationInput, userId: string): Promise<Location> {
  const now = new Date().toISOString();
  if (!hasDatabaseUrl()) {
    return {
      id: randomUUID(),
      datasetId: input.datasetId,
      title: input.title,
      description: input.description,
      geometry: input.geometry,
      geometryType: input.geometry.type,
      metadata: input.metadata,
      sources: input.sources?.map((item) => ({ id: randomUUID(), ...item })) ?? [],
      createdBy: userId,
      updatedBy: userId,
      createdAt: now,
      updatedAt: now
    };
  }

  const pool = getPool();
  const result = await pool.query(
    `
      INSERT INTO locations (dataset_id, title, description, geometry, geometry_type, metadata, created_by, updated_by)
      VALUES ($1, $2, $3, ST_SetSRID(ST_GeomFromGeoJSON($4), 4326), $5, $6, $7, $7)
      RETURNING *, ST_AsGeoJSON(geometry)::json AS geometry
    `,
    [input.datasetId, input.title, input.description, JSON.stringify(input.geometry), input.geometry.type, input.metadata, userId]
  );
  return locationFromRow({ ...result.rows[0], sources: [] });
}

export async function listRevisions(targetType?: "dataset" | "location", targetId?: string): Promise<Revision[]> {
  if (!hasDatabaseUrl()) {
    return sampleRevisions.filter((revision) => (!targetType || revision.targetType === targetType) && (!targetId || revision.targetId === targetId));
  }

  const table = targetType === "location" ? "location_revisions" : "dataset_revisions";
  const idColumn = targetType === "location" ? "location_id" : "dataset_id";
  const values: unknown[] = [];
  const where: string[] = [];
  if (targetId) {
    values.push(targetId);
    where.push(`r.${idColumn} = $1`);
  }
  const result = await getPool().query(
    `
      SELECT r.*, u.name AS author_name
      FROM ${table} r
      JOIN users u ON u.id = r.author_id
      ${where.length ? `WHERE ${where.join(" AND ")}` : ""}
      ORDER BY r.created_at DESC
      LIMIT 100
    `,
    values
  );
  return result.rows.map((row) => ({
    id: String(row.id),
    targetType: targetType ?? "dataset",
    targetId: String(row[idColumn]),
    parentRevisionId: row.parent_revision_id,
    authorId: String(row.author_id),
    authorName: String(row.author_name),
    changeSummary: String(row.change_summary),
    diff: row.diff ?? {},
    snapshot: row.snapshot ?? {},
    createdAt: toIso(row.created_at)
  }));
}

export async function listComments(datasetId?: string, locationId?: string): Promise<Comment[]> {
  if (!hasDatabaseUrl()) {
    return sampleComments.filter((comment) => (!datasetId || comment.datasetId === datasetId) && (!locationId || comment.locationId === locationId));
  }

  const values: unknown[] = [];
  const where = ["c.deleted_at IS NULL"];
  if (datasetId) {
    values.push(datasetId);
    where.push(`c.dataset_id = $${values.length}`);
  }
  if (locationId) {
    values.push(locationId);
    where.push(`c.location_id = $${values.length}`);
  }
  const result = await getPool().query(
    `
      SELECT c.*, u.name AS author_name
      FROM comments c
      JOIN users u ON u.id = c.author_id
      WHERE ${where.join(" AND ")}
      ORDER BY c.created_at DESC
      LIMIT 100
    `,
    values
  );
  return result.rows.map((row) => ({
    id: String(row.id),
    datasetId: row.dataset_id,
    locationId: row.location_id,
    parentId: row.parent_id,
    authorId: String(row.author_id),
    authorName: String(row.author_name),
    body: String(row.body),
    voteScore: Number(row.vote_score ?? 0),
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at)
  }));
}

export async function addComment(input: { datasetId?: string; locationId?: string; body: string }, userId: string): Promise<Comment> {
  const now = new Date().toISOString();
  if (!hasDatabaseUrl()) {
    return {
      id: randomUUID(),
      datasetId: input.datasetId ?? null,
      locationId: input.locationId ?? null,
      parentId: null,
      authorId: userId,
      authorName: "You",
      body: input.body,
      voteScore: 0,
      createdAt: now,
      updatedAt: now
    };
  }

  const result = await getPool().query(
    `
      INSERT INTO comments (dataset_id, location_id, author_id, body)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `,
    [input.datasetId ?? null, input.locationId ?? null, userId, input.body]
  );
  const author = await getUserById(userId);
  return {
    id: String(result.rows[0].id),
    datasetId: result.rows[0].dataset_id,
    locationId: result.rows[0].location_id,
    parentId: result.rows[0].parent_id,
    authorId: userId,
    authorName: author?.name ?? "Unknown",
    body: result.rows[0].body,
    voteScore: Number(result.rows[0].vote_score ?? 0),
    createdAt: toIso(result.rows[0].created_at),
    updatedAt: toIso(result.rows[0].updated_at)
  };
}

export async function restoreRevision(targetType: "dataset" | "location", revisionId: string, userId: string): Promise<Revision> {
  if (!hasDatabaseUrl()) {
    const revision = sampleRevisions.find((item) => item.id === revisionId && item.targetType === targetType);
    if (!revision) throw new Error("Revision not found.");
    return {
      ...revision,
      id: randomUUID(),
      parentRevisionId: revision.id,
      authorId: userId,
      authorName: "You",
      changeSummary: `Restored revision ${revision.id}`,
      createdAt: new Date().toISOString()
    };
  }

  const table = targetType === "location" ? "location_revisions" : "dataset_revisions";
  const idColumn = targetType === "location" ? "location_id" : "dataset_id";
  const pool = getPool();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");
    const existing = await client.query(`SELECT * FROM ${table} WHERE id = $1 FOR UPDATE`, [revisionId]);
    if (!existing.rowCount) throw new Error("Revision not found.");

    const row = existing.rows[0];
    const snapshot = row.snapshot ?? {};
    const targetId = row[idColumn] as string;

    if (targetType === "dataset") {
      await client.query(
        `
          UPDATE datasets
          SET
            name = COALESCE($2, name),
            description = COALESCE($3, description),
            cover_image = COALESCE($4, cover_image),
            category = COALESCE($5, category),
            visibility = COALESCE($6, visibility),
            status = COALESCE($7, status),
            color = COALESCE($8, color),
            default_opacity = COALESCE($9, default_opacity)
          WHERE id = $1
        `,
        [
          targetId,
          snapshot.name,
          snapshot.description,
          snapshot.coverImage ?? snapshot.cover_image,
          snapshot.category,
          snapshot.visibility,
          snapshot.status,
          snapshot.color,
          snapshot.defaultOpacity ?? snapshot.default_opacity
        ]
      );
    } else {
      await client.query(
        `
          UPDATE locations
          SET
            title = COALESCE($2, title),
            description = COALESCE($3, description),
            geometry = COALESCE(ST_SetSRID(ST_GeomFromGeoJSON($4), 4326), geometry),
            geometry_type = COALESCE($5, geometry_type),
            metadata = COALESCE($6, metadata),
            updated_by = $7
          WHERE id = $1
        `,
        [
          targetId,
          snapshot.title,
          snapshot.description,
          snapshot.geometry ? JSON.stringify(snapshot.geometry) : null,
          snapshot.geometryType ?? snapshot.geometry_type,
          snapshot.metadata,
          userId
        ]
      );
    }

    const restored = await client.query(
      `
        INSERT INTO ${table} (${idColumn}, parent_revision_id, author_id, change_summary, diff, snapshot)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `,
      [targetId, revisionId, userId, `Restored revision ${revisionId}`, { op: "restore", revisionId }, snapshot]
    );

    await client.query("COMMIT");
    const author = await getUserById(userId);
    return {
      id: String(restored.rows[0].id),
      targetType,
      targetId,
      parentRevisionId: revisionId,
      authorId: userId,
      authorName: author?.name ?? "Unknown",
      changeSummary: restored.rows[0].change_summary,
      diff: restored.rows[0].diff,
      snapshot: restored.rows[0].snapshot,
      createdAt: toIso(restored.rows[0].created_at)
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function searchAll(q: string): Promise<SearchResult[]> {
  const query = q.trim().toLowerCase();
  if (!query) return [];

  if (!hasDatabaseUrl()) {
    const datasetResults = sampleDatasets
      .filter((dataset) => [dataset.name, dataset.description, dataset.category, ...dataset.tags].some((value) => value.toLowerCase().includes(query)))
      .map<SearchResult>((dataset) => ({
        id: dataset.id,
        type: "dataset",
        title: dataset.name,
        subtitle: `${dataset.category} · ${dataset.objectCount} objects`,
        href: `/datasets/${dataset.slug}`,
        score: dataset.name.toLowerCase().includes(query) ? 1 : 0.72
      }));
    const locationResults = sampleLocations
      .filter((location) => [location.title, location.description, JSON.stringify(location.metadata)].some((value) => value.toLowerCase().includes(query)))
      .map<SearchResult>((location) => {
        const dataset = sampleDatasets.find((item) => item.id === location.datasetId);
        return {
          id: location.id,
          type: "location",
          title: location.title,
          subtitle: dataset?.name,
          href: `/map?location=${location.id}`,
          score: location.title.toLowerCase().includes(query) ? 0.95 : 0.62
        };
      });
    const userResults = sampleUsers
      .filter((user) => user.name.toLowerCase().includes(query))
      .map<SearchResult>((user) => ({
        id: user.id,
        type: "user",
        title: user.name,
        subtitle: user.bio ?? "Contributor",
        href: `/profile/${user.id}`,
        score: 0.58
      }));
    return [...datasetResults, ...locationResults, ...userResults].sort((a, b) => b.score - a.score).slice(0, 20);
  }

  const result = await getPool().query(
    `
      SELECT id, 'dataset' AS type, name AS title, category AS subtitle, ('/datasets/' || slug) AS href,
        ts_rank_cd(search_vector, plainto_tsquery('english', $1)) AS score
      FROM datasets
      WHERE search_vector @@ plainto_tsquery('english', $1) AND visibility = 'public'
      UNION ALL
      SELECT id, 'location' AS type, title, description AS subtitle, ('/map?location=' || id) AS href,
        ts_rank_cd(search_vector, plainto_tsquery('english', $1)) AS score
      FROM locations
      WHERE search_vector @@ plainto_tsquery('english', $1) AND deleted_at IS NULL
      ORDER BY score DESC
      LIMIT 20
    `,
    [q]
  );
  return result.rows as SearchResult[];
}

export async function listUsers(): Promise<User[]> {
  if (!hasDatabaseUrl()) return sampleUsers;
  const result = await getPool().query("SELECT * FROM users ORDER BY created_at DESC LIMIT 100");
  return result.rows.map((row) => ({
    id: String(row.id),
    name: String(row.name),
    email: row.email,
    image: row.image,
    bio: row.bio,
    role: row.role,
    createdAt: toIso(row.created_at),
    updatedAt: toIso(row.updated_at)
  }));
}

export async function getUserById(id: string): Promise<User | null> {
  if (!hasDatabaseUrl()) return sampleUsers.find((user) => user.id === id) ?? null;
  const result = await getPool().query("SELECT * FROM users WHERE id = $1", [id]);
  return result.rows[0]
    ? {
        id: String(result.rows[0].id),
        name: String(result.rows[0].name),
        email: result.rows[0].email,
        image: result.rows[0].image,
        bio: result.rows[0].bio,
        role: result.rows[0].role,
        createdAt: toIso(result.rows[0].created_at),
        updatedAt: toIso(result.rows[0].updated_at)
      }
    : null;
}
