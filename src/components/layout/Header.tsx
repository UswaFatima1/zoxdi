"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useProgressContext } from "@/lib/storage/ProgressContext";
import { Avatar } from "./Avatar";
import { Logo } from "./Logo";
import { SoundToggle } from "@/components/fx/SoundToggle";

const NAV = [
  { href: "/learn", label: "Learn", icon: "🎓" },
  { href: "/lessons", label: "Lessons", icon: "📘" },
  { href: "/lab", label: "Account Lab", icon: "🧪" },
  { href: "/drills", label: "Drills", icon: "🎯" },
  { href: "/daily", label: "Daily", icon: "📅" },
  { href: "/leaderboard", label: "Leaderboard", icon: "🏆" },
  { href: "/progress", label: "Profile", icon: "👤" },
];

export default function Header() {
  const { profile, theme, toggleTheme, progress } = useProgressContext();
  const pathname = usePathname();
  // `trailingSlash: true` means the path may be "/login/"; normalise it.
  const path = (pathname ?? "/").replace(/\/+$/, "") || "/";
  const onLogin = path === "/login";

  const isActive = (href: string) => path === href || path.startsWith(`${href}/`);

  return (
    <header className="sticky top-0 z-40 border-b border-line/60 glass">
      <div className="h-1 w-full grad-ig" />
      <div className="flex h-16 w-full items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link
          href={profile ? "/learn" : "/login"}
          className="flex shrink-0 items-center gap-2.5"
          aria-label="Zoxdi home"
        >
          <Logo />
          <span className="flex flex-col leading-none">
            <span className="text-xl font-black tracking-tight text-ink">Zoxdi</span>
            <span className="hidden text-[11px] font-bold uppercase tracking-wide text-ink-muted sm:block">
              Play the numbers
            </span>
          </span>
        </Link>

        {!onLogin && (
          <nav className="mx-auto hidden items-center gap-1 rounded-full border border-line/70 bg-paper-card/70 p-1 lg:flex">
            {NAV.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`relative rounded-full px-3.5 py-1.5 text-sm font-bold transition ${
                    active ? "text-white" : "text-ink-soft hover:text-ink"
                  }`}
                >
                  {active && <span className="absolute inset-0 -z-10 rounded-full grad-ig" />}
                  <span className="mr-1.5" aria-hidden="true">
                    {item.icon}
                  </span>
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          {!onLogin && progress.xp.total > 0 ? (
            <span className="hidden rounded-full bg-gold-soft px-3 py-1 text-xs font-black text-gold-deep sm:inline-flex">
              ⚡ {progress.xp.total.toLocaleString()} XP
            </span>
          ) : null}
          <SoundToggle />
          <button
            type="button"
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line bg-paper-card text-lg transition hover:border-credit/50"
            aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            title={theme === "dark" ? "Light theme" : "Dark theme"}
          >
            {theme === "dark" ? "☀️" : "🌙"}
          </button>
          {profile && !onLogin ? (
            <Link
              href="/progress"
              aria-label="Your profile"
              title={profile.shopName || profile.name}
              className="rounded-full ring-2 ring-transparent transition hover:ring-credit/40"
            >
              <Avatar profile={profile} size={36} />
            </Link>
          ) : null}
        </div>
      </div>

    </header>
  );
}
