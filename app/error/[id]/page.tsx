import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { AnalyzeExistingButton } from "@/components/AnalyzeExistingButton";
import { HelpfulButton } from "@/components/HelpfulButton";
import { getPostById, incrementView } from "@/lib/db";
import { formatDate } from "@/lib/utils";
import { uuidSchema } from "@/lib/validation";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) return { title: "오류 기록" };
  try {
    const post = await getPostById(id);
    return { title: post?.title ?? "오류 기록" };
  } catch {
    return { title: "오류 기록" };
  }
}

export default async function ErrorDetailPage({ params }: { params: Params }) {
  const { id } = await params;
  if (!uuidSchema.safeParse(id).success) notFound();

  const post = await getPostById(id).catch(() => null);
  if (!post) notFound();
  await incrementView(id).catch(() => undefined);

  const hasAi = Boolean(post.aiSummary || post.aiCause || post.aiSteps.length);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <div className="grid gap-8 lg:grid-cols-[1fr_280px]">
        <article className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-indigo-700">{post.technology}</span>
            {post.technologyVersion && <span className="text-slate-400">v{post.technologyVersion}</span>}
            <span className="text-slate-300">•</span>
            <span className="text-slate-400">{formatDate(post.createdAt)}</span>
          </div>

          <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">{post.title}</h1>
          {post.description && <p className="mt-4 whitespace-pre-wrap text-base leading-7 text-slate-600">{post.description}</p>}

          <section className="mt-8">
            <h2 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-500">오류 메시지</h2>
            <pre className="overflow-x-auto whitespace-pre-wrap break-words rounded-2xl bg-slate-950 p-5 text-sm leading-6 text-slate-200"><code>{post.errorMessage}</code></pre>
          </section>

          {post.code && (
            <section className="mt-8">
              <h2 className="mb-3 text-sm font-black uppercase tracking-wider text-slate-500">관련 코드</h2>
              <pre className="overflow-x-auto whitespace-pre rounded-2xl border border-slate-800 bg-[#101827] p-5 text-sm leading-6 text-slate-200"><code>{post.code}</code></pre>
            </section>
          )}

          <section className="mt-8 rounded-3xl border border-emerald-200 bg-emerald-50/70 p-6">
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-emerald-600 text-sm font-black text-white">✓</span>
              <h2 className="text-lg font-black text-emerald-950">실제로 해결한 방법</h2>
            </div>
            <p className="mt-4 whitespace-pre-wrap text-sm leading-7 text-emerald-950/80">{post.solution}</p>
          </section>

          <section className="mt-8 rounded-3xl border border-indigo-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-indigo-600">Gemini Analysis</p>
                <h2 className="mt-1 text-xl font-black text-slate-950">AI 오류 분석</h2>
              </div>
              {!hasAi && <AnalyzeExistingButton id={post.id} />}
            </div>

            {hasAi ? (
              <div className="mt-6 space-y-6">
                {post.aiSummary && (
                  <div>
                    <h3 className="text-sm font-black text-slate-900">한눈에 보기</h3>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600">{post.aiSummary}</p>
                  </div>
                )}
                {post.aiCause && (
                  <div>
                    <h3 className="text-sm font-black text-slate-900">가능성이 높은 원인</h3>
                    <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600">{post.aiCause}</p>
                  </div>
                )}
                {post.aiSteps.length > 0 && (
                  <div>
                    <h3 className="text-sm font-black text-slate-900">확인 및 해결 순서</h3>
                    <ol className="mt-3 space-y-2">
                      {post.aiSteps.map((step, index) => (
                        <li key={`${step}-${index}`} className="flex gap-3 rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-600">
                          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-indigo-100 text-xs font-black text-indigo-700">{index + 1}</span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}
                {post.aiCautions.length > 0 && (
                  <div className="rounded-2xl bg-amber-50 p-4">
                    <h3 className="text-sm font-black text-amber-900">주의할 점</h3>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-amber-800">
                      {post.aiCautions.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}
                    </ul>
                  </div>
                )}
                <p className="text-xs leading-5 text-slate-400">AI 분석은 참고용입니다. 실제 해결 기록과 공식 문서를 함께 확인하세요.</p>
              </div>
            ) : (
              <div className="mt-6 rounded-2xl bg-slate-50 p-5 text-sm leading-6 text-slate-500">
                이 기록에는 아직 AI 분석이 없습니다. 버튼을 누르면 오류 정보와 실제 해결 방법을 바탕으로 Gemini가 원인과 확인 순서를 정리합니다.
              </div>
            )}
          </section>
        </article>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-black uppercase tracking-wider text-slate-400">기록 반응</p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-center">
              <div className="rounded-xl bg-slate-50 p-3"><strong className="block text-xl text-slate-950">{post.viewCount + 1}</strong><span className="text-xs text-slate-400">조회</span></div>
              <div className="rounded-xl bg-slate-50 p-3"><strong className="block text-xl text-slate-950">{post.helpfulCount}</strong><span className="text-xs text-slate-400">도움됨</span></div>
            </div>
            <div className="mt-4"><HelpfulButton id={post.id} initialCount={post.helpfulCount} /></div>
          </div>

          {(post.tags.length > 0 || post.aiKeywords.length > 0) && (
            <div className="rounded-2xl border border-slate-200 bg-white p-5">
              <p className="text-xs font-black uppercase tracking-wider text-slate-400">키워드</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {[...new Set([...post.tags, ...post.aiKeywords])].slice(0, 12).map((tag) => (
                  <span key={tag} className="rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-600">#{tag}</span>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
