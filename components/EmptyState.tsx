import Link from "next/link";

export function EmptyState({ query }: { query?: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 px-6 py-14 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-2xl">⌕</div>
      <h2 className="mt-5 text-xl font-black text-slate-900">아직 일치하는 해결 기록이 없어요.</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">
        {query ? `“${query}”와 관련된 공개 기록을 찾지 못했습니다.` : "아직 등록된 해결 기록이 없습니다."} 직접 해결한 사례가 있다면 첫 기록을 남겨보세요.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {query && (
          <Link href={`/analyze?q=${encodeURIComponent(query)}`} className="inline-flex rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-500">
            AI로 이 오류 분석하기
          </Link>
        )}
        <Link href="/submit" className="inline-flex rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800">
          해결 기록 등록하기
        </Link>
      </div>
    </div>
  );
}
