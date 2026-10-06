"use client";

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import type {
  AiAnalysis,
  SubmitDraft,
} from "@/types/error-post";

const SUBMIT_DRAFT_KEY =
  "fixlog-submit-draft";

const commonTechnologies = [
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
  "기타",
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

function isAiAnalysis(
  value: unknown,
): value is AiAnalysis {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return false;
  }

  const analysis =
    value as Record<
      string,
      unknown
    >;

  return (
    typeof analysis.summary ===
      "string" &&
    typeof analysis.cause ===
      "string" &&
    Array.isArray(
      analysis.steps,
    ) &&
    Array.isArray(
      analysis.cautions,
    ) &&
    Array.isArray(
      analysis.keywords,
    )
  );
}

function isSubmitDraft(
  value: unknown,
): value is SubmitDraft {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return false;
  }

  const draft =
    value as Record<
      string,
      unknown
    >;

  return (
    typeof draft.title ===
      "string" &&
    typeof draft.errorMessage ===
      "string" &&
    typeof draft.description ===
      "string" &&
    typeof draft.technology ===
      "string" &&
    typeof draft.technologyVersion ===
      "string" &&
    typeof draft.code ===
      "string" &&
    typeof draft.tags ===
      "string" &&
    isAiAnalysis(
      draft.analysis,
    )
  );
}

