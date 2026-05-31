import { NextResponse } from "next/server";
import { hasDatabaseUrl } from "@/server/db/client";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    databaseConfigured: hasDatabaseUrl(),
    timestamp: new Date().toISOString()
  });
}

