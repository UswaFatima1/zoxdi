import Link from "next/link";
import { CHAPTER_BY_ID } from "@/data/accounting";
import { LESSONS } from "@/lib/learning/lessons";

export const metadata = {
  title: "Lessons — Zoxdi",
  description:
    "Short “why and how” lessons for every idea in accounting: the equation, journal entries, the ledger, the trial balance and the financial statements.",
};

const ACCENT_GRADIENT: Record<string, string> = {
  gold: "linear-gradient(135deg,#FFD93D,#F58529)",
  debit: "linear-gradient(135deg,#405DE6,#9B30BF)",
  credit: "linear-gradient(135deg,#E1306C,#9B30BF)",
  good: "linear-gradient(135deg,#06C167,#405DE6)",
  ink: "linear-gradient(135deg,#F58529,#E1306C)",
};

export default function LessonsPage() {
  return (
    <div className="space-y-6 py-6">
      <header className="max-w-2xl">
        <p className="text-xs font-black uppercase tracking-wide text-credit">Concepts</p>
        <h1 className="mt-1 text-3xl font-black text-ink sm:text-4xl">Why each idea exists</h1>
        <p className="mt-2 text-ink-muted">
          Two minutes each. Every lesson explains why the idea exists, how it works, a worked
          example and a quick check — before you ever use it in a level.
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2">
        {LESSONS.map((lesson) => {
          const chapter = CHAPTER_BY_ID[lesson.chapterId];
          return (
            <Link
              key={lesson.slug}
              href={`/lessons/${lesson.slug}`}
              className="group flex flex-col overflow-hidden rounded-xl2 border border-line bg-paper-card shadow-card transition hover:-translate-y-0.5 hover:border-credit/40 hover:shadow-lift"
            >
              <div className="h-1.5 w-full" style={{ backgroundImage: ACCENT_GRADIENT[lesson.accent] }} />
              <div className="flex flex-1 flex-col p-5">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-paper-sunken text-xl" aria-hidden="true">
                    {lesson.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="text-[11px] font-black uppercase tracking-wide text-ink-muted">
                      Chapter {chapter?.order ?? ""} · {lesson.eyebrow}
                    </p>
                    <h2 className="truncate text-lg font-black text-ink">{lesson.title}</h2>
                  </div>
                </div>
                <p className="mt-3 flex-1 text-sm text-ink-muted">{lesson.tagline}</p>
                <span className="mt-3 text-xs font-black uppercase tracking-wide text-credit group-hover:text-credit-deep">
                  Start the lesson ▶
                </span>
              </div>
            </Link>
          );
        })}
      </div>

      <p className="text-center text-xs text-ink-muted">
        Prefer to jump straight in?{" "}
        <Link href="/learn" className="font-bold text-credit underline-offset-2 hover:underline">
          Go to the levels →
        </Link>
      </p>
    </div>
  );
}
