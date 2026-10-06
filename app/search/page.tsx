import Link from "next/link";
import { ErrorCard } from "@/components/ErrorCard";
import { EmptyState } from "@/components/EmptyState";
import { SearchBar } from "@/components/SearchBar";
import { getTechnologyOptions, searchPosts } from "@/lib/db";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ q?: string; tech?: string; sort?: string }>;

export default async function SearchPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const query = (params.q ?? "").trim().slice(0, 300);
  const technology = (params.tech ?? "").trim().slice(0, 80) || undefined;
  const sort = params.sort === "helpful" ? "helpful" : "recent";

  let posts = [] as Awaited<ReturnType<typeof searchPosts>>;
  let technologies = [] as Awaited<ReturnType<typeof getTechnologyOptions>>;
  let dbError = false;

  try {
    [posts, technologies] = await Promise.all([
      query ? searchPosts({ query, technology, sort }) : searchPosts({ query: "", technology, sort }),
      getTechnologyOptions(),
    ]);
  } catch {
    dbError = true;
  }

  function searchHref(next: { tech?: string; sort?: string }) {
    const p = new URLSearchParams();
    if (query) p.set("q", query);
    if (next.tech ?? technology) p.set("tech", next.tech ?? technology ?? "");
    p.set("sort", next.sort ?? sort);
    return `/search?${p.toString()}`;
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-black tracking-tight text-slate-950">오류 해결 기록 검색</h1>
        <p className="mt-2 text-sm text-slate-500">오류 메시지를 그대로 붙여넣거나 핵심 키워드로 찾아보세요.</p>
        <div className="mt-6"><SearchBar defaultValue={query} /></div>
      </div>

      <div className="mt-10 flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm text-slate-500">검색 결과</p>
          <h2 className="mt-1 text-xl font-black text-slate-950">
            {query ? `“${query}”` : "전체 기록"} <span className="text-indigo-600">{posts.length}</span>
          </h2>
        </div>
        <div className="flex flex-wrap gap-2 text-xs font-bold">
          <Link
            href={searchHref({ sort: "recent" })}
            className={`rounded-lg px-3 py-2 ${sort === "recent" ? "bg-slate-950 text-white" : "border border-slate-200 bg-white text-slate-500"}`}
          >
            최신순
          </Link>
          <Link
            href={searchHref({ sort: "helpful" })}
            className={`rounded-lg px-3 py-2 ${sort === "helpful" ? "bg-slate-950 text-white" : "border border-slate-200 bg-white text-slate-500"}`}
          >
            도움순
          </Link>
        </div>
      </div>

      {technologies.length > 0 && (
        <div className="mt-4 flex gap-2 overflow-x-auto pb-2 text-xs font-semibold">
          <Link href={searchHref({ tech: "" })} className={`shrink-0 rounded-full px-3 py-1.5 ${!technology ? "bg-indigo-600 text-white" : "border border-slate-200 bg-white text-slate-500"}`}>
            전체
          </Link>
          {technologies.map((tech) => (
            <Link
              key={tech.name}
              href={searchHref({ tech: tech.name })}
              className={`shrink-0 rounded-full px-3 py-1.5 ${technology === tech.name ? "bg-indigo-600 text-white" : "border border-slate-200 bg-white text-slate-500"}`}
            >
              {tech.name} ({tech.count})
            </Link>
          ))}
        </div>
      )}

      <div className="mt-7">
        {dbError ? (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">데이터베이스 연결을 확인해 주세요. Supabase 스키마 실행과 Vercel의 <code>SUPABASE_URL</code>, <code>SUPABASE_SECRET_KEY</code> 설정이 필요합니다.</div>
        ) : posts.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {posts.map((post) => <ErrorCard key={post.id} post={post} />)}
          </div>
        ) : (
          <EmptyState query={query || undefined} />
        )}
      </div>
    </div>
  );
}
