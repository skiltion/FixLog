import Link from "next/link";
import type { ErrorPostCard } from "@/types/error-post";
import { formatDate, truncate } from "@/lib/utils";

export function ErrorCard({ post }: { post: ErrorPostCard }) {
  return (
    <Link
      href={`/error/${post.id}`}
      className="group block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100/50"
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">
          {post.technology}
        </span>
        {post.technologyVersion && (
          <span className="text-xs font-medium text-slate-400">v{post.technologyVersion}</span>
        )}
        <span className="ml-auto text-xs text-slate-400">{formatDate(post.createdAt)}</span>
      </div>
      <h3 className="text-lg font-extrabold text-slate-900 transition group-hover:text-indigo-700">{post.title}</h3>
      <p className="mt-2 rounded-xl bg-slate-950 px-3 py-2.5 font-mono text-xs leading-5 text-slate-300">
        {truncate(post.errorMessage.replace(/\s+/g, " "), 170)}
      </p>
      {post.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {post.tags.slice(0, 5).map((tag) => (
            <span key={tag} className="rounded-md bg-slate-100 px-2 py-1 text-[11px] font-medium text-slate-500">
              #{tag}
            </span>
          ))}
        </div>
      )}
      <div className="mt-4 flex gap-4 text-xs font-semibold text-slate-400">
        <span>도움됨 {post.helpfulCount}</span>
        <span>조회 {post.viewCount}</span>
      </div>
    </Link>
  );
}
