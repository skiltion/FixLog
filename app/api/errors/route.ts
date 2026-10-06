import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createErrorPost } from "@/lib/db";
import { analyzeError } from "@/lib/gemini";
import { enforceRateLimit } from "@/lib/rate-limit";
import { createErrorPostSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const rate = await enforceRateLimit(request, { action: "submit", limit: 8, windowSeconds: 3600 });
    if (!rate.allowed) {
      return NextResponse.json({ error: "등록 요청이 너무 많습니다. 잠시 후 다시 시도해 주세요." }, { status: 429 });
    }

    const body = await request.json();
    const parsed = createErrorPostSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.issues[0]?.message || "입력값을 확인해 주세요." }, { status: 400 });
    }

    const { includeAiAnalysis, ...postInput } = parsed.data;
    let aiAnalysis;
    if (includeAiAnalysis) {
      try {
        aiAnalysis = await analyzeError({
          title: postInput.title,
          errorMessage: postInput.errorMessage,
          description: postInput.description,
          technology: postInput.technology,
          technologyVersion: postInput.technologyVersion,
          code: postInput.code,
          solution: postInput.solution,
        });
      } catch (aiError) {
        console.error("AI analysis during save failed; saving post without AI:", aiError);
      }
    }

    const id = await createErrorPost({ ...postInput, aiAnalysis });
    revalidatePath("/");
    revalidatePath("/search");
    return NextResponse.json({ id }, { status: 201 });
  } catch (error) {
    console.error("Create error post failed:", error);
    return NextResponse.json({ error: "해결 기록을 저장하지 못했습니다. 잠시 후 다시 시도해 주세요." }, { status: 500 });
  }
}
