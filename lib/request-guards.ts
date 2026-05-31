import { fail } from "@/lib/api";

export async function readJsonBody(request: Request, maxBytes: number) {
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > maxBytes) {
    return { ok: false as const, response: fail(413, "Request body is too large.") };
  }

  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > maxBytes) {
    return { ok: false as const, response: fail(413, "Request body is too large.") };
  }

  try {
    return { ok: true as const, data: text ? JSON.parse(text) : {} };
  } catch {
    return { ok: false as const, response: fail(400, "Malformed JSON body.") };
  }
}

export function assertContentLength(request: Request, maxBytes: number) {
  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > maxBytes) {
    return fail(413, "Request body is too large.");
  }
  return null;
}
