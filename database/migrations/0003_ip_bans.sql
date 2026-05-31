CREATE TABLE IF NOT EXISTS abuse_ip_bans (
  ip_hash text PRIMARY KEY,
  client_key text,
  banned_until timestamptz NOT NULL,
  reason text NOT NULL,
  action text NOT NULL,
  score integer NOT NULL DEFAULT 0,
  hit_count integer NOT NULL DEFAULT 1,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS abuse_ip_bans_active_idx ON abuse_ip_bans (banned_until);
