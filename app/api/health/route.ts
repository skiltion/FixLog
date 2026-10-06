import { NextResponse } from "next/server";
import { checkDatabaseConnection } from "@/lib/db";

export async function GET() {
  let database = false;
  try {
    database = await checkDatabaseConnection();
  } catch {
    database = false;
  }

  const geminiConfigured = Boolean(process.env.GEMINI_API_KEY);
  const rateLimitSaltConfigured = Boolean(process.env.RATE_LIMIT_SALT);

  return NextResponse.json(
    {
      app: "FixLog",
      status: database && geminiConfigured ? "ready" : "configuration-required",
      database,
      geminiConfigured,
      rateLimitSaltConfigured,
      timestamp: new Date().toISOString(),
    },
    { status: database ? 200 : 503 },
  );
}
