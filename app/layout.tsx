import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "FixLog | 개발 오류 해결 기록",
    template: "%s | FixLog",
  },
  description: "개발 오류를 검색하고, AI 분석과 실제 해결 기록을 함께 공유하는 공개 지식 저장소",
};

function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-black tracking-tight text-slate-950">
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-slate-950 text-sm text-white shadow-sm">
        &gt;_
      </span>
      <span className="text-xl">FixLog</span>
    </Link>
  );
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body className="min-h-screen">
        <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
            <Logo />
            <nav className="flex items-center gap-2 text-sm font-semibold text-slate-600">
              <Link href="/search" className="rounded-lg px-3 py-2 hover:bg-slate-100 hover:text-slate-950">
                오류 검색
              </Link>
              <Link href="/analyze" className="hidden rounded-lg px-3 py-2 hover:bg-slate-100 hover:text-slate-950 sm:block">
                AI 분석
              </Link>
              <Link
                href="/submit"
                className="rounded-xl bg-slate-950 px-4 py-2.5 text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-800"
              >
                해결 기록 등록
              </Link>
            </nav>
          </div>
        </header>

        <main>{children}</main>

        <footer className="mt-20 border-t border-slate-200 bg-white/70">
          <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-slate-500 sm:px-6 md:flex-row md:items-center md:justify-between">
            <p>FixLog — 개발 오류와 실제 해결 경험을 함께 쌓는 공개 지식 저장소</p>
            <p>Next.js · Supabase · Gemini API · Vercel</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
