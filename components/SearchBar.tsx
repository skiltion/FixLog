export function SearchBar({ defaultValue = "" }: { defaultValue?: string }) {
  return (
    <form action="/search" method="GET" className="relative mx-auto flex w-full max-w-3xl gap-2 rounded-2xl border border-slate-200 bg-white p-2 shadow-xl shadow-slate-200/50">
      <div className="flex min-w-0 flex-1 items-center gap-3 px-3">
        <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0 fill-none stroke-slate-400" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.4-3.4" />
        </svg>
        <input
          name="q"
          defaultValue={defaultValue}
          maxLength={300}
          placeholder="오류 메시지나 기술명을 붙여넣어 검색하세요"
          className="h-12 min-w-0 flex-1 bg-transparent text-base text-slate-900 placeholder:text-slate-400 focus:outline-none"
        />
      </div>
      <button className="shrink-0 rounded-xl bg-indigo-600 px-5 font-bold text-white transition hover:bg-indigo-500 disabled:opacity-50">
        검색
      </button>
    </form>
  );
}
