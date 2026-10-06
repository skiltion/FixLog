"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AiAnalysis } from "@/types/error-post";

const commonTechnologies = [
  "Next.js", "React", "TypeScript", "JavaScript", "Node.js", "Supabase", "PostgreSQL", "Vercel", "Python", "Java", "Flutter", "기타",
];

type FormState = {
  title: string;
  errorMessage: string;
  description: string;
  technology: string;
  technologyVersion: string;
  code: string;
  solution: string;
  tags: string;
};

const initialForm: FormState = {
  title: "",
  errorMessage: "",
  description: "",
  technology: "Next.js",
  technologyVersion: "",
  code: "",
  solution: "",
  tags: "",
};

export function SubmitForm() {
  const [form, setForm] = useState(initialForm);
  const [analysis, setAnalysis] = useState<AiAnalysis | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const tags = useMemo(
    () => form.tags.split(",").map((tag) => tag.trim().replace(/^#/, "")).filter(Boolean).slice(0, 8),
    [form.tags],
  );

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (["title", "errorMessage", "description", "technology", "technologyVersion", "code", "solution"].includes(key)) {
      setAnalysis(null);
    }
  }

  async function runAi() {
    setMessage("");
    if (form.title.trim().length < 3 || form.errorMessage.trim().length < 3 || !form.technology.trim()) {
      setMessage("제목, 기술, 오류 메시지를 먼저 입력해 주세요.");
      return;
    }

    setAiLoading(true);
    try {
      const response = await fetch("/api/ai/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "AI 분석에 실패했습니다.");
      setAnalysis(data.analysis);
      setMessage("AI 분석이 완료되었습니다. 실제 해결 방법과 비교해 확인해 주세요.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "AI 분석에 실패했습니다.");
    } finally {
      setAiLoading(false);
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    setMessage("");
    setSaving(true);
    try {
      const response = await fetch("/api/errors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, tags, includeAiAnalysis: Boolean(analysis) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "등록에 실패했습니다.");
      router.push(`/error/${data.id}`);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "등록에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  }

  const fieldClass = "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-100";

  return (
    <form onSubmit={submit} className="space-y-6">
      <div className="grid gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="grid gap-5 sm:grid-cols-2">
          <label className="text-sm font-bold text-slate-700">
            기술 <span className="text-red-500">*</span>
            <input list="submit-tech-options" value={form.technology} onChange={(e) => update("technology", e.target.value)} maxLength={80} className={fieldClass} placeholder="예: Next.js" />
            <datalist id="submit-tech-options">{commonTechnologies.map((tech) => <option key={tech} value={tech} />)}</datalist>
          </label>
          <label className="text-sm font-bold text-slate-700">
            버전
            <input value={form.technologyVersion} onChange={(e) => update("technologyVersion", e.target.value)} maxLength={80} placeholder="예: 16.3.8" className={fieldClass} />
          </label>
        </div>

        <label className="text-sm font-bold text-slate-700">
          오류 제목 <span className="text-red-500">*</span>
          <input value={form.title} onChange={(e) => update("title", e.target.value)} maxLength={160} placeholder="예: Vercel 배포에서 SUPABASE_URL을 읽지 못하는 오류" className={fieldClass} required />
        </label>

        <label className="text-sm font-bold text-slate-700">
          오류 메시지 <span className="text-red-500">*</span>
          <textarea value={form.errorMessage} onChange={(e) => update("errorMessage", e.target.value)} maxLength={12000} rows={6} placeholder="터미널이나 브라우저에 표시된 오류 메시지를 그대로 붙여넣으세요." className={`${fieldClass} font-mono`} required />
        </label>

        <label className="text-sm font-bold text-slate-700">
          발생 상황
          <textarea value={form.description} onChange={(e) => update("description", e.target.value)} maxLength={5000} rows={4} placeholder="어떤 작업을 하다가 발생했는지 설명해 주세요." className={fieldClass} />
        </label>

        <label className="text-sm font-bold text-slate-700">
          관련 코드
          <textarea value={form.code} onChange={(e) => update("code", e.target.value)} maxLength={16000} rows={8} placeholder="필요한 부분만 붙여넣으세요. API 키, 비밀번호 등 비밀값은 제거하세요." className={`${fieldClass} font-mono`} />
        </label>

        <label className="text-sm font-bold text-slate-700">
          실제 해결 방법 <span className="text-red-500">*</span>
          <textarea value={form.solution} onChange={(e) => update("solution", e.target.value)} maxLength={8000} rows={6} placeholder="무엇을 변경했더니 해결됐는지 구체적으로 적어 주세요." className={fieldClass} required />
        </label>

        <label className="text-sm font-bold text-slate-700">
          태그
          <input value={form.tags} onChange={(e) => update("tags", e.target.value)} placeholder="RLS, env, deployment 처럼 쉼표로 구분" className={fieldClass} />
          <span className="mt-2 block text-xs font-normal text-slate-400">최대 8개 · 검색 키워드로 활용됩니다.</span>
        </label>
      </div>

      <div className="rounded-3xl border border-indigo-200 bg-indigo-50/70 p-6 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-wider text-indigo-600">Optional AI Assist</p>
            <h2 className="mt-1 text-xl font-black text-slate-950">등록 전에 Gemini로 정리하기</h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">입력한 오류와 해결 방법을 바탕으로 원인, 확인 순서, 주의점, 검색 키워드를 구조화합니다.</p>
          </div>
          <button type="button" onClick={runAi} disabled={aiLoading || saving} className="shrink-0 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60">
            {aiLoading ? "분석 중…" : analysis ? "AI 다시 분석" : "AI로 분석"}
          </button>
        </div>

        {analysis && (
          <div className="mt-6 grid gap-4 rounded-2xl bg-white p-5 text-sm shadow-sm">
            <div><strong className="text-slate-900">요약</strong><p className="mt-1 leading-6 text-slate-600">{analysis.summary}</p></div>
            <div><strong className="text-slate-900">원인</strong><p className="mt-1 leading-6 text-slate-600">{analysis.cause}</p></div>
            <div><strong className="text-slate-900">확인 순서</strong><ol className="mt-2 list-decimal space-y-1 pl-5 leading-6 text-slate-600">{analysis.steps.map((step, index) => <li key={`${step}-${index}`}>{step}</li>)}</ol></div>
            {analysis.keywords.length > 0 && <div className="flex flex-wrap gap-1.5">{analysis.keywords.map((keyword) => <span key={keyword} className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500">#{keyword}</span>)}</div>}
          </div>
        )}
      </div>

      {message && <p className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600">{message}</p>}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-xl text-xs leading-5 text-slate-400">등록한 내용은 로그인 없이 모든 사용자에게 공개됩니다. 개인정보, API 키, 비밀번호, 토큰 등 민감한 정보는 절대 입력하지 마세요.</p>
        <button type="submit" disabled={saving || aiLoading} className="rounded-xl bg-slate-950 px-6 py-3.5 text-sm font-black text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60">
          {saving ? "등록 중…" : "해결 기록 공개 등록"}
        </button>
      </div>
    </form>
  );
}
