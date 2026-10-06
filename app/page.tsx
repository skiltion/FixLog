import Link from "next/link";
import { SearchBar } from "@/components/SearchBar";
import { ErrorCard } from "@/components/ErrorCard";
import { EmptyState } from "@/components/EmptyState";
import { getHomeData } from "@/lib/db";

export const dynamic = "force-dynamic";

export default async function Home() {
  let data: Awaited<ReturnType<typeof getHomeData>> = {
    recent: [],
    stats: { totalPosts: 0, totalHelpful: 0, technologies: 0 },
    technologies: [],
  };
  let dbError = false;

  try {
    data = await getHomeData();
  } catch {
    dbError = true;
  }

  return (
    <>
      <section className="mx-auto max-w-6xl px-4 pb-14 pt-16 text-center sm:px-6 sm:pt-24">
        <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-700">
          <span className="h-2 w-2 rounded-full bg-indigo-500" />
          실제 해결 기록 + Gemini AI 분석
        </div>
        <h1 className="mx-auto max-w-4xl text-balance text-4xl font-black tracking-tight text-slate-950 sm:text-6xl">
          같은 오류를 만난 사람이<br className="hidden sm:block" /> 이미 해결했을지도 몰라요.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-pretty text-base leading-7 text-slate-500 sm:text-lg">
          오류 메시지를 검색해 실제 개발자의 해결 기록을 먼저 확인하고, 필요할 때 Gemini에게 원인과 해결 순서를 분석받으세요.
        </p>
        <div className="mt-9">
          <SearchBar />
        </div>
        <div className="mt-4">
          <Link href="/analyze" className="text-sm font-bold text-indigo-600 hover:text-indigo-500">기존 기록 없이 바로 AI 분석하기 →</Link>
        </div>

        <div className="mx-auto mt-7 flex max-w-3xl flex-wrap justify-center gap-2">
          {data.technologies.length > 0 ? (
            data.technologies.map((tech) => (
              <Link
                key={tech.name}
                href={`/search?q=${encodeURIComponent(tech.name)}&tech=${encodeURIComponent(tech.name)}`}
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-500 hover:border-indigo-200 hover:text-indigo-700"
              >
                {tech.name} <span className="text-slate-300">{tech.count}</span>
              </Link>
            ))
          ) : (
            <span className="text-xs text-slate-400">Next.js · React · TypeScript · Supabase · Vercel · Python 등 모든 개발 오류를 기록할 수 있어요.</span>
          )}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white/65">
        <div className="mx-auto grid max-w-5xl grid-cols-3 divide-x divide-slate-200 px-4 py-6 text-center sm:px-6">
          <div>
            <strong className="block text-2xl font-black text-slate-950">{data.stats.totalPosts}</strong>
            <span className="text-xs font-semibold text-slate-400">해결 기록</span>
          </div>
          <div>
            <strong className="block text-2xl font-black text-slate-950">{data.stats.technologies}</strong>
            <span className="text-xs font-semibold text-slate-400">기술 분야</span>
          </div>
          <div>
            <strong className="block text-2xl font-black text-slate-950">{data.stats.totalHelpful}</strong>
            <span className="text-xs font-semibold text-slate-400">도움됨</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold text-indigo-600">COMMUNITY FIXES</p>
            <h2 className="mt-1 text-2xl font-black text-slate-950">최근 해결된 오류</h2>
          </div>
          <Link href="/search" className="text-sm font-bold text-slate-500 hover:text-indigo-700">
            전체 보기 →
          </Link>
        </div>

        {dbError ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm leading-6 text-amber-800">
            아직 데이터베이스가 연결되지 않았습니다. 배포 후 Supabase의 SQL Editor에서 <code>database/schema.sql</code>을 실행하고 Vercel에 <code>SUPABASE_URL</code>과 <code>SUPABASE_SECRET_KEY</code>를 등록하면 이 영역이 활성화됩니다.
          </div>
        ) : data.recent.length ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {data.recent.map((post) => <ErrorCard key={post.id} post={post} />)}
          </div>
        ) : (
          <EmptyState />
        )}
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ["1", "먼저 검색", "이미 같은 문제를 해결한 기록이 있는지 빠르게 확인합니다."],
            ["2", "AI로 분석", "기존 사례가 부족하면 Gemini가 오류의 의미, 원인, 확인 순서를 정리합니다."],
            ["3", "해결 경험 공유", "실제로 해결한 방법을 공개 기록으로 남겨 다음 개발자가 다시 활용합니다."],
          ].map(([num, title, desc]) => (
            <div key={num} className="rounded-2xl border border-slate-200 bg-white p-6">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-950 text-sm font-black text-white">{num}</span>
              <h3 className="mt-4 font-extrabold text-slate-900">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{desc}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
