import { banClientIp, contentFingerprint, getClientIdentity, recordAbuseEvent, recordSubmissionFingerprint } from "@/lib/abuse";

type SpamField = {
  name: string;
  value: unknown;
};

export type SpamCheckOptions = {
  action: string;
  fields: SpamField[];
  allowUrls?: number;
  checkDuplicates?: boolean;
  rejectScore?: number;
  duplicateWindowMs?: number;
};

export type SpamCheckResult = {
  ok: boolean;
  score: number;
  reasons: string[];
};

const suspiciousPhrases = [
  "buy followers",
  "casino bonus",
  "crypto giveaway",
  "free money",
  "guaranteed income",
  "loan approval",
  "payday loan",
  "seo backlinks",
  "telegram channel",
  "viagra",
  "whatsapp only",
  "work from home earning"
];

const honeypotNames = new Set(["company", "homepage", "url", "website"]);
const urlPattern = /\b(?:https?:\/\/|www\.|[a-z0-9-]+\.(?:com|net|org|info|biz|xyz|top|click|live|shop|ru|cn)\b)/gi;

function textFrom(value: unknown): string {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "";
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value);
  } catch {
    return "";
  }
}

function lexicalDiversity(text: string) {
  const words = text.toLowerCase().match(/[a-z0-9]{3,}/g) ?? [];
  if (words.length < 12) return 1;
  return new Set(words).size / words.length;
}

function uppercaseRatio(text: string) {
  const letters = text.match(/[a-z]/gi) ?? [];
  if (letters.length < 30) return 0;
  return letters.filter((letter) => letter === letter.toUpperCase()).length / letters.length;
}

function addReason(reasons: string[], reason: string) {
  if (!reasons.includes(reason)) reasons.push(reason);
}

export async function checkSpam(request: Request, options: SpamCheckOptions): Promise<SpamCheckResult> {
  const identity = getClientIdentity(request);
  const reasons: string[] = [];
  let score = 0;
  let totalUrlCount = 0;

  for (const field of options.fields) {
    const text = textFrom(field.value).trim();
    if (!text) continue;

    if (honeypotNames.has(field.name) && text.length > 0) {
      score += 100;
      addReason(reasons, "Hidden anti-bot field was filled.");
    }
    if (/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/.test(text)) {
      score += 80;
      addReason(reasons, "Control characters are not allowed.");
    }
    if (/[\u200B-\u200F\uFEFF]/.test(text)) {
      score += 25;
      addReason(reasons, "Invisible characters were detected.");
    }
    if (/<\/?(script|iframe|object|embed|style|link|meta|form|input)\b/i.test(text) || /\b(?:javascript:|data:text\/html|onerror\s*=|onload\s*=)/i.test(text)) {
      score += 100;
      addReason(reasons, "Executable HTML or script content is not allowed.");
    } else if (/<[^>]{1,120}>/.test(text)) {
      score += 20;
      addReason(reasons, "HTML markup is discouraged in submissions.");
    }
    if (/(.)\1{14,}/i.test(text)) {
      score += 35;
      addReason(reasons, "Repeated characters look automated.");
    }
    if (/[!?$]{8,}/.test(text)) {
      score += 25;
      addReason(reasons, "Excessive punctuation looks automated.");
    }
    if (uppercaseRatio(text) > 0.78) {
      score += 25;
      addReason(reasons, "Excessive uppercase text looks automated.");
    }
    if (text.length > 180 && lexicalDiversity(text) < 0.24) {
      score += 35;
      addReason(reasons, "Low variety repeated text looks automated.");
    }

    const lower = text.toLowerCase();
    const matchedPhrases = suspiciousPhrases.filter((phrase) => lower.includes(phrase));
    if (matchedPhrases.length) {
      score += matchedPhrases.length >= 2 ? 85 : 45;
      addReason(reasons, "Common spam phrase detected.");
    }

    totalUrlCount += text.match(urlPattern)?.length ?? 0;
  }

  const allowedUrls = options.allowUrls ?? 1;
  if (totalUrlCount > allowedUrls) {
    score += 30 + (totalUrlCount - allowedUrls) * 15;
    addReason(reasons, "Too many links for this submission type.");
  }

  const contentHash = options.checkDuplicates === false ? "" : contentFingerprint(options.fields.map((field) => field.value));
  if (contentHash) {
    const duplicateCount = await recordSubmissionFingerprint(identity, options.action, contentHash, options.duplicateWindowMs);
    if (duplicateCount > 1) {
      score += duplicateCount > 2 ? 100 : 55;
      addReason(reasons, "Duplicate submission detected.");
    }
  }

  const rejectScore = options.rejectScore ?? 75;
  const ok = score < rejectScore;
  if (!ok || score >= 30) {
    await recordAbuseEvent(identity, {
      action: options.action,
      kind: ok ? "spam_warning" : "spam_reject",
      score,
      reasons,
      metadata: { urlCount: totalUrlCount }
    });
  }
  if (!ok || score >= 30) {
    const reason = reasons[0] ?? "Suspicious submission pattern.";
    await banClientIp(identity, {
      action: options.action,
      reason,
      durationMs: ok ? 60 * 60_000 : score >= 125 ? 7 * 24 * 60 * 60_000 : 24 * 60 * 60_000,
      score,
      metadata: {
        reasons,
        urlCount: totalUrlCount,
        outcome: ok ? "warning" : "rejected"
      }
    });
  }

  return { ok, score, reasons };
}
