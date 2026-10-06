"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function AnalyzeExistingButton({ id }: { id: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  async function analyze() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/errors/${id}/analyze`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "AI 분석에 실패했습니다.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "AI 분석에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={analyze}
        disabled={loading}
        className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Gemini가 분석 중…" : "Gemini로 이 오류 분석하기"}
      </button>
      {error && <p className="mt-2 text-sm font-medium text-red-600">{error}</p>}
    </div>
  );
}
