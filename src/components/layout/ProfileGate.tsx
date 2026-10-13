"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useProgressContext } from "@/lib/storage/ProgressContext";
import { Logo } from "./Logo";

/**
 * Gate the app behind a signed-in account. Anything that depends on an
 * identity (the leaderboard, XP, saved progress) lives behind this gate, and a
 * visitor without an account is sent to the welcome screen.
 */
export function ProfileGate({ children }: { children: ReactNode }) {
  const { ready, profile } = useProgressContext();
  const pathname = usePathname();
  const router = useRouter();
  // `trailingSlash: true` means the path may be "/login/"; normalise it.
  const path = (pathname ?? "/").replace(/\/+$/, "") || "/";
  const onLogin = path === "/login";

  useEffect(() => {
    if (ready && !profile && !onLogin) {
      router.replace("/login/");
    }
  }, [ready, profile, onLogin, router]);

  if (!ready || (!profile && !onLogin)) {
    return <Splash />;
  }

  return <>{children}</>;
}

function Splash() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-paper">
      <div className="animate-float">
        <Logo size={56} />
      </div>
      <p className="text-sm font-bold uppercase tracking-wide text-ink-muted">
        Zoxdi
      </p>
    </div>
  );
}
