"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * A thumb-friendly tab bar for phones. The desktop header keeps the full menu;
 * on small screens this sticks to the bottom of the viewport so every core
 * destination is one tap away without a cramped, scrolling nav strip.
 */
const ITEMS = [
  { href: "/learn", label: "Learn", icon: "🎓" },
  { href: "/lessons", label: "Lessons", icon: "📘" },
  { href: "/lab", label: "Lab", icon: "🧪" },
  { href: "/drills", label: "Drills", icon: "🎯" },
  { href: "/progress", label: "Profile", icon: "👤" },
];

export default function MobileNav() {
  const pathname = usePathname();
  const path = (pathname ?? "/").replace(/\/+$/, "") || "/";
  if (path === "/login") return null;

  const isActive = (href: string) => path === href || path.startsWith(`${href}/`);

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line/60 glass pb-[env(safe-area-inset-bottom)] lg:hidden"
    >
      <ul className="flex items-stretch">
        {ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <li key={item.href} className="min-w-0 flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-bold transition ${
                  active ? "text-credit" : "text-ink-muted hover:text-ink"
                }`}
              >
                <span className="text-lg leading-none" aria-hidden="true">
                  {item.icon}
                </span>
                <span className="max-w-full truncate">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
