export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl animate-pulse px-4 py-12 sm:px-6">
      <div className="h-8 w-56 rounded-lg bg-slate-200" />
      <div className="mt-4 h-4 w-80 max-w-full rounded bg-slate-200" />
      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((item) => <div key={item} className="h-52 rounded-2xl bg-slate-200" />)}
      </div>
    </div>
  );
}
