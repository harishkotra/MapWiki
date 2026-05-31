CREATE TABLE IF NOT EXISTS abuse_rate_limit_counters (
  client_key text NOT NULL,
  policy text NOT NULL,
  window_start bigint NOT NULL,
  count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (client_key, policy, window_start)
);

CREATE TABLE IF NOT EXISTS abuse_rate_limit_penalties (
  client_key text NOT NULL,
  policy text NOT NULL,
  violations integer NOT NULL DEFAULT 0,
  blocked_until timestamptz NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (client_key, policy)
);

CREATE TABLE IF NOT EXISTS abuse_submission_fingerprints (
  client_key text NOT NULL,
  action text NOT NULL,
  content_hash text NOT NULL,
  count integer NOT NULL DEFAULT 1,
  first_seen timestamptz NOT NULL DEFAULT now(),
  last_seen timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (client_key, action, content_hash)
);

CREATE TABLE IF NOT EXISTS abuse_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_key text NOT NULL,
  action text NOT NULL,
  route text,
  method text,
  kind text NOT NULL,
  score integer NOT NULL DEFAULT 0,
  reasons text[] NOT NULL DEFAULT '{}',
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO users (id, name, email, image, bio, role)
VALUES (
  '00000000-0000-4000-8000-000000000004',
  'Anonymous contributor',
  NULL,
  NULL,
  'Open MapWiki contributor without a signed-in account.',
  'registered'
)
ON CONFLICT (id) DO NOTHING;

CREATE INDEX IF NOT EXISTS abuse_rate_limit_counters_updated_idx ON abuse_rate_limit_counters (updated_at);
CREATE INDEX IF NOT EXISTS abuse_rate_limit_penalties_blocked_idx ON abuse_rate_limit_penalties (blocked_until);
CREATE INDEX IF NOT EXISTS abuse_submission_last_seen_idx ON abuse_submission_fingerprints (last_seen);
CREATE INDEX IF NOT EXISTS abuse_events_client_created_idx ON abuse_events (client_key, created_at DESC);
CREATE INDEX IF NOT EXISTS abuse_events_action_created_idx ON abuse_events (action, created_at DESC);
