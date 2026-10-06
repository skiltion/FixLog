"use client";

import { useState } from "react";

export function HelpfulButton({ id, initialCount }: { id: string; initialCount: number }) {
  const [count, setCount] = useState(initialCount);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);

  async function vote() {
    if (done || loading) return;
    setLoading(true);
    try {
      const response = await fetch(`/api/errors/${id}/helpful`, { method: "POST" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "요청에 실패했습니다.");
      setCount(data.helpfulCount);
      setDone(true);
    } catch (error) {
      alert(error instanceof Error ? error.message : "요청에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={vote}
      disabled={done || loading}
      className="rounded-xl border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-bold text-indigo-700 transition hover:bg-indigo-100 disabled:cursor-default disabled:opacity-70"
    >
      {done ? "도움됐어요 ✓" : loading ? "처리 중…" : `도움이 됐어요 · ${count}`}
    </button>
  );
}
