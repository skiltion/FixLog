"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type {
  AiAnalysis,
  SubmitDraft,
} from "@/types/error-post";

const SUBMIT_DRAFT_KEY = "fixlog-submit-draft";

const technologies = [
  "Next.js",
  "React",
  "TypeScript",
  "JavaScript",
  "Node.js",
  "Supabase",
  "PostgreSQL",
  "Vercel",
  "Python",
  "Java",
  "Flutter",
];

export function AnalyzeForm({
  initialQuery = "",
}: {
  initialQuery?: string;
}) {
  const [title, setTitle] = useState(
    initialQuery
      ? "이 오류의 원인과 해결 방법"
      : "",
  );

  const [technology, setTechnology] =
    useState("Next.js");

  const [
    technologyVersion,
    setTechnologyVersion,
  ] = useState("");

  const [errorMessage, setErrorMessage] =
    useState(initialQuery);

  const [description, setDescription] =
    useState("");

  const [code, setCode] = useState("");

  const [analysis, setAnalysis] =
    useState<AiAnalysis | null>(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const router = useRouter();

  async function analyze() {
    setError("");
    setAnalysis(null);

    if (
      title.trim().length < 3 ||
      technology.trim().length < 1 ||
      errorMessage.trim().length < 3
    ) {
      setError(
        "제목, 기술, 오류 메시지를 입력해 주세요.",
      );

      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        "/api/ai/analyze",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            title,
            technology,
            technologyVersion,
            errorMessage,
            description,
            code,
          }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "AI 분석에 실패했습니다.",
        );
      }

      setAnalysis(data.analysis);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "AI 분석에 실패했습니다.",
      );
    } finally {
      setLoading(false);
    }
  }

  function moveToSubmit() {
    if (!analysis) return;

    const draft: SubmitDraft = {
      title: title.trim(),

      errorMessage:
        errorMessage.trim(),

      description:
        description.trim(),

      technology:
        technology.trim(),

      technologyVersion:
        technologyVersion.trim(),

      code: code.trim(),

      tags: analysis.keywords
        .slice(0, 8)
        .map((keyword) =>
          keyword.slice(0, 40),
        )
        .join(", "),

      analysis,
    };

    try {
      sessionStorage.setItem(
        SUBMIT_DRAFT_KEY,
        JSON.stringify(draft),
      );

      router.push(
        "/submit?from=ai",
      );
    } catch {
      setError(
        "분석 결과를 등록 화면으로 전달하지 못했습니다. 브라우저 저장소 사용 가능 여부를 확인해 주세요.",
      );
    }
  }

  const fieldClass =
    "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-100";

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="grid gap-5">

          <label className="text-sm font-bold text-slate-700">
            기술{" "}
            <span className="text-red-500">
              *
            </span>

            <input
              list="analyze-tech-options"
              value={technology}
              onChange={(e) => {
                setTechnology(
                  e.target.value,
                );

                setAnalysis(null);
              }}
              maxLength={80}
              className={fieldClass}
              placeholder="예: Next.js"
            />

            <datalist id="analyze-tech-options">
              {technologies.map(
                (tech) => (
                  <option
                    key={tech}
                    value={tech}
                  />
                ),
              )}
            </datalist>
          </label>

          <label className="text-sm font-bold text-slate-700">
            버전

            <input
              value={
                technologyVersion
              }
              onChange={(e) => {
                setTechnologyVersion(
                  e.target.value,
                );

                setAnalysis(null);
              }}
              maxLength={80}
              className={fieldClass}
              placeholder="예: 16.3.8"
            />
          </label>

          <label className="text-sm font-bold text-slate-700">
            분석 제목{" "}
            <span className="text-red-500">
              *
            </span>

            <input
              value={title}
              onChange={(e) => {
                setTitle(
                  e.target.value,
                );

                setAnalysis(null);
              }}
              maxLength={160}
              className={fieldClass}
              placeholder="예: Vercel 배포 중 환경변수 오류"
            />
          </label>

          <label className="text-sm font-bold text-slate-700">
            오류 메시지{" "}
            <span className="text-red-500">
              *
            </span>

            <textarea
              value={errorMessage}
              onChange={(e) => {
                setErrorMessage(
                  e.target.value,
                );

                setAnalysis(null);
              }}
              maxLength={12000}
              rows={7}
              className={`${fieldClass} font-mono`}
              placeholder="오류 메시지를 그대로 붙여넣으세요."
            />
          </label>

          <label className="text-sm font-bold text-slate-700">
            발생 상황

            <textarea
              value={description}
              onChange={(e) => {
                setDescription(
                  e.target.value,
                );

                setAnalysis(null);
              }}
              maxLength={5000}
              rows={4}
              className={fieldClass}
              placeholder="무엇을 하다가 오류가 났는지 적어 주세요."
            />
          </label>

          <label className="text-sm font-bold text-slate-700">
            관련 코드

            <textarea
              value={code}
              onChange={(e) => {
                setCode(
                  e.target.value,
                );

                setAnalysis(null);
              }}
              maxLength={16000}
              rows={7}
              className={`${fieldClass} font-mono`}
              placeholder="API 키, 비밀번호, 토큰 등 비밀값은 제거하고 붙여넣으세요."
            />
          </label>

          <button
            type="button"
            onClick={analyze}
            disabled={loading}
            className="rounded-xl bg-indigo-600 px-5 py-3.5 text-sm font-black text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading
              ? "Gemini가 분석 중…"
              : "Gemini로 오류 분석"}
          </button>

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
              {error}
            </p>
          )}
        </div>
      </div>

      <div className="rounded-3xl border border-indigo-200 bg-indigo-50/60 p-6 sm:p-8">

        <p className="text-xs font-black uppercase tracking-wider text-indigo-600">
          AI RESULT
        </p>

        <h2 className="mt-1 text-xl font-black text-slate-950">
          분석 결과
        </h2>

        {!analysis ? (
          <div className="mt-6 rounded-2xl border border-dashed border-indigo-200 bg-white/70 p-8 text-center text-sm leading-6 text-slate-500">
            왼쪽에 오류 정보를
            입력하고 분석 버튼을
            누르면 여기에 결과가
            표시됩니다.
            <br />
            AI 답변은 참고용이므로
            실제 환경과 공식 문서를
            함께 확인하세요.
          </div>
        ) : (
          <div className="mt-6 space-y-5">

            <section className="rounded-2xl bg-white p-5 shadow-sm">

              <h3 className="font-black text-slate-900">
                한눈에 보기
              </h3>

              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                {analysis.summary}
              </p>
            </section>

            <section className="rounded-2xl bg-white p-5 shadow-sm">

              <h3 className="font-black text-slate-900">
                가능성이 높은 원인
              </h3>

              <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                {analysis.cause}
              </p>
            </section>

            <section className="rounded-2xl bg-white p-5 shadow-sm">

              <h3 className="font-black text-slate-900">
                확인 및 해결 순서
              </h3>

              <ol className="mt-3 space-y-2">

                {analysis.steps.map(
                  (
                    step,
                    index,
                  ) => (

                    <li
                      key={`${step}-${index}`}
                      className="flex gap-3 rounded-xl bg-slate-50 p-3 text-sm leading-6 text-slate-600"
                    >

                      <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-indigo-100 text-xs font-black text-indigo-700">
                        {index + 1}
                      </span>

                      <span>
                        {step}
                      </span>

                    </li>
                  ),
                )}
              </ol>
            </section>

            {analysis.cautions.length >
              0 && (

              <section className="rounded-2xl bg-amber-50 p-5">

                <h3 className="font-black text-amber-900">
                  주의할 점
                </h3>

                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-6 text-amber-800">

                  {analysis.cautions.map(
                    (
                      item,
                      index,
                    ) => (

                      <li
                        key={`${item}-${index}`}
                      >
                        {item}
                      </li>
                    ),
                  )}

                </ul>
              </section>
            )}

            {analysis.keywords.length >
              0 && (

              <section>

                <h3 className="text-sm font-black text-slate-900">
                  다시 검색해 볼 키워드
                </h3>

                <div className="mt-2 flex flex-wrap gap-2">

                  {analysis.keywords.map(
                    (keyword) => (

                      <Link
                        key={keyword}
                        href={`/search?q=${encodeURIComponent(
                          keyword,
                        )}`}
                        className="rounded-lg border border-indigo-200 bg-white px-2.5 py-1.5 text-xs font-bold text-indigo-700 hover:bg-indigo-50"
                      >
                        #{keyword}
                      </Link>

                    ),
                  )}

                </div>
              </section>
            )}

            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">

              <p className="text-sm font-bold text-emerald-950">
                이 방법으로 실제 해결됐나요?
              </p>

              <p className="mt-1 text-xs leading-5 text-emerald-800">
                해결 기록 등록을 누르면
                지금 입력한 오류 정보와
                AI 분석 결과가 등록
                화면에 자동으로
                채워집니다.
              </p>

              <button
                type="button"
                onClick={moveToSubmit}
                className="mt-3 inline-flex rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-black text-white hover:bg-emerald-600"
              >
                해결 기록 등록하기
              </button>

            </div>

          </div>
        )}
      </div>
    </div>
  );
}
