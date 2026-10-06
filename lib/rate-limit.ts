import { createHash } from "crypto";
import { consumeRateLimit } from "@/lib/db";

function getClientHash(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  const salt = process.env.RATE_LIMIT_SALT || "fixlog-development-only-salt";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex");
}

export async function enforceRateLimit(
  request: Request,
  options: { action: string; limit: number; windowSeconds: number },
) {
  const clientHash = getClientHash(request);
  const used = await consumeRateLimit({
    clientHash,
    action: options.action,
    windowSeconds: options.windowSeconds,
  });

  return {
    allowed: used <= options.limit,
    remaining: Math.max(options.limit - used, 0),
  };
}
