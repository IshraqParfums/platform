import { BackendStatus } from "@/components/backend-status";

export default function Home() {
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-6 py-16">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(15,118,110,0.12),_transparent_55%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-24 right-0 h-72 w-72 rounded-full bg-teal-400/10 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-24 left-0 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl"
      />

      <div className="relative z-10 flex w-full max-w-lg flex-col items-center gap-10">
        <header className="text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-teal-700 text-lg font-bold tracking-tight text-white shadow-lg shadow-teal-700/25">
            IP
          </div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-teal-700 dark:text-teal-400">
            Ishraq Parfums
          </p>
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
            Init page
          </h1>
          <p className="mt-4 text-base leading-relaxed text-zinc-600 dark:text-zinc-400 sm:text-lg">
            Premium perfume shopping and bespoke blends.
            <br />
            Monorepo bootstrap validation is live.
          </p>
        </header>

        <BackendStatus />
      </div>
    </main>
  );
}
