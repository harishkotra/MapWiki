CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE user_role AS ENUM ('registered', 'moderator', 'admin');
CREATE TYPE dataset_visibility AS ENUM ('public', 'unlisted', 'private');
CREATE TYPE dataset_status AS ENUM ('draft', 'pending_review', 'published', 'locked', 'archived');
CREATE TYPE report_status AS ENUM ('open', 'triaged', 'resolved', 'dismissed');
CREATE TYPE vote_target_type AS ENUM ('dataset', 'location', 'comment');
CREATE TYPE media_owner_type AS ENUM ('dataset', 'location', 'comment');
CREATE TYPE member_role AS ENUM ('viewer', 'editor', 'maintainer', 'owner');
CREATE TYPE audit_action AS ENUM ('create', 'update', 'delete', 'restore', 'lock', 'unlock', 'ban', 'report', 'approve', 'reject');

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name text NOT NULL,
  email text UNIQUE,
  "emailVerified" timestamptz,
  image text,
  bio text,
  role user_role NOT NULL DEFAULT 'registered',
  banned_at timestamptz,
  ban_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE accounts (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL,
  provider text NOT NULL,
  "providerAccountId" text NOT NULL,
  refresh_token text,
  access_token text,
  expires_at integer,
  token_type text,
  scope text,
  id_token text,
  session_state text,
  UNIQUE (provider, "providerAccountId")
);

CREATE TABLE sessions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  "sessionToken" text NOT NULL UNIQUE,
  "userId" uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires timestamptz NOT NULL
);

CREATE TABLE verification_tokens (
  identifier text NOT NULL,
  token text NOT NULL,
  expires timestamptz NOT NULL,
  PRIMARY KEY (identifier, token)
);

CREATE TABLE datasets (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  cover_image text,
  category text NOT NULL DEFAULT 'General',
  creator_id uuid NOT NULL REFERENCES users(id),
  visibility dataset_visibility NOT NULL DEFAULT 'public',
  status dataset_status NOT NULL DEFAULT 'draft',
  object_count integer NOT NULL DEFAULT 0,
  followers integer NOT NULL DEFAULT 0,
  views integer NOT NULL DEFAULT 0,
  color text NOT NULL DEFAULT '#0f766e',
  default_opacity numeric(4,3) NOT NULL DEFAULT 0.800,
  locked_by uuid REFERENCES users(id),
  locked_at timestamptz,
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(category, '')), 'C')
  ) STORED,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE dataset_tags (
  dataset_id uuid NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  tag text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (dataset_id, tag)
);

CREATE TABLE dataset_members (
  dataset_id uuid NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role member_role NOT NULL DEFAULT 'editor',
  invited_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (dataset_id, user_id)
);

CREATE TABLE locations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  dataset_id uuid NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  geometry geometry(Geometry, 4326) NOT NULL,
  geometry_type text NOT NULL CHECK (geometry_type IN ('Point', 'LineString', 'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon')),
  metadata jsonb NOT NULL DEFAULT '{}',
  created_by uuid NOT NULL REFERENCES users(id),
  updated_by uuid NOT NULL REFERENCES users(id),
  deleted_at timestamptz,
  search_vector tsvector GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(description, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(metadata::text, '')), 'C')
  ) STORED,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sources (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title text NOT NULL,
  url text,
  publication_date date,
  notes text,
  reliability_score integer NOT NULL DEFAULT 3 CHECK (reliability_score BETWEEN 1 AND 5),
  created_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE location_sources (
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  source_id uuid NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  claim text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (location_id, source_id)
);

CREATE TABLE dataset_revisions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  dataset_id uuid NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  parent_revision_id uuid REFERENCES dataset_revisions(id),
  author_id uuid NOT NULL REFERENCES users(id),
  change_summary text NOT NULL,
  diff jsonb NOT NULL DEFAULT '{}',
  snapshot jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE location_revisions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id uuid NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  parent_revision_id uuid REFERENCES location_revisions(id),
  author_id uuid NOT NULL REFERENCES users(id),
  change_summary text NOT NULL,
  diff jsonb NOT NULL DEFAULT '{}',
  snapshot jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE comments (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  dataset_id uuid REFERENCES datasets(id) ON DELETE CASCADE,
  location_id uuid REFERENCES locations(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES comments(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES users(id),
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 5000),
  vote_score integer NOT NULL DEFAULT 0,
  deleted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (dataset_id IS NOT NULL OR location_id IS NOT NULL)
);

CREATE TABLE votes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type vote_target_type NOT NULL,
  target_id uuid NOT NULL,
  value smallint NOT NULL CHECK (value IN (-1, 1)),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, target_type, target_id)
);

