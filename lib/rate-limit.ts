import { NextResponse } from "next/server";
import { ensureAbuseSchema, getClientIdentity, recordAbuseEvent, type ClientIdentity } from "@/lib/abuse";
import { getPool, hasDatabaseUrl } from "@/server/db/client";

type FallbackBucket = {
  count: number;
  resetAt: number;
  blockedUntil?: number;
  violations: number;
};

export type RateLimitRule = {
  id: string;
  limit: number;
  windowMs: number;
  penaltyMs?: number;
  maxPenaltyMs?: number;
};

export type RateLimitResult = {
  ok: boolean;
  identity: ClientIdentity;
  policy: string;
  limit: number;
  remaining: number;
  resetAt: number;
  retryAfter: number;
};

const fallbackBuckets = new Map<string, FallbackBucket>();

export const rateLimitRules = {
  apiRead: { id: "api:read", limit: 600, windowMs: 60_000, penaltyMs: 60_000, maxPenaltyMs: 15 * 60_000 },
  search: { id: "search", limit: 90, windowMs: 60_000, penaltyMs: 2 * 60_000, maxPenaltyMs: 30 * 60_000 },
  export: { id: "export", limit: 30, windowMs: 60_000, penaltyMs: 5 * 60_000, maxPenaltyMs: 60 * 60_000 },
  datasetCreateBurst: { id: "dataset:create:burst", limit: 3, windowMs: 10 * 60_000, penaltyMs: 15 * 60_000, maxPenaltyMs: 6 * 60 * 60_000 },
  datasetCreateDaily: { id: "dataset:create:daily", limit: 12, windowMs: 24 * 60 * 60_000, penaltyMs: 60 * 60_000, maxPenaltyMs: 24 * 60 * 60_000 },
  locationCreateBurst: { id: "location:create:burst", limit: 30, windowMs: 10 * 60_000, penaltyMs: 10 * 60_000, maxPenaltyMs: 6 * 60 * 60_000 },
  locationCreateDaily: { id: "location:create:daily", limit: 250, windowMs: 24 * 60 * 60_000, penaltyMs: 60 * 60_000, maxPenaltyMs: 24 * 60 * 60_000 },
  commentCreateBurst: { id: "comment:create:burst", limit: 8, windowMs: 10 * 60_000, penaltyMs: 15 * 60_000, maxPenaltyMs: 6 * 60 * 60_000 },
  commentCreateDaily: { id: "comment:create:daily", limit: 80, windowMs: 24 * 60 * 60_000, penaltyMs: 60 * 60_000, maxPenaltyMs: 24 * 60 * 60_000 },
  importPreview: { id: "import:preview", limit: 8, windowMs: 60 * 60_000, penaltyMs: 30 * 60_000, maxPenaltyMs: 12 * 60 * 60_000 },
  revisionRestore: { id: "revision:restore", limit: 8, windowMs: 60 * 60_000, penaltyMs: 60 * 60_000, maxPenaltyMs: 24 * 60 * 60_000 },
  serverAction: { id: "server-action", limit: 30, windowMs: 10 * 60_000, penaltyMs: 10 * 60_000, maxPenaltyMs: 6 * 60 * 60_000 }
} satisfies Record<string, RateLimitRule>;

function fallbackRateLimit(identity: ClientIdentity, rule: RateLimitRule): RateLimitResult {
  const now = Date.now();
  const bucketKey = `${identity.key}:${rule.id}:${Math.floor(now / rule.windowMs)}`;
  const resetAt = Math.floor(now / rule.windowMs) * rule.windowMs + rule.windowMs;
  const current = fallbackBuckets.get(bucketKey) ?? { count: 0, resetAt, violations: 0 };
  if (current.blockedUntil && current.blockedUntil > now) {
    return {
      ok: false,
      identity,
      policy: rule.id,
      limit: rule.limit,
      remaining: 0,
      resetAt: current.blockedUntil,
      retryAfter: Math.ceil((current.blockedUntil - now) / 1000)
    };
  }

  current.count += 1;
  current.resetAt = resetAt;
  if (current.count > rule.limit) {
    current.violations += 1;
    const basePenaltyMs = rule.penaltyMs ?? rule.windowMs;
    const penaltyMs = Math.min(basePenaltyMs * 2 ** Math.min(current.violations - 1, 6), rule.maxPenaltyMs ?? basePenaltyMs);
    current.blockedUntil = now + penaltyMs;
    fallbackBuckets.set(bucketKey, current);
    return {
      ok: false,
      identity,
      policy: rule.id,
      limit: rule.limit,
      remaining: 0,
      resetAt: current.blockedUntil,
      retryAfter: Math.ceil((current.blockedUntil - now) / 1000)
    };
  }

  fallbackBuckets.set(bucketKey, current);
  return {
    ok: true,
    identity,
    policy: rule.id,
    limit: rule.limit,
    remaining: Math.max(0, rule.limit - current.count),
    resetAt,
    retryAfter: 0
  };
}

