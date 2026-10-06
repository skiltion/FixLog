import { NextResponse } from "next/server";
import { analyzeError } from "@/lib/gemini";
import { enforceRateLimit } from "@/lib/rate-limit";
import { aiAnalyzeSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const rate = await enforceRateLimit(request, { action: "ai-preview", limit: 8, windowSeconds: 600 });
    if (!rate.allowed) {
      return NextResponse.json({ error: "AI 분석 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요." }, { status: 429 });
    }

    const body = await request.json();
    const parsed = aiAnalyzeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "입력값을 확인해 주세요." }, { status: 400 });
    }

    const analysis = await analyzeError(parsed.data);
    return NextResponse.json({ analysis });
  } catch (error) {
    console.error("AI analyze error:", error);
    return NextResponse.json({ error: "AI 분석을 완료하지 못했습니다. 환경변수와 Gemini API 상태를 확인한 뒤 다시 시도해 주세요." }, { status: 500 });
  }
}