export function SubmitForm() {
  const [form, setForm] =
    useState<FormState>(
      initialForm,
    );

  const [analysis, setAnalysis] =
    useState<AiAnalysis | null>(
      null,
    );

  const [aiLoading, setAiLoading] =
    useState(false);

  const [saving, setSaving] =
    useState(false);

  const [message, setMessage] =
    useState("");

  const router = useRouter();

  useEffect(() => {
    try {
      const savedDraft =
        sessionStorage.getItem(
          SUBMIT_DRAFT_KEY,
        );

      if (!savedDraft) return;

      const parsed: unknown =
        JSON.parse(savedDraft);

      if (
        !isSubmitDraft(parsed)
      ) {
        sessionStorage.removeItem(
          SUBMIT_DRAFT_KEY,
        );

        return;
      }

      setForm({
        title: parsed.title,

        errorMessage:
          parsed.errorMessage,

        description:
          parsed.description,

        technology:
          parsed.technology,

        technologyVersion:
          parsed.technologyVersion,

        code: parsed.code,

        solution: "",

        tags: parsed.tags,
      });

      setAnalysis(
        parsed.analysis,
      );

      setMessage(
        "AI 분석 화면에서 입력한 정보와 분석 결과를 불러왔습니다. 실제로 해결한 방법만 확인해서 작성해 주세요.",
      );
    } catch {
      sessionStorage.removeItem(
        SUBMIT_DRAFT_KEY,
      );
    }
  }, []);

  const tags = useMemo(
    () =>
      form.tags
        .split(",")
        .map((tag) =>
          tag
            .trim()
            .replace(/^#/, ""),
        )
        .filter(Boolean)
        .map((tag) =>
          tag.slice(0, 40),
        )
        .slice(0, 8),

    [form.tags],
  );

  function update<
    K extends keyof FormState,
  >(
    key: K,
    value: FormState[K],
  ) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));

    const analysisInputFields: Array<
      keyof FormState
    > = [
      "title",
      "errorMessage",
      "description",
      "technology",
      "technologyVersion",
      "code",
    ];

    if (
      analysisInputFields.includes(
        key,
      )
    ) {
      setAnalysis(null);
    }
  }

  async function runAi() {
    setMessage("");

    if (
      form.title.trim().length <
        3 ||
      form.errorMessage.trim()
        .length < 3 ||
      !form.technology.trim()
    ) {
      setMessage(
        "제목, 기술, 오류 메시지를 먼저 입력해 주세요.",
      );

      return;
    }

    setAiLoading(true);

    try {
      const response =
        await fetch(
          "/api/ai/analyze",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              ...form,
            }),
          },
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "AI 분석에 실패했습니다.",
        );
      }

      setAnalysis(
        data.analysis,
      );

      if (
        Array.isArray(
          data.analysis
            ?.keywords,
        )
      ) {
        setForm((prev) => ({
          ...prev,

          tags:
            prev.tags.trim() ||
            data.analysis.keywords
              .slice(0, 8)
              .map(
                (
                  keyword: string,
                ) =>
                  keyword.slice(
                    0,
                    40,
                  ),
              )
              .join(", "),
        }));
      }

      setMessage(
        "AI 분석이 완료되었습니다. 실제 해결 방법과 비교해 확인해 주세요.",
      );
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "AI 분석에 실패했습니다.",
      );
    } finally {
      setAiLoading(false);
    }
  }

  function copyAiStepsToSolution() {
    if (!analysis) return;

    const suggestedSolution =
      analysis.steps
        .map(
          (
            step,
            index,
          ) =>
            `${index + 1}. ${step}`,
        )
        .join("\n");

    setForm((prev) => ({
      ...prev,

      solution:
        suggestedSolution,
    }));

    setMessage(
      "AI의 제안 해결 순서를 실제 해결 방법 칸에 복사했습니다. 실제로 적용해 해결된 내용인지 확인하고 수정해 주세요.",
    );
  }

  async function submit(
    event: FormEvent,
  ) {
    event.preventDefault();

    setMessage("");
    setSaving(true);

    try {
      const response =
        await fetch(
          "/api/errors",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              ...form,

              tags,

              aiAnalysis:
                analysis ??
                undefined,
            }),
          },
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            "등록에 실패했습니다.",
        );
      }

      sessionStorage.removeItem(
        SUBMIT_DRAFT_KEY,
      );

      router.push(
        `/error/${data.id}`,
      );

      router.refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "등록에 실패했습니다.",
      );
    } finally {
      setSaving(false);
    }
  }

  const fieldClass =
    "mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-indigo-400 focus:outline-none focus:ring-4 focus:ring-indigo-100";

  return (
    <form
      onSubmit={submit}
      className="space-y-6"
    >

      <div className="grid gap-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">

        <div className="grid gap-5 sm:grid-cols-2">

          <label className="text-sm font-bold text-slate-700">
            기술{" "}
            <span className="text-red-500">
              *
            </span>

            <input
              list="submit-tech-options"
              value={
                form.technology
              }
              onChange={(e) =>
                update(
                  "technology",
                  e.target.value,
                )
              }
              maxLength={80}
              className={
                fieldClass
              }
              placeholder="예: Next.js"
            />

            <datalist id="submit-tech-options">
              {commonTechnologies.map(
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
                form.technologyVersion
              }
              onChange={(e) =>
                update(
                  "technologyVersion",
                  e.target.value,
                )
              }
              maxLength={80}
              placeholder="예: 16.3.8"
              className={
                fieldClass
              }
            />
          </label>

        </div>

        <label className="text-sm font-bold text-slate-700">
          오류 제목{" "}
          <span className="text-red-500">
            *
          </span>

          <input
            value={form.title}
            onChange={(e) =>
              update(
                "title",
                e.target.value,
              )
            }
            maxLength={160}
            placeholder="예: Vercel 배포에서 SUPABASE_URL을 읽지 못하는 오류"
            className={fieldClass}
            required
          />
        </label>

        <label className="text-sm font-bold text-slate-700">
          오류 메시지{" "}
          <span className="text-red-500">
            *
          </span>

          <textarea
            value={
              form.errorMessage
            }
            onChange={(e) =>
              update(
                "errorMessage",
                e.target.value,
              )
            }
            maxLength={12000}
            rows={6}
            placeholder="터미널이나 브라우저에 표시된 오류 메시지를 그대로 붙여넣으세요."
            className={`${fieldClass} font-mono`}
            required
          />
        </label>

        <label className="text-sm font-bold text-slate-700">
          발생 상황

          <textarea
            value={
              form.description
            }
            onChange={(e) =>
              update(
                "description",
                e.target.value,
              )
            }
            maxLength={5000}
            rows={4}
            placeholder="어떤 작업을 하다가 발생했는지 설명해 주세요."
            className={fieldClass}
          />
        </label>

        <label className="text-sm font-bold text-slate-700">
          관련 코드

          <textarea
            value={form.code}
            onChange={(e) =>
              update(
                "code",
                e.target.value,
              )
            }
            maxLength={16000}
            rows={8}
            placeholder="필요한 부분만 붙여넣으세요. API 키, 비밀번호 등 비밀값은 제거하세요."
            className={`${fieldClass} font-mono`}
          />
        </label>

        <label className="text-sm font-bold text-slate-700">
          실제 해결 방법{" "}
          <span className="text-red-500">
            *
          </span>

          <textarea
            value={form.solution}
            onChange={(e) =>
              update(
                "solution",
                e.target.value,
              )
            }
            maxLength={8000}
            rows={6}
            placeholder="AI가 제안한 방법을 실제로 적용해 본 뒤, 무엇을 변경했더니 해결됐는지 구체적으로 적어 주세요."
            className={fieldClass}
            required
          />

          <span className="mt-2 block text-xs font-normal leading-5 text-slate-400">
            AI의 제안은 자동으로
            실제 해결 방법으로
            확정하지 않습니다.
          </span>
        </label>

        <label className="text-sm font-bold text-slate-700">
          태그

          <input
            value={form.tags}
            onChange={(e) =>
              update(
                "tags",
                e.target.value,
              )
            }
            placeholder="RLS, env, deployment 처럼 쉼표로 구분"
            className={fieldClass}
          />

          <span className="mt-2 block text-xs font-normal text-slate-400">
            최대 8개 · AI
            분석에서 넘어온
            키워드가 자동
            입력됩니다.
          </span>
        </label>

      </div>

      <div className="rounded-3xl border border-indigo-200 bg-indigo-50/70 p-6 sm:p-8">

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>

            <p className="text-xs font-black uppercase tracking-wider text-indigo-600">
              Optional AI Assist
            </p>

            <h2 className="mt-1 text-xl font-black text-slate-950">
              Gemini 분석 결과
            </h2>

            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
              AI 분석 화면에서
              넘어온 결과가 있으면
              그대로 표시됩니다.
              입력한 오류 내용을
              수정했다면 다시
              분석할 수 있습니다.
            </p>

          </div>

          <button
            type="button"
            onClick={runAi}
            disabled={
              aiLoading ||
              saving
            }
            className="shrink-0 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {aiLoading
              ? "분석 중…"
              : analysis
                ? "AI 다시 분석"
                : "AI로 분석"}
          </button>

        </div>

        {analysis && (

          <div className="mt-6 grid gap-4 rounded-2xl bg-white p-5 text-sm shadow-sm">

            <div>

              <strong className="text-slate-900">
                요약
              </strong>

              <p className="mt-1 whitespace-pre-wrap leading-6 text-slate-600">
                {analysis.summary}
              </p>

            </div>

            <div>

              <strong className="text-slate-900">
                원인
              </strong>

              <p className="mt-1 whitespace-pre-wrap leading-6 text-slate-600">
                {analysis.cause}
              </p>

            </div>

            <div>

              <strong className="text-slate-900">
                확인 및 해결 순서
              </strong>

              <ol className="mt-2 list-decimal space-y-1 pl-5 leading-6 text-slate-600">

                {analysis.steps.map(
                  (
                    step,
                    index,
                  ) => (

                    <li
                      key={`${step}-${index}`}
                    >
                      {step}
                    </li>

                  ),
                )}

              </ol>

            </div>

            {analysis.cautions.length >
              0 && (

              <div>

                <strong className="text-slate-900">
                  주의할 점
                </strong>

                <ul className="mt-2 list-disc space-y-1 pl-5 leading-6 text-slate-600">

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

              </div>

            )}

            {analysis.keywords.length >
              0 && (

              <div className="flex flex-wrap gap-1.5">

                {analysis.keywords.map(
                  (keyword) => (

                    <span
                      key={keyword}
                      className="rounded-lg bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-500"
                    >
                      #{keyword}
                    </span>

                  ),
                )}

              </div>

            )}

            <div className="border-t border-slate-100 pt-4">

              <button
                type="button"
                onClick={
                  copyAiStepsToSolution
                }
                className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-xs font-black text-indigo-700 hover:bg-indigo-100"
              >
                AI 제안 해결
                순서를 실제 해결
                방법 칸에 복사
              </button>

            </div>

          </div>

        )}

      </div>

      {message && (

        <p className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600">
          {message}
        </p>

      )}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">

        <p className="max-w-xl text-xs leading-5 text-slate-400">
          등록한 내용은 로그인 없이
          모든 사용자에게
          공개됩니다. 개인정보,
          API 키, 비밀번호, 토큰
          등 민감한 정보는 절대
          입력하지 마세요.
        </p>

        <button
          type="submit"
          disabled={
            saving ||
            aiLoading
          }
          className="rounded-xl bg-slate-950 px-6 py-3.5 text-sm font-black text-white shadow-sm hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving
            ? "등록 중…"
            : "해결 기록 공개 등록"}
        </button>

      </div>

    </form>
  );
}
