import Link from "next/link";
import { Logo } from "./Logo";

const EXPLORE = [
  { href: "/learn", label: "Learning path" },
  { href: "/lab", label: "Account Lab" },
  { href: "/drills", label: "Question drills" },
];

const PRACTISE = [
  { href: "/daily", label: "Daily challenge" },
  { href: "/speed", label: "Speed round" },
  { href: "/cards", label: "Flashcards" },
  { href: "/leaderboard", label: "Leaderboard" },
];

export default function Footer() {
  return (
    <footer className="relative mt-20 border-t border-line/60 bg-paper-sunken/30">
      <div className="h-px w-full grad-ig opacity-60" />
      <div className="w-full px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:gap-12 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2.5">
              <Logo size={30} />
              <span className="text-lg font-black text-ink">Zoxdi</span>
            </div>
            <p className="mt-3 max-w-xs text-sm text-ink-muted">
              Learn the language of business by running one.
            </p>
            <p className="mt-2 text-[11px] font-semibold text-ink-muted/80">
              A quiet side-project, kept by one learner.
            </p>
          </div>

          <nav aria-label="Explore">
            <p className="text-xs font-black uppercase tracking-wide text-ink-muted">Explore</p>
            <ul className="mt-3 space-y-2">
              {EXPLORE.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm font-semibold text-ink-soft transition hover:text-credit"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Practise">
            <p className="text-xs font-black uppercase tracking-wide text-ink-muted">Practise</p>
            <ul className="mt-3 space-y-2">
              {PRACTISE.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm font-semibold text-ink-soft transition hover:text-credit"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-line/60 pt-8 text-xs text-ink-muted sm:flex-row">
          <p>© {new Date().getFullYear()} Zoxdi · Accounting for everyone, everywhere.</p>
          <div className="flex items-center gap-4">
            <Link href="/about" className="font-bold text-ink-soft transition hover:text-credit">
              About
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
