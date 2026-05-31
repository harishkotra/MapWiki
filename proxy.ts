import { NextResponse, type NextRequest } from "next/server";

const unsafeMethods = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function sameOrigin(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === request.nextUrl.host;
  } catch {
    return false;
  }
}

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api") && !request.nextUrl.pathname.startsWith("/api/auth") && unsafeMethods.has(request.method) && !sameOrigin(request)) {
    return NextResponse.json({ error: "Cross-origin unsafe requests are blocked." }, { status: 403 });
  }

  const response = NextResponse.next();
  response.headers.set("x-content-type-options", "nosniff");
  response.headers.set("referrer-policy", "strict-origin-when-cross-origin");
  response.headers.set("permissions-policy", "camera=(), microphone=(), payment=()");
  response.headers.set(
    "content-security-policy",
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https://demotiles.maplibre.org",
      "connect-src 'self' https://tile.openstreetmap.org https://demotiles.maplibre.org",
      "worker-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'"
    ].join("; ")
  );
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
