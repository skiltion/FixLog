"use client";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-red-50 text-2xl">!</div>
      <h2 className="mt-5 text-2xl font-black text-slate-950">페이지를 불러오지 못했습니다.</h2>
      <p className="mt-2 text-sm leading-6 text-slate-500">일시적인 오류이거나 데이터베이스 설정이 완료되지 않았을 수 있습니다.</p>
      <button onClick={reset} className="mt-6 rounded-xl bg-slate-950 px-5 py-3 text-sm font-bold text-white hover:bg-slate-800">다시 시도</button>
    </div>
  );
}
