import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About — Zoxdi",
  description:
    "Zoxdi teaches accounting as a game anyone can win. Accounting is for everyone, everywhere.",
};

const VALUES = [
  {
    icon: "🌍",
    title: "For everyone, everywhere",
    body: "No jargon walls and no gatekeeping. If you can read, you can learn the books.",
  },
  {
    icon: "🧠",
    title: "Understand, then remember",
    body: "Every concept starts with why it exists. The rules come after the reason.",
  },
  {
    icon: "🩺",
    title: "Mistakes are the lesson",
    body: "A wrong answer is named, explained and re-taught — never just marked red.",
  },
];

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-10 py-10">
      <header className="text-center">
        <span className="text-5xl" aria-hidden="true">📚</span>
        <h1 className="mt-4 text-4xl font-black leading-tight text-ink sm:text-5xl">
          Accounting is for <span className="text-ig">everyone.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-ink-muted">
          Zoxdi turns the language of business into a game you can win — one
          shop, one transaction and one level at a time.
        </p>
      </header>

      <section className="rounded-xl3 border border-line bg-paper-card p-6 shadow-card">
        <h2 className="text-xl font-black text-ink">Why Zoxdi exists</h2>
        <p className="mt-2 text-ink-muted">
          Most people meet accounting as a wall of rules to memorise. That is
          backwards. Every rule exists to answer a question: did the business
          get richer, and where did the money go? Zoxdi starts from that
          question and lets you discover the rules by running a real set of
          books.
        </p>
        <p className="mt-3 text-ink-muted">
          It is built as a quiet side-project by one learner, for anyone,
          anywhere who wants to understand business without a lecture hall.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {VALUES.map((value) => (
          <div
            key={value.title}
            className="rounded-xl3 border border-line bg-paper-card p-5 shadow-card"
          >
            <span className="text-3xl" aria-hidden="true">{value.icon}</span>
            <h3 className="mt-3 font-black text-ink">{value.title}</h3>
            <p className="mt-1 text-sm text-ink-muted">{value.body}</p>
          </div>
        ))}
      </section>

      <section className="rounded-xl3 grad-ig p-1">
        <div className="rounded-[calc(1.75rem-4px)] bg-paper-card px-6 py-8 text-center">
          <h2 className="text-2xl font-black text-ink">Open your first shop</h2>
          <p className="mx-auto mt-2 max-w-md text-ink-muted">
            Six chapters, forty levels and five hundred questions, free to play.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link
              href="/learn"
              className="rounded-full bg-ig-135 px-7 py-3 font-black text-white shadow-glow transition hover:opacity-95"
            >
              Start learning →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