async function databaseRateLimit(identity: ClientIdentity, rule: RateLimitRule): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStart = Math.floor(now / rule.windowMs) * rule.windowMs;
  const resetAt = windowStart + rule.windowMs;
  await ensureAbuseSchema();

  const penalty = await getPool().query<{ blocked_until: Date }>(
    `
      SELECT blocked_until
      FROM abuse_rate_limit_penalties
      WHERE client_key = $1 AND policy = $2 AND blocked_until > now()
      LIMIT 1
    `,
    [identity.key, rule.id]
  );
  if (penalty.rowCount) {
    const blockedUntil = penalty.rows[0].blocked_until.getTime();
    return {
      ok: false,
      identity,
      policy: rule.id,
      limit: rule.limit,
      remaining: 0,
      resetAt: blockedUntil,
      retryAfter: Math.max(1, Math.ceil((blockedUntil - now) / 1000))
    };
  }

  const countResult = await getPool().query<{ count: number }>(
    `
      INSERT INTO abuse_rate_limit_counters (client_key, policy, window_start, count)
      VALUES ($1, $2, $3, 1)
      ON CONFLICT (client_key, policy, window_start)
      DO UPDATE SET count = abuse_rate_limit_counters.count + 1, updated_at = now()
      RETURNING count
    `,
    [identity.key, rule.id, windowStart]
  );
  const count = Number(countResult.rows[0]?.count ?? 1);
  if (count <= rule.limit) {
    return {
      ok: true,
      identity,
      policy: rule.id,
      limit: rule.limit,
      remaining: Math.max(0, rule.limit - count),
      resetAt,
      retryAfter: 0
    };
  }

  const penaltyMs = rule.penaltyMs ?? rule.windowMs;
  const maxPenaltyMs = rule.maxPenaltyMs ?? penaltyMs;
  const blocked = await getPool().query<{ blocked_until: Date }>(
    `
      INSERT INTO abuse_rate_limit_penalties (client_key, policy, violations, blocked_until)
      VALUES ($1, $2, 1, now() + ($3::double precision * interval '1 millisecond'))
      ON CONFLICT (client_key, policy)
      DO UPDATE SET
        violations = abuse_rate_limit_penalties.violations + 1,
        blocked_until = now() + (
          LEAST(
            $3::double precision * power(2, LEAST(abuse_rate_limit_penalties.violations, 6)),
            $4::double precision
          ) * interval '1 millisecond'
        ),
        updated_at = now()
      RETURNING blocked_until
    `,
    [identity.key, rule.id, penaltyMs, maxPenaltyMs]
  );
  const blockedUntil = blocked.rows[0]?.blocked_until.getTime() ?? resetAt;
  await recordAbuseEvent(identity, {
    action: rule.id,
    kind: "rate_limit",
    score: 100,
    reasons: [`Exceeded ${rule.limit} requests per ${Math.round(rule.windowMs / 1000)} seconds.`],
    metadata: { limit: rule.limit, count, retryAfter: Math.max(1, Math.ceil((blockedUntil - now) / 1000)) }
  });

  return {
    ok: false,
    identity,
    policy: rule.id,
    limit: rule.limit,
    remaining: 0,
    resetAt: blockedUntil,
    retryAfter: Math.max(1, Math.ceil((blockedUntil - now) / 1000))
  };
}

export async function checkRateLimits(request: Request, rules: RateLimitRule | RateLimitRule[]): Promise<RateLimitResult> {
  const identity = getClientIdentity(request);
  const policies = Array.isArray(rules) ? rules : [rules];
  let latestOk: RateLimitResult | null = null;

  for (const rule of policies) {
    const result = hasDatabaseUrl() ? await databaseRateLimit(identity, rule) : fallbackRateLimit(identity, rule);
    if (!result.ok) return result;
    latestOk = result;
  }

  return latestOk ?? {
    ok: true,
    identity,
    policy: "none",
    limit: 0,
    remaining: 0,
    resetAt: Date.now(),
    retryAfter: 0
  };
}

export function rateLimitHeaders(result: RateLimitResult) {
  const headers = new Headers();
  headers.set("ratelimit-policy", `${result.policy};w=${Math.max(1, Math.round((result.resetAt - Date.now()) / 1000))}`);
  headers.set("ratelimit-limit", String(result.limit));
  headers.set("ratelimit-remaining", String(result.remaining));
  headers.set("ratelimit-reset", String(Math.max(0, Math.ceil((result.resetAt - Date.now()) / 1000))));
  if (!result.ok) headers.set("retry-after", String(result.retryAfter));
  return headers;
}

export function rateLimitExceeded(result: RateLimitResult) {
  return NextResponse.json(
    {
      error: "Too many requests. Please wait before trying again.",
      retryAfter: result.retryAfter
    },
    { status: 429, headers: rateLimitHeaders(result) }
  );
}

export function withRateLimitHeaders(response: Response, result: RateLimitResult) {
  for (const [key, value] of rateLimitHeaders(result)) response.headers.set(key, value);
  return response;
}
