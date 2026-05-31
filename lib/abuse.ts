import { createHash } from "crypto";
import { getPool, hasDatabaseUrl } from "@/server/db/client";

const fallbackSalt = "mapwiki-local-abuse-salt";
let ensureSchemaPromise: Promise<void> | null = null;

export type ClientIdentity = {
  key: string;
  ipHash: string;
  userAgentHash: string;
  route?: string;
  method?: string;
};

function hash(value: string) {
  const salt = process.env.RATE_LIMIT_SALT ?? process.env.NEXTAUTH_SECRET ?? fallbackSalt;
  return createHash("sha256").update(salt).update(":").update(value).digest("hex");
}

export function getClientIp(request: Request) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "local"
  );
}

export function getClientIdentity(request: Request): ClientIdentity {
  const url = new URL(request.url);
  const ip = getClientIp(request);
  const userAgent = request.headers.get("user-agent")?.slice(0, 300) ?? "unknown";
  const acceptLanguage = request.headers.get("accept-language")?.slice(0, 120) ?? "";
  const key = hash(`${ip}|${userAgent}|${acceptLanguage}`).slice(0, 48);

  return {
    key,
    ipHash: hash(ip).slice(0, 48),
    userAgentHash: hash(userAgent).slice(0, 48),
    route: url.pathname,
    method: request.method
  };
}

export async function ensureAbuseSchema() {
  if (!hasDatabaseUrl()) return;
  if (!ensureSchemaPromise) {
    ensureSchemaPromise = getPool()
      .query(
        `
          CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
          CREATE INDEX IF NOT EXISTS abuse_ip_bans_active_idx ON abuse_ip_bans (banned_until);
        `
      )
      .then(() => undefined);
  }
  await ensureSchemaPromise;
}

export async function getActiveIpBan(identity: ClientIdentity) {
  if (!hasDatabaseUrl()) return null;
  await ensureAbuseSchema();
  const result = await getPool().query<{
    banned_until: Date;
    reason: string;
    action: string;
    score: number;
  }>(
    `
      SELECT banned_until, reason, action, score
      FROM abuse_ip_bans
      WHERE ip_hash = $1 AND banned_until > now()
      LIMIT 1
    `,
    [identity.ipHash]
  );
  if (!result.rowCount) return null;
  return {
    bannedUntil: result.rows[0].banned_until.getTime(),
    reason: result.rows[0].reason,
    action: result.rows[0].action,
    score: Number(result.rows[0].score ?? 0)
  };
}

export async function banClientIp(
  identity: ClientIdentity,
  ban: { action: string; reason: string; durationMs: number; score?: number; metadata?: Record<string, unknown> }
) {
  if (!hasDatabaseUrl()) return;
  await ensureAbuseSchema();
  await getPool().query(
    `
      INSERT INTO abuse_ip_bans (ip_hash, client_key, banned_until, reason, action, score, metadata)
      VALUES ($1, $2, now() + ($3::double precision * interval '1 millisecond'), $4, $5, $6, $7)
      ON CONFLICT (ip_hash)
      DO UPDATE SET
        client_key = EXCLUDED.client_key,
        banned_until = GREATEST(abuse_ip_bans.banned_until, EXCLUDED.banned_until),
        reason = EXCLUDED.reason,
        action = EXCLUDED.action,
        score = GREATEST(abuse_ip_bans.score, EXCLUDED.score),
        hit_count = abuse_ip_bans.hit_count + 1,
        metadata = abuse_ip_bans.metadata || EXCLUDED.metadata,
        updated_at = now()
    `,
    [
      identity.ipHash,
      identity.key,
      ban.durationMs,
      ban.reason,
      ban.action,
      ban.score ?? 0,
      {
        userAgentHash: identity.userAgentHash,
        route: identity.route,
        method: identity.method,
        ...(ban.metadata ?? {})
      }
    ]
  );
  await recordAbuseEvent(identity, {
    action: ban.action,
    kind: "ip_ban",
    score: ban.score ?? 0,
    reasons: [ban.reason],
    metadata: {
      durationMs: ban.durationMs,
      ...(ban.metadata ?? {})
    }
  });
}

export async function recordAbuseEvent(
  identity: ClientIdentity,
  event: { action: string; kind: string; score?: number; reasons?: string[]; metadata?: Record<string, unknown> }
) {
  if (!hasDatabaseUrl()) return;
  await ensureAbuseSchema();
  await getPool().query(
    `
      INSERT INTO abuse_events (client_key, action, route, method, kind, score, reasons, metadata)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `,
    [
      identity.key,
      event.action,
      identity.route ?? null,
      identity.method ?? null,
      event.kind,
      event.score ?? 0,
      event.reasons ?? [],
      {
        ipHash: identity.ipHash,
        userAgentHash: identity.userAgentHash,
        ...(event.metadata ?? {})
      }
    ]
  );
}

export function contentFingerprint(parts: unknown[]) {
  return createHash("sha256")
    .update(
      parts
        .map((part) => (typeof part === "string" ? part : JSON.stringify(part)))
        .join("\n")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ")
    )
    .digest("hex");
}

export async function recordSubmissionFingerprint(identity: ClientIdentity, action: string, contentHash: string, duplicateWindowMs = 15 * 60_000) {
  if (!hasDatabaseUrl()) return 1;
  await ensureAbuseSchema();
  const result = await getPool().query<{ count: number }>(
    `
      INSERT INTO abuse_submission_fingerprints (client_key, action, content_hash, count, first_seen, last_seen)
      VALUES ($1, $2, $3, 1, now(), now())
      ON CONFLICT (client_key, action, content_hash)
      DO UPDATE SET
        count = CASE
          WHEN abuse_submission_fingerprints.last_seen < now() - ($4::double precision * interval '1 millisecond')
            THEN 1
          ELSE abuse_submission_fingerprints.count + 1
        END,
        first_seen = CASE
          WHEN abuse_submission_fingerprints.last_seen < now() - ($4::double precision * interval '1 millisecond')
            THEN now()
          ELSE abuse_submission_fingerprints.first_seen
        END,
        last_seen = now()
      RETURNING count
    `,
    [identity.key, action, contentHash, duplicateWindowMs]
  );
  return Number(result.rows[0]?.count ?? 1);
}
