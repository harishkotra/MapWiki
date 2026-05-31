import { NextResponse } from "next/server";
import { ZodError } from "zod";
import type { ApiError } from "@/types/domain";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, init);
}

export function created<T>(data: T) {
  return NextResponse.json({ data }, { status: 201 });
}

export function fail(status: number, error: string, details?: unknown) {
  return NextResponse.json<ApiError>({ error, details }, { status });
}

export function validationError(error: unknown) {
  if (error instanceof ZodError) {
    return fail(422, "Validation failed.", error.flatten());
  }
  return fail(400, "Invalid request.");
}

export function clientIp(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
}

