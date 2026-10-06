import { NextResponse } from "next/server";
import { incrementHelpful } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rate-limit";
import { uuidSchema } from "@/lib/validation";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!uuidSchema.safeParse(id).success) {
      return NextResponse.json({ error: "잘못된 기록 ID입니다." }, { status: 400 });
    }

    const rate = await enforceRateLimit(request, { action: "helpful", limit: 50, windowSeconds: 3600 });
    if (!rate.allowed) {
      return NextResponse.json({ error: "반응 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요." }, { status: 429 });
    }

    const helpfulCount = await incrementHelpful(id);
    if (helpfulCount === null) {
      return NextResponse.json({ error: "기록을 찾을 수 없습니다." }, { status: 404 });
    }
    return NextResponse.json({ helpfulCount });
  } catch (error) {
    console.error("Helpful error:", error);
    return NextResponse.json({ error: "요청을 처리하지 못했습니다." }, { status: 500 });
  }
}
