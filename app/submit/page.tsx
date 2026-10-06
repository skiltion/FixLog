import { SubmitForm } from "@/components/SubmitForm";

export const metadata = { title: "해결 기록 등록" };

export default function SubmitPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
      <div className="mb-8">
        <p className="text-sm font-black text-indigo-600">SHARE A FIX</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950">해결한 오류를 기록해 주세요.</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">회원가입 없이 공개됩니다. AI는 기록을 정리하는 보조 역할이며, 가장 중요한 정보는 직접 확인한 실제 해결 방법입니다.</p>
      </div>
      <SubmitForm />
    </div>
  );
}
