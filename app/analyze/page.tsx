import { AnalyzeForm } from "@/components/AnalyzeForm";

export const metadata = { title: "AI 오류 분석" };

type SearchParams = Promise<{ q?: string }>;

export default async function AnalyzePage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const initialQuery = (params.q ?? "").trim().slice(0, 300);

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <p className="text-sm font-black text-indigo-600">AI DEBUG ASSIST</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">기존 사례가 없다면 AI로 분석해 보세요.</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-500">Gemini가 오류의 의미와 가능성이 높은 원인, 확인 순서를 정리합니다. 이 결과는 자동으로 공개 저장되지 않으며, 실제로 해결된 뒤에만 별도로 해결 기록을 등록할 수 있습니다.</p>
      </div>
      <AnalyzeForm initialQuery={initialQuery} />
    </div>
  );
}
