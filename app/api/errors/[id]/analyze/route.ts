import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { analyzeError } from "@/lib/gemini";
import { getPostById, saveAiAnalysis } from "@/lib/db";
import { enforceRateLimit } from "@/lib/rate-limit";
import { uuidSchema } from "@/lib/validation";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    if (!uuidSchema.safeParse(id).success) {
      return NextResponse.json({ error: "잘못된 기록 ID입니다." }, { status: 400 });
    }

    const rate = await enforceRateLimit(request, { action: "ai-existing", limit: 6, windowSeconds: 600 });
    if (!rate.allowed) {
      return NextResponse.json({ error: "AI 분석 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요." }, { status: 429 });
    }

    const post = await getPostById(id);
    if (!post) {
      return NextResponse.json({ error: "기록을 찾을 수 없습니다." }, { status: 404 });
    }

    if (post.aiSummary || post.aiCause || post.aiSteps.length > 0) {
      return NextResponse.json({ error: "이미 AI 분석이 저장된 기록입니다." }, { status: 409 });
    }

    const analysis = await analyzeError({
      title: post.title,
      errorMessage: post.errorMessage,
      description: post.description || undefined,
      technology: post.technology,
      technologyVersion: post.technologyVersion || undefined,
      code: post.code || undefined,
      solution: post.solution,
    });

    await saveAiAnalysis(id, analysis);
    revalidatePath(`/error/${id}`);
    revalidatePath("/search");
    return NextResponse.json({ analysis });
  } catch (error) {
    console.error("Existing analyze error:", error);
    return NextResponse.json({ error: "AI 분석을 완료하지 못했습니다. 잠시 후 다시 시도해 주세요." }, { status: 500 });
  }
}