CREATE TABLE favorites (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dataset_id uuid NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, dataset_id)
);

CREATE TABLE media (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  owner_type media_owner_type NOT NULL,
  owner_id uuid NOT NULL,
  url text NOT NULL,
  mime_type text NOT NULL,
  byte_size bigint,
  alt_text text,
  created_by uuid NOT NULL REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE reports (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id uuid REFERENCES users(id),
  target_type text NOT NULL CHECK (target_type IN ('dataset', 'location', 'comment', 'user')),
  target_id uuid NOT NULL,
  reason text NOT NULL,
  details text,
  status report_status NOT NULL DEFAULT 'open',
  reviewed_by uuid REFERENCES users(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE audit_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id uuid REFERENCES users(id),
  action audit_action NOT NULL,
  target_type text NOT NULL,
  target_id uuid,
  ip_address inet,
  user_agent text,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE notifications (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  href text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE import_jobs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL REFERENCES users(id),
  dataset_id uuid REFERENCES datasets(id),
  file_name text NOT NULL,
  file_type text NOT NULL,
  status text NOT NULL DEFAULT 'preview',
  summary jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE dataset_follows (
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dataset_id uuid NOT NULL REFERENCES datasets(id) ON DELETE CASCADE,
  notify_on_change boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, dataset_id)
);

CREATE INDEX datasets_search_idx ON datasets USING gin (search_vector);
CREATE INDEX datasets_slug_idx ON datasets (slug);
CREATE INDEX dataset_tags_tag_idx ON dataset_tags (tag);
CREATE INDEX locations_dataset_idx ON locations (dataset_id);
CREATE INDEX locations_geometry_gix ON locations USING gist (geometry);
CREATE INDEX locations_search_idx ON locations USING gin (search_vector);
CREATE INDEX locations_metadata_gin ON locations USING gin (metadata);
CREATE INDEX comments_dataset_idx ON comments (dataset_id);
CREATE INDEX comments_location_idx ON comments (location_id);
CREATE INDEX reports_status_idx ON reports (status, created_at DESC);
CREATE INDEX audit_logs_target_idx ON audit_logs (target_type, target_id);
CREATE INDEX notifications_user_unread_idx ON notifications (user_id, read_at);

CREATE TRIGGER users_set_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER datasets_set_updated_at BEFORE UPDATE ON datasets FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER locations_set_updated_at BEFORE UPDATE ON locations FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER sources_set_updated_at BEFORE UPDATE ON sources FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER comments_set_updated_at BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER import_jobs_set_updated_at BEFORE UPDATE ON import_jobs FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE FUNCTION refresh_dataset_object_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE datasets
  SET object_count = (
    SELECT count(*) FROM locations WHERE dataset_id = COALESCE(NEW.dataset_id, OLD.dataset_id) AND deleted_at IS NULL
  )
  WHERE id = COALESCE(NEW.dataset_id, OLD.dataset_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER locations_refresh_dataset_count
AFTER INSERT OR UPDATE OR DELETE ON locations
FOR EACH ROW EXECUTE FUNCTION refresh_dataset_object_count();

